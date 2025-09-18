import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "OpenAI-Project": process.env.OPENAI_PROJECT_ID,
    },
    body: JSON.stringify({
      input: "hello world",
      model: "text-embedding-3-small",
    }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
