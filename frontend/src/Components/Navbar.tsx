"use client";

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

  async function logout(){
    setIsLoggedIn(false);
    const access_token = localStorage.getItem("access_token");
    const res = await fetch("http://localhost:8000/auth/logout", {
      method : 'POST',
      headers : {
        'Authorization' : `Bearer ${access_token}`
      }
    });

    if(res.status == 204){
      console.log("logged out succesfully");
      setIsLoggedIn(false);
      localStorage.clear()
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
        <Link
        href={"/"}
         className="text-lg font-serif text-text-main">
          Quirk
        </Link>

        <div className="flex gap-4 items-center">
        {!isLoggedIn ?
        <div className="flex gap-4 items-center">
        <Link className="hover:text-accent " href={"/login"}>
          Login
        </Link>
        <Link className="hover:text-accent" href={"/register"}>Register</Link>
        </div> : <p className="hover:text-accent cursor-pointer" onClick={logout}>Logout</p>
        }
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
      <span className="text-text-main">
        {username || "anonymous"}
      </span>
    </div>
  );
}
