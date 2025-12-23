"use client";

import React from "react";
import { loginStore } from "@/stores/login-store";
import { usernameStore } from "@/stores/user-store";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Minimal Navbar
 * Blends with ambient background
 * Shows identity + connection context
 */

export default function Navbar() {
  const username = usernameStore((state) => state.username);
  const isLoggedIn = loginStore((state) => state.isLoggedIn);
  const setIsLoggedIn = loginStore((state) => state.setIsLoggedIn);
  const router = useRouter();
  // const pathname = usePathname();

  // If user navigates to public pages while a random connection is open,
  // inform the partner by sending a skip and close the socket.
  // useEffect(() => {
  //   if (!pathname) return;
  //   if (["/", "/login", "/register"].includes(pathname)) {
  //     try {
  //       connectionStore.getState().skipRandom();
  //     } catch (e) {}
  //   }
  // }, [pathname]);

  async function logout() {
    setIsLoggedIn(false);
    const access_token = localStorage.getItem("access_token");
    const res = await fetch("https://echo-l8ml.onrender.com/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (res.status == 204) {
      console.log("logged out succesfully");
      setIsLoggedIn(false);
      localStorage.clear();
      router.push("/login");
    }
  }

  return (
    <header
      className="
        relative
        z-20
        w-full
        border-b
        border-border-dark
        bg-bg-dark/60
        backdrop-blur-md
      "
    >
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6">
        {/* Brand */}
        <Link href={"/"} className="relative inline-block">
          {/* Soft echo layer */}
          <span
            className="
      absolute
    left-0
    top-0
    -z-10
    translate-x-[2px]
    translate-y-[2px]
    text-accent/30
    text-3xl
    font-serif
    font-bold
    select-none
    animate-[echoFade_0.6s_ease-out]
    "
          >
            Echo
          </span>

          {/* Main brand */}
          <span className="text-3xl font-serif font-bold text-text-main">
            Echo
          </span>
        </Link>

        <div className="flex gap-4 items-center">
          {!isLoggedIn ? (
            <div className="flex gap-4 items-center">
              <Link className="hover:text-accent " href={"/login"}>
                Login
              </Link>
              <Link className="hover:text-accent" href={"/register"}>
                Register
              </Link>
            </div>
          ) : (
            <p className="hover:text-accent cursor-pointer" onClick={logout}>
              Logout
            </p>
          )}
          <ConnectionStatus username={username} />
        </div>

        {/* Connection status */}
      </div>
    </header>
  );
}

/* ======================================================
   Connection Status
   ====================================================== */
function ConnectionStatus({ username }: { username: string }) {
  return (
    <div className="text-sm text-text-main/60">
      Connected as{" "}
      <span className="text-text-main">{username || "anonymous"}</span>
    </div>
  );
}
