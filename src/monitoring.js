// Optional error monitoring (Sentry). Zero-cost when unconfigured: without
// VITE_SENTRY_DSN this module does nothing, so there's no account
// requirement to run the app locally or in CI. Set VITE_SENTRY_DSN (from
// sentry.io -> Create Project -> React) in production to start receiving
// crash reports from real users/officials.
let sentryReady = false;

export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  import("@sentry/react")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.1,
      });
      sentryReady = true;
    })
    .catch((err) => {
      console.error("Failed to initialize error monitoring:", err);
    });
}

/** Safe to call whether or not monitoring is configured/loaded. */
export function reportError(error, context) {
  if (!sentryReady) return;
  import("@sentry/react").then((Sentry) => {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  });
}
