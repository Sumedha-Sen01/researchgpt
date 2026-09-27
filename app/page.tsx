"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [promptResult, setPromptResult] = useState<{
  qualityAssessment: string;
  strengths: string;
  weaknesses: string;
  improvedPrompt: string;
  improvementExplanation: string;
  promptingTechniques: string;
} | null>(null);
const [optimizingPrompt, setOptimizingPrompt] = useState(false);
const [comparisonFile, setComparisonFile] = useState<File | null>(null);
const [comparisonPaperInfo, setComparisonPaperInfo] = useState<{
  fileName: string;
  totalPages: number;
  textLength: number;
  text: string;
} | null>(null);

const [comparisonResult, setComparisonResult] = useState<{
  researchProblem: string;
  objective: string;
  methodology: string;
  dataset: string;
  modelsAndAlgorithms: string;
  experimentalSetup: string;
  results: string;
  advantages: string;
  limitations: string;
  researchGaps: string;
  similarities: string;
  differences: string;
} | null>(null);

const [comparingPapers, setComparingPapers] = useState(false);
const [aiAnalysis, setAiAnalysis] = useState<{
  title: string;
  researchProblem: string;
  objective: string;
  methodology: string;
  dataset: string;
  modelsAndAlgorithms: string;
  experimentalSetup: string;
  results: string;
  advantages: string;
  limitations: string;
  futureScope: string;
  researchGaps: string;
} | null>(null);
  const [paperInfo, setPaperInfo] = useState<{
        fileName: string;
        totalPages: number;
        textLength: number;
        preview: string;
        text: string;
      } | null>(null);
  const [paperChunks, setPaperChunks] = useState<string[]>([]);
  const [retrievedChunks, setRetrievedChunks] = useState<
  { chunk: string; index: number; score: number }[]
>([]);
  const handleUpload = async () => {
  if (!file) {
    setMessage("Please select a PDF research paper first.");
    return;
  }

  setUploading(true);
  setAnalyzing(false);
  setMessage("");
  setAiAnalysis(null);

  try {
    // Step 1: Upload and extract PDF text
    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok) {
      setMessage(uploadResult.message || "Upload failed.");
      return;
    }

    // Store extracted paper information
    setPaperInfo({
      fileName: uploadResult.fileName,
      totalPages: uploadResult.totalPages,
      textLength: uploadResult.textLength,
      preview: uploadResult.preview,
      text: uploadResult.text,
    });
    await createPaperChunks(uploadResult.text);

    // Step 2: Send the extracted paper text to GenAI
    setUploading(false);
    setAnalyzing(true);

    setMessage("✓ PDF processed. ResearchGPT is analyzing your paper...");

    const analyzeResponse = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paperText: uploadResult.text,
      }),
    });

    const analyzeResult = await analyzeResponse.json();

    if (!analyzeResponse.ok) {
      setMessage(
        analyzeResult.message || "AI analysis failed."
      );
      return;
    }

    // Store AI-generated analysis
    setAiAnalysis(analyzeResult.analysis);

    setMessage(
      "✓ Research paper analyzed successfully by ResearchGPT."
    );
  } catch (error) {
    console.error(error);
    setMessage(
      "Something went wrong while processing the research paper."
    );
  } finally {
    setUploading(false);
    setAnalyzing(false);
  }
};

const createPaperChunks = async (paperText: string) => {
  try {
    const response = await fetch("/api/chunk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paperText,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Chunking failed:", result.message);
      return;
    }

    setPaperChunks(result.chunks);

    console.log("RAG chunks created:", result.totalChunks);
  } catch (error) {
    console.error("Chunking error:", error);
  }
};

const retrieveRelevantChunks = async (questionText: string) => {
  if (paperChunks.length === 0) {
    console.error("No paper chunks are available for retrieval.");
    return [];
  }

  try {
    const response = await fetch("/api/retrieve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: questionText,
        chunks: paperChunks,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Retrieval failed:", result.message);
      return [];
    }

    setRetrievedChunks(result.retrievedChunks);

    console.log("Retrieved chunks:", result.retrievedChunks);

    return result.retrievedChunks;
  } catch (error) {
    console.error("Retrieval error:", error);
    return [];
  }
};
const handleAskQuestion = async () => {
  if (!paperInfo) {
    setAnswer("Please upload a research paper first.");
    return;
  }

  if (!question.trim()) {
    setAnswer("Please enter a question.");
    return;
  }

  setAskingQuestion(true);
  setAnswer("");

  const relevantChunks = await retrieveRelevantChunks(question.trim());

  try {
    const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        question: question.trim(),
        retrievedChunks: relevantChunks,
      }),
    });

    const responseText = await response.text();

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      console.error("Non-JSON response from /api/ask:", responseText);

      setAnswer(
        `The server returned an unexpected response. Status: ${response.status}`
      );
      return;
    }

    if (!response.ok) {
      setAnswer(result.message || "Failed to get an answer.");
      return;
    }

    setAnswer(result.answer);
  } catch (error) {
    console.error("Ask question error:", error);
    setAnswer("Something went wrong while asking the question.");
  } finally {
    setAskingQuestion(false);
  }
};

const handleOptimizePrompt = async () => {
  if (!userPrompt.trim()) {
    setPromptResult(null);
    return;
  }

  setOptimizingPrompt(true);
  setPromptResult(null);

  try {
    const response = await fetch("/api/prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: userPrompt.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setPromptResult({
        qualityAssessment: result.message || "Prompt optimization failed.",
        strengths: "",
        weaknesses: "",
        improvedPrompt: "",
        improvementExplanation: "",
        promptingTechniques: "",
      });
      return;
    }

    setPromptResult(result.result);
  } catch (error) {
    console.error("Prompt optimization error:", error);

    setPromptResult({
      qualityAssessment: "Something went wrong while optimizing the prompt.",
      strengths: "",
      weaknesses: "",
      improvedPrompt: "",
      improvementExplanation: "",
      promptingTechniques: "",
    });
  } finally {
    setOptimizingPrompt(false);
  }
};

const handleComparePapers = async () => {
  if (!paperInfo) {
    setComparisonResult(null);
    return;
  }

  if (!comparisonFile) {
    setComparisonResult(null);
    return;
  }

  setComparingPapers(true);
  setComparisonResult(null);

  try {
    const formData = new FormData();
    formData.append("file", comparisonFile);

    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok) {
      throw new Error(
        uploadResult.message || "Failed to process the second paper."
      );
    }

    setComparisonPaperInfo({
      fileName: uploadResult.fileName,
      totalPages: uploadResult.totalPages,
      textLength: uploadResult.textLength,
      text: uploadResult.text,
    });

    const compareResponse = await fetch("/api/compare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paper1Text: paperInfo.text,
        paper2Text: uploadResult.text,
      }),
    });

    const compareResult = await compareResponse.json();

    if (!compareResponse.ok) {
      throw new Error(
        compareResult.message || "Failed to compare the papers."
      );
    }

    setComparisonResult(compareResult.comparison);
  } catch (error) {
    console.error("Paper comparison error:", error);

    setComparisonResult({
      researchProblem:
        error instanceof Error
          ? error.message
          : "Something went wrong while comparing the papers.",
      objective: "",
      methodology: "",
      dataset: "",
      modelsAndAlgorithms: "",
      experimentalSetup: "",
      results: "",
      advantages: "",
      limitations: "",
      researchGaps: "",
      similarities: "",
      differences: "",
    });
  } finally {
    setComparingPapers(false);
  }
};
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">
              ResearchGPT
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              AI-Powered Research Paper Analysis & Prompt Optimization
            </p>
          </div>

          <div className="hidden text-sm text-gray-500 md:block">
            Generative AI Research Assistant
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* Hero */}
        <section className="text-center">

          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-600">
            Generative AI Research Assistant
          </p>

          <h2 className="text-4xl font-bold leading-tight text-gray-900 md:text-6xl">
            Understand Research Papers
            <br />

            <span className="text-blue-600">
              with Generative AI
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Upload a research paper, analyze its methodology,
            datasets and results, ask questions, identify research
            gaps, and optimize your AI prompts.
          </p>

        </section>

        {/* Upload Card */}
        <section className="mx-auto mt-12 max-w-3xl">

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

            <div className="text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
                📄
              </div>

              <h3 className="mt-5 text-2xl font-semibold text-gray-900">
                Upload Research Paper
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Upload a PDF research paper to begin your analysis.
              </p>

            </div>

            {/* File Upload */}
            <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center transition hover:border-blue-400">

              <p className="mb-4 text-sm text-gray-600">
                Select your research paper
              </p>

              <input
                type="file"
                accept=".pdf"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0];

                  if (selectedFile) {
                    setFile(selectedFile);
                    setMessage("");
                  }
                }}
                className="mx-auto block w-full max-w-md text-sm text-blue-600"
              />

              {file && (
                <div className="mx-auto mt-5 max-w-md rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-medium text-green-700">
                    ✓ PDF selected
                  </p>

                  <p className="mt-1 break-all text-sm text-gray-600">
                    {file.name}
                  </p>
                </div>
              )}

            </div>

            {/* Analyze Button */}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {uploading ? "Uploading..." : "Analyze Paper"}
            </button>

            {/* Upload Message */}
            {message && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center text-sm text-blue-700">
                {message}
              </div>
            )}

          </div>

        </section>

        {/* Paper Extraction Results */}
{paperInfo && (
  <section className="mx-auto mt-10 max-w-5xl">

    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
          ✓
        </div>

        <div>
          <h3 className="text-2xl font-semibold text-gray-900">
            Paper Successfully Processed
          </h3>

          <p className="text-sm text-gray-500">
            ResearchGPT has extracted the text from your PDF.
          </p>
        </div>
      </div>

      {/* Paper Information */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">

        <div className="rounded-xl bg-gray-50 p-5">
          <p className="text-sm text-gray-500">
            File
          </p>

          <p className="mt-1 break-all font-semibold text-gray-900">
            {paperInfo.fileName}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-5">
          <p className="text-sm text-gray-500">
            Pages
          </p>

          <p className="mt-1 text-2xl font-bold text-blue-600">
            {paperInfo.totalPages}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-5">
          <p className="text-sm text-gray-500">
            Extracted Characters
          </p>

          <p className="mt-1 text-2xl font-bold text-blue-600">
            {paperInfo.textLength.toLocaleString()}
          </p>
        </div>

      </div>

      {/* Text Preview */}
      <div className="mt-6">

        <h4 className="text-lg font-semibold text-gray-900">
          Extracted Text Preview
        </h4>

        <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-5">

          <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
            {paperInfo.preview}
          </p>

        </div>

      </div>

    </div>

  </section>
)}
{paperInfo && (
  <section className="mx-auto mt-10 max-w-5xl">
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          ResearchGPT Paper Comparison
        </p>

        <h2 className="mt-2 text-3xl font-bold text-gray-900">
          Compare Two Research Papers
        </h2>

        <p className="mt-2 text-gray-500">
          Your currently uploaded paper will be compared with a second research paper.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
        <p className="mb-3 font-semibold text-gray-900">
          Select the second research paper
        </p>

        <input
          type="file"
          accept=".pdf"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0];

            if (selectedFile) {
              setComparisonFile(selectedFile);
              setComparisonResult(null);
            }
          }}
          className="block w-full text-sm text-gray-700"
        />

        {comparisonFile && (
          <p className="mt-3 text-sm text-gray-600">
            Selected: {comparisonFile.name}
          </p>
        )}
      </div>

      <button
        onClick={handleComparePapers}
        disabled={comparingPapers || !comparisonFile}
        className="mt-5 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {comparingPapers ? "Comparing Papers..." : "Compare Papers"}
      </button>

      {comparisonPaperInfo && (
        <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
          <strong>Second paper:</strong> {comparisonPaperInfo.fileName}
        </div>
      )}

      {comparisonResult && (
        <div className="mt-8 space-y-5">
          <div className="rounded-xl bg-blue-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              🔬 Research Problem
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {comparisonResult.researchProblem}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              🎯 Research Objective
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {comparisonResult.objective}
            </p>
          </div>

          <div className="rounded-xl bg-purple-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              🧪 Methodology
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {comparisonResult.methodology}
            </p>
          </div>

          <div className="rounded-xl bg-green-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              📊 Dataset
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {comparisonResult.dataset}
            </p>
          </div>

          <div className="rounded-xl bg-yellow-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              🤖 Models & Algorithms
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {comparisonResult.modelsAndAlgorithms}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              ⚙️ Experimental Setup
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {comparisonResult.experimentalSetup}
            </p>
          </div>

          <div className="rounded-xl bg-green-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              📈 Results
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {comparisonResult.results}
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              ✅ Advantages & Contributions
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {comparisonResult.advantages}
            </p>
          </div>

          <div className="rounded-xl bg-red-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              ⚠️ Limitations
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {comparisonResult.limitations}
            </p>
          </div>

          <div className="rounded-xl bg-yellow-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              💡 Research Gaps
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {comparisonResult.researchGaps}
            </p>
          </div>

          <div className="rounded-xl bg-indigo-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              🔗 Key Similarities
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {comparisonResult.similarities}
            </p>
          </div>

          <div className="rounded-xl bg-orange-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              🔀 Key Differences
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {comparisonResult.differences}
            </p>
          </div>
        </div>
      )}
    </div>
  </section>
)}

{paperInfo && (
  <section className="mx-auto mt-10 max-w-5xl">
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">
          ResearchGPT Prompt Optimizer
        </p>

        <h2 className="mt-2 text-3xl font-bold text-gray-900">
          Optimize Your Research Prompt
        </h2>

        <p className="mt-2 text-gray-500">
          Enter a prompt and ResearchGPT will analyze and improve it for research use.
        </p>
      </div>

      <textarea
        value={userPrompt}
        onChange={(event) => setUserPrompt(event.target.value)}
        placeholder="Example: Explain this research paper."
        className="min-h-32 w-full rounded-xl border border-gray-300 p-4 text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
      />

      <button
        onClick={handleOptimizePrompt}
        disabled={optimizingPrompt}
        className="mt-4 rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {optimizingPrompt ? "Optimizing..." : "Optimize Prompt"}
      </button>

      {promptResult && (
        <div className="mt-8 space-y-5">
          <div className="rounded-xl bg-gray-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              📋 Prompt Quality Assessment
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {promptResult.qualityAssessment}
            </p>
          </div>

          <div className="rounded-xl bg-green-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              ✅ Strengths
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {promptResult.strengths}
            </p>
          </div>

          <div className="rounded-xl bg-red-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              ⚠️ Weaknesses
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {promptResult.weaknesses}
            </p>
          </div>

          <div className="rounded-xl bg-purple-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              ✨ Improved Prompt
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {promptResult.improvedPrompt}
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              💡 Why This Prompt Is Better
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {promptResult.improvementExplanation}
            </p>
          </div>

          <div className="rounded-xl bg-yellow-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              🧠 Prompting Techniques Used
            </h3>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
              {promptResult.promptingTechniques}
            </p>
          </div>
        </div>
      )}
    </div>
  </section>
)}

{aiAnalysis && (
  <section className="mx-auto mt-10 max-w-5xl">
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          ResearchGPT AI Analysis
        </p>

        <h2 className="mt-2 text-3xl font-bold text-gray-900">
          {aiAnalysis.title}
        </h2>

        <p className="mt-2 text-gray-500">
          AI-generated analysis of your research paper
        </p>
      </div>

      <div className="space-y-6">

        <div className="rounded-xl bg-blue-50 p-6">
          <h3 className="text-xl font-semibold text-gray-900">
            🎯 Research Problem
          </h3>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
            {aiAnalysis.researchProblem}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-6">
          <h3 className="text-xl font-semibold text-gray-900">
            🎯 Research Objective
          </h3>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
            {aiAnalysis.objective}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-6">
          <h3 className="text-xl font-semibold text-gray-900">
            🔬 Methodology
          </h3>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
            {aiAnalysis.methodology}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-6">
          <h3 className="text-xl font-semibold text-gray-900">
            📊 Dataset
          </h3>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
            {aiAnalysis.dataset}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-6">
          <h3 className="text-xl font-semibold text-gray-900">
            🤖 Models & Algorithms
          </h3>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
            {aiAnalysis.modelsAndAlgorithms}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-6">
          <h3 className="text-xl font-semibold text-gray-900">
            ⚙️ Experimental Setup
          </h3>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
            {aiAnalysis.experimentalSetup}
          </p>
        </div>

        <div className="rounded-xl bg-green-50 p-6">
          <h3 className="text-xl font-semibold text-gray-900">
            📈 Results
          </h3>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
            {aiAnalysis.results}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-6">
          <h3 className="text-xl font-semibold text-gray-900">
            ✅ Advantages & Contributions
          </h3>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
            {aiAnalysis.advantages}
          </p>
        </div>

        <div className="rounded-xl bg-red-50 p-6">
          <h3 className="text-xl font-semibold text-gray-900">
            ⚠️ Limitations
          </h3>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
            {aiAnalysis.limitations}
          </p>
        </div>

        <div className="rounded-xl bg-purple-50 p-6">
          <h3 className="text-xl font-semibold text-gray-900">
            🔮 Future Scope
          </h3>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
            {aiAnalysis.futureScope}
          </p>
        </div>

        <div className="rounded-xl bg-yellow-50 p-6">
          <h3 className="text-xl font-semibold text-gray-900">
            💡 Possible Research Gaps
          </h3>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
            {aiAnalysis.researchGaps}
          </p>
        </div>

      </div>
    </div>
  </section>
)}

{paperInfo && (
  <section className="mx-auto mt-10 max-w-5xl">
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          ResearchGPT Q&A
        </p>

        <h2 className="mt-2 text-3xl font-bold text-gray-900">
          Ask Questions About This Paper
        </h2>

        <p className="mt-2 text-gray-500">
          Ask ResearchGPT anything about the uploaded research paper.
        </p>
      </div>

      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="Example: What dataset was used in this research paper?"
        className="min-h-32 w-full rounded-xl border border-gray-300 p-4 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      <button
        onClick={handleAskQuestion}
        disabled={askingQuestion}
        className="mt-4 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {askingQuestion ? "Thinking..." : "Ask ResearchGPT"}
      </button>

      {answer && (
  <div className="mt-6 rounded-xl bg-blue-50 p-6">
    <h3 className="text-lg font-semibold text-gray-900">
      🤖 ResearchGPT Answer
    </h3>

    <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">
      {answer}
    </p>

    {retrievedChunks.length > 0 && (
      <div className="mt-6 border-t border-blue-200 pt-5">
        <h4 className="text-md font-semibold text-gray-900">
          📚 Retrieved Evidence
        </h4>

        <p className="mt-1 text-sm text-gray-600">
          These sections of the research paper were retrieved and used to
          generate the answer.
        </p>

        <div className="mt-4 space-y-3">
          {retrievedChunks.map((item, index) => (
            <div
              key={item.index}
              className="rounded-lg border border-blue-200 bg-white p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">
                  Retrieved Section {index + 1}
                </span>

                <span className="text-xs text-gray-500">
                  Relevance: {(item.score * 100).toFixed(1)}%
                </span>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {item.chunk}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}
    </div>
  </section>
)}

        {/* Main Features */}
        <section className="mt-16">

          <div className="mb-8 text-center">

            <h3 className="text-3xl font-bold text-gray-900">
              What ResearchGPT Can Do
            </h3>

            <p className="mt-2 text-gray-600">
              AI-powered tools for understanding and working with research.
            </p>

          </div>

          <div className="grid gap-6 md:grid-cols-3">

            {/* Paper Analysis */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                📚
              </div>

              <h4 className="mt-5 text-xl font-semibold text-gray-900">
                Paper Analysis
              </h4>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Extract the research objective, methodology,
                datasets, models, experimental setup, results,
                limitations and future scope.
              </p>

            </div>

            {/* Research Q&A */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                💬
              </div>

              <h4 className="mt-5 text-xl font-semibold text-gray-900">
                Research Q&A
              </h4>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Ask questions about an uploaded research paper
                and receive AI-generated answers based on the
                paper content.
              </p>

            </div>

            {/* Prompt Optimizer */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                ✨
              </div>

              <h4 className="mt-5 text-xl font-semibold text-gray-900">
                Prompt Optimizer
              </h4>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Transform simple prompts into clearer, structured
                and more effective prompts using prompt
                engineering techniques.
              </p>

            </div>

          </div>

        </section>

        {/* Additional Features */}
        <section className="mt-8 grid gap-6 md:grid-cols-2">

          {/* Research Gap */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              🔍
            </div>

            <h4 className="mt-5 text-xl font-semibold text-gray-900">
              Research Gap Detection
            </h4>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Identify limitations, unexplored areas and potential
              research directions from the analyzed literature.
            </p>

          </div>

          {/* Multi Paper */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              📊
            </div>

            <h4 className="mt-5 text-xl font-semibold text-gray-900">
              Multi-Paper Comparison
            </h4>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Compare multiple research papers based on
              methodology, datasets, models, results and
              limitations.
            </p>

          </div>

        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500">
        ResearchGPT • Generative AI & Prompt Engineering Project
      </footer>

    </main>
  );
}