"use server";

import twilio from "twilio";
import crypto, { randomBytes } from "crypto";
import z from "zod";
import validator from "validator";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import getSession from "@/lib/session";

const phoneSchema = z
  .string()
  .trim()
  .refine((phone) => validator.isMobilePhone(phone, "ko-KR"), "Wrong phone format");

async function getToken() {
  const token = crypto.randomInt(100000, 999999).toString();
  const exists = await db.sMSToken.findUnique({
    where: {
      token,
    },
    select: {
      id: true,
    },
  });
  if (exists) {
    return getToken();
  } else {
    return token;
  }
}

async function tokenExists(token: number) {
  const exists = await db.sMSToken.findUnique({
    where: {
      token: token.toString(),
    },
    select: {
      id: true,
    },
  });
  return Boolean(exists);
}

const tokenSchema = z.coerce
  .number()
  .min(100000)
  .max(999999)
  .refine(tokenExists, "This token do not exist");

export interface ActionState {
  token: boolean;
  phone?: string;
  error?: {
    formErrors: string[];
    fieldErrors: { [key: string]: string[] | undefined };
  };
}

export async function smsLogin(prevState: ActionState, formData: FormData) {
  const phone = formData.get("phone") as string;
  // 이미 폰넘버는 가지고 있는 거야
  const token = formData.get("token");
  if (!prevState.token) {
    const result = phoneSchema.safeParse(phone);
    if (!result.success) {
      console.log(result.error.flatten());
      return {
        token: false,
        phone,
        error: result.error.flatten(),
      };
    } else {
      await db.sMSToken.deleteMany({
        where: {
          user: {
            phone: result.data,
          },
        },
      });
      const token = await getToken();
      await db.sMSToken.create({
        data: {
          token,
          user: {
            connectOrCreate: {
              where: {
                phone: result.data,
              },
              create: {
                username: randomBytes(10).toString("hex"),
                phone: result.data,
              },
            },
          },
        },
      });
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
      // await client.messages.create({
      //   body: `Your verification code is: ${token}`,
      //   from: process.env.TWILIO_PHONE_NUMBER!,
      //   to: process.env.MY_PHONE_NUMBER!,
      // });
      console.log(`[SMS 인증번호]: ${token}`);
      return {
        token: true,
        phone: result.data, // 전화번호를 다음 상태로 넘겨주고
      };
    }
  } else {
    const result = await tokenSchema.spa(token);
    if (!result.success) {
      return {
        token: true,
        phone: prevState.phone,
        error: result.error.flatten(),
      };
      //위에서 토큰을 인증할때 113-119 에서 폰넘버도 확인하고
      // 아래에서 토큰조회하는 로직에도 폰넘버를 추가하자
    } else {
      const result = await tokenSchema.spa(token);
      if (!result.success) {
        return {
          token: true,
          phone: prevState.phone,
          error: result.error.flatten(),
        };
      } else {
        // 폰넘버는 폼 데이터나 prevState에서 가져옵니다.
        const currentPhone = phone || prevState.phone;

        // 🔍 토큰과 전화번호가 둘 다 일치하는지 조회
        const tokenRecord = await db.sMSToken.findFirst({
          where: {
            token: result.data.toString(),
            user: {
              phone: currentPhone, // 👈 폰넘버 조건 추가
            },
          },
          select: {
            id: true,
            userId: true,
          },
        });

        // 일치하는 토큰이 없는 경우 (틀렸거나 다른 사람 번호의 토큰인 경우)
        if (!tokenRecord) {
          return {
            token: true,
            phone: currentPhone,
            error: {
              formErrors: ["인증번호가 올바르지 않거나 만료되었습니다."],
              fieldErrors: {},
            },
          };
        }

        // 🔑 일치 확인 후 세션 로그인
        const session = await getSession();
        session.id = tokenRecord.userId;
        await session.save();

        // 사용한 토큰 삭제
        await db.sMSToken.delete({
          where: {
            id: tokenRecord.id,
          },
        });

        redirect("/profile");
      }
    }
    // 이거슨 토큰만 검증하는 이전의 코드
    // } else {
    //   const token = await db.sMSToken.findUnique({
    //     where: {
    //       token: result.data.toString(),
    //     },
    //     select: {
    //       id: true,
    //       userId: true,
    //     },
    //   });

    //   const session = await getSession();
    //   session.id = token!.userId;
    //   await session.save();
    //   await db.sMSToken.delete({
    //     where: {
    //       id: token!.id,
    //     },
    //   });

    //   // get the userId of token 29
    //   //log the user in
    //   redirect("/profile");
    // }
  }
}
