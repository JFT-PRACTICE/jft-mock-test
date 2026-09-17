"use client";

import { useState } from "react";

export default function LoginPage() {
const [studentId, setStudentId] = useState("");
const [password, setPassword] = useState("");

function login(e: React.FormEvent) {
e.preventDefault();

const students = JSON.parse(localStorage.getItem("students") || "[]");

const student = students.find(
  (item: any) =>
    item.studentId === studentId && item.password === password
);

if (!student) {
  alert("Student ID or Password is wrong");
  return;
}

localStorage.setItem("loggedInStudent", JSON.stringify(student));

window.location.href = "/dashboard";

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
        className="w-full bg-black text-white p-3 rounded-lg"
      >
        Login
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