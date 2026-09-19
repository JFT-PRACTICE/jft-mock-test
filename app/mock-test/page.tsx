"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../admin/utils/supabase/client";

type Difficulty = "easy" | "medium" | "hard";

type Section =
  | "Script and Vocabulary"
  | "Conversation and Expression"
  | "Listening Comprehension"
  | "Reading Comprehension";

type Question = {
  id: string;
  section: Section;
  difficulty: Difficulty;
  question: string;
  image_url?: string | null;
  options: string[];
  answer: number;
  nepali?: string;
  audioText?: string;
};

const sections: Section[] = [
  "Script and Vocabulary",
  "Conversation and Expression",
  "Listening Comprehension",
  "Reading Comprehension",
];

const TOTAL_TIME = 60 * 60;

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function randomCount() {
  return 45 + Math.floor(Math.random() * 8);
}

function getMarks(difficulty: Difficulty) {
  if (difficulty === "easy") return 4;
  if (difficulty === "medium") return 5;
  return 6;
}

function makeMock(bank: Question[], usedIds: string[]) {
  const available = bank.filter(
    (question) => !usedIds.includes(question.id)
  );

  const source = available.length >= 45 ? available : bank;

  const count = Math.min(randomCount(), source.length);

  const selected: Question[] = [];

  const perSection = Math.floor(count / 4);

  sections.forEach((section) => {
    const sectionQuestions = shuffle(
      source.filter(
        (question) => question.section === section
      )
    );

    selected.push(
      ...sectionQuestions.slice(0, perSection)
    );
  });

  while (selected.length < count) {
    const remaining = shuffle(
      source.filter(
        (question) =>
          !selected.some(
            (item) => item.id === question.id
          )
      )
    );

    if (!remaining.length) break;

    selected.push(remaining[0]);
  }

  return shuffle(selected).slice(0, count);
}

export default function MockTestPage() {
  const [student, setStudent] = useState<any>(null);
  const [mock, setMock] = useState<Question[]>([]);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answers, setAnswers] = useState<
    Record<string, number>
  >({});

  const [flags, setFlags] = useState<
    Record<string, boolean>
  >({});

  const [audioPlays, setAudioPlays] = useState<
    Record<string, number>
  >({});

  const [timeLeft, setTimeLeft] =
    useState(TOTAL_TIME);

  const [languageOpen, setLanguageOpen] =
    useState(false);

  const [finished, setFinished] = useState(false);

  const [loading, setLoading] = useState(true);

  const [savingResult, setSavingResult] =
    useState(false);

  const [finalScore, setFinalScore] =
    useState<number | null>(null);

  /*
   * Load logged-in student and questions
   */
  useEffect(() => {
    async function loadMockTest() {
      try {
        const saved = sessionStorage.getItem(
          "loggedInStudent"
        );

        if (!saved) {
          window.location.href = "/login";
          return;
        }

        const currentStudent = JSON.parse(saved);

        setStudent(currentStudent);

        const supabase = createClient();

        /*
         * Check latest student status
         */
        const {
          data: currentStudentData,
          error: studentError,
        } = await supabase
          .from("students")
          .select(
            "id, full_name, student_id, blocked"
          )
          .eq("id", currentStudent.id)
          .maybeSingle();

        if (
          studentError ||
          !currentStudentData
        ) {
          sessionStorage.removeItem(
            "loggedInStudent"
          );

          window.location.href = "/login";
          return;
        }

        if (currentStudentData.blocked) {
          sessionStorage.removeItem(
            "loggedInStudent"
          );

          alert(
            "Your account has been blocked. Please contact admin."
          );

          window.location.href = "/login";
          return;
        }

        const updatedStudent = {
          id: currentStudentData.id,
          full_name: currentStudentData.full_name,
          student_id:
            currentStudentData.student_id,
          blocked: currentStudentData.blocked,
        };

        setStudent(updatedStudent);

        sessionStorage.setItem(
          "loggedInStudent",
          JSON.stringify(updatedStudent)
        );

        /*
         * Get questions already used by this student
         */
        const {
          data: historyData,
          error: historyError,
        } = await supabase
          .from("question_history")
          .select("question_id")
          .eq(
            "student_id",
            currentStudentData.id
          );

        if (historyError) {
          throw new Error(historyError.message);
        }

        const usedIds =
          historyData?.map(
            (item) => item.question_id
          ) || [];

        /*
         * Get all questions from Supabase
         */
        const {
          data: databaseQuestions,
          error,
        } = await supabase
          .from("questions")
          .select(
            `
              id,
              section,
              question,
              option_a,
              option_b,
              option_c,
              option_d,
              correct_answer,
              difficulty,
              audio_url,
              nepali,
              image_url
            `
          );

        if (error) {
          throw new Error(error.message);
        }

        if (
          !databaseQuestions ||
          databaseQuestions.length === 0
        ) {
          throw new Error(
            "No questions found in the database."
          );
        }

        /*
         * Convert database questions
         */
        const convertedQuestions: Question[] =
          databaseQuestions.map((question) => {
            const options = [
              question.option_a,
              question.option_b,
              question.option_c,
              question.option_d,
            ];

            const answerIndex =
              options.indexOf(
                question.correct_answer
              );

            return {
              id: question.id,
              section:
                question.section as Section,
              difficulty:
                question.difficulty as Difficulty,
              question: question.question,
              image_url:
                question.image_url || null,
              options,
              answer:
                answerIndex >= 0
                  ? answerIndex
                  : 0,
              nepali:
                question.nepali || undefined,
              audioText:
                question.audio_url || undefined,
            };
          });

        /*
         * Create randomized mock
         */
        const selected = makeMock(
          convertedQuestions,
          usedIds
        );

        setMock(selected);
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Failed to load Mock Test."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMockTest();
  }, []);

  /*
   * Timer
   */
  useEffect(() => {
    if (
      finished ||
      !mock.length ||
      loading
    ) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((oldTime) => {
        if (oldTime <= 1) {
          clearInterval(timer);
          finishTest();

          return 0;
        }

        return oldTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [finished, mock.length, loading]);

  const currentSection =
    sections[sectionIndex];

  const sectionQuestions = useMemo(() => {
    return mock.filter(
      (question) =>
        question.section === currentSection
    );
  }, [mock, currentSection]);

  const currentQuestion =
    sectionQuestions[currentIndex];

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(remaining).padStart(
      2,
      "0"
    )}`;
  }

  function chooseAnswer(index: number) {
    if (!currentQuestion) return;

    setAnswers((old) => ({
      ...old,
      [currentQuestion.id]: index,
    }));
  }

  function toggleFlag() {
    if (!currentQuestion) return;

    setFlags((old) => ({
      ...old,
      [currentQuestion.id]:
        !old[currentQuestion.id],
    }));
  }

  function nextQuestion() {
    if (
      currentIndex <
      sectionQuestions.length - 1
    ) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function previousQuestion() {
    if (
      currentIndex > 0 &&
      currentSection !==
        "Listening Comprehension"
    ) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  function finishSection() {
    if (
      sectionIndex <
      sections.length - 1
    ) {
      setSectionIndex(
        sectionIndex + 1
      );

      setCurrentIndex(0);

      setLanguageOpen(false);

      return;
    }

    finishTest();
  }

  function playAudio() {
    if (!currentQuestion?.audioText) {
      return;
    }

    const used =
      audioPlays[currentQuestion.id] || 0;

    if (used >= 2) {
      return;
    }

    const speech =
      new SpeechSynthesisUtterance(
        currentQuestion.audioText
      );

    speech.lang = "ja-JP";

    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(speech);

    setAudioPlays((old) => ({
      ...old,
      [currentQuestion.id]: used + 1,
    }));
  }

  function calculateScore() {
    let raw = 0;
    let maxRaw = 0;

    mock.forEach((question) => {
      const marks = getMarks(
        question.difficulty
      );

      maxRaw += marks;

      if (
        answers[question.id] ===
        question.answer
      ) {
        raw += marks;
      }
    });

    if (!maxRaw) {
      return 0;
    }

    return Math.min(
      250,
      Math.max(
        0,
        Math.round(
          (raw / maxRaw) * 250
        )
      )
    );
  }

  async function finishTest() {
    if (
      savingResult ||
      finished
    ) {
      return;
    }

    setSavingResult(true);

    try {
      const score = calculateScore();

      setFinalScore(score);

      const supabase = createClient();

      /*
       * Save result
       */
      const {
        error: resultError,
      } = await supabase
        .from("results")
        .insert({
          student_id: student.id,
          score,
          section_scores: {},
          answers,
          total_questions:
            mock.length,
          passed: score >= 200,
        });

      if (resultError) {
        throw new Error(
          resultError.message
        );
      }

      /*
       * Save question history
       */
      const historyRows = mock.map(
        (question) => ({
          student_id: student.id,
          question_id: question.id,
        })
      );

      if (historyRows.length > 0) {
        const {
          error: historyError,
        } = await supabase
          .from("question_history")
          .upsert(
            historyRows,
            {
              onConflict:
                "student_id,question_id",
              ignoreDuplicates: true,
            }
          );

        if (historyError) {
          throw new Error(
            historyError.message
          );
        }
      }

      setFinished(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not save the result."
      );
    } finally {
      setSavingResult(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Loading Mock Test...</p>
      </main>
    );
  }

  if (
    !student ||
    !currentQuestion
  ) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>
          Mock Test could not be loaded.
        </p>
      </main>
    );
  }

  if (finished) {
    const score =
      finalScore ?? calculateScore();

    return (
      <main className="min-h-screen bg-[#eef1f4]">
        <div className="bg-[#1f4e79] text-white text-center py-2 font-semibold">
          Made by Anish Bhattarai
        </div>

        <div className="max-w-3xl mx-auto p-5 md:p-10">
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="bg-[#3f7d32] text-white p-5">
              <h1 className="text-2xl font-bold">
                Test Result
              </h1>
            </div>

            <div className="p-8 text-center">
              <p className="text-gray-500">
                Candidate
              </p>

              <h2 className="text-xl font-bold">
                {student.full_name}
              </h2>

              <div className="mt-8 border rounded-lg p-8">
                <p className="text-gray-500">
                  Score
                </p>

                <p className="text-6xl font-bold text-[#1f4e79]">
                  {score}
                </p>

                <p className="text-gray-500">
                  / 250
                </p>
              </div>

              <p
                className={`mt-6 text-2xl font-bold ${
                  score >= 200
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {score >= 200
                  ? "PASS"
                  : "NOT PASS"}
              </p>

              <p className="text-gray-500 mt-2">
                Pass Mark: 200
              </p>

              <p className="text-gray-500 mt-2">
                Questions: {mock.length}
              </p>

              <button
                onClick={() => {
                  window.location.href =
                    "/dashboard";
                }}
                className="mt-8 bg-[#1f4e79] text-white px-7 py-3 rounded font-bold"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#1f4e79] text-white text-center py-3 font-semibold">
          Made by Anish Bhattarai
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef1f4]">
      <div className="bg-[#1f4e79] text-white text-center py-2 text-sm font-semibold">
        Made by Anish Bhattarai
      </div>

      <header className="bg-[#3f7d32] text-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="p-4 flex flex-col lg:flex-row lg:justify-between gap-4">
            <div>
              <p className="text-xs opacity-90">
                Japan Foundation Test for Basic
                Japanese
              </p>

              <h1 className="text-xl font-bold mt-1">
                Candidate:{" "}
                {student.full_name}
              </h1>
            </div>

            <div className="flex gap-3 items-center">
              <div className="border border-white/30 px-4 py-2 rounded bg-white/10">
                <p className="text-xs">
                  Time Remaining
                </p>

                <p className="font-mono text-xl font-bold">
                  {formatTime(timeLeft)}
                </p>
              </div>

              <button
                onClick={finishTest}
                disabled={savingResult}
                className="bg-[#f4c430] text-black px-5 py-3 rounded font-bold disabled:opacity-50"
              >
                {savingResult
                  ? "Saving..."
                  : "Finish Test"}
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto">
            {sections.map(
              (section, index) => {
                const active =
                  index === sectionIndex;

                const completed =
                  index < sectionIndex;

                return (
                  <div
                    key={section}
                    className={`min-w-[220px] p-3 border-r border-white/20 text-sm font-bold ${
                      active
                        ? "bg-white text-[#3f7d32]"
                        : completed
                        ? "bg-[#356b2d]"
                        : "bg-[#386f30] opacity-70"
                    }`}
                  >
                    {index + 1}. {section}

                    {completed && (
                      <div className="text-xs mt-1">
                        Completed
                      </div>
                    )}

                    {active && (
                      <div className="text-xs mt-1">
                        Current Section
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="max-w-[1400px] mx-auto p-4 flex flex-col md:flex-row justify-between gap-3">
          <div>
            <p className="font-bold">
              Question:{" "}
              {currentIndex + 1}
            </p>

            <p className="text-sm text-gray-500">
              Section: {currentSection}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setLanguageOpen(true)
              }
              className="border border-[#1f4e79] text-[#1f4e79] px-4 py-2 rounded font-bold"
            >
              Your Language
            </button>

            <button
              onClick={toggleFlag}
              className={`border px-4 py-2 rounded font-bold ${
                flags[currentQuestion.id]
                  ? "bg-yellow-100 border-yellow-500"
                  : "bg-white"
              }`}
            >
              🚩 Flag
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-4">
        <div className="grid lg:grid-cols-[1fr_280px] gap-4">
          <section className="bg-white border rounded-lg shadow-sm">
            <div className="p-6 md:p-10 min-h-[560px]">
              <p className="text-sm text-gray-500">
                Choose one answer.
              </p>

              {currentQuestion.image_url && (
                <div className="mt-6 flex justify-center">
                  <div className="w-full max-w-3xl border rounded-lg bg-gray-50 p-3">
                    <img
                      src={
                        currentQuestion.image_url
                      }
                      alt="Question"
                      className="w-full max-h-[500px] object-contain rounded"
                    />
                  </div>
                </div>
              )}

              {currentQuestion.question && (
                <h2 className="text-xl md:text-2xl font-semibold mt-5 leading-relaxed">
                  {currentQuestion.question}
                </h2>
              )}

              {currentSection ===
                "Listening Comprehension" && (
                <div className="mt-7 border rounded-lg bg-gray-50 p-5">
                  <p className="font-bold">
                    Listening
                  </p>

                  <button
                    onClick={playAudio}
                    disabled={
                      (audioPlays[
                        currentQuestion.id
                      ] || 0) >= 2
                    }
                    className="mt-4 bg-[#1f4e79] text-white px-6 py-3 rounded font-bold disabled:bg-gray-400"
                  >
                    ▶ Play
                  </button>

                  <p className="mt-3 text-sm text-gray-500">
                    Plays:{" "}
                    {audioPlays[
                      currentQuestion.id
                    ] || 0}{" "}
                    / 2
                  </p>
                </div>
              )}

              <div className="mt-8 space-y-3">
                {currentQuestion.options.map(
                  (option, index) => {
                    const selected =
                      answers[
                        currentQuestion.id
                      ] === index;

                    return (
                      <button
                        key={index}
                        onClick={() =>
                          chooseAnswer(index)
                        }
                        className={`w-full text-left border-2 rounded-lg p-4 flex items-center gap-4 ${
                          selected
                            ? "bg-[#dceaf7] border-[#1f4e79]"
                            : "bg-white border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold border ${
                            selected
                              ? "bg-[#1f4e79] text-white"
                              : ""
                          }`}
                        >
                          {String.fromCharCode(
                            65 + index
                          )}
                        </span>

                        {option}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="border-t bg-gray-50 p-4 flex justify-between gap-3">
              <button
                onClick={previousQuestion}
                disabled={
                  currentIndex === 0 ||
                  currentSection ===
                    "Listening Comprehension"
                }
                className="border bg-white px-6 py-3 rounded font-bold disabled:opacity-40"
              >
                ← Back
              </button>

              {currentIndex ===
              sectionQuestions.length - 1 ? (
                <button
                  onClick={finishSection}
                  disabled={savingResult}
                  className="bg-[#f4c430] text-black px-6 py-3 rounded font-bold disabled:opacity-50"
                >
                  {sectionIndex === 3
                    ? "Finish Test"
                    : "Finish Section"}
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="bg-[#1f4e79] text-white px-7 py-3 rounded font-bold"
                >
                  Next →
                </button>
              )}
            </div>
          </section>

          <aside className="bg-white border rounded-lg shadow-sm h-fit">
            <div className="p-5 border-b bg-gray-50">
              <h2 className="font-bold">
                Answer Status
              </h2>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-4 gap-2">
                {sectionQuestions.map(
                  (question, index) => {
                    const answered =
                      answers[
                        question.id
                      ] !== undefined;

                    const active =
                      index === currentIndex;

                    return (
                      <button
                        key={question.id}
                        onClick={() => {
                          if (
                            currentSection ===
                            "Listening Comprehension"
                          ) {
                            return;
                          }

                          setCurrentIndex(index);
                        }}
                        className={`relative h-11 rounded border-2 font-bold ${
                          active
                            ? "bg-[#3f7d32] text-white"
                            : answered
                            ? "bg-gray-200 border-gray-400"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {index + 1}

                        {flags[
                          question.id
                        ] && (
                          <span className="absolute -top-2 -right-2 text-xs">
                            🚩
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>

              <div className="mt-6 border-t pt-5 text-sm space-y-3">
                <p>
                  Answered:{" "}
                  <strong>
                    {
                      sectionQuestions.filter(
                        (question) =>
                          answers[
                            question.id
                          ] !== undefined
                      ).length
                    }
                  </strong>{" "}
                  /{" "}
                  {sectionQuestions.length}
                </p>

                <p>
                  Total Mock Questions:{" "}
                  <strong>
                    {mock.length}
                  </strong>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="bg-[#1f4e79] text-white text-center py-3 font-semibold">
        Made by Anish Bhattarai
      </footer>

      {languageOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-lg overflow-hidden">
            <div className="bg-[#3f7d32] text-white p-5 flex justify-between">
              <h2 className="font-bold">
                Your Language — Nepali
              </h2>

              <button
                onClick={() =>
                  setLanguageOpen(false)
                }
                className="text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="border rounded-lg bg-gray-50 p-5 text-lg">
                {currentQuestion.nepali ||
                  "Nepali explanation will be available for this question."}
              </div>
            </div>

            <div className="border-t p-4 text-right">
              <button
                onClick={() =>
                  setLanguageOpen(false)
                }
                className="bg-[#1f4e79] text-white px-6 py-2 rounded font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}