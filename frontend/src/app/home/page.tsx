"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/context/authStore";
import Home from "@/components/Home";

export default function Page() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    const userData = localStorage.getItem("user-storage");
    if (!userData) {
      router.push("/");
      return;
    }
    const parsedUserData = JSON.parse(userData);
    if (!parsedUserData.state?.user?.email) {
      console.log("User email not found, redirecting to login...");
      router.push("/");
    }
  }, [router]);

  return (
    <div className="h-screen">
      <Home/>
    </div>
  );
}