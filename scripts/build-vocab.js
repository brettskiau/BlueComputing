// scripts/build-vocab.js
import 'dotenv/config';
import fs from "node:fs";
import path from "node:path";

const WORDS_PATH = path.join(process.cwd(), "data", "words.txt");
const OUT_PATH   = path.join(process.cwd(), "data", "vocab-embeddings.json");

// --- helpers ---
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function embed(text) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "OpenAI-Project": process.env.OPENAI_PROJECT_ID, // if using a project key
    },
    headers: {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
  ...(process.env.OPENAI_PROJECT_ID ? { "OpenAI-Project": process.env.OPENAI_PROJECT_ID } : {})
},

    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });
  if (!res.ok) {
    const errTxt = await res.text();
    throw new Error(`Embed ${res.status}: ${errTxt}`);
  }
  const json = await res.json();
  return json.data[0].embedding;
}

async function main() {
  const words = fs.readFileSync(WORDS_PATH, "utf8")
    .split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  // resume support
  let existing = [];
  if (fs.existsSync(OUT_PATH)) {
    existing = JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
  }
  const done = new Set(existing.map(x => x.word));
  const out = [...existing];

  console.log(`Total words: ${words.length}. Already have: ${done.size}. To do: ${words.length - done.size}`);

  // throttle: small sleep per call; also handles 429s backoff
  for (const w of words) {
    if (done.has(w)) continue;
    try {
      const emb = await embed(w);
      out.push({ word: w, embedding: emb });
      if (out.length % 50 === 0) {
        fs.writeFileSync(OUT_PATH, JSON.stringify(out));
        console.log(`Saved ${out.length} so far...`);
      }
      await sleep(100); // ~10 req/sec max; adjust if you see 429s
    } catch (e) {
      console.warn(`Failed "${w}": ${e.message}`);
      // basic 429/backoff
      if (/429|rate/i.test(e.message)) {
        console.log("Backing off 5s...");
        await sleep(5000);
      }
    }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 0));
  console.log(`✅ Saved ${out.length} embeddings to ${OUT_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
