import db from "@/lib/db";
import { loginUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

// 1. 깃허브 이메일 응답 객체 타입 정의
interface IGitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

// 1. 토큰 받아오는 전용 함수
async function getAccessToken(code: string) {
  const accessTokenParams = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    client_secret: process.env.GITHUB_CLIENT_SECRET!,
    code,
  }).toString();
  const accessTokenURL = `https://github.com/login/oauth/access_token?${accessTokenParams}`;
  const accessTokenResponse = await fetch(accessTokenURL, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });
  return await accessTokenResponse.json();
}

// 2. 프로필 받아오는 전용 함수
async function getGithubProfile(accessToken: string) {
  const userProfileResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-cache",
  });
  return await userProfileResponse.json();
}

//3/ 이메일 조회하는 펑션
async function getGithubEmail(accessToken: string) {
  const emailResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-cache",
  });
  const emails = await emailResponse.json();
  // 여러 이메일 중 primary(주 이메일)이면서 verified(인증된) 이메일 선택
  const primaryEmail = emails.find(
    (email: IGitHubEmail) => email.primary && email.verified,
  );
  return primaryEmail?.email;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return new Response(null, {
      status: 400,
    });
  }
  // getAccessToken 이라는 새펑션을 만들어 사용해 보자 -4 - 32줄-38줄을 하나로 묶어서 getGithubProfile 새펑션으로
  // 아래는 1. 토큰 받아오는 전용 함수 -- 원래 코드
  // const accessTokenParams = new URLSearchParams({
  //   client_id: process.env.GITHUB_CLIENT_ID!,
  //   client_secret: process.env.GITHUB_CLIENT_SECRET!,
  //   code,
  // }).toString();
  // const accessTokenURL = `https://github.com/login/oauth/access_token?${accessTokenParams}`;
  // const accessTokenResponse = await fetch(accessTokenURL, {
  //   method: "POST",
  //   headers: {
  //     Accept: "application/json",
  //   },
  // });
  // const { error, access_token } = await accessTokenResponse.json();
  // if (error) {
  //   return new Response(null, {
  //     status: 400,
  //   });
  // }

  // 요 아래에다가 동일한 access token으로 이메일도 요청할 수 있어 이미 start 부분에서 이메일 요청해 놨으므로 - 3
  // 아래는 2. 프로필 받아오는 전용 함수 의 원래 코드
  // const userProfileResponse = await fetch("https://api.github.com/user", {
  //   headers: {
  //     Authorization: `Bearer ${access_token}`,
  //   },
  //   cache: "no-cache",
  // });
  // const { id, avatar_url, login } = await userProfileResponse.json();

  const { error, access_token } = await getAccessToken(code);
  if (error) {
    return new Response(null, { status: 400 });
  }

  const { id, avatar_url, login } = await getGithubProfile(access_token);
  const email = await getGithubEmail(access_token);
  const user = await db.user.findUnique({
    where: {
      github_id: id + "",
    },
    select: {
      id: true,
    },
  });
  if (user) {
    // const session = await getSession();
    // session.id = user.id;
    // await session.save();
    // id만 보내주면 실행시켜주는 펑션  - 요 세줄을 로그인 이라는 평션으로 만들어봐  user id 만 보내주면 getSession를 호출하도록 가져다쓰자-1
    //
    await loginUser(user.id);
    return redirect("/profile");
  }
  const newUser = await db.user.create({
    data: {
      username: `${login}-gh`, // 요건 만들었어 같은 아이디가 있을 수 잇으니 아예 드냥 -gh 붙이도록 -2
      github_id: id + "",
      avatar: avatar_url,
      email: email,
    },
    select: {
      id: true,
    },
  });
  await loginUser(newUser.id);
  return redirect("/profile");
}
