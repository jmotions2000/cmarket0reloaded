import Link from "next/link";
import Image from "next/image";
import { formatToTimeAgo, formatToWon } from "@/lib/utils";

interface ListProductProps {
  title: string;
  price: number;
  created_at: Date;
  photo: string;
  id: number;
}

export default function ListProduct({
  title,
  price,
  created_at,
  photo,
  id,
}: ListProductProps) {
  return (
    <Link href={`/products/${id}`} className="flex gap-5">
      <div className="relative w-28 h-28 flex-shrink:0 rounded-md overflow-hidden">
        <Image
          fill
          src={photo}
          alt={title}
          className="object-cover"
          unoptimized
          priority
        />
      </div>
      <div className="flex flex-col gap-1 *:text-white">
        <span className="text-lg">{title}</span>
        <span>{formatToTimeAgo(created_at.toString())}</span>
        <span className="text-lg font-semibold">{formatToWon(price)}원</span>
      </div>
    </Link>
  );
}
