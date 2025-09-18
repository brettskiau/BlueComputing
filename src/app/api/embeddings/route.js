// src/app/api/embeddings/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // needed so we can use fetch with env on server

export async function POST(req) {
  const { text } = await req.json();

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "OpenAI-Project": process.env.OPENAI_PROJECT_ID, // required for sk-proj- keys
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small",
    }),
  });

  const data = await res.json();
  // Pass through the OpenAI-shaped response so other code expecting data.data[0].embedding still works
  return NextResponse.json(data, { status: res.status });
}
