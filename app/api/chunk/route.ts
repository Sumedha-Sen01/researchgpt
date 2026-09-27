import { NextResponse } from "next/server";

function createChunks(text: string, chunkSize = 1200, overlap = 200) {
  const chunks: string[] = [];

  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);

    const chunk = text.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= text.length) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const paperText = body.paperText;

    if (!paperText || typeof paperText !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "No research paper text was provided.",
        },
        { status: 400 }
      );
    }

    const chunks = createChunks(paperText);

    return NextResponse.json({
      success: true,
      message: "Research paper divided into searchable chunks.",
      totalChunks: chunks.length,
      chunkSize: 1200,
      overlap: 200,
      chunks,
    });
  } catch (error) {
    console.error("Chunking error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create text chunks.",
      },
      { status: 500 }
    );
  }
}