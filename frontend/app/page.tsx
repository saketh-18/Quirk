"use client";

import { usernameStore } from "@/stores/user-store";
import { useRouter } from "next/navigation";
import { useState } from "react"

export default function Home() {
  const setUsernameStore = usernameStore((state) => state.setUsername);
  const [username, setUsername] = useState<string>("");
  const router = useRouter(); 
  return (
    <div className="bg-linear-to-r from-gray-900 to-gray-700 w-screen h-screen flex flex-col items-center justify-center">
      <p className="text-4xl mb-4"> Enter your name to start off</p>
      <form className="w-1/4 flex justify-center gap-2" onSubmit={(e) => {
        e.preventDefault();
        if(username.trim().length > 0){
        setUsernameStore(username);
        router.push('/chat'); 
        } else {
          console.log("enter a valid username");
        }
      }}>
        <input name="username" className="p-2 focus:outline-0 focus:ring-0 bg-red-700 rounded-md" placeholder="" value={username} onChange={(e) => setUsername(e.target.value)}></input>
        <button className="p-2 bg-gray-600/50 mx-2 rounded-md text-4xl text-white">Enter</button>
      </form>
    </div>
  )
}
