import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userPrompt = body.prompt;

    if (!userPrompt || typeof userPrompt !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a prompt to optimize.",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are ResearchGPT, an expert AI prompt optimization assistant.

Analyze the user's prompt and improve it for research and academic use.

User's original prompt:
${userPrompt}

Provide the following:

1. Prompt quality assessment
2. Strengths of the original prompt
3. Weaknesses of the original prompt
4. Improved prompt
5. Explanation of why the improved prompt is better
6. Prompting techniques used in the improved prompt

Do not claim that the original prompt is objectively "bad".
Give constructive and practical feedback.

For the improved prompt:
- Make the task clear.
- Specify the expected role when useful.
- Add relevant context requirements.
- Specify the desired output format.
- Add useful constraints.
- Avoid unnecessary complexity.

Return the result as JSON.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            qualityAssessment: {
              type: "STRING",
            },
            strengths: {
              type: "STRING",
            },
            weaknesses: {
              type: "STRING",
            },
            improvedPrompt: {
              type: "STRING",
            },
            improvementExplanation: {
              type: "STRING",
            },
            promptingTechniques: {
              type: "STRING",
            },
          },
          required: [
            "qualityAssessment",
            "strengths",
            "weaknesses",
            "improvedPrompt",
            "improvementExplanation",
            "promptingTechniques",
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

    const result = JSON.parse(output);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Prompt optimization error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to optimize the prompt using Gemini.",
      },
      { status: 500 }
    );
  }
}