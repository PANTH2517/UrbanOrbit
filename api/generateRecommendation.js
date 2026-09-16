const { verifyIdToken } = require("./_lib/firebaseAdmin");
const { callGemini } = require("./_lib/gemini");
const { enforceRateLimit } = require("./_lib/rateLimit");

// Vercel serverless function (replaces the old Firebase Cloud Function of the
// same name - moved here so this feature doesn't require a Firebase Blaze
// billing account). The Gemini API key lives only in Vercel's environment
// variables and never reaches the browser. See docs/SECURITY.md.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const decodedToken = await verifyIdToken(req.headers.authorization);

    if (decodedToken.role !== "government_official" && decodedToken.role !== "admin") {
      res.status(403).json({ error: "Official access required." });
      return;
    }

    // 60 AI calls/minute per official - covers both interactive use (one
    // recommendation per issue triaged) and GovernmentReports.jsx's bulk CSV/
    // PDF export (which calls this once per issue in the export), while still
    // blunting a leaked/abused token from burning through the Gemini quota.
    // A 429 here degrades gracefully - callers fall back to "N/A" per issue.
    await enforceRateLimit({ uid: decodedToken.uid, action: "generateRecommendation", max: 60, windowMs: 60_000 });

    const { prompt, response_json_schema } = req.body || {};
    if (!prompt || typeof prompt !== "string" || prompt.length > 4000) {
      res.status(400).json({ error: "A prompt (max 4000 chars) is required." });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "AI service is not configured (missing GEMINI_API_KEY)." });
      return;
    }

    const result = await callGemini({ apiKey, prompt, jsonSchema: response_json_schema || null });
    res.status(200).json({ result });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "AI generation failed." });
  }
};
