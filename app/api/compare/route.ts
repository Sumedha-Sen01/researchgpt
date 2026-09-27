import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const paper1Text = body.paper1Text;
    const paper2Text = body.paper2Text;

    if (!paper1Text || typeof paper1Text !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "First research paper text was not provided.",
        },
        { status: 400 }
      );
    }

    if (!paper2Text || typeof paper2Text !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Second research paper text was not provided.",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are ResearchGPT, an AI research-paper comparison assistant.

Compare the two research papers provided below.

Base your comparison ONLY on the information contained in the two papers.

Do not invent facts, datasets, algorithms, numerical results, or conclusions.

If information is not available in either paper, write:
"Not clearly specified in the paper."

Compare the papers across these areas:

1. Research problem
2. Research objective
3. Methodology
4. Dataset
5. Models and algorithms
6. Experimental setup
7. Results
8. Advantages and contributions
9. Limitations
10. Research gaps
11. Key similarities
12. Key differences

Clearly distinguish Paper 1 from Paper 2.

Keep the comparison clear and suitable for a university research student.

PAPER 1:
${paper1Text}

PAPER 2:
${paper2Text}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            researchProblem: { type: "STRING" },
            objective: { type: "STRING" },
            methodology: { type: "STRING" },
            dataset: { type: "STRING" },
            modelsAndAlgorithms: { type: "STRING" },
            experimentalSetup: { type: "STRING" },
            results: { type: "STRING" },
            advantages: { type: "STRING" },
            limitations: { type: "STRING" },
            researchGaps: { type: "STRING" },
            similarities: { type: "STRING" },
            differences: { type: "STRING" },
          },
          required: [
            "researchProblem",
            "objective",
            "methodology",
            "dataset",
            "modelsAndAlgorithms",
            "experimentalSetup",
            "results",
            "advantages",
            "limitations",
            "researchGaps",
            "similarities",
            "differences",
          ],
        },
      },
    });

    const output = response.text;

    if (!output) {
      return NextResponse.json(
        {
          success: false,
          message: "Gemini returned an empty comparison.",
        },
        { status: 500 }
      );
    }

    const comparison = JSON.parse(output);

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (error) {
    console.error("Paper comparison error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to compare the research papers using Gemini.",
      },
      { status: 500 }
    );
  }
}