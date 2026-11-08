// components/delete-product-button.tsx
"use client";

import { deleteProduct } from "@/app/products/[id]/actions";

export default function DeleteProductButton({ productId }: { productId: number }) {
  const handleDelete = async () => {
    // 💡 브라우저 컨펌 창 추가 가능!
    const ok = window.confirm("정말 이 상품을 삭제하시겠습니까?");
    if (ok) {
      await deleteProduct(productId);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="bg-red-500 px-5 py-2.5 rounded-md text-white font-semibold hover:bg-red-600 transition">
      Delete product
    </button>
  );
}
