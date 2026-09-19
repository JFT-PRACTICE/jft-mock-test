"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../admin/utils/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const cleanUsername = username.trim();

      if (!cleanUsername || !password) {
        setError("Please enter username and password.");
        setLoading(false);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from("admins")
        .select("id, username")
        .eq("username", cleanUsername)
        .eq("password", password)
        .limit(1)
        .maybeSingle();

      if (supabaseError) {
        console.error("Admin login error:", supabaseError);
        setError("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Invalid admin username or password.");
        setLoading(false);
        return;
      }

      // Save admin login state
      sessionStorage.setItem("jft_admin_logged_in", "true");
      sessionStorage.setItem("jft_admin_username", data.username);

      // Go directly to Admin Dashboard
      window.location.href = "/admin";
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">

          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-3xl">
              🔐
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Admin Login
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              JFT Mock Test Admin Panel
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Admin Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                autoComplete="username"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Admin Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Admin Login"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push("/admin/forgot-password")}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Made by Anish Bhattarai
        </p>
      </div>
    </main>
  );
}