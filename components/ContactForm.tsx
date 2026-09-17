"use client";

import { useState } from "react";

const ENDPOINT = "https://formspree.io/f/xaqzelqw";

type Status = "idle" | "sending" | "sent" | "error";

const inputClass =
  "w-full rounded-[4px] border border-[rgba(43,39,33,0.22)] bg-[rgba(255,252,244,0.6)] px-3.5 py-3 text-[16px] font-light text-[#2b2721] placeholder:text-[rgba(43,39,33,0.36)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6a3e]";

const labelClass =
  "mb-1.5 block text-[11px] tracking-[0.2em] text-[rgba(43,39,33,0.6)] uppercase";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setName("");
    setEmail("");
    setMessage("");
    setStatus("idle");
  }

  if (status === "sent") {
    return (
      <div className="rounded-[6px] border border-[rgba(43,39,33,0.18)] bg-[rgba(255,252,244,0.55)] p-[clamp(20px,3vw,32px)] shadow-[0_10px_30px_rgba(58,44,26,0.08)]">
        <p
          className="m-0 text-[clamp(19px,2vw,24px)]"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Thank you — your note is on its way.
        </p>
        <p className="mt-2 mb-0 max-w-[48ch] text-[15px] leading-[1.7] font-light text-[rgba(43,39,33,0.72)]">
          I read everything and reply within a day.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 min-h-[44px] cursor-pointer rounded-[4px] border border-[rgba(43,39,33,0.25)] bg-transparent px-5 text-[12px] tracking-[0.2em] text-[#2b2721] uppercase transition-colors hover:bg-[rgba(154,106,62,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6a3e]"
        >
          Send another
        </button>
        <p aria-live="polite" className="sr-only">
          Message sent successfully.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[6px] border border-[rgba(43,39,33,0.18)] bg-[rgba(255,252,244,0.55)] p-[clamp(20px,3vw,32px)] shadow-[0_10px_30px_rgba(58,44,26,0.08)]"
    >
      <div className="grid gap-5">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Name <span aria-hidden="true">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-message" className={labelClass}>
            Message <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What would you like to build?"
            className={`${inputClass} resize-y`}
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={status === "sending"}
            className="min-h-[44px] w-full cursor-pointer rounded-[4px] border-0 bg-[#9a6a3e] px-6 py-3.5 text-[13px] tracking-[0.22em] text-[#fffdf7] uppercase transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b2721]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            {status === "sending" ? "Sending…" : "Send message"}
          </button>
          <p aria-live="polite" className="mt-3 mb-0 min-h-[1.5em] text-[14px] font-light">
            {status === "error" && (
              <span className="text-[#8c3a2b]">
                Something went wrong sending your note — please try again. Your words are still
                here.
              </span>
            )}
          </p>
        </div>
      </div>
    </form>
  );
}
