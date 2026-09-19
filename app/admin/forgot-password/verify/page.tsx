"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabase/client";

export default function VerifyRecoveryPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = sessionStorage.getItem(
      "jft_admin_recovery_email"
    );

    if (!savedEmail) {
      router.replace("/admin/forgot-password");
      return;
    }

    setEmail(savedEmail);
  }, [router]);

  function maskEmail(email: string) {
    const [name, domain] = email.split("@");

    if (!name || !domain) return email;

    return `${name.slice(0, 2)}${"*".repeat(
      Math.max(0, name.length - 4)
    )}${name.slice(-2)}@${domain}`;
  }

  async function resetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!code.trim()) {
      setError("Enter the recovery code.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Temporary verification.
       * Real email OTP verification will be connected
       * when an email provider/API is configured.
       */

      if (code !== "123456") {
        setError("Invalid recovery code. For local testing use 123456.");
        return;
      }

      const { error: updateError } = await supabase
        .from("admins")
        .update({
          password: newPassword,
        })
        .eq("username", "admin");

      if (updateError) {
        console.error(updateError);
        setError("Could not change password.");
        return;
      }

      sessionStorage.removeItem("jft_admin_recovery_email");

      setMessage(
        "Password changed successfully. Redirecting to login..."
      );

      setTimeout(() => {
        router.push("/admin/login");
      }, 1500);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-3xl">
            🔐
          </div>

          <h1 className="text-2xl font-bold">
            Reset Admin Password
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Recovery: {email ? maskEmail(email) : "..."}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <form onSubmit={resetPassword} className="space-y-5">

          <div>
            <label className="mb-2 block text-sm font-medium">
              Recovery Code
            </label>

            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Changing Password..." : "Reset Password"}
          </button>
        </form>

        <button
          onClick={() => router.push("/admin/forgot-password")}
          className="w-full mt-6 text-sm text-slate-600"
        >
          ← Back
        </button>
      </div>
    </main>
  );
}