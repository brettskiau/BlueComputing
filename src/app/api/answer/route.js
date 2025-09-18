// src/app/api/answer/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  const { prompt } = await req.json();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // or whichever you're using
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Always answer in ONE sentence only. If the question cannot be fully answered in one sentence, say so briefly in one sentence.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 60, // keeps answers short
    }),
  });

  const data = await res.json();

  return NextResponse.json({
    text: data.choices?.[0]?.message?.content?.trim() || "No answer",
  });
}
