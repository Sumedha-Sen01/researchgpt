import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const question = body.question;
    const retrievedChunks = body.retrievedChunks;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a question.",
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(retrievedChunks) ||
      retrievedChunks.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "No relevant paper content was retrieved.",
        },
        { status: 400 }
      );
    }

    const context = retrievedChunks
      .map(
        (item: { chunk: string; index: number; score: number }, position: number) =>
          `Retrieved Section ${position + 1}:\n${item.chunk}`
      )
      .join("\n\n");

    const prompt = `
You are ResearchGPT, an AI research-paper question answering assistant.

Answer the user's question using ONLY the retrieved sections from the research paper provided below.

The retrieved sections were selected because they are relevant to the user's question.

Rules:
- Do not use outside knowledge.
- Do not invent facts.
- Do not invent datasets, algorithms, results, or conclusions.
- If the answer cannot be determined from the retrieved sections, say:
"The answer is not clearly specified in the retrieved sections of the paper."
- Give a clear and concise answer suitable for a university research student.
- Base the answer directly on the provided retrieved content.

User's question:
${question}

Retrieved sections from the research paper:
${context}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    const answer = response.text;

    if (!answer) {
      return NextResponse.json(
        {
          success: false,
          message: "Gemini returned an empty answer.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error("RAG question answering error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to answer the question using the retrieved paper content.",
      },
      { status: 500 }
    );
  }
}