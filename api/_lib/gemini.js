const MODEL = "gemini-3.6-flash";

/**
 * Calls the Gemini API directly over REST. When jsonSchema is given, we don't
 * try to translate its dialect into Gemini's own schema format - instead we
 * ask Gemini for a JSON mime type and describe the desired shape in the
 * prompt itself, which is robust and keeps this function simple.
 */
async function callGemini({ apiKey, prompt, jsonSchema }) {
  const generationConfig = { temperature: 0.4, maxOutputTokens: 1024 };
  let fullPrompt = prompt;

  if (jsonSchema) {
    generationConfig.responseMimeType = "application/json";
    fullPrompt = `${prompt}\n\nRespond with ONLY a single valid JSON object with exactly these fields (no markdown, no commentary):\n${JSON.stringify(
      jsonSchema,
      null,
      2
    )}`;
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig,
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  if (jsonSchema) {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Gemini did not return valid JSON");
    }
  }

  return text.trim();
}

module.exports = { callGemini };
