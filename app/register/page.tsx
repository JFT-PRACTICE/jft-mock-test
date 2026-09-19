"use client";

import { useState } from "react";
import { createClient } from "../admin/utils/supabase/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  async function register(e: React.FormEvent) {
    e.preventDefault();

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (!email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (
      email
        .split("@")[0]
        .toLowerCase()
        .includes(password.toLowerCase())
    ) {
      alert(
        "For your security, please create a password different from your email."
      );
      return;
    }

    try {
      setLoading(true);

      const supabase = createClient();

      const { data, error } = await supabase.rpc("register_student", {
        p_full_name: name.trim(),
        p_password: password,
        p_email: email.trim().toLowerCase(),
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || !data.student_id) {
        throw new Error("Student ID could not be generated.");
      }

      const studentId = data.student_id;

      const firstConfirm = window.confirm(
        `🎉 Account Created Successfully!\n\n` +
          `Your Student ID / तपाईंको विद्यार्थी ID\n\n` +
          `${studentId}\n\n` +
          `📋 Please remember your Student ID.\n` +
          `आफ्नो विद्यार्थी ID नबिर्सनुहोस्।\n\n` +
          `Click OK to continue.`
      );

      if (!firstConfirm) {
        window.location.href = "/login";
        return;
      }

      window.alert(
        `🔔 Important Reminder / महत्वपूर्ण सूचना\n\n` +
          `Make sure you remember or note down your Student ID.\n\n` +
          `आफ्नो विद्यार्थी ID याद गर्नुहोस् वा सुरक्षित ठाउँमा टिपेर राख्नुहोस्।\n\n` +
          `🔒 Do not share your Student ID or password with anyone.\n` +
          `🔒 आफ्नो विद्यार्थी ID वा पासवर्ड कसैसँग पनि साझा नगर्नुहोस्।`
      );

      window.location.href = "/login";
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <h1 className="text-3xl font-bold text-center">
          Create Student Account
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Student ID will be generated automatically
        </p>

        <form onSubmit={register} className="mt-8 space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="email"
            placeholder="Email / Gmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

          <div>
            <input
              type="text"
              value="Automatic"
              disabled
              className="w-full border p-3 rounded-lg bg-gray-100 text-gray-500"
            />

            <p className="text-xs text-gray-500 mt-1">
              Student ID will be generated after registration.
            </p>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-3 pr-12 rounded-lg"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border p-3 pr-12 rounded-lg"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            🔒 Do not use your email password.
            <br />
            🔒 आफ्नो email password प्रयोग नगर्नुहोस्।
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded-lg disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <a
          href="/login"
          className="block text-center text-blue-600 mt-5"
        >
          Already have an account? Login
        </a>

        <a
          href="/"
          className="block text-center text-gray-600 mt-4 hover:text-black"
        >
          ← Back to Home
        </a>

        <p className="text-center text-xs text-gray-500 mt-6">
          Made by Anish Bhattarai
        </p>
      </div>
    </main>
  );
}