"use client";

import { useState } from "react";
import { createClient } from "../utils/supabase/client";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      alert("Please enter Admin Username and Password");
      return;
    }

    try {
      setLoading(true);

      const supabase = createClient();

      const { data: admin, error } = await supabase
        .from("admins")
        .select("id, username, password")
        .eq("username", username.trim())
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!admin || admin.password !== password) {
        alert("Admin Username or Password is wrong");
        return;
      }

      localStorage.setItem(
        "loggedInAdmin",
        JSON.stringify({
          id: admin.id,
          username: admin.username,
        })
      );

      window.location.href = "/admin";
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Admin login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <h1 className="text-3xl font-bold text-center">
          JFT Admin Panel
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Admin Login
        </p>

        <form onSubmit={login} className="mt-8 space-y-4">
          <input
            type="text"
            placeholder="Admin Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded-lg disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Admin Login"}
          </button>
        </form>

        <a
          href="/"
          className="block text-center text-blue-600 mt-5"
        >
          Back to Home
        </a>
      </div>
    </main>
  );
}