"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../admin/utils/supabase/client";

type Student = {
  id: string;
  full_name: string;
  student_id: string;
  password?: string;
  blocked: boolean;
  created_at: string;
};

type Result = {
  id: string;
  student_id: string;
  score: number;
  section_scores?: Record<string, unknown> | null;
  total_questions: number;
  passed: boolean;
  created_at: string;
};

type Question = {
  id: string;
  section: string;
  category?: string | null;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: string;
  nepali?: string | null;
  audio_url?: string | null;
  created_at: string;
};

type Tab = "students" | "questions" | "results" | "statistics";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("students");

  const [students, setStudents] = useState<Student[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [studentSearch, setStudentSearch] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");

  const [questionPage, setQuestionPage] = useState(1);
  const questionsPerPage = 20;

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(
    null
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);

  const [form, setForm] = useState({
    section: "Script & Vocabulary",
    category: "",
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    difficulty: "medium",
    nepali: "",
    audio_url: "",
  });

  useEffect(() => {
    const admin = localStorage.getItem("loggedInAdmin");

    if (!admin) {
      window.location.href = "/admin/login";
      return;
    }

    loadData(true);
  }, []);

  async function loadData(firstLoad = false) {
    try {
      if (firstLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [studentsResponse, resultsResponse, questionsResponse] =
        await Promise.all([
          supabase
            .from("students")
            .select("*")
            .order("created_at", { ascending: false }),

          supabase
            .from("results")
            .select("*")
            .order("created_at", { ascending: false }),

          supabase
            .from("questions")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

      if (studentsResponse.error) {
        throw new Error(`Students: ${studentsResponse.error.message}`);
      }

      if (resultsResponse.error) {
        throw new Error(`Results: ${resultsResponse.error.message}`);
      }

      if (questionsResponse.error) {
        throw new Error(`Questions: ${questionsResponse.error.message}`);
      }

      setStudents(studentsResponse.data || []);
      setResults(resultsResponse.data || []);
      setQuestions(questionsResponse.data || []);

      if (!firstLoad) {
        alert("Admin data refreshed successfully!");
      }
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to load admin data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function resetQuestionForm() {
    setEditingId(null);

    setForm({
      section: "Script & Vocabulary",
      category: "",
      question: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "A",
      difficulty: "medium",
      nepali: "",
      audio_url: "",
    });
  }

  async function saveQuestion() {
    if (
      !form.question.trim() ||
      !form.option_a.trim() ||
      !form.option_b.trim() ||
      !form.option_c.trim() ||
      !form.option_d.trim()
    ) {
      alert("Please fill all required question fields.");
      return;
    }

    try {
      setQuestionLoading(true);

      const questionData = {
        section: form.section,
        category: form.category,
        question: form.question,
        option_a: form.option_a,
        option_b: form.option_b,
        option_c: form.option_c,
        option_d: form.option_d,
        correct_answer: form.correct_answer,
        difficulty: form.difficulty,
        nepali: form.nepali,
        audio_url: form.audio_url,
      };

      if (editingId) {
        const { error } = await supabase
          .from("questions")
          .update(questionData)
          .eq("id", editingId);

        if (error) throw error;

        alert("Question updated successfully!");
      } else {
        const { error } = await supabase
          .from("questions")
          .insert([questionData]);

        if (error) throw error;

        alert("Question added successfully!");
      }

      resetQuestionForm();
      setQuestionPage(1);
      await loadData(true);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save question."
      );
    } finally {
      setQuestionLoading(false);
    }
  }

  function editQuestion(question: Question) {
    setEditingId(question.id);

    setForm({
      section: question.section || "Script & Vocabulary",
      category: question.category || "",
      question: question.question || "",
      option_a: question.option_a || "",
      option_b: question.option_b || "",
      option_c: question.option_c || "",
      option_d: question.option_d || "",
      correct_answer: question.correct_answer || "A",
      difficulty: question.difficulty || "medium",
      nepali: question.nepali || "",
      audio_url: question.audio_url || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteQuestion(id: string) {
    const ok = confirm(
      "Are you sure you want to delete this question?"
    );

    if (!ok) return;

    try {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setQuestions((prev) => prev.filter((q) => q.id !== id));

      alert("Question deleted successfully!");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete question."
      );
    }
  }

  async function toggleStudentBlock(student: Student) {
    try {
      const { error } = await supabase
        .from("students")
        .update({
          blocked: !student.blocked,
        })
        .eq("id", student.id);

      if (error) throw error;

      setStudents((prev) =>
        prev.map((item) =>
          item.id === student.id
            ? {
                ...item,
                blocked: !student.blocked,
              }
            : item
        )
      );

      alert(
        student.blocked
          ? "Student unblocked successfully!"
          : "Student blocked successfully!"
      );
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update student."
      );
    }
  }

  async function deleteStudent(student: Student) {
    const ok = confirm(
      `Delete student "${student.full_name}" (${student.student_id})?`
    );

    if (!ok) return;

    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", student.id);

      if (error) throw error;

      setStudents((prev) =>
        prev.filter((item) => item.id !== student.id)
      );

      setSelectedStudent(null);

      alert("Student deleted successfully!");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete student."
      );
    }
  }

  async function deleteResult(id: string) {
    const ok = confirm("Delete this result?");

    if (!ok) return;

    try {
      const { error } = await supabase
        .from("results")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setResults((prev) =>
        prev.filter((result) => result.id !== id)
      );

      alert("Result deleted successfully!");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete result."
      );
    }
  }

  function logout() {
    localStorage.removeItem("loggedInAdmin");
    window.location.href = "/admin/login";
  }

  const filteredStudents = useMemo(() => {
    const search = studentSearch.toLowerCase().trim();

    if (!search) return students;

    return students.filter(
      (student) =>
        student.full_name.toLowerCase().includes(search) ||
        student.student_id.toLowerCase().includes(search)
    );
  }, [students, studentSearch]);

  const filteredQuestions = useMemo(() => {
    const search = questionSearch.toLowerCase().trim();

    if (!search) return questions;

    return questions.filter(
      (question) =>
        question.question.toLowerCase().includes(search) ||
        question.section.toLowerCase().includes(search) ||
        (question.category || "").toLowerCase().includes(search)
    );
  }, [questions, questionSearch]);

  const totalQuestionPages = Math.max(
    1,
    Math.ceil(filteredQuestions.length / questionsPerPage)
  );

  const visibleQuestions = filteredQuestions.slice(
    (questionPage - 1) * questionsPerPage,
    questionPage * questionsPerPage
  );

  const passedResults = results.filter(
    (result) => result.passed
  ).length;

  const failedResults = results.filter(
    (result) => !result.passed
  ).length;

  const averageScore =
    results.length > 0
      ? (
          results.reduce(
            (sum, result) => sum + Number(result.score || 0),
            0
          ) / results.length
        ).toFixed(1)
      : "0";

  useEffect(() => {
    setQuestionPage(1);
  }, [questionSearch]);

  useEffect(() => {
    if (questionPage > totalQuestionPages) {
      setQuestionPage(totalQuestionPages);
    }
  }, [questionPage, totalQuestionPages]);

  function menuButton(
    tab: Tab,
    icon: string,
    title: string,
    count?: number
  ) {
    const active = activeTab === tab;

    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition ${
          active
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-700 hover:bg-blue-50"
        }`}
      >
        <span className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold">{title}</span>
        </span>

        {count !== undefined && (
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              active
                ? "bg-white/20 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {count}
          </span>
        )}
      </button>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <div className="text-2xl font-bold mb-2">
            Loading Admin Dashboard...
          </div>
          <p className="text-gray-500">
            Please wait.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              JFT Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Manage students, questions and results
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => loadData()}
              disabled={refreshing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-5">
          {/* SIDEBAR / FOLDERS */}
          <aside>
            <div className="bg-gray-50 rounded-2xl p-3 border lg:sticky lg:top-24">
              <div className="text-xs uppercase tracking-wide text-gray-400 px-3 py-2 font-bold">
                Admin Menu
              </div>

              <div className="space-y-2">
                {menuButton(
                  "students",
                  "📁",
                  "Registered Students",
                  students.length
                )}

                {menuButton(
                  "questions",
                  "📁",
                  "Question Bank",
                  questions.length
                )}

                {menuButton(
                  "results",
                  "📁",
                  "Student Results",
                  results.length
                )}

                {menuButton(
                  "statistics",
                  "📊",
                  "Statistics"
                )}
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <section>
            {/* REGISTERED STUDENTS */}
            {activeTab === "students" && (
              <div className="bg-white rounded-2xl shadow-sm border p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Registered Students
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Manage all registered student accounts.
                    </p>
                  </div>

                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) =>
                      setStudentSearch(e.target.value)
                    }
                    placeholder="Search student name or ID..."
                    className="border rounded-lg px-4 py-2 w-full md:w-80 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    No students found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                      >
                        <div>
                          <div className="font-bold text-lg">
                            {student.full_name}
                          </div>

                          <div className="text-sm text-gray-500">
                            Student ID: {student.student_id}
                          </div>

                          <div className="text-xs text-gray-400 mt-1">
                            Registered:{" "}
                            {new Date(
                              student.created_at
                            ).toLocaleString()}
                          </div>

                          <span
                            className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${
                              student.blocked
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {student.blocked
                              ? "BLOCKED"
                              : "ACTIVE"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              setSelectedStudent(student)
                            }
                            className="bg-gray-100 px-3 py-2 rounded-lg"
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              toggleStudentBlock(student)
                            }
                            className={`px-3 py-2 rounded-lg text-white ${
                              student.blocked
                                ? "bg-green-600"
                                : "bg-orange-500"
                            }`}
                          >
                            {student.blocked
                              ? "Unblock"
                              : "Block"}
                          </button>

                          <button
                            onClick={() =>
                              deleteStudent(student)
                            }
                            className="bg-red-600 text-white px-3 py-2 rounded-lg"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedStudent && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                      <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xl font-bold">
                          Student Details
                        </h3>

                        <button
                          onClick={() =>
                            setSelectedStudent(null)
                          }
                          className="text-gray-500 text-xl"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="font-semibold">
                            Name:
                          </span>{" "}
                          {selectedStudent.full_name}
                        </div>

                        <div>
                          <span className="font-semibold">
                            Student ID:
                          </span>{" "}
                          {selectedStudent.student_id}
                        </div>

                        <div>
                          <span className="font-semibold">
                            Status:
                          </span>{" "}
                          {selectedStudent.blocked
                            ? "Blocked"
                            : "Active"}
                        </div>

                        <div>
                          <span className="font-semibold">
                            Registered:
                          </span>{" "}
                          {new Date(
                            selectedStudent.created_at
                          ).toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setSelectedStudent(null)
                        }
                        className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* QUESTIONS */}
            {activeTab === "questions" && (
              <div className="space-y-5">
                {/* QUESTION FORM */}
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {editingId
                          ? "Edit Question"
                          : "Add Question"}
                      </h2>

                      <p className="text-sm text-gray-500">
                        Add or update questions in the question bank.
                      </p>
                    </div>

                    {editingId && (
                      <button
                        onClick={resetQuestionForm}
                        className="bg-gray-200 px-4 py-2 rounded-lg"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      value={form.section}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          section: e.target.value,
                        })
                      }
                      className="border rounded-lg px-3 py-2"
                    >
                      <option>
                        Script & Vocabulary
                      </option>
                      <option>
                        Conversation & Expression
                      </option>
                      <option>
                        Listening Comprehension
                      </option>
                      <option>
                        Reading Comprehension
                      </option>
                    </select>

                    <input
                      value={form.category}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          category: e.target.value,
                        })
                      }
                      placeholder="Category"
                      className="border rounded-lg px-3 py-2"
                    />

                    <textarea
                      value={form.question}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          question: e.target.value,
                        })
                      }
                      placeholder="Question"
                      className="border rounded-lg px-3 py-2 md:col-span-2 min-h-24"
                    />

                    <input
                      value={form.option_a}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          option_a: e.target.value,
                        })
                      }
                      placeholder="Option A"
                      className="border rounded-lg px-3 py-2"
                    />

                    <input
                      value={form.option_b}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          option_b: e.target.value,
                        })
                      }
                      placeholder="Option B"
                      className="border rounded-lg px-3 py-2"
                    />

                    <input
                      value={form.option_c}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          option_c: e.target.value,
                        })
                      }
                      placeholder="Option C"
                      className="border rounded-lg px-3 py-2"
                    />

                    <input
                      value={form.option_d}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          option_d: e.target.value,
                        })
                      }
                      placeholder="Option D"
                      className="border rounded-lg px-3 py-2"
                    />

                    <select
                      value={form.correct_answer}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          correct_answer: e.target.value,
                        })
                      }
                      className="border rounded-lg px-3 py-2"
                    >
                      <option value="A">
                        Correct Answer: A
                      </option>
                      <option value="B">
                        Correct Answer: B
                      </option>
                      <option value="C">
                        Correct Answer: C
                      </option>
                      <option value="D">
                        Correct Answer: D
                      </option>
                    </select>

                    <select
                      value={form.difficulty}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          difficulty: e.target.value,
                        })
                      }
                      className="border rounded-lg px-3 py-2"
                    >
                      <option value="easy">
                        Easy
                      </option>
                      <option value="medium">
                        Medium
                      </option>
                      <option value="hard">
                        Hard
                      </option>
                    </select>

                    <textarea
                      value={form.nepali}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          nepali: e.target.value,
                        })
                      }
                      placeholder="Nepali explanation"
                      className="border rounded-lg px-3 py-2 md:col-span-2 min-h-20"
                    />

                    <input
                      value={form.audio_url}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          audio_url: e.target.value,
                        })
                      }
                      placeholder="Audio URL (optional)"
                      className="border rounded-lg px-3 py-2 md:col-span-2"
                    />
                  </div>

                  <button
                    onClick={saveQuestion}
                    disabled={questionLoading}
                    className="mt-5 bg-blue-600 text-white px-5 py-3 rounded-lg disabled:opacity-50"
                  >
                    {questionLoading
                      ? "Saving..."
                      : editingId
                      ? "Update Question"
                      : "Add Question"}
                  </button>
                </div>

                {/* QUESTION LIST */}
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-2xl font-bold">
                        Question Bank
                      </h2>

                      <p className="text-sm text-gray-500">
                        Showing 20 questions per page.
                      </p>
                    </div>

                    <input
                      type="text"
                      value={questionSearch}
                      onChange={(e) =>
                        setQuestionSearch(e.target.value)
                      }
                      placeholder="Search questions..."
                      className="border rounded-lg px-4 py-2 w-full md:w-80"
                    />
                  </div>

                  <div className="mb-4 text-sm text-gray-500">
                    Total:{" "}
                    <span className="font-bold">
                      {filteredQuestions.length}
                    </span>{" "}
                    questions
                  </div>

                  <div className="space-y-4">
                    {visibleQuestions.map(
                      (question, index) => (
                        <div
                          key={question.id}
                          className="border rounded-xl p-4"
                        >
                          <div className="flex flex-col md:flex-row md:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex flex-wrap gap-2 mb-2">
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                  #
                                  {(questionPage - 1) *
                                    questionsPerPage +
                                    index +
                                    1}
                                </span>

                                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                                  {question.section}
                                </span>

                                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                                  {question.difficulty}
                                </span>
                              </div>

                              <div className="font-semibold text-lg">
                                {question.question}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
                                <div>A. {question.option_a}</div>
                                <div>B. {question.option_b}</div>
                                <div>C. {question.option_c}</div>
                                <div>D. {question.option_d}</div>
                              </div>

                              <div className="mt-3 text-sm">
                                <span className="font-bold">
                                  Correct:
                                </span>{" "}
                                {question.correct_answer}
                              </div>

                              {question.nepali && (
                                <div className="mt-2 bg-yellow-50 p-3 rounded-lg text-sm">
                                  <span className="font-bold">
                                    Nepali:
                                  </span>{" "}
                                  {question.nepali}
                                </div>
                              )}
                            </div>

                            <div className="flex md:flex-col gap-2">
                              <button
                                onClick={() =>
                                  editQuestion(question)
                                }
                                className="bg-yellow-500 text-white px-3 py-2 rounded-lg"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  deleteQuestion(question.id)
                                }
                                className="bg-red-600 text-white px-3 py-2 rounded-lg"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {visibleQuestions.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                      No questions found.
                    </div>
                  )}

                  {/* PAGINATION */}
                  {filteredQuestions.length > 0 && (
                    <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
                      <button
                        onClick={() =>
                          setQuestionPage((p) =>
                            Math.max(1, p - 1)
                          )
                        }
                        disabled={questionPage === 1}
                        className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-40"
                      >
                        ← Previous
                      </button>

                      <span className="px-4 py-2 font-semibold">
                        Page {questionPage} of{" "}
                        {totalQuestionPages}
                      </span>

                      <button
                        onClick={() =>
                          setQuestionPage((p) =>
                            Math.min(
                              totalQuestionPages,
                              p + 1
                            )
                          )
                        }
                        disabled={
                          questionPage === totalQuestionPages
                        }
                        className="px-4 py-2 rounded-lg bg-gray-200 disabled:opacity-40"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RESULTS */}
            {activeTab === "results" && (
              <div className="bg-white rounded-2xl shadow-sm border p-5">
                <div className="mb-5">
                  <h2 className="text-2xl font-bold">
                    Student Results
                  </h2>

                  <p className="text-sm text-gray-500">
                    View and manage all mock-test results.
                  </p>
                </div>

                {results.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    No results yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map((result) => {
                      const student = students.find(
                        (item) => item.id === result.student_id
                      );

                      return (
                        <div
                          key={result.id}
                          className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                        >
                          <div>
                            <div className="font-bold">
                              {student?.full_name ||
                                "Unknown Student"}
                            </div>

                            <div className="text-sm text-gray-500">
                              Student ID:{" "}
                              {student?.student_id ||
                                "Unknown"}
                            </div>

                            <div className="text-sm mt-2">
                              Score:{" "}
                              <span className="font-bold">
                                {result.score} / 250
                              </span>
                            </div>

                            <div className="text-sm">
                              Questions:{" "}
                              {result.total_questions}
                            </div>

                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(
                                result.created_at
                              ).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-2 rounded-full text-sm font-bold ${
                                result.passed
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {result.passed
                                ? "PASSED"
                                : "FAILED"}
                            </span>

                            <button
                              onClick={() =>
                                deleteResult(result.id)
                              }
                              className="bg-red-600 text-white px-3 py-2 rounded-lg"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STATISTICS */}
            {activeTab === "statistics" && (
              <div>
                <div className="mb-5">
                  <h2 className="text-2xl font-bold">
                    Statistics
                  </h2>

                  <p className="text-sm text-gray-500">
                    Overview of your JFT practice system.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl border p-6">
                    <div className="text-gray-500 text-sm">
                      Registered Students
                    </div>
                    <div className="text-3xl font-bold mt-2">
                      {students.length}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border p-6">
                    <div className="text-gray-500 text-sm">
                      Total Questions
                    </div>
                    <div className="text-3xl font-bold mt-2">
                      {questions.length}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border p-6">
                    <div className="text-gray-500 text-sm">
                      Total Results
                    </div>
                    <div className="text-3xl font-bold mt-2">
                      {results.length}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border p-6">
                    <div className="text-gray-500 text-sm">
                      Average Score
                    </div>
                    <div className="text-3xl font-bold mt-2">
                      {averageScore} / 250
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div className="bg-white rounded-2xl border p-6">
                    <div className="text-gray-500 text-sm">
                      Passed Results
                    </div>

                    <div className="text-3xl font-bold text-green-600 mt-2">
                      {passedResults}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border p-6">
                    <div className="text-gray-500 text-sm">
                      Failed Results
                    </div>

                    <div className="text-3xl font-bold text-red-600 mt-2">
                      {failedResults}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center text-gray-400 text-sm py-8">
        JFT Mock Test Admin Panel
        <br />
        Made by Anish Bhattarai
      </footer>
    </main>
  );
}