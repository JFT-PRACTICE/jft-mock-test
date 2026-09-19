"use client";

import { useEffect, useState } from "react";
import { createClient } from "../admin/utils/supabase/client";

export default function DashboardPage() {
  const [student, setStudent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      const savedStudent = localStorage.getItem("loggedInStudent");

      if (!savedStudent) {
        window.location.href = "/login";
        return;
      }

      const currentStudent = JSON.parse(savedStudent);

      setStudent(currentStudent);

      const supabase = createClient();

      // Database बाट latest student status check गर्ने
      const { data: currentDbStudent, error: studentError } =
        await supabase
          .from("students")
          .select("id, full_name, student_id, blocked")
          .eq("id", currentStudent.id)
          .maybeSingle();

      if (studentError || !currentDbStudent) {
        localStorage.removeItem("loggedInStudent");
        window.location.href = "/login";
        return;
      }

      // Admin ले block गरेको छ भने तुरुन्त access रोक्ने
      if (currentDbStudent.blocked) {
        localStorage.removeItem("loggedInStudent");
        alert("Your account has been blocked. Please contact admin.");
        window.location.href = "/login";
        return;
      }

      const updatedStudent = {
        id: currentDbStudent.id,
        full_name: currentDbStudent.full_name,
        student_id: currentDbStudent.student_id,
        blocked: currentDbStudent.blocked,
      };

      setStudent(updatedStudent);

      localStorage.setItem(
        "loggedInStudent",
        JSON.stringify(updatedStudent)
      );

      // Result history database बाट ल्याउने
      const { data: studentResults, error: resultError } =
        await supabase
          .from("results")
          .select(
            "id, score, section_scores, answers, total_questions, passed, created_at"
          )
          .eq("student_id", currentDbStudent.id)
          .order("created_at", { ascending: false });

      if (!resultError && studentResults) {
        setResults(studentResults);
      }
    }

    loadDashboard();
  }, []);

  if (!student) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-5">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-3xl font-bold">
            Student Dashboard
          </h1>

          <p className="mt-3 text-gray-600">
            Welcome, {student.full_name}
          </p>

          <p className="mt-1 text-gray-500">
            Student ID: {student.student_id}
          </p>

          <a
            href="/mock-test"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg mt-8"
          >
            Start Mock Test
          </a>

          <div className="mt-10">
            <h2 className="text-2xl font-bold">
              My Result History
            </h2>

            {results.length === 0 ? (
              <p className="text-gray-500 mt-4">
                You have not taken any test yet.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {results.map((result, index) => {
                  const date = new Date(
                    result.created_at
                  ).toLocaleString();

                  return (
                    <div
                      key={result.id}
                      className="border rounded-xl p-5 bg-gray-50"
                    >
                      <div className="flex flex-col md:flex-row md:justify-between gap-3">
                        <div>
                          <p className="font-bold">
                            Attempt {index + 1}
                          </p>

                          <p className="text-gray-500 mt-1">
                            {date}
                          </p>
                        </div>

                        <p>
                          Score:{" "}
                          <span className="font-bold">
                            {result.score} / 250
                          </span>
                        </p>

                        <p>
                          Questions:{" "}
                          <span className="font-bold">
                            {result.total_questions}
                          </span>
                        </p>

                        <p>
                          Status:{" "}
                          <span className="font-bold">
                            {result.passed ? "Passed" : "Not Passed"}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("loggedInStudent");
              window.location.href = "/login";
            }}
            className="block mt-8 text-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}