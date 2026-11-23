"use client";
import { useState } from "react";

/**
 * THE ENQUIRY FORM. The model site has NO enquiry form on its home page — its
 * only form submits a REVIEW, and Enroll / Tour / Portal all leave for
 * app.tryplayground.com (10 links, measured 2026-11-23). Primrose and Goddard
 * both start with a ZIP search, not a form. So this is where we win: one screen,
 * our own system, the parent's data stays with the school.
 *
 * PHONE FIRST, KEYBOARD OPEN: labels ABOVE inputs so the label is never hidden
 * by the keyboard; every control >= 48px; inputMode and autoComplete set so the
 * right keyboard opens; and NO sticky bar on this page, because a sticky bottom
 * bar plus an open keyboard is how a submit button disappears.
 *
 * LABELS ARRIVE AS A PLAIN OBJECT, NEVER AS t(). A server component cannot pass
 * a function across the client boundary: doing that returned HTTP 500 on
 * /en/visit while `next build` passed and 14 tests stayed green (proved
 * 2026-11-23). Translating on the server and handing over strings is the fix.
 */
export default function LeadForm({ labels: L, rooms = [], lang = "en", phone = null, room = "" }) {
  const [state, setState] = useState("idle");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setState("sending");
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    body.lang = lang;
    try {
      const r = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j.error || L.wrong); setState("error"); return; }
      setState("done");
    } catch {
      setErr(L.wrong); setState("error");
    }
  }

  const telHref = phone ? `tel:${String(phone).replace(/[^+\d]/g, "")}` : null;

  if (state === "done") {
    return (
      <div className="ok" role="status">
        <h3>{L.thanks}</h3>
        <p>{L.thanksBody}</p>
        {telHref && <a className="btn" href={telHref}>{L.call}</a>}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      {state === "error" && (
        <p className="bad" role="alert">{err} {telHref ? L.callInstead : L.tryAgain}</p>
      )}
      <label className="field">
        <span>{L.name}</span>
        <input name="parentName" required autoComplete="name" />
      </label>
      <label className="field">
        <span>{L.email}</span>
        <input name="email" type="email" required autoComplete="email" inputMode="email" />
      </label>
      <label className="field">
        <span>{L.phone}</span>
        <input name="phone" type="tel" autoComplete="tel" inputMode="tel" />
      </label>
      <label className="field">
        <span>{L.age}</span>
        <select name="childAge" defaultValue={room}>
          <option value="">{L.chooseAge}</option>
          {rooms.map((p) => (
            <option key={p.slug} value={p.slug}>{p.label}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{L.start}</span>
        <input name="startMonth" type="month" />
      </label>
      <label className="field">
        <span>{L.more}</span>
        <textarea name="message" rows={3} />
      </label>
      <p className="hint">{L.privacy}</p>
      <input type="text" name="_t" tabIndex={-1} autoComplete="off" aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
      <button className="btn btn--wide" type="submit" disabled={state === "sending"}>
        {state === "sending" ? L.sending : L.submit}
      </button>
    </form>
  );
}
