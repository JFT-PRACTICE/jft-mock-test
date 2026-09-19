"use client";

import { useState } from "react";
import { createClient } from "../admin/utils/supabase/client";

export default function LoginPage() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();

    if (!studentId.trim() || !password.trim()) {
      alert("Please enter Student ID and Password");
      return;
    }

    try {
      setLoading(true);

      const supabase = createClient();

      const { data: student, error } = await supabase
        .from("students")
        .select("id, full_name, student_id, password, blocked")
        .eq("student_id", studentId.trim())
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!student || student.password !== password) {
        alert("Student ID or Password is wrong");
        return;
      }

      if (student.blocked) {
        alert("Your account has been blocked. Please contact admin.");
        return;
      }

      const loggedInStudent = {
        id: student.id,
        full_name: student.full_name,
        student_id: student.student_id,
        blocked: student.blocked,
      };

      // Session only — browser/tab session सकिएपछि login हट्छ
      sessionStorage.setItem(
        "loggedInStudent",
        JSON.stringify(loggedInStudent)
      );

      // पुरानो localStorage login हटाउने
      localStorage.removeItem("loggedInStudent");

      window.location.href = "/dashboard";
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <h1 className="text-3xl font-bold text-center">
          JFT Mock Test
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Student Login
        </p>

        <form onSubmit={login} className="mt-8 space-y-4">
          <input
            type="text"
            placeholder="Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded-lg disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <a
          href="/register"
          className="block text-center text-blue-600 mt-5"
        >
          Create Student Account
        </a>
      </div>
    </main>
  );
}