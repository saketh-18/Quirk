"use client";

import { useState } from "react";
import Navbar from "@components/Navbar";
import { useRouter } from "next/navigation";
import { loginStore } from "@/stores/login-store";
import { usernameStore } from "@/stores/user-store";
import { uiStateStore } from "@/stores/uiState-store";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter(); //from next navigation
  const setIsLoggedIn = loginStore((state) => state.setIsLoggedIn);
  const setUsername = usernameStore((state) => state.setUsername);
  const setUiState = uiStateStore((state) => state.setUiState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: email,
          password,
        }),
      });

      if (!res.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await res.json();

      const result = await fetch("http://localhost:8000/username", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      const username_res = await result.json();

      console.log(username_res);
      setUsername(username_res.username);
      localStorage.setItem("username", username_res.username);
      console.log(username_res.username);

      // Store token
      localStorage.setItem("access_token", data.access_token);

      // Optional: redirect after login
      setUiState("form");
      router.push("/chat");
      console.log("Login successful");
      setIsLoggedIn(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-bg-dark">
      <Navbar />

      {/* Ambient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-bg-dark via-surface to-bg-dark" />
        <div className="absolute -top-48 left-1/4 h-[40rem] w-[40rem] rounded-full bg-accent/18 blur-[180px] animate-[floatSlow_40s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 right-1/4 h-[34rem] w-[34rem] rounded-full bg-surface-highlight/30 blur-[200px] animate-[floatSlow_55s_ease-in-out_infinite]" />
      </div>

      {/* Content */}
      <main className="relative z-10 flex min-h-[calc(100vh-56px)] items-center px-8">
        <div className="max-w-md space-y-8">
          {/* Copy */}
          <div className="space-y-2">
            <h1 className="text-3xl text-text-main">Welcome back</h1>
            <p className="text-text-main/60">
              Sign in to continue conversations you cared about.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md bg-surface px-4 py-3 text-text-main placeholder:text-text-main/40 border border-border-dark focus:outline-none focus:ring-1 focus:ring-accent/30"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md bg-surface px-4 py-3 text-text-main placeholder:text-text-main/40 border border-border-dark focus:outline-none focus:ring-1 focus:ring-accent/30"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-accent py-3 font-medium text-bg-dark hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Helper */}
          <p className="text-sm text-text-main/50">
            Don’t have an account?{" "}
            <span className="text-text-main underline cursor-pointer">
              Create one
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
