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

type MockPurchase = {
  id: string;
  package_id: string | null;
  package_name: string;
  paid_price: number;
  purchased_mock_count: number;
  validity_days: number;
  purchased_at: string;
  expires_at: string | null;
  mocks_used: number;
  payment_status: string;
};

type Result = {
  id: string;
  score: number;
  section_scores?: any;
  answers?: any;
  total_questions: number;
  passed: boolean;
  created_at: string;
  is_deleted: boolean;
};

export default function DashboardPage() {
  const [student, setStudent] = useState<any>(null);
  const [results, setResults] = useState<Result[]>([]);

  const [mockSettings, setMockSettings] =
    useState<MockSettings | null>(null);

  const [packages, setPackages] = useState<MockPackage[]>([]);
  const [purchases, setPurchases] = useState<MockPurchase[]>([]);

  const [loadingMockSystem, setLoadingMockSystem] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);

  const [deletingResultId, setDeletingResultId] =
    useState<string | null>(null);

  const [selectedPackage, setSelectedPackage] =
    useState<MockPackage | null>(null);

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [policyChecked, setPolicyChecked] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const savedStudent = sessionStorage.getItem("loggedInStudent");

    if (!savedStudent) {
      window.location.href = "/login";
      return;
    }

    const currentStudent = JSON.parse(savedStudent);

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

    const {
      data: studentResults,
      error: resultError,
    } = await supabase
      .from("results")
      .select(
        "id, score, section_scores, answers, total_questions, passed, created_at, is_deleted"
      )
      .eq("student_id", currentDbStudent.id)
      .order("created_at", { ascending: false });

    if (!resultError && studentResults) {
      setResults(studentResults);
    }

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

        await loadPurchases(currentDbStudent.id);
      } else {
        setLoadingPurchases(false);
      }
    } else {
      setLoadingPurchases(false);
    }

    setLoadingMockSystem(false);
  }

  async function loadPurchases(studentId: string) {
    setLoadingPurchases(true);

    const {
      data,
      error,
    } = await supabase
      .from("mock_purchases")
      .select(
        "id, package_id, package_name, paid_price, purchased_mock_count, validity_days, purchased_at, expires_at, mocks_used, payment_status"
      )
      .eq("student_id", studentId)
      .order("purchased_at", { ascending: false });

    if (!error && data) {
      setPurchases(data);
    }

    setLoadingPurchases(false);
  }

  function getExpiryDate(purchase: MockPurchase) {
    if (purchase.expires_at) {
      return new Date(purchase.expires_at);
    }

    return new Date(
      new Date(purchase.purchased_at).getTime() +
        purchase.validity_days * 24 * 60 * 60 * 1000
    );
  }

  function isPurchaseActive(purchase: MockPurchase) {
    const now = new Date();
    const expiry = getExpiryDate(purchase);

    return (
      purchase.payment_status === "paid" &&
      purchase.mocks_used < purchase.purchased_mock_count &&
      expiry > now
    );
  }

  function getRemainingMocks(purchase: MockPurchase) {
    return Math.max(
      0,
      purchase.purchased_mock_count - purchase.mocks_used
    );
  }

  function getPurchaseStatus(purchase: MockPurchase) {
    if (purchase.payment_status !== "paid") {
      return "Payment Pending";
    }

    if (purchase.mocks_used >= purchase.purchased_mock_count) {
      return "Mock Tests Used";
    }

    if (getExpiryDate(purchase) <= new Date()) {
      return "Expired";
    }

    return "Active";
  }

  function openPurchaseModal(pkg: MockPackage) {
    setSelectedPackage(pkg);
    setPolicyChecked(false);
    setPurchaseModalOpen(true);
  }

  function closePurchaseModal() {
    if (purchasing) return;

    setPurchaseModalOpen(false);
    setSelectedPackage(null);
    setPolicyChecked(false);
  }

  async function confirmTestPurchase() {
    if (!student || !selectedPackage) return;

    if (!policyChecked) {
      alert(
        "Please confirm that you have read and understood the payment and refund policy."
      );
      return;
    }

    setPurchasing(true);

    const purchasedAt = new Date();

    const expiresAt = new Date(
      purchasedAt.getTime() +
        selectedPackage.validity_days *
          24 *
          60 *
          60 *
          1000
    );

    const demoReference =
      "DEMO-" +
      Date.now().toString();

    const {
      error,
    } = await supabase
      .from("mock_purchases")
      .insert({
        student_id: student.id,
        package_id: selectedPackage.id,
        package_name: selectedPackage.package_name,
        paid_price: selectedPackage.price,
        purchased_mock_count: selectedPackage.mock_count,
        validity_days: selectedPackage.validity_days,
        purchased_at: purchasedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        mocks_used: 0,

        // DEMO ONLY
        // Real payment gateway will replace this later.
        payment_status: "paid",
        payment_reference: demoReference,
      });

    if (error) {
      console.error(error);

      alert(
        "Test purchase failed.\n\n" +
          error.message
      );

      setPurchasing(false);
      return;
    }

    await loadPurchases(student.id);

    setPurchasing(false);
    setPurchaseModalOpen(false);
    setSelectedPackage(null);
    setPolicyChecked(false);

    alert(
      "Test purchase successful!\n\n" +
        "This is a DEMO purchase. No real money was charged."
    );
  }

  async function deleteFailedHistory(result: Result) {
    if (result.passed) {
      alert("Passed results cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this failed result from your history?"
    );

    if (!confirmed) return;

    setDeletingResultId(result.id);

    const {
      error,
    } = await supabase
      .from("results")
      .update({ is_deleted: true })
      .eq("id", result.id)
      .eq("student_id", student.id)
      .eq("passed", false);

    if (error) {
      alert(
        "Failed to delete this history. Please try again."
      );

      setDeletingResultId(null);
      return;
    }

    setResults((currentResults) =>
      currentResults.map((item) =>
        item.id === result.id
          ? { ...item, is_deleted: true }
          : item
      )
    );

    setDeletingResultId(null);
  }

  if (!student) {
    return null;
  }

  const totalAttempts = results.length;

  const visibleResults = results.filter(
    (result) => !result.is_deleted
  );

  const paidSystemEnabled =
    mockSettings?.paid_system_enabled === true;

  const freeDemoEnabled =
    paidSystemEnabled &&
    mockSettings?.free_demo_enabled === true;

  const activePurchases = purchases.filter(
    (purchase) => isPurchaseActive(purchase)
  );

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

          {/* TOTAL ATTEMPTS */}

          <div className="mt-6 bg-gray-50 border rounded-xl p-5">
            <p className="text-gray-600">
              Total Attempts
            </p>

            <p className="text-3xl font-bold mt-1">
              {totalAttempts}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Deleted failed attempts are still counted.
            </p>
          </div>

          {/* OLD MOCK SYSTEM */}

          {!loadingMockSystem &&
            !paidSystemEnabled && (
              <a
                href="/mock-test"
                className="inline-block bg-black text-white px-6 py-3 rounded-lg mt-8"
              >
                Start Mock Test
              </a>
            )}

          {/* PAID SYSTEM */}

          {!loadingMockSystem &&
            paidSystemEnabled && (
              <div className="mt-10 border-2 border-blue-200 rounded-2xl p-6 bg-blue-50">

                <h2 className="text-2xl font-bold">
                  Mock Test Packages
                </h2>

                <p className="mt-2 text-gray-600">
                  Choose a free demo or purchase a mock
                  test package.
                </p>

                {/* FREE DEMO */}

                {freeDemoEnabled && (
                  <div className="mt-6 bg-white border rounded-xl p-5">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                      <div>
                        <h3 className="text-xl font-bold">
                          Free Demo Mock
                        </h3>

                        <p className="text-gray-600 mt-1">
                          {mockSettings?.free_demo_questions ||
                            20}{" "}
                          questions
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

                {/* PURCHASED PACKAGES */}

                <div className="mt-8">

                  <h3 className="text-xl font-bold">
                    My Purchased Packages
                  </h3>

                  {loadingPurchases ? (
                    <p className="mt-4 text-gray-500">
                      Loading purchased packages...
                    </p>
                  ) : purchases.length === 0 ? (
                    <div className="mt-4 bg-white border rounded-xl p-5">
                      <p className="text-gray-500">
                        You have not purchased any package yet.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">

                      {purchases.map((purchase) => {
                        const active =
                          isPurchaseActive(purchase);

                        const expiry =
                          getExpiryDate(purchase);

                        const remaining =
                          getRemainingMocks(purchase);

                        const status =
                          getPurchaseStatus(purchase);

                        return (
                          <div
                            key={purchase.id}
                            className="bg-white border rounded-xl p-5"
                          >

                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                              <div>
                                <h4 className="text-xl font-bold">
                                  {purchase.package_name}
                                </h4>

                                <p className="text-gray-600 mt-2">
                                  Price:{" "}
                                  <span className="font-bold">
                                    Rs.{" "}
                                    {Number(
                                      purchase.paid_price
                                    ).toLocaleString()}
                                  </span>
                                </p>

                                <p className="text-gray-600 mt-1">
                                  Total Mock Tests:{" "}
                                  <span className="font-bold">
                                    {
                                      purchase.purchased_mock_count
                                    }
                                  </span>
                                </p>

                                <p className="text-gray-600 mt-1">
                                  Used:{" "}
                                  <span className="font-bold">
                                    {purchase.mocks_used}
                                  </span>
                                </p>

                                <p className="text-gray-600 mt-1">
                                  Remaining:{" "}
                                  <span className="font-bold">
                                    {remaining}
                                  </span>
                                </p>

                                <p className="text-gray-600 mt-1">
                                  Valid Until:{" "}
                                  <span className="font-bold">
                                    {expiry.toLocaleString()}
                                  </span>
                                </p>

                                <p className="mt-2">
                                  Status:{" "}
                                  <span
                                    className={
                                      active
                                        ? "font-bold text-green-600"
                                        : "font-bold text-red-600"
                                    }
                                  >
                                    {status}
                                  </span>
                                </p>
                              </div>

                              {active && (
                                <a
                                  href="/mock-test"
                                  className="bg-black text-white px-5 py-3 rounded-lg font-semibold text-center"
                                >
                                  Start Mock Test
                                </a>
                              )}

                            </div>

                          </div>
                        );
                      })}

                    </div>
                  )}

                </div>

                {/* AVAILABLE PACKAGES */}

                <div className="mt-8">

                  <h3 className="text-xl font-bold">
                    Available Packages
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
                                {Number(
                                  pkg.price
                                ).toLocaleString()}
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
                            onClick={() =>
                              openPurchaseModal(pkg)
                            }
                            className="w-full mt-5 bg-black text-white px-5 py-3 rounded-lg font-semibold"
                          >
                            Purchase Package
                          </button>

                        </div>
                      ))}

                    </div>
                  )}

                </div>

                {/* PAYMENT INFORMATION */}

                {(freeDemoEnabled ||
                  packages.length > 0) && (
                  <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-5">

                    <p className="font-semibold">
                      Important Payment Information
                    </p>

                    <p className="text-sm text-gray-700 mt-2">
                      Please review the package, number of
                      mock tests, validity period, and price
                      carefully before payment. Payments are
                      non-refundable after successful purchase.
                    </p>

                    <p className="text-sm text-gray-700 mt-3">
                      भुक्तानी गर्नु अघि package, mock test
                      संख्या, validity period र price राम्रोसँग
                      जाँच गर्नुहोस्। सफल payment पछि payment
                      refund गरिने छैन।
                    </p>

                  </div>
                )}

              </div>
            )}

          {/* RESULT HISTORY */}

          <div className="mt-10">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

              <h2 className="text-2xl font-bold">
                My Result History
              </h2>

              <p className="text-sm text-gray-500">
                Total Attempts:{" "}
                <span className="font-bold text-gray-700">
                  {totalAttempts}
                </span>
              </p>

            </div>

            {visibleResults.length === 0 ? (
              <p className="text-gray-500 mt-4">
                You have not taken any visible test yet.
              </p>
            ) : (
              <div className="mt-5 space-y-3">

                {visibleResults.map(
                  (result, index) => {

                    const date =
                      new Date(
                        result.created_at
                      ).toLocaleString();

                    return (
                      <div
                        key={result.id}
                        className="border rounded-xl p-5 bg-gray-50"
                      >

                        <div className="flex flex-col md:flex-row md:justify-between gap-4">

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

                          {!result.passed && (
                            <button
                              onClick={() =>
                                deleteFailedHistory(
                                  result
                                )
                              }
                              disabled={
                                deletingResultId ===
                                result.id
                              }
                              className="text-red-600 font-semibold border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingResultId ===
                              result.id
                                ? "Deleting..."
                                : "Delete History"}
                            </button>
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

          {/* LOGOUT */}

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

          {/* BACK HOME */}

          <div className="mt-6 text-center">

            <a
              href="/"
              className="text-gray-600 hover:text-black"
            >
              ← Back to Home
            </a>

          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            Made by Anish Bhattarai
          </p>

        </div>
      </div>

      {/* PURCHASE MODAL */}

      {purchaseModalOpen &&
        selectedPackage && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-5">

            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">

              <h2 className="text-2xl font-bold">
                Confirm Package Purchase
              </h2>

              <div className="mt-5 bg-gray-50 border rounded-xl p-5">

                <h3 className="text-xl font-bold">
                  {selectedPackage.package_name}
                </h3>

                <div className="mt-4 space-y-2">

                  <p>
                    Price:{" "}
                    <span className="font-bold">
                      Rs.{" "}
                      {Number(
                        selectedPackage.price
                      ).toLocaleString()}
                    </span>
                  </p>

                  <p>
                    Mock Tests:{" "}
                    <span className="font-bold">
                      {selectedPackage.mock_count}
                    </span>
                  </p>

                  <p>
                    Validity:{" "}
                    <span className="font-bold">
                      {selectedPackage.validity_days} days
                    </span>
                  </p>

                </div>

              </div>

              {/* DEMO NOTICE */}

              <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4">

                <p className="font-bold text-blue-800">
                  DEMO / TEST PURCHASE
                </p>

                <p className="text-sm text-blue-700 mt-2">
                  Real payment gateway is not connected yet.
                  Confirming this purchase will only create
                  a test purchase in the system.
                </p>

                <p className="text-sm text-blue-700 mt-2">
                  No real money will be charged.
                </p>

              </div>

              {/* POLICY */}

              <div className="mt-5 border rounded-xl p-4">

                <p className="font-semibold">
                  Payment & Refund Policy
                </p>

                <p className="text-sm text-gray-700 mt-2">
                  Important: Please review the package,
                  number of mock tests, validity period,
                  and price carefully before payment.
                  Payments are non-refundable after
                  successful purchase.
                </p>

                <p className="text-sm text-gray-700 mt-3">
                  भुक्तानी गर्नु अघि package, mock test
                  संख्या, validity period र price राम्रोसँग
                  जाँच गर्नुहोस्। सफल payment पछि payment
                  refund गरिने छैन।
                </p>

                <label className="flex gap-3 mt-4 cursor-pointer">

                  <input
                    type="checkbox"
                    checked={policyChecked}
                    onChange={(e) =>
                      setPolicyChecked(
                        e.target.checked
                      )
                    }
                    className="mt-1 w-5 h-5"
                  />

                  <span className="text-sm font-semibold">
                    I have read and understood the payment
                    and refund policy.
                  </span>

                </label>

              </div>

              {/* BUTTONS */}

              <div className="mt-6 flex flex-col md:flex-row gap-3">

                <button
                  onClick={closePurchaseModal}
                  disabled={purchasing}
                  className="flex-1 border border-gray-300 px-5 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmTestPurchase}
                  disabled={
                    !policyChecked ||
                    purchasing
                  }
                  className="flex-1 bg-black text-white px-5 py-3 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {purchasing
                    ? "Processing..."
                    : "Confirm Test Purchase"}
                </button>

              </div>

            </div>

          </div>
        )}

    </main>
  );
}