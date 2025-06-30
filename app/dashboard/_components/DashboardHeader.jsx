"use client";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

function DashboardHeader() {
  const path = usePathname();
  return (
    <div
      className={`p-5 shadow-md flex ${
        path == "/dashboard" ? "justify-end" : "justify-between"
      }`}
    >
      {/* Logo appears only when not in dashboard and go back to dashboard if user click on to the logo*/}
      {path != "/dashboard" && (
        <Link href={"/dashboard"}>
          <div className="flex items-center">
            <Image src={"/Riselogo.svg"} alt="logo" width={170} height={100} />
          </div>
        </Link>
      )}

      {/* Dashboard Button added */}
      <div className="flex items-center gap-3">
        <UserButton />
        <Link href={"/dashboard"}>
          <Button>Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

export default DashboardHeader;
