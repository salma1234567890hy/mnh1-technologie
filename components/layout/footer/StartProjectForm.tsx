"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidEmail, savePrefillEmail } from "@/lib/contact/prefill";

type StartProjectFormProps = {
  /** Visually hidden label of the email field. */
  emailLabel: string;
  placeholder: string;
  /** Accessible name of the arrow button. */
  submitLabel: string;
  errorMessage: string;
  /** Localized page that reads the email with consumePrefillEmail(). */
  destination: string;
};

/**
 * Email capture → hands the email to /contact through sessionStorage (never the URL).
 * Nothing is "sent" here: no fake success message.
 */
export function StartProjectForm({ emailLabel, placeholder, submitLabel, errorMessage, destination }: StartProjectFormProps) {
  const router = useRouter();
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!isValidEmail(value)) {
      setError(errorMessage);
      return;
    }
    setError(null);
    savePrefillEmail(value);
    router.push(destination);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-6">
      <label htmlFor={inputId} className="sr-only">
        {emailLabel}
      </label>
      <div
        className={cn(
          "group/field flex items-center border-b transition-colors duration-200 focus-within:border-mnh-accent",
          error ? "border-red-400/70" : "border-mnh-white/20",
        )}
      >
        <input
          id={inputId}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          placeholder={placeholder}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className="h-11 min-w-0 flex-1 bg-transparent font-sans text-[15px] text-mnh-text-white outline-none placeholder:text-mnh-text-muted-dark"
        />
        <button
          type="submit"
          aria-label={submitLabel}
          className="group/btn inline-flex size-11 shrink-0 items-center justify-center rounded-md text-mnh-text-muted-dark transition-colors duration-200 hover:text-mnh-accent focus-visible:text-mnh-accent"
        >
          <ArrowRight
            aria-hidden="true"
            size={18}
            className="transition-transform duration-200 ease-out group-hover/btn:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover/btn:translate-x-0"
          />
        </button>
      </div>
      <p id={errorId} aria-live="polite" className="mt-2 min-h-5 font-sans text-[13px] text-red-300">
        {error}
      </p>
    </form>
  );
}
