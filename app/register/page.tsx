"use client";

import { useState } from "react";
import { createClient } from "../admin/utils/supabase/client";

export default function RegisterPage() {
const [name, setName] = useState("");
const [studentId, setStudentId] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);

async function register(e: React.FormEvent) {
e.preventDefault();

if (!name.trim() || !studentId.trim() || !password.trim()) {
  alert("Please fill all fields");
  return;
}

try {
  setLoading(true);

  const supabase = createClient();

  const { data: existingStudent, error: checkError } = await supabase
    .from("students")
    .select("id")
    .eq("student_id", studentId.trim())
    .maybeSingle();

  if (checkError) {
    throw new Error(checkError.message);
  }

  if (existingStudent) {
    alert("This Student ID is already registered.");
    return;
  }

  const { error } = await supabase.from("students").insert({
    full_name: name.trim(),
    student_id: studentId.trim(),
    password: password,
    blocked: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  alert("Account created successfully!");
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

    <form onSubmit={register} className="mt-8 space-y-4">
      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border p-3 rounded-lg"
      />

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
        {loading ? "Creating Account..." : "Create Account"}
      </button>
    </form>

    <a
      href="/login"
      className="block text-center text-blue-600 mt-5"
    >
      Login
    </a>
  </div>
</main>

);
}