"use client";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import React from "react";

function WelcomeBanner() {
  const { user } = useUser();
  return (
    <div className="p-5 bg-primary w-full text-white rounded-lg flex items-center gap-6">
      <Image src={"/psyduck.png"} alt="laptop" width={140} height={140} />
      <div>
        <h2 className="font-bold text-3xl">
          Hey {user?.fullName}, ready to be cooked?
        </h2>
        <p className="text-lg text-gray-600">luck favors the prepared!</p>
      </div>
    </div>
  );
}

export default WelcomeBanner;
