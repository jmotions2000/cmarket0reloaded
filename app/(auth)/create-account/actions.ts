"use server";

import z from "zod";

import db from "@/lib/db";

import bcrypt from "bcrypt";
import { PASSWORD_MIN_LENGTH } from "@/lib/constans";
import { redirect } from "next/navigation";
import getSession from "@/lib/session";

function checkUsername(username: string) {
  return !username.includes("jmotions");
}

const checkPasswords = ({
  password,
  confirm_password,
}: {
  password: string;
  confirm_password: string;
}) => password === confirm_password;

const formSchema = z
  .object({
    username: z
      .string()
      .toLowerCase()
      .transform((username) => `${username}`)
      .refine(checkUsername, "No jmotions allowed"),
    email: z.string().email().toLowerCase(),
    password: z.string().min(PASSWORD_MIN_LENGTH),
    //.regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
    confirm_password: z.string().min(PASSWORD_MIN_LENGTH),
  })
  .superRefine(async ({ username, email }, ctx) => {
    const user = await db.user.findUnique({
      where: {
        username,
      },
      select: {
        id: true,
      },
    });
    if (user) {
      ctx.addIssue({
        code: "custom",
        message: "사용중",
        path: ["username"],
        fatal: true,
      });
      return z.NEVER;
    }
    const existingEmail = await db.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });
    if (existingEmail) {
      ctx.addIssue({
        code: "custom",
        message: "EMAIL 사용중",
        path: ["email"],
        fatal: true,
      });
      return z.NEVER;
    }
  })

  .refine(checkPasswords, {
    error: "Bot passwords should be the same!",
    path: ["confirm_password"],
  });

export async function createAccount(prevState: unknown, formData: FormData) {
  const data = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  };
  const result = await formSchema.safeParseAsync(data);
  if (!result.success) {
    console.log(result.error.flatten());
    return result.error.flatten();
  } else {
    const hashedPassword = await bcrypt.hash(result.data.password, 12);
    console.log(hashedPassword);
    const user = await db.user.create({
      data: {
        username: result.data.username,
        email: result.data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
      },
    });

    const session = await getSession();

    session.id = user.id;
    await session.save();
    redirect("/profile");
    //hash password
    // save the user to DB using prisma
    //log the user in
  }
}
