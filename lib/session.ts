import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

interface SessionContent {
  id?: number;
}

export default async function getSession() {
  console.log(cookies());
  return getIronSession<SessionContent>(await cookies(), {
    cookieName: "Karrot",
    password: process.env.COOKIE_PASSWORD!,
  });
}

export async function loginUser(userId: number) {
  const session = await getSession();
  session.id = userId;
  await session.save();
}
