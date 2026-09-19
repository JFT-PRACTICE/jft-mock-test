"use client";

import { useEffect, useState } from "react";
import { createClient } from "../admin/utils/supabase/client";

type MockSettings = {
  id: number;
  paid_system_enabled: boolean;
  free_demo_enabled: boolean;
  free_demo_questions: number;
};

type MockPackage = {
  id: string;
  package_name: string;
  price: number;
  mock_count: number;
  validity_days: number;
  enabled: boolean;
};

export default function DashboardPage() {
  const [student, setStudent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);

  const [mockSettings, setMockSettings] =
    useState<MockSettings | null>(null);

  const [packages, setPackages] = useState<MockPackage[]>([]);

  const [loadingMockSystem, setLoadingMockSystem] =
    useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const savedStudent =
        sessionStorage.getItem("loggedInStudent");

      if (!savedStudent) {
        window.location.href = "/login";
        return;
      }

      const currentStudent = JSON.parse(savedStudent);

      setStudent(currentStudent);

      const supabase = createClient();

      // ============================================
      // CHECK LATEST STUDENT STATUS
      // ============================================

      const {
        data: currentDbStudent,
        error: studentError,
      } = await supabase
        .from("students")
        .select("id, full_name, student_id, blocked")
        .eq("id", currentStudent.id)
        .maybeSingle();

      if (studentError || !currentDbStudent) {
        sessionStorage.removeItem("loggedInStudent");
        window.location.href = "/login";
        return;
      }

      // ============================================
      // BLOCK CHECK
      // ============================================

      if (currentDbStudent.blocked) {
        sessionStorage.removeItem("loggedInStudent");

        alert(
          "Your account has been blocked. Please contact admin."
        );

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

      sessionStorage.setItem(
        "loggedInStudent",
        JSON.stringify(updatedStudent)
      );

      // ============================================
      // RESULT HISTORY
      // ============================================

      const {
        data: studentResults,
        error: resultError,
      } = await supabase
        .from("results")
        .select(
          "id, score, section_scores, answers, total_questions, passed, created_at"
        )
        .eq("student_id", currentDbStudent.id)
        .order("created_at", { ascending: false });

      if (!resultError && studentResults) {
        setResults(studentResults);
      }

      // ============================================
      // LOAD LIVE MOCK TEST SETTINGS
      // ============================================

      const {
        data: settings,
        error: settingsError,
      } = await supabase
        .from("mock_test_settings")
        .select(
          "id, paid_system_enabled, free_demo_enabled, free_demo_questions"
        )
        .eq("id", 1)
        .maybeSingle();

      if (!settingsError && settings) {
        setMockSettings(settings);

        // ==========================================
        // LOAD ENABLED PACKAGES ONLY
        // ==========================================

        if (settings.paid_system_enabled) {
          const {
            data: packageData,
            error: packageError,
          } = await supabase
            .from("mock_packages")
            .select(
              "id, package_name, price, mock_count, validity_days, enabled"
            )
            .eq("enabled", true)
            .order("price", { ascending: true });

          if (!packageError && packageData) {
            setPackages(packageData);
          }
        }
      }

      setLoadingMockSystem(false);
    }

    loadDashboard();
  }, []);

  if (!student) {
    return null;
  }

  const paidSystemEnabled =
    mockSettings?.paid_system_enabled === true;

  const freeDemoEnabled =
    paidSystemEnabled &&
    mockSettings?.free_demo_enabled === true;

  return (
    <main className="min-h-screen bg-gray-100 p-5">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-8">

          {/* ========================================
              STUDENT INFORMATION
          ======================================== */}

          <h1 className="text-3xl font-bold">
            Student Dashboard
          </h1>

          <p className="mt-3 text-gray-600">
            Welcome, {student.full_name}
          </p>

          <p className="mt-1 text-gray-500">
            Student ID: {student.student_id}
          </p>

          {/* ========================================
              NORMAL MOCK TEST
              ONLY WHEN PAID SYSTEM IS OFF
          ======================================== */}

          {!loadingMockSystem && !paidSystemEnabled && (
            <a
              href="/mock-test"
              className="inline-block bg-black text-white px-6 py-3 rounded-lg mt-8"
            >
              Start Mock Test
            </a>
          )}

          {/* ========================================
              LIVE PAID MOCK SYSTEM
          ======================================== */}

          {!loadingMockSystem && paidSystemEnabled && (
            <div className="mt-10 border-2 border-blue-200 rounded-2xl p-6 bg-blue-50">

              <h2 className="text-2xl font-bold">
                Mock Test Packages
              </h2>

              <p className="mt-2 text-gray-600">
                Choose a free demo or a paid mock test package.
              </p>

              {/* ====================================
                  FREE DEMO
              ==================================== */}

              {freeDemoEnabled && (
                <div className="mt-6 bg-white border rounded-xl p-5">

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    <div>
                      <h3 className="text-xl font-bold">
                        Free Demo Mock
                      </h3>

                      <p className="text-gray-600 mt-1">
                        {mockSettings?.free_demo_questions || 20} questions
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        Unlimited attempts
                      </p>
                    </div>

                    <a
                      href="/mock-test?mode=free-demo"
                      className="inline-block bg-green-600 text-white px-5 py-3 rounded-lg font-semibold text-center"
                    >
                      Start Free Demo
                    </a>

                  </div>
                </div>
              )}

              {/* ====================================
                  PAID PACKAGES
              ==================================== */}

              <div className="mt-6">

                <h3 className="text-xl font-bold">
                  Paid Mock Tests
                </h3>

                {packages.length === 0 ? (
                  <div className="mt-4 bg-white border rounded-xl p-5">
                    <p className="text-gray-500">
                      No paid packages are available right now.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">

                    {packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="bg-white border rounded-xl p-6"
                      >

                        <h4 className="text-xl font-bold">
                          {pkg.package_name}
                        </h4>

                        <div className="mt-4 space-y-2">

                          <p>
                            Price:{" "}
                            <span className="font-bold">
                              Rs.{" "}
                              {Number(pkg.price).toLocaleString()}
                            </span>
                          </p>

                          <p>
                            Mock Tests:{" "}
                            <span className="font-bold">
                              {pkg.mock_count}
                            </span>
                          </p>

                          <p>
                            Validity:{" "}
                            <span className="font-bold">
                              {pkg.validity_days} days
                            </span>
                          </p>

                        </div>

                        <button
                          onClick={() => {
                            alert(
                              "Payment system will be connected here. Package selected: " +
                                pkg.package_name
                            );
                          }}
                          className="w-full mt-5 bg-black text-white px-5 py-3 rounded-lg font-semibold"
                        >
                          Purchase Package
                        </button>

                      </div>
                    ))}

                  </div>
                )}

              </div>

              {/* ====================================
                  PAYMENT NOTICE
              ==================================== */}

              {(freeDemoEnabled || packages.length > 0) && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5">

                  <p className="font-semibold">
                    Important Payment Information
                  </p>

                  <p className="text-sm text-gray-700 mt-2">
                    Please review the package, number of mock
                    tests, validity period, and price carefully
                    before payment. Payments are non-refundable
                    after successful purchase.
                  </p>

                  <p className="text-sm text-gray-700 mt-3">
                    भुक्तानी गर्नु अघि package, mock test संख्या,
                    validity period र price राम्रोसँग जाँच गर्नुहोस्।
                    सफल payment पछि payment refund गरिने छैन।
                  </p>

                </div>
              )}

            </div>
          )}

          {/* ========================================
              RESULT HISTORY
          ======================================== */}

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
                            {result.passed
                              ? "Passed"
                              : "Not Passed"}
                          </span>
                        </p>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </div>

          {/* ========================================
              LOGOUT
          ======================================== */}

          <button
            onClick={() => {
              sessionStorage.removeItem(
                "loggedInStudent"
              );

              window.location.href = "/login";
            }}
            className="block mt-8 text-red-600"
          >
            Logout
          </button>

          {/* ========================================
              BACK TO HOME
          ======================================== */}

          <div className="mt-6 text-center">

            <a
              href="/"
              className="text-gray-600 hover:text-black"
            >
              ← Back to Home
            </a>

          </div>

          {/* ========================================
              FOOTER
          ======================================== */}

          <p className="mt-6 text-center text-xs text-gray-500">
            Made by Anish Bhattarai
          </p>

        </div>
      </div>
    </main>
  );
}