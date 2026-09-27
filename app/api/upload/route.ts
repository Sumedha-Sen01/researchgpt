import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "No PDF file was uploaded.",
        },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          success: false,
          message: "Only PDF files are allowed.",
        },
        { status: 400 }
      );
    }

    // Convert uploaded PDF into binary data
    const arrayBuffer = await file.arrayBuffer();

    const pdfData = new Uint8Array(arrayBuffer);

    // Load the PDF
    const pdf = await getDocumentProxy(pdfData);

    // Extract text from all pages
    const { totalPages, text } = await extractText(pdf, {
      mergePages: true,
    });

    // Make sure the extracted result is a string
    const extractedText = String(text).replace(/\u0000/g, "").trim();

    return NextResponse.json({
  success: true,
  message: "PDF uploaded and text extracted successfully.",
  fileName: file.name,
  fileSize: file.size,
  totalPages,
  textLength: extractedText.length,
  preview: extractedText.substring(0, 1000),
  text: extractedText,
});
  } catch (error) {
    console.error("PDF extraction error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Could not extract text from the PDF.",
      },
      { status: 500 }
    );
  }
}