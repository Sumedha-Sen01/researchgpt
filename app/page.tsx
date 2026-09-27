"use client";

import { useState } from "react";

type RetrievedChunk = {
  chunk: string;
  index: number;
  score: number;
};

type PaperInfo = {
  fileName: string;
  totalPages: number;
  textLength: number;
  preview: string;
  text: string;
};

type AnalysisResult = {
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
};

type ComparisonResult = {
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
};

type PromptResult = {
  qualityAssessment: string;
  strengths: string;
  weaknesses: string;
  improvedPrompt: string;
  improvementExplanation: string;
  promptingTechniques: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");

  const [paperInfo, setPaperInfo] = useState<PaperInfo | null>(null);
  const [paperChunks, setPaperChunks] = useState<string[]>([]);
  const [retrievedChunks, setRetrievedChunks] = useState<RetrievedChunk[]>(
    []
  );

  const [aiAnalysis, setAiAnalysis] = useState<AnalysisResult | null>(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);

  const [comparisonFile, setComparisonFile] = useState<File | null>(null);
  const [comparisonPaperInfo, setComparisonPaperInfo] =
    useState<PaperInfo | null>(null);
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [comparingPapers, setComparingPapers] = useState(false);

  const [userPrompt, setUserPrompt] = useState("");
  const [promptResult, setPromptResult] = useState<PromptResult | null>(null);
  const [optimizingPrompt, setOptimizingPrompt] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a PDF research paper first.");
      return;
    }

    setUploading(true);
    setAnalyzing(false);
    setMessage("");
    setAiAnalysis(null);
    setAnswer("");
    setRetrievedChunks([]);

    try {
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

      setPaperInfo({
        fileName: uploadResult.fileName,
        totalPages: uploadResult.totalPages,
        textLength: uploadResult.textLength,
        preview: uploadResult.preview,
        text: uploadResult.text,
      });

      await createPaperChunks(uploadResult.text);

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
        setMessage(analyzeResult.message || "AI analysis failed.");
        return;
      }

      setAiAnalysis(analyzeResult.analysis);

      setMessage("✓ Research paper analyzed successfully by ResearchGPT.");
    } catch (error) {
      console.error("Upload error:", error);
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
    setRetrievedChunks([]);

    try {
      const relevantChunks = await retrieveRelevantChunks(question.trim());

      if (!relevantChunks || relevantChunks.length === 0) {
        setAnswer("No relevant content could be retrieved from the paper.");
        return;
      }

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
          qualityAssessment:
            result.message || "Prompt optimization failed.",
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
        qualityAssessment:
          "Something went wrong while optimizing the prompt.",
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
        preview: uploadResult.preview,
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

  const ResultCard = ({
    icon,
    title,
    content,
    className = "bg-white",
  }: {
    icon: string;
    title: string;
    content: string;
    className?: string;
  }) => (
    <div
      className={`rounded-2xl border border-slate-200 p-6 shadow-sm ${className}`}
    >
      <h3 className="flex items-center gap-3 text-lg font-bold text-slate-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-lg">
          {icon}
        </span>
        {title}
      </h3>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
        {content}
      </p>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-sm">
              📚
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                ResearchGPT
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                AI Research Assistant
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#analyze" className="transition hover:text-blue-600">
              Analyze
            </a>

            <a href="#compare" className="transition hover:text-blue-600">
              Compare
            </a>

            <a href="#prompt" className="transition hover:text-blue-600">
              Prompt Optimizer
            </a>

            <a href="#features" className="transition hover:text-blue-600">
              Features
            </a>
          </nav>

          <div className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            GenAI Powered
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            ✨ Generative AI Research Assistant
          </div>

          <h2 className="mx-auto mt-7 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-950 md:text-6xl md:leading-tight">
            Understand Research Papers
            <span className="block text-blue-600">
              Faster with AI
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
            Upload a research paper and use ResearchGPT to analyze its
            methodology, datasets, models, results and research gaps.
            Ask questions using retrieval-augmented generation and
            improve your research prompts.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-4 py-2">
              📄 PDF Analysis
            </span>

            <span className="rounded-full bg-slate-100 px-4 py-2">
              🔍 RAG Q&A
            </span>

            <span className="rounded-full bg-slate-100 px-4 py-2">
              📊 Paper Comparison
            </span>

            <span className="rounded-full bg-slate-100 px-4 py-2">
              ✨ Prompt Optimization
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Upload */}
        <section id="analyze" className="scroll-mt-24">
          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/70 px-8 py-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
                    📄
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-blue-600">
                      STEP 01
                    </p>

                    <h3 className="mt-1 text-2xl font-bold text-slate-900">
                      Upload Your Research Paper
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Start by uploading a PDF. ResearchGPT will extract and
                      analyze its content automatically.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition hover:border-blue-400 hover:bg-blue-50/30">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                    📑
                  </div>

                  <h4 className="mt-5 text-lg font-semibold text-slate-900">
                    Select a PDF research paper
                  </h4>

                  <p className="mt-2 text-sm text-slate-500">
                    PDF files only
                  </p>

                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(event) => {
                      const selectedFile = event.target.files?.[0];

                      if (selectedFile) {
                        setFile(selectedFile);
                        setMessage("");
                      }
                    }}
                    className="mx-auto mt-6 block w-full max-w-md cursor-pointer rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-600"
                  />

                  {file && (
                    <div className="mx-auto mt-5 max-w-md rounded-xl border border-green-200 bg-green-50 p-4 text-left">
                      <p className="text-sm font-semibold text-green-700">
                        ✓ PDF selected
                      </p>

                      <p className="mt-1 break-all text-sm text-slate-600">
                        {file.name}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploading || analyzing}
                  className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {uploading
                    ? "Uploading PDF..."
                    : analyzing
                      ? "ResearchGPT is analyzing..."
                      : "Analyze Research Paper"}
                </button>

                {message && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-center text-sm font-medium text-blue-700">
                    {message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Paper Information */}
        {paperInfo && (
          <section className="mx-auto mt-10 max-w-6xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-green-600">
                    PDF Processing Complete
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    Paper Successfully Processed
                  </h3>
                </div>

                <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                  ✓ Ready for ResearchGPT
                </div>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    File
                  </p>

                  <p className="mt-2 break-all font-semibold text-slate-800">
                    {paperInfo.fileName}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Pages
                  </p>

                  <p className="mt-2 text-2xl font-bold text-blue-600">
                    {paperInfo.totalPages}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Extracted Characters
                  </p>

                  <p className="mt-2 text-2xl font-bold text-blue-600">
                    {paperInfo.textLength.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <h4 className="font-semibold text-slate-900">
                  Extracted Text Preview
                </h4>

                <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {paperInfo.preview}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* AI Analysis */}
        {aiAnalysis && (
          <section className="mx-auto mt-10 max-w-6xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="border-b border-slate-100 pb-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  STEP 02 · AI ANALYSIS
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {aiAnalysis.title}
                </h2>

                <p className="mt-2 text-slate-500">
                  Structured analysis generated from the uploaded paper.
                </p>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <ResultCard
                  icon="🎯"
                  title="Research Problem"
                  content={aiAnalysis.researchProblem}
                  className="bg-blue-50/50"
                />

                <ResultCard
                  icon="🎯"
                  title="Research Objective"
                  content={aiAnalysis.objective}
                />

                <ResultCard
                  icon="🔬"
                  title="Methodology"
                  content={aiAnalysis.methodology}
                />

                <ResultCard
                  icon="📊"
                  title="Dataset"
                  content={aiAnalysis.dataset}
                />

                <ResultCard
                  icon="🤖"
                  title="Models & Algorithms"
                  content={aiAnalysis.modelsAndAlgorithms}
                />

                <ResultCard
                  icon="⚙️"
                  title="Experimental Setup"
                  content={aiAnalysis.experimentalSetup}
                />

                <ResultCard
                  icon="📈"
                  title="Results"
                  content={aiAnalysis.results}
                  className="bg-green-50/60"
                />

                <ResultCard
                  icon="✅"
                  title="Advantages & Contributions"
                  content={aiAnalysis.advantages}
                />

                <ResultCard
                  icon="⚠️"
                  title="Limitations"
                  content={aiAnalysis.limitations}
                  className="bg-red-50/60"
                />

                <ResultCard
                  icon="🔮"
                  title="Future Scope"
                  content={aiAnalysis.futureScope}
                />

                <div className="md:col-span-2">
                  <ResultCard
                    icon="💡"
                    title="Possible Research Gaps"
                    content={aiAnalysis.researchGaps}
                    className="bg-amber-50/70"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Q&A */}
        {paperInfo && (
          <section className="mx-auto mt-10 max-w-6xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="border-b border-slate-100 pb-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  STEP 03 · RAG QUESTION ANSWERING
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  Ask Questions About This Paper
                </h2>

                <p className="mt-2 text-slate-500">
                  ResearchGPT retrieves relevant sections of the paper before
                  generating an answer.
                </p>
              </div>

              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Example: What dataset was used in this research paper?"
                className="mt-7 min-h-32 w-full rounded-2xl border border-slate-300 bg-slate-50 p-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              <button
                onClick={handleAskQuestion}
                disabled={askingQuestion}
                className="mt-4 rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {askingQuestion ? "ResearchGPT is thinking..." : "Ask ResearchGPT"}
              </button>

              {answer && (
                <div className="mt-7 rounded-2xl border border-blue-200 bg-blue-50/70 p-6">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    🤖 ResearchGPT Answer
                  </h3>

                  <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">
                    {answer}
                  </p>

                  {retrievedChunks.length > 0 && (
                    <div className="mt-7 border-t border-blue-200 pt-6">
                      <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                        📚 Retrieved Evidence
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        These sections were retrieved from the paper and used
                        as context for the answer.
                      </p>

                      <div className="mt-5 space-y-4">
                        {retrievedChunks.map((item, index) => (
                          <div
                            key={item.index}
                            className="rounded-2xl border border-slate-200 bg-white p-5"
                          >
                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                              <span className="text-sm font-bold text-slate-800">
                                Retrieved Section {index + 1}
                              </span>

                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                Relevance: {(item.score * 100).toFixed(1)}%
                              </span>
                            </div>

                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
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

        {/* Comparison */}
        {paperInfo && (
          <section id="compare" className="mx-auto mt-10 max-w-6xl scroll-mt-24">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="border-b border-slate-100 pb-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                  STEP 04 · MULTI-PAPER ANALYSIS
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  Compare Two Research Papers
                </h2>

                <p className="mt-2 text-slate-500">
                  Compare the uploaded paper with another research paper using
                  the same structured research dimensions.
                </p>
              </div>

              <div className="mt-7 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
                  📊
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  Select the second research paper
                </h3>

                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0];

                    if (selectedFile) {
                      setComparisonFile(selectedFile);
                      setComparisonResult(null);
                    }
                  }}
                  className="mt-4 block w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-600"
                />

                {comparisonFile && (
                  <p className="mt-3 text-sm text-slate-600">
                    Selected: <strong>{comparisonFile.name}</strong>
                  </p>
                )}
              </div>

              <button
                onClick={handleComparePapers}
                disabled={comparingPapers || !comparisonFile}
                className="mt-5 rounded-xl bg-indigo-600 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {comparingPapers ? "Comparing Papers..." : "Compare Papers"}
              </button>

              {comparisonPaperInfo && (
                <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  <strong>Second paper:</strong>{" "}
                  {comparisonPaperInfo.fileName}
                </div>
              )}

              {comparisonResult && (
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <ResultCard
                    icon="🔬"
                    title="Research Problem"
                    content={comparisonResult.researchProblem}
                  />

                  <ResultCard
                    icon="🎯"
                    title="Research Objective"
                    content={comparisonResult.objective}
                  />

                  <ResultCard
                    icon="🧪"
                    title="Methodology"
                    content={comparisonResult.methodology}
                  />

                  <ResultCard
                    icon="📊"
                    title="Dataset"
                    content={comparisonResult.dataset}
                  />

                  <ResultCard
                    icon="🤖"
                    title="Models & Algorithms"
                    content={comparisonResult.modelsAndAlgorithms}
                  />

                  <ResultCard
                    icon="⚙️"
                    title="Experimental Setup"
                    content={comparisonResult.experimentalSetup}
                  />

                  <ResultCard
                    icon="📈"
                    title="Results"
                    content={comparisonResult.results}
                    className="bg-green-50/60"
                  />

                  <ResultCard
                    icon="✅"
                    title="Advantages & Contributions"
                    content={comparisonResult.advantages}
                  />

                  <ResultCard
                    icon="⚠️"
                    title="Limitations"
                    content={comparisonResult.limitations}
                    className="bg-red-50/60"
                  />

                  <ResultCard
                    icon="💡"
                    title="Research Gaps"
                    content={comparisonResult.researchGaps}
                    className="bg-amber-50/70"
                  />

                  <ResultCard
                    icon="🔗"
                    title="Key Similarities"
                    content={comparisonResult.similarities}
                    className="bg-indigo-50/60"
                  />

                  <ResultCard
                    icon="🔀"
                    title="Key Differences"
                    content={comparisonResult.differences}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Prompt Optimizer */}
        {paperInfo && (
          <section id="prompt" className="mx-auto mt-10 max-w-6xl scroll-mt-24">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="border-b border-slate-100 pb-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
                  STEP 05 · PROMPT ENGINEERING
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  Optimize Your Research Prompt
                </h2>

                <p className="mt-2 text-slate-500">
                  Analyze a prompt, identify weaknesses, and generate an
                  improved version using prompting techniques.
                </p>
              </div>

              <textarea
                value={userPrompt}
                onChange={(event) => setUserPrompt(event.target.value)}
                placeholder="Example: Explain this research paper."
                className="mt-7 min-h-32 w-full rounded-2xl border border-slate-300 bg-slate-50 p-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
              />

              <button
                onClick={handleOptimizePrompt}
                disabled={optimizingPrompt}
                className="mt-4 rounded-xl bg-purple-600 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {optimizingPrompt
                  ? "Optimizing Prompt..."
                  : "Optimize Prompt"}
              </button>

              {promptResult && (
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <ResultCard
                    icon="📋"
                    title="Prompt Quality Assessment"
                    content={promptResult.qualityAssessment}
                  />

                  <ResultCard
                    icon="✅"
                    title="Strengths"
                    content={promptResult.strengths}
                    className="bg-green-50/60"
                  />

                  <ResultCard
                    icon="⚠️"
                    title="Weaknesses"
                    content={promptResult.weaknesses}
                    className="bg-red-50/60"
                  />

                  <div className="md:col-span-2">
                    <ResultCard
                      icon="✨"
                      title="Improved Prompt"
                      content={promptResult.improvedPrompt}
                      className="bg-purple-50/60"
                    />
                  </div>

                  <ResultCard
                    icon="💡"
                    title="Why This Prompt Is Better"
                    content={promptResult.improvementExplanation}
                  />

                  <ResultCard
                    icon="🧠"
                    title="Prompting Techniques Used"
                    content={promptResult.promptingTechniques}
                    className="bg-amber-50/60"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Features */}
        <section id="features" className="mx-auto mt-20 max-w-6xl scroll-mt-24">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              ResearchGPT Capabilities
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Everything You Need for Research
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-slate-500">
              A single AI-powered workspace for understanding papers,
              exploring evidence and improving research prompts.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                📚
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                Paper Analysis
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Extract research problems, objectives, methodology, datasets,
                models, results, limitations and future scope.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                🔍
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                RAG-Based Q&A
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Retrieve relevant paper sections and use them as context for
                grounded research-paper questions.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-2xl">
                ✨
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                Prompt Optimization
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Improve research prompts by identifying weaknesses and applying
                structured prompting techniques.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl">
                💡
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                Research Gap Detection
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Surface possible research gaps from limitations and future
                directions identified in the analyzed paper.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
                📊
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                Multi-Paper Comparison
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Compare research papers across methodology, datasets, models,
                results, limitations and research gaps.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
                📖
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                Evidence-Based Answers
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                View the retrieved evidence sections that were supplied to the
                AI while answering a question.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-center md:flex-row md:text-left">
          <div>
            <p className="font-semibold text-slate-900">
              ResearchGPT
            </p>

            <p className="mt-1 text-sm text-slate-500">
              AI-Powered Research Paper Analysis and Prompt Optimization
            </p>
          </div>

          <p className="text-sm text-slate-400">
            Generative AI & Prompt Engineering Project
          </p>
        </div>
      </footer>
    </main>
  );
}