"use client";

import { useState } from "react";
import { createClient } from "../admin/utils/supabase/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function register(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !password.trim() || !confirmPassword.trim()) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const supabase = createClient();

      const { data, error } = await supabase.rpc("register_student", {
        p_full_name: name.trim(),
        p_password: password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || !data.student_id) {
        throw new Error("Student ID could not be generated.");
      }

      alert(
        `Account created successfully!\n\nYour Student ID is: ${data.student_id}\n\nPlease remember your Student ID and Password.`
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

          <input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

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