"use server";

import db from "@/lib/db";

export async function getMoreProducts(page: number) {
  // tabs 의 getProducts 부분을 가져오자
  const products = await db.product.findMany({
    select: {
      title: true,
      price: true,
      created_at: true,
      photo: true,
      id: true,
    },
    // 하나를 가져오지만 첫번째 것은 건너뛴다
    skip: page * 1,
    take: 1,
    orderBy: {
      created_at: "desc",
    },
  });
  return products;
}
