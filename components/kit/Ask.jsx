"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * THE BRAIN EXISTED AND HAD NO MOUTH. /api/ask has been live and nothing on
 * any page called it (row 412) - measured 2026-11-25: zero references to
 * "api/ask" anywhere in app/ or components/.
 *
 * THE PARENT DECIDES AT 10PM WITH NOBODY TO ASK. Same rule as CallBar.
 *
 * THIS COMPONENT HOLDS NO FACTS. It renders exactly what /api/ask returns and
 * nothing else - no fallback answer, no "probably", no cached last reply. If
 * the request fails it says so and points at a human. A widget that invents a
 * nap time for someone's two-year-old is worse than no widget.
 *
 * THE DICTIONARY STAYS ON THE SERVER. Labels arrive already translated from
 * the layout, so en.json and es.json are never shipped to the browser.
 */
export default function Ask({ lang, labels }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState([]); // {who:"you"|"bot", say, next?, miss?}
  const inputRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [turns, busy]);
  useEffect(() => {
    if (!open) return;
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  async function send(e) {
    e?.preventDefault();
    const question = q.trim();
    if (!question || busy) return;
    setTurns((v) => [...v, { who: "you", say: question }]);
    setQ("");
    setBusy(true);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: question, lang }),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const d = await r.json();
      setTurns((v) => [...v, { who: "bot", say: d.say, next: d.next, miss: d.kind === "unknown" }]);
    } catch (err) {
      /* LOUD, NEVER QUIET. The parent is told, and the console carries it. */
      console.error("[Ask] /api/ask failed", err);
      setTurns((v) => [...v, { who: "bot", say: labels.broke, miss: true }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="ask__open"
        aria-expanded={open}
        aria-controls="ask-panel"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? labels.close : labels.openBtn}
      </button>

      <div id="ask-panel" className="ask" hidden={!open} role="dialog" aria-label={labels.title}>
        <div className="ask__head">
          <strong>{labels.title}</strong>
          <button type="button" className="ask__x" onClick={() => setOpen(false)} aria-label={labels.close}>×</button>
        </div>

        <div className="ask__log" ref={logRef} aria-live="polite">
          {turns.length === 0 && <p className="ask__hint">{labels.hint}</p>}
          {turns.map((turn, i) => (
            <div key={i} className={"ask__turn ask__turn--" + turn.who + (turn.miss ? " ask__turn--miss" : "")}>
              <p>{turn.say}</p>
              {turn.next && (
                <Link className="btn btn--sm" href={turn.next.href}>{turn.next.label}</Link>
              )}
            </div>
          ))}
          {busy && <p className="ask__hint">{labels.thinking}</p>}
        </div>

        <form className="ask__form" onSubmit={send}>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={labels.placeholder}
            aria-label={labels.placeholder}
            maxLength={300}
            autoComplete="off"
          />
          <button className="btn" type="submit" disabled={busy || !q.trim()}>{labels.send}</button>
        </form>
      </div>
    </>
  );
}
