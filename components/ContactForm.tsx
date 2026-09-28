"use client";

import { useState } from "react";

const ENDPOINT = "https://formspree.io/f/xaqzelqw";

type Status = "idle" | "sending" | "sent" | "error";
type FieldErrors = { name?: string; email?: string; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const inputClass =
  "w-full rounded-[4px] border bg-[rgba(255,252,244,0.6)] px-3.5 py-3 text-[16px] font-light text-[#2b2721] placeholder:text-[rgba(43,39,33,0.36)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6a3e]";
const inputOk = "border-[rgba(43,39,33,0.22)]";
const inputErr = "border-[#8c3a2b] bg-[rgba(140,58,43,0.04)]";

const labelClass =
  "mb-1.5 block text-[11px] tracking-[0.2em] text-[rgba(43,39,33,0.6)] uppercase";
const errorClass = "mt-1 text-[12.5px] font-light text-[#8c3a2b]";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const sending = status === "sending";

  function validate(): boolean {
    const e: FieldErrors = {};
    if (!name.trim()) e.name = "Please tell me your name.";
    if (!email.trim()) e.email = "Your email is required.";
    else if (!EMAIL_RE.test(email.trim()))
      e.email = "That email doesn't look right — check for typos.";
    if (!message.trim()) e.message = "Don't forget to write a message.";
    else if (message.trim().length < 10)
      e.message = "A few more words would help (min 10 characters).";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const firstInvalid = e.name
        ? "contact-name"
        : e.email
          ? "contact-email"
          : "contact-message";
      document.getElementById(firstInvalid)?.focus();
      return false;
    }
    return true;
  }

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (status === "sending") return;
    if (!validate()) return;
    if (website.trim()) {
      setStatus("sent");
      return;
    }
    setStatus("sending");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
      setStatus("sent");
    } catch {
      setStatus("error");
    } finally {
      clearTimeout(timeout);
    }
  }

  function reset() {
    setName("");
    setEmail("");
    setMessage("");
    setWebsite("");
    setStatus("idle");
    setErrors({});
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
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="min-h-[44px] cursor-pointer rounded-[4px] border border-[rgba(43,39,33,0.25)] bg-transparent px-5 text-[12px] tracking-[0.2em] text-[#2b2721] uppercase transition-colors hover:bg-[rgba(154,106,62,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a6a3e]"
          >
            Send another
          </button>
          <a
            href="/Resume_Manoj.pdf"
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-[44px] items-center rounded-[4px] border-0 bg-[#9a6a3e] px-5 text-[12px] tracking-[0.2em] text-[#fffdf7] uppercase transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b2721]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Download resume
          </a>
        </div>
        <p aria-live="polite" className="sr-only">
          Message sent successfully.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
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
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={100}
            disabled={sending}
            className={`${inputClass} ${errors.name ? inputErr : inputOk}`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
          />
          {errors.name && (
            <p id="contact-name-error" role="alert" className={errorClass}>
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            maxLength={254}
            disabled={sending}
            className={`${inputClass} ${errors.email ? inputErr : inputOk}`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
          />
          {errors.email && (
            <p id="contact-email-error" role="alert" className={errorClass}>
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="contact-message" className={labelClass}>
            Message <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What would you like to build?"
            maxLength={5000}
            disabled={sending}
            className={`${inputClass} resize-y ${errors.message ? inputErr : inputOk}`}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
          />
          {errors.message && (
            <p id="contact-message-error" role="alert" className={errorClass}>
              {errors.message}
            </p>
          )}
        </div>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "auto",
            width: "1px",
            height: "1px",
            overflow: "hidden",
          }}
        >
          <label htmlFor="contact-ref">
            Reference
            <input
              id="contact-ref"
              name="contact_ref"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={sending}
            />
          </label>
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
