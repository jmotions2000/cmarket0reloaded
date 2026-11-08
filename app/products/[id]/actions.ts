// app/products/[id]/actions.ts
"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";

export async function deleteProduct(productId: number) {
  const session = await getSession();

  // 보안 검증: 삭제할 제품의 등록자가 현재 로그인 유저인지 확인
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { userId: true },
  });

  if (!product || product.userId !== session.id) {
    throw new Error("삭제 권한이 없습니다.");
  }

  await db.product.delete({
    where: { id: productId },
  });

  redirect("/products");
}
