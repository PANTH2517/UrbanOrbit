// Thin wrapper around 2Factor.in's SMS OTP API - replaces Firebase Phone
// Auth, which requires the Blaze billing plan to send real SMS
// (auth/billing-not-enabled). 2Factor generates and holds the actual OTP on
// their side (AUTOGEN) - we only ever see a session id - and later checks a
// submitted code against it (VERIFY). The OTP itself never touches our
// server or logs.
//
// Every 2Factor response is a flat { Status: "Success" | "Error", Details: string }
// envelope - on success, Details holds the payload (session id, "OTP Matched");
// on error, it holds a human-readable reason.

const BASE_URL = "https://2factor.in/API/V1";

function requireApiKey() {
  const key = process.env.TWOFACTOR_API_KEY;
  if (!key) {
    throw new Error("TWOFACTOR_API_KEY is not set - see .env.example.");
  }
  return key;
}

// 2Factor wants the number as countrycode+number with no leading "+" (e.g.
// "919876543210"), not the "+919876543210" E.164 form used everywhere else
// in this app - stripped here so callers don't have to remember.
function toTwoFactorPhone(e164Phone) {
  return e164Phone.replace(/^\+/, "");
}

async function callTwoFactor(path) {
  const res = await fetch(`${BASE_URL}/${path}`);
  return res.json();
}

/** Sends the OTP SMS and returns the session id needed to verify it later. */
async function sendOtp(e164Phone) {
  const apiKey = requireApiKey();
  const phone = toTwoFactorPhone(e164Phone);

  // TWOFACTOR_OTP_TEMPLATE is optional: unset uses 2Factor's own default
  // OTP template (works immediately after signup, no setup needed). Set it
  // once you've DLT-registered your own template on the 2Factor dashboard
  // for a branded message instead.
  const template = process.env.TWOFACTOR_OTP_TEMPLATE;
  const path = template
    ? `${apiKey}/SMS/${phone}/AUTOGEN2/${encodeURIComponent(template)}`
    : `${apiKey}/SMS/${phone}/AUTOGEN`;

  const data = await callTwoFactor(path);
  if (data.Status !== "Success") {
    throw new Error(data.Details || "Could not send OTP.");
  }
  return data.Details; // session id
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Checks the code the user typed against the session 2Factor is holding.
 * Returns a boolean rather than throwing for a wrong/expired code, since
 * that's an expected outcome here, not a failure to reach 2Factor.
 *
 * 2Factor's VERIFY endpoint has a brief propagation lag right after AUTOGEN
 * issues the OTP - a genuinely correct code can come back "OTP Mismatch"
 * for the first second or so. A real user takes long enough reading the SMS
 * and typing it in that this never shows up for them, but retries a couple
 * of times with a short backoff anyway rather than leave that narrow window.
 */
async function verifyOtp(sessionId, otp) {
  const apiKey = requireApiKey();
  const attempts = [0, 700, 1500];

  for (const wait of attempts) {
    if (wait > 0) await delay(wait);
    const data = await callTwoFactor(`${apiKey}/SMS/VERIFY/${sessionId}/${otp}`);
    if (data.Status === "Success") return true;
  }
  return false;
}

module.exports = { sendOtp, verifyOtp };
