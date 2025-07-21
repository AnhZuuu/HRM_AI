'use client';

import Image from "next/image";
import Link from "next/link";

// import LoginComponent from "@/components/login/login";

export default function Home() {
  return (
    <>
    {/* <LoginComponent/> */}
    Hi
     <Link

                href='/dashboard'
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-transparent rounded-lg hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray mr-20"
            >
                Trang chủ
            </Link>
    </>
  );
}
