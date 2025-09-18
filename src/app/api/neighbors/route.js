// src/app/api/neighbors/route.js
import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { cosineSim } from "../../../lib/similarity.js"; 

export const runtime = "nodejs";

let VOCAB = null;
function getVocabPath() {
  return path.join(process.cwd(), "data", "vocab-embeddings.json");
}

function loadVocab() {
  const p = getVocabPath();
  // In dev, always reload from disk so new files are picked up
  if (process.env.NODE_ENV !== "production") {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  }
  // In prod, cache for performance
  if (!VOCAB) {
    VOCAB = JSON.parse(fs.readFileSync(p, "utf8"));
  }
  return VOCAB;
}
export async function POST(req) {
  try {
    const { word, embedding } = await req.json();

    if (!Array.isArray(embedding) || embedding.length === 0) {
      return NextResponse.json({ error: "Missing or empty embedding" }, { status: 400 });
    }

    const vocab = loadVocab();

    // Optional safety: check dimension match
    const dim = vocab?.[0]?.embedding?.length || 0;
    if (dim && embedding.length !== dim) {
      return NextResponse.json(
        { error: `Embedding dim mismatch: got ${embedding.length}, expected ${dim}` },
        { status: 400 }
      );
    }

    const neighbors = vocab
      .map(item => ({
        word: item.word,
        score: cosineSim(embedding, item.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json({ word, neighbors });
  } catch (err) {
    console.error("neighbors route error:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
