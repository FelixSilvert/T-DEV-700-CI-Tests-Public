"use client";

import { useState } from "react";
import { routes } from "@/lib/routes";
import Link from "next/link";
import Input from "@/component/input";
import Button from "@/component/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(routes.auth.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Identifiants invalides");

      const data = await res.json();
      localStorage.setItem("token", data.token);
      alert("Login successful !");
    } catch (err) {
      setError("Email or password incorrect");
    }
  };

  return (
    
    <div className="relative z-0 flex flex-col items-center justify-center min-h-screen bg-blue-100 overflow-hidden">
<div className="absolute inset-0 -z-10 pointer-events-none">
    <div className="absolute top-50 xl:left-80 lg:left-60 md:left-40 sm:left-20 left-10 lg:w-32 lg:h-32 w-16 h-16 bg-blue-600 rounded-xl" />
    <div className="absolute top-0 right-0 w-60 h-32 bg-blue-600" />
    <div className="absolute top-32 right-60 w-28 h-28 bg-blue-600 rounded-tl-xl rounded-bl-xl rounded-br-xl" />
    <div className="absolute bottom-60 left-0 w-24 h-36 bg-blue-600 rounded-br-xl" />
    <div className="absolute bottom-96 left-24 w-28 h-28 bg-blue-600 rounded-br-xl rounded-tr-xl rounded-tl-xl" />
  </div>
      <h1 className="text-7xl font-bold text-black mb-10 tracking-tight">
        TRINITY<span className="text-blue-600">_</span>
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-8 w-[90%] max-w-md flex flex-col gap-6"
      >
        <h2 className="text-4xl font-semibold text-center text-gray-800">
          Login
        </h2>

        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="exemple@entreprise.com"
        />

        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <Button type="submit">Login</Button>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot password ?
          </Link>
        </div>
      </form>
    </div>
  );
}