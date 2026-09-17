"use client";

import { useEffect, useState } from "react";

export default function ResultPage() {
const [result, setResult] = useState<any>(null);

useEffect(() => {
const saved = localStorage.getItem("latestResult");

if (!saved) {
  window.location.href = "/dashboard";
  return;
}

setResult(JSON.parse(saved));

}, []);

if (!result) {
return null;
}

const percentage = Math.round(
(result.score / result.total) * 100
);

return (
<main className="min-h-screen bg-gray-100 flex items-center justify-center p-5">
<div className="w-full max-w-md bg-white rounded-2xl shadow p-8 text-center">
<h1 className="text-3xl font-bold">
Test Result
</h1>

    <p className="text-5xl font-bold mt-8">
      {result.score} / {result.total}
    </p>

    <p className="text-2xl mt-3">
      {percentage}%
    </p>

    <p className="text-gray-500 mt-3">
      Completed: {result.date}
    </p>

    <a
      href="/dashboard"
      className="block mt-8 bg-black text-white py-3 rounded-lg"
    >
      Back to Dashboard
    </a>

    <a
      href="/mock-test"
      className="block mt-3 border border-black py-3 rounded-lg"
    >
      Try Again
    </a>
  </div>
</main>

);
}