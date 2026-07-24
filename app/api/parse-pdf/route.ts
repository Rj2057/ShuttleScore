import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse the PDF
    const data = await pdfParse(buffer);
    
    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error("PDF Parse Error:", error);
    return NextResponse.json({ error: `Failed to parse PDF file: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
  }
}
