import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import questionBank from "@/app/data/questionBank";

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

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
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Upload failed",
      },
      { status: 500 }
    );
  }
}