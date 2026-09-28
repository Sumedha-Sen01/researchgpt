# ResearchGPT: AI-Powered Research Paper Analysis and Prompt Optimization

ResearchGPT is a web-based Generative AI application designed to help students and researchers understand, analyze, compare, and interact with research papers more efficiently.

The application allows users to upload research papers in PDF format, automatically extract their content, generate structured AI-based analysis, ask questions about the paper using Retrieval-Augmented Generation (RAG), compare multiple papers, identify research gaps, and optimize research prompts.

---

## 🚀 Features

### 📄 Research Paper Upload
- Upload research papers in PDF format.
- Extract text directly from uploaded PDFs.
- Display basic document information such as:
  - File name
  - File size
  - Number of pages
  - Extracted text preview

### 🤖 AI-Powered Research Paper Analysis

ResearchGPT generates a structured analysis of the uploaded research paper, including:

- Title
- Research problem
- Research objectives
- Methodology
- Dataset
- Models and algorithms
- Experimental setup
- Results
- Advantages
- Limitations
- Future scope
- Research gaps

### 🔎 Retrieval-Augmented Generation (RAG)

ResearchGPT allows users to ask questions about an uploaded paper.

The RAG pipeline:

1. Extracts text from the PDF.
2. Splits the text into smaller chunks.
3. Retrieves the most relevant chunks based on the user's question.
4. Sends the retrieved content to the Gemini model.
5. Generates an answer grounded in the retrieved paper content.
6. Displays the retrieved evidence used for the answer.

This helps reduce unsupported answers by restricting the question-answering process to the retrieved paper content.

### 📚 Multiple-Paper Comparison

Users can provide two research papers and generate an AI-based comparison covering aspects such as:

- Research problem
- Objectives
- Methodology
- Datasets
- Algorithms/models
- Results
- Limitations
- Future scope

### ✨ Prompt Optimizer

ResearchGPT includes a prompt optimization module that analyzes a user's research prompt.

It provides:

- Prompt quality analysis
- Strengths
- Weaknesses
- Suggested improvements
- An optimized version of the prompt
- Explanation of the prompt engineering techniques used

### 🧠 Research Gap Identification

The system extracts and presents research gaps identified from the uploaded research paper, helping users understand potential areas for future research.

---

## 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      User / UI       │
                    │   ResearchGPT Web    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    PDF Upload        │
                    │   & Text Extraction  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Text Chunking      │
                    │  & Pre-processing    │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │ AI Analysis │ │ RAG / Q&A   │ │ Comparison  │
        └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
               │               │               │
               └───────────────┼───────────────┘
                               ▼
                    ┌──────────────────────┐
                    │    Gemini API        │
                    │ Generative AI Model  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Structured Results   │
                    │ & Research Insights  │
                    └──────────────────────┘
