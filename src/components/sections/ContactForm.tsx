"use client";
import { Turnstile } from "@marsidev/react-turnstile";
import { useState, useTransition } from "react";
import { submitContactForm } from "@/app/actions/submit-contact-form";
import { env } from "@/env";

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    startTransition(async () => {
      const result = await submitContactForm(formData);

      if (result.success) {
        setStatus({
          type: "success",
          message: "Thank you! Your message has been sent successfully.",
        });
        // Reset the form
        (e.target as HTMLFormElement).reset();
        // Clear success message after 5 seconds
        setTimeout(() => {
          setStatus({ type: null, message: "" });
        }, 5000);
      } else {
        setStatus({
          type: "error",
          message: result.error || "Something went wrong. Please try again.",
        });
      }
    });
  };

  const labelClass =
    "mb-2 block font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground";
  const fieldClass =
    "w-full rounded-md border border-border bg-transparent px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand transition disabled:opacity-60";

  return (
    <div className="rounded-[10px] border border-border bg-card p-5 md:p-6">
      <h3 className="mb-6 font-serif text-lg font-semibold text-foreground">
        Send a message
      </h3>

      {status.type && (
        <div
          className={`mb-4 rounded-md p-3 text-sm ${
            status.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          {status.message}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className={fieldClass}
            placeholder="Your name"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className={fieldClass}
            placeholder="your.email@example.com"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="subject" className={labelClass}>
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            className={fieldClass}
            placeholder="What's this about?"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="message" className={labelClass}>
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            className={`${fieldClass} resize-none`}
            placeholder="Tell me about your project..."
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Turnstile siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""} />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-brand px-5 py-2.5 font-medium text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}
