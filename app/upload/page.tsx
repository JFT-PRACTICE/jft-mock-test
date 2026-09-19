"use client";

import { useState } from "react";

export default function UploadQuestionsPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/upload-questions", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setMessage(
        `${result.count} questions uploaded successfully.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Upload failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Upload Question Bank</h1>

      <p className="mt-2 text-gray-600">
        Upload the current 500-question bank to Supabase.
      </p>

      <button
        onClick={handleUpload}
        disabled={loading}
        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload 500 Questions"}
      </button>

      {message && (
        <p className="mt-5 rounded-lg bg-gray-100 p-4">
          {message}
        </p>
      )}
    </main>
  );
}