/**
 * Email hand-off from the footer "Start a project" form to the /contact page.
 *
 * The email is kept in sessionStorage (never in the URL, so it does not end up in
 * logs, history or analytics). The contact page reads it ONCE with
 * `consumePrefillEmail()` to pre-fill its form, which also removes it.
 */
export const PREFILL_EMAIL_KEY = "mnh:prefill-email";

export function savePrefillEmail(email: string): boolean {
  try {
    window.sessionStorage.setItem(PREFILL_EMAIL_KEY, email);
    return true;
  } catch {
    // Storage unavailable (private mode, blocked site data): the contact form just starts empty.
    return false;
  }
}

export function consumePrefillEmail(): string | null {
  try {
    const email = window.sessionStorage.getItem(PREFILL_EMAIL_KEY);
    if (email !== null) window.sessionStorage.removeItem(PREFILL_EMAIL_KEY);
    return email;
  } catch {
    return null;
  }
}

/** Pragmatic email check (same rule for the footer and the contact page). */
export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}
