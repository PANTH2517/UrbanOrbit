// src/integrations/Core.jsx
// Real implementations replacing the Base44 stubs. Both functions keep the exact
// call shape the rest of the app already expects (ReportIssueDialog.jsx,
// RecommendationDialog.jsx, GovernmentReports.jsx were built against this shape).
//
// File storage is Cloudinary rather than Firebase Storage - new Firebase
// Storage buckets require the Blaze billing plan even on a fresh project,
// which this app deliberately avoids. See docs/SECURITY.md.
import { auth } from "../src/firebase";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PUBLIC_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_PUBLIC;
const PRIVATE_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_PRIVATE;

async function cloudinaryUpload(file, preset) {
  if (!CLOUD_NAME || !preset) {
    throw new Error(
      "Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and the upload preset env vars - see .env.example."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Upload failed.");
  }
  return data;
}

// Used for citizen report photos - public by design (this is a public
// transparency tool), uploaded via Cloudinary's "public" unsigned preset.
export async function UploadFile({ file } = {}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Please sign in and verify your phone number before uploading a photo.");
  }
  if (!file) {
    throw new Error("No file provided.");
  }

  const data = await cloudinaryUpload(file, PUBLIC_PRESET);
  return { file_url: data.secure_url, public_id: data.public_id, resource_type: data.resource_type };
}

// Used for government-official verification documents - private by design.
// Uploaded via Cloudinary's "authenticated" delivery-type unsigned preset, so
// the resulting asset isn't publicly viewable by URL. Only
// api/getDocumentUrl.js (which checks the caller is an admin) can mint a
// viewable signed link for it.
export async function UploadOfficialDocument(file) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated.");
  }
  if (!file) {
    throw new Error("No file provided.");
  }

  const data = await cloudinaryUpload(file, PRIVATE_PRESET);
  return { public_id: data.public_id, resource_type: data.resource_type };
}

// Proxies to the /api/generateRecommendation Vercel serverless function - the
// Gemini API key never reaches the browser. Accepts either calling convention
// already used in the app: InvokeLLM({ prompt, response_json_schema }) ->
// returns an object matching the schema, or InvokeLLM({ prompt }) -> returns
// a plain string.
export async function InvokeLLM({ prompt, response_json_schema } = {}) {
  if (!prompt) {
    throw new Error("A prompt is required.");
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Please sign in as a verified official to use AI recommendations.");
  }

  const idToken = await user.getIdToken();
  const res = await fetch("/api/generateRecommendation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ prompt, response_json_schema: response_json_schema || null }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `AI request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return data.result;
}
