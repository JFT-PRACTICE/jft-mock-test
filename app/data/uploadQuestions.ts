import { createClient } from "../admin/utils/supabase/client";
import questionBank from "./questionBank";

export async function uploadQuestions() {
  const supabase = createClient();

  const questions = questionBank.map((q) => ({
    section: q.section,
    question: q.question,
    option_a: q.options[0],
    option_b: q.options[1],
    option_c: q.options[2],
    option_d: q.options[3],
    correct_answer: q.options[q.answer],
    difficulty: q.difficulty,
    audio_url: q.audioText ?? null,
  }));

  const { data, error } = await supabase
    .from("questions")
    .insert(questions)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}