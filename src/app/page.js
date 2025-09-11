'use client';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('Is the bank near the river wider than the city bank?');
  const [answer, setAnswer] = useState('The sky is blue on a clear day.');
  const [overlay, setOverlay] = useState(null); // {x,y, word, sense, data}
  const [senses, setSenses] = useState([]);     // [{sense_index,label}]
  const [activeSense, setActiveSense] = useState(0);

  // Split text into clickable tokens
  const tokenize = (txt) => txt.match(/\S+|\s+/g) ?? [];

  // Render text with clickable words
  const renderTokens = (txt) =>
    tokenize(txt).map((t, i) => {
      if (/^\s+$/.test(t)) return <span key={i}>{t}</span>;
      const isWord = /\w/.test(t);
      const clean = t.replace(/[^\w’-]/g, '').toLowerCase();
      return (
        <span
          key={i}
          className={isWord ? "cursor-pointer text-white hover:bg-white/10 rounded px-1" : ""}
          onClick={isWord ? (e)=>openOverlay(e, clean) : undefined}
        >
          {t}
        </span>
      );
    });

  // Answer button (simple demo logic)
  const onSubmit = () => {
    const t = prompt.toLowerCase();
    setAnswer(
      t.includes('bank')
        ? 'Keep emergency savings in a bank account that offers easy access.'
        : 'The man is blue after hearing the sad news.'
    );
  };

  // Open overlay near clicked span and fetch neighbors (sense 0 by default)
  async function openOverlay(e, word, sense=0) {
    const rect = e.target.getBoundingClientRect();
    const x = rect.left + rect.width/2;
    const y = rect.bottom + 8;

    const res = await fetch('/api/neighbors', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ word, sense, model: 'demo-model' })
    });
    const data = await res.json();

    if (!data.ok) return;

    setSenses(data.alternates || []);
    setActiveSense(data.sense_index ?? sense);
    setOverlay({
      x, y,
      word: data.center || word,
      neighbors: data.neighbors
    });
  }

  // Cycle sense (= button)
  const cycleSense = async () => {
    if (!overlay) return;
    const next = senses.length ? (activeSense + 1) % senses.length : 0;
    await changeSense(next);
  };

  // Choose a specific sense
  const changeSense = async (sense) => {
    const res = await fetch('/api/neighbors', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ word: overlay.word, sense, model: 'demo-model' })
    });
    const data = await res.json();
    if (!data.ok) return;
    setActiveSense(sense);
    setOverlay(o => o && ({ ...o, neighbors: data.neighbors }));
  };

  // Walk the space: clicking a petal becomes new center if we have data
  const onPetalClick = async (word) => {
    if (!word) return;
    // reuse last screen position
    const res = await fetch('/api/neighbors', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ word, sense: 0, model: 'demo-model' })
    });
    const data = await res.json();
    if (!data.ok) return;
    setSenses(data.alternates || []);
    setActiveSense(data.sense_index ?? 0);
    setOverlay(o => o && ({
      ...o,
      word,
      neighbors: data.neighbors
    }));
  };

  return (
    <main className="min-h-dvh bg-black text-zinc-200 grid place-items-start gap-6 pt-16">
      {/* Search box */}
      <div className="w-[min(800px,92vw)] mx-auto">
        <div className="relative">
          <input
            className="w-full rounded-xl border border-white/15 bg-zinc-900 px-4 py-3 text-lg outline-none"
            placeholder="Type your question…"
            value={prompt}
            onChange={e=>setPrompt(e.target.value)}
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-white/15 bg-zinc-800 px-3 py-1"
            onClick={onSubmit}
            aria-label="Submit"
          >🔍</button>
        </div>
        <p className="text-sm text-zinc-400 mt-2">Click words in the prompt or answer to open the semantic web. Use “=” to change sense.</p>
      </div>

      {/* Prompt tokens */}
      <div className="w-[min(800px,92vw)] mx-auto rounded-xl border border-white/10 bg-zinc-950 p-4">
        <div className="text-xs text-zinc-400 uppercase mb-1">Prompt tokens</div>
        <div className="text-lg">{renderTokens(prompt)}</div>
      </div>

      {/* Answer tokens */}
      <div className="w-[min(800px,92vw)] mx-auto rounded-xl border border-white/10 bg-zinc-950 p-4">
        <div className="text-xs text-zinc-400 uppercase mb-1">Answer</div>
        <div className="text-2xl leading-relaxed">{renderTokens(answer)}</div>
      </div>

      {/* Flower overlay */}
      {overlay && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/20 backdrop-blur"
          onClick={()=>setOverlay(null)}
          aria-hidden="false"
        >
          <div
            className="relative w-80 h-80"
            style={{
              left: Math.min(window.innerWidth - 340, Math.max(20, overlay.x - 160)),
              top:  Math.min(window.innerHeight - 340, Math.max(20, overlay.y - 160)),
              position: 'absolute'
            }}
            onClick={e=>e.stopPropagation()}
          >
            {/* yellow diamond */}
            <div className="absolute inset-0 m-auto w-60 h-60 rotate-45 rounded-2xl"
                 style={{background:'linear-gradient(160deg,#f1ad2a,#ef9f0e 80%)', border:'2px solid #d98d13',
                         boxShadow:'0 14px 40px rgba(0,0,0,.45)'}} />
            {/* center word */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                            px-3 py-2 rounded-lg border border-white/25 bg-black/30 text-white font-semibold">
              {overlay.word}
            </div>
            {/* sense bar */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-white text-black font-bold" onClick={cycleSense}>=</button>
              {senses.map((s)=>(
                <button key={s.sense_index}
                        onClick={()=>changeSense(s.sense_index)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${s.sense_index===activeSense?'bg-white text-black':'bg-zinc-800 text-white'}`}>
                  {s.sense_label}
                </button>
              ))}
            </div>
            {/* petals */}
            <button className="absolute left-1/2 -translate-x-1/2 top-3 px-3 py-2 rounded-full bg-white/15 border border-white/25"
                    onClick={()=>onPetalClick(overlay.neighbors?.north)}>{overlay.neighbors?.north||'—'}</button>
            <button className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full bg-white/15 border border-white/25"
                    onClick={()=>onPetalClick(overlay.neighbors?.east)}>{overlay.neighbors?.east||'—'}</button>
            <button className="absolute left-1/2 -translate-x-1/2 bottom-3 px-3 py-2 rounded-full bg-white/15 border border-white/25"
                    onClick={()=>onPetalClick(overlay.neighbors?.south)}>{overlay.neighbors?.south||'—'}</button>
            <button className="absolute left-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full bg-white/15 border border-white/25"
                    onClick={()=>onPetalClick(overlay.neighbors?.west)}>{overlay.neighbors?.west||'—'}</button>

            <button className="absolute -right-3 -top-3 w-8 h-8 rounded-full bg-white text-black font-bold"
                    onClick={()=>setOverlay(null)}>×</button>
          </div>
        </div>
      )}
    </main>
  );
}
