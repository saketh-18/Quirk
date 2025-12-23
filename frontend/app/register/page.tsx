"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../src/components/Navbar";

export default function Register() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          username,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.detail?.[0]?.msg || "Registration failed");
      }

      const data = await res.json();
      console.log("Registered user:", data);

      // Redirect to login after successful register
      router.push("/login");
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
            <h1 className="text-3xl text-text-main">Create account</h1>
            <p className="text-text-main/60">
              Join to start meaningful conversations.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-md bg-surface px-4 py-3 text-text-main placeholder:text-text-main/40 border border-border-dark focus:outline-none focus:ring-1 focus:ring-accent/30"
            />

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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* Helper */}
          <p className="text-sm text-text-main/50">
            Already have an account?{" "}
            <span
              onClick={() => router.push("/login")}
              className="text-text-main underline cursor-pointer"
            >
              Sign in
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
