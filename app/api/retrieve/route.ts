import { NextResponse } from "next/server";

function getWords(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function calculateSimilarity(question: string, chunk: string) {
  const questionWords = getWords(question);
  const chunkWords = getWords(chunk);

  const chunkWordSet = new Set(chunkWords);

  const matchingWords = questionWords.filter((word) =>
    chunkWordSet.has(word)
  );

  const uniqueMatches = new Set(matchingWords);

  return uniqueMatches.size / Math.max(new Set(questionWords).size, 1);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const question = body.question;
    const chunks = body.chunks;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "No question was provided.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No paper chunks were provided.",
        },
        { status: 400 }
      );
    }

    const rankedChunks = chunks
      .map((chunk: string, index: number) => ({
        chunk,
        index,
        score: calculateSimilarity(question, chunk),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      retrievedChunks: rankedChunks,
    });
  } catch (error) {
    console.error("Retrieval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve relevant paper chunks.",
      },
      { status: 500 }
    );
  }
}