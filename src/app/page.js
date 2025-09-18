'use client';
import { useState, useRef } from 'react';

export default function Home() {
  // ── State ────────────────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState('What colour is the sky?');
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [overlay, setOverlay] = useState(null); // { x,y, word, neighbors }
  const [senses, setSenses] = useState([]);     // [{sense_index,label}]
  const [activeSense, setActiveSense] = useState(0);
  const [model, setModel] = useState('demo-model');

  // ── New UI state ─────────────────────────────────────────────────────────────
  const [hasCommitted, setHasCommitted] = useState(false); // show red "x" after submit
  const inputRef = useRef(null); // for focusing after clear

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const tokenize = (txt) => txt.match(/\S+|\s+/g) ?? [];

  const fetchNeighbors = async (word) => {
    const embRes = await fetch("/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: word }),
    });
    const embData = await embRes.json();
    const embedding = embData?.data?.[0]?.embedding;

    const neighRes = await fetch("/api/neighbors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, embedding }),
    });
    const neighbors = await neighRes.json();

    console.log("Neighbors for", word, ":", neighbors);
    setOverlay({ word, neighbors });
  };

  const openOverlay = (e, clean) => {
    fetchNeighbors(clean);
  };

  const renderTokens = (txt) =>
    tokenize(txt).map((t, i) => {
      if (/^\s+$/.test(t)) return <span key={i}>{t}</span>;
      const isWord = /\w/.test(t);
      const clean = t.replace(/[^\w’-]/g, '').toLowerCase();
      return (
        <span
          key={i}
          className={isWord ? "cursor-pointer text-white hover:bg-white/10 rounded px-1" : ""}
          onClick={isWord ? (e) => openOverlay(e, clean) : undefined}
        >
          {t}
        </span>
      );
    });

  // ── Actions ──────────────────────────────────────────────────────────────────
  const onSubmit = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setOverlay(null);
    setHasCommitted(true); // lock-in: enables red "x"

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const json = await res.json();

      if (res.ok && json.text) {
        setAnswer(json.text);
      } else {
        setAnswer(
          json?.error
            ? `Error: ${json.error.message || json.error}`
            : "No answer"
        );
      }
    } catch (err) {
      setAnswer(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onClearPrompt = () => {
    setPrompt("");
    setHasCommitted(false); // hide red "x"
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // ── UI / Layout ──────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* ┌───────────────────────────────────────────────────────────────────────┐
          │ HEADER: title + dropdown stacked vertically (right aligned)          │
          └───────────────────────────────────────────────────────────────────────┘ */}
{/* Top bar (tighter spacing) */}
<div className="w-full flex justify-end items-center p-3 md:p-3.5 gap-3">
  <h1 className="text-lg md:text-xl font-semibold">Blue Computing</h1>
  <select
    value={model}
    onChange={(e) => setModel(e.target.value)}
    className="border border-white/20 bg-white text-black rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white/40"
    aria-label="Select model"
  >
    <option value="demo-model">Demo model</option>
    <option value="model-a">Model A</option>
    <option value="model-b">Model B</option>
  </select>
</div>

{/* Content wrapper (ADDED) */}
<section className="mx-auto px-4 pt-2 pb-8 space-y-5 max-w-6xl">

  {/* HUMAN TOKEN (Prompt) — narrower, shorter */}
  <div className="relative mx-auto w-full max-w-3xl rounded-2xl border-2 border-amber-400/30 bg-zinc-900/70
                  p-5 md:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
    <div className="text-xs md:text-sm uppercase tracking-wider text-amber-300/80 mb-2">
      Human Prompt
    </div>

    {/* Input wrapper with icons */}
    <div className="relative">
      {/* Left icons cluster (search + red X when committed) */}
      <div className="absolute inset-y-0 left-4 flex items-center gap-2 pointer-events-none">
        {/* Search icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        {/* Red X (after submit) */}
        {hasCommitted && (
          <div className="pointer-events-auto">
            <button type="button" onClick={onClearPrompt} className="group" aria-label="Clear prompt" title="Clear prompt">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] text-red-500 group-hover:text-red-400 transition"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Input field — slightly shorter */}
      <input
        ref={inputRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        placeholder="What?!?"
        className="w-full pr-32 pl-14 py-4 md:py-4.5 rounded-2xl bg-zinc-950/80 border border-amber-300/30
                   focus:outline-none focus:ring-2 focus:ring-amber-300/40
                   text-xl md:text-2xl leading-tight placeholder-white/30"
        aria-label="Type your prompt"
      />

      {/* Submit button */}
      <div className="absolute inset-y-0 right-3 flex items-center">
        <button
          onClick={onSubmit}
          disabled={isLoading || !prompt.trim()}
          className="px-4 py-2 md:px-5 md:py-2.5 rounded-xl bg-amber-300 text-black font-semibold
                     disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-200 transition
                     text-sm md:text-base"
        >
          {isLoading ? 'Thinking…' : 'Send'}
        </button>
      </div>
    </div>

    {/* Helper text — explicitly left-aligned */}
    <div className="mt-2 text-left text-xs md:text-sm text-white/50">
      Press <kbd className="px-1.5 py-0.5 rounded border border-white/20">Enter</kbd> to submit.
    </div>
  </div>

  {/* MACHINE TOKEN (Model Output) — wider */}
  <div className="mx-auto w-full max-w-5xl rounded-2xl border-2 border-cyan-400/30 bg-zinc-900/70
                  p-6 md:p-7 lg:p-8 min-h-[18rem] md:min-h-[22rem] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
    <div className="text-xs md:text-sm uppercase tracking-wider text-cyan-300/80 mb-3">
      Model Output
    </div>

    <div className="text-xl md:text-2xl lg:text-[28px] leading-relaxed">
      {answer
        ? renderTokens(answer)
        : <span className="text-white/35">Model is ready… ask anything, then tap words to see neighbors.</span>}
    </div>

    {/* QUICK PETALS DEBUG */}
    {overlay?.neighbors?.length > 0 && (
      <div className="mt-6">
        <div className="text-sm text-white/60 mb-2">Neighbors:</div>
        <div className="flex flex-wrap gap-2">
          {overlay.neighbors.map((n, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-full bg-cyan-400/15 border border-cyan-300/30 text-cyan-100 text-sm"
              title={typeof n === 'string' ? n : n?.word || ''}
            >
              {typeof n === 'string' ? n : (n?.word ?? JSON.stringify(n))}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>

</section>  {/* ← make sure this closing matches the opening above */}

    </main>
  );
}
