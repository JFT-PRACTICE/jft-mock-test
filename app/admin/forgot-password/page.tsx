"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabase/client";

function maskEmail(email: string) {
  const [name, domain] = email.split("@");

  if (!name || !domain) return email;

  if (name.length <= 4) {
    return `${name.slice(0, 2)}${"*".repeat(
      Math.max(1, name.length - 4)
    )}${name.slice(-2)}@${domain}`;
  }

  return `${name.slice(0, 2)}${"*".repeat(
    name.length - 4
  )}${name.slice(-2)}@${domain}`;
}

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [emails, setEmails] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEmails() {
      const { data, error } = await supabase
        .from("admins")
        .select(
          "recovery_email_1, recovery_email_2, recovery_email_3"
        )
        .eq("username", "admin")
        .maybeSingle();

      if (error || !data) {
        setError("Could not load recovery emails.");
        setLoading(false);
        return;
      }

      const list = [
        data.recovery_email_1,
        data.recovery_email_2,
        data.recovery_email_3,
      ].filter(Boolean);

      setEmails(list);
      setLoading(false);
    }

    loadEmails();
  }, []);

  function continueRecovery() {
    setError("");

    if (!selected) {
      setError("Please select a recovery email.");
      return;
    }

    sessionStorage.setItem(
      "jft_admin_recovery_email",
      selected
    );

    router.push("/admin/forgot-password/verify");
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-3xl">
            🔑
          </div>

          <h1 className="text-2xl font-bold">
            Forgot Password
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Select your recovery email
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center text-slate-500">
            Loading...
          </p>
        ) : (
          <div className="space-y-3">
            {emails.map((email, index) => (
              <button
                key={email}
                onClick={() => setSelected(email)}
                className={`w-full rounded-xl border-2 p-4 text-left ${
                  selected === email
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200"
                }`}
              >
                <p className="text-sm font-medium">
                  Recovery Email {index + 1}
                </p>

                <p className="text-sm text-slate-500">
                  {maskEmail(email)}
                </p>
              </button>
            ))}

            <button
              onClick={continueRecovery}
              className="w-full mt-4 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
            >
              Send Recovery Code
            </button>
          </div>
        )}

        <button
          onClick={() => router.push("/admin/login")}
          className="w-full mt-6 text-sm text-slate-600"
        >
          ← Back to Admin Login
        </button>
      </div>
    </main>
  );
}