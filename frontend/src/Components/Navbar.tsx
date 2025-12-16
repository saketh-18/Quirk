"use client";

import { usernameStore } from "@/stores/user-store"

export default function Navbar() {
  const username = usernameStore((state) => state.username);
  return (
    <div className='flex bg-red-700 h-10'>
      <p className='sm:text-4xl font-serif text-text-primary'>Quirk</p>
       {   username.length > 0 ? 
        <p className="hidden sm:inline">Connected as {username}</p> :
        <p className="hidden sm:inline"> Not Connected </p>
       }
    </div>
  )
}
