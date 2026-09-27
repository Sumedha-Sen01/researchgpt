import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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

    const prompt = `
You are ResearchGPT, an AI research-paper analysis assistant.

Analyze the following research paper carefully.

Your analysis must be based ONLY on the information contained in the paper.

Do not invent facts, datasets, algorithms, numerical results, or conclusions.

If information is not available, write:
"Not clearly specified in the paper."

Analyze these areas:

1. Title
2. Research problem
3. Research objective
4. Methodology
5. Dataset
6. Models and algorithms
7. Experimental setup
8. Results
9. Advantages and contributions
10. Limitations
11. Future scope
12. Possible research gaps

For research gaps, identify limitations, unexplored areas, missing comparisons, dataset limitations, methodological limitations, or possible directions that are reasonably supported by the paper.

Keep each answer clear and suitable for a university research student.

Research paper:

${paperText}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,

      config: {
        responseMimeType: "application/json",

        responseSchema: {
          type: Type.OBJECT,

          properties: {
            title: {
              type: Type.STRING,
            },

            researchProblem: {
              type: Type.STRING,
            },

            objective: {
              type: Type.STRING,
            },

            methodology: {
              type: Type.STRING,
            },

            dataset: {
              type: Type.STRING,
            },

            modelsAndAlgorithms: {
              type: Type.STRING,
            },

            experimentalSetup: {
              type: Type.STRING,
            },

            results: {
              type: Type.STRING,
            },

            advantages: {
              type: Type.STRING,
            },

            limitations: {
              type: Type.STRING,
            },

            futureScope: {
              type: Type.STRING,
            },

            researchGaps: {
              type: Type.STRING,
            },
          },

          required: [
            "title",
            "researchProblem",
            "objective",
            "methodology",
            "dataset",
            "modelsAndAlgorithms",
            "experimentalSetup",
            "results",
            "advantages",
            "limitations",
            "futureScope",
            "researchGaps",
          ],
        },
      },
    });

    const output = response.text;

    if (!output) {
      return NextResponse.json(
        {
          success: false,
          message: "Gemini returned an empty response.",
        },
        { status: 500 }
      );
    }

    const analysis = JSON.parse(output);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Gemini analysis error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to analyze the research paper using Gemini.",
      },
      { status: 500 }
    );
  }
}