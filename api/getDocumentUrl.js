const { verifyIdToken } = require("./_lib/firebaseAdmin");
const { cloudinary } = require("./_lib/cloudinary");
const { enforceRateLimit } = require("./_lib/rateLimit");

// Vercel serverless function. Official-application documents are uploaded to
// Cloudinary with "authenticated" delivery (not publicly viewable by URL) -
// this is the only way to get a working link to one, and it requires the
// caller to hold a valid Firebase ID token with the admin role. See
// docs/SECURITY.md and integrations/Core.jsx (UploadOfficialDocument).
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const decodedToken = await verifyIdToken(req.headers.authorization);
    if (decodedToken.role !== "admin") {
      res.status(403).json({ error: "Admin access required." });
      return;
    }

    // 20 document links/minute per admin - this is a manual review workflow
    // (an admin clicking into applications one at a time), not a bulk export,
    // so this is mostly a floor against a compromised admin token being used
    // to scrape every applicant's document in a tight loop.
    await enforceRateLimit({ uid: decodedToken.uid, action: "getDocumentUrl", max: 20, windowMs: 60_000 });

    const { publicId, resourceType } = req.body || {};
    if (!publicId || typeof publicId !== "string") {
      res.status(400).json({ error: "publicId is required." });
      return;
    }

    const urlOptions = {
      type: "authenticated",
      sign_url: true,
      resource_type: resourceType || "image",
    };

    // If Cloudinary's Token-Based Authentication add-on is enabled (Console ->
    // Settings -> Security -> Strict token-based authentication) and its auth
    // token key is set here, mint a link that expires in 5 minutes instead of
    // working forever once generated. Falls back to a plain (non-expiring)
    // signed URL if that add-on isn't configured - see docs/SECURITY.md.
    const authTokenKey = process.env.CLOUDINARY_AUTH_TOKEN_KEY;
    if (authTokenKey) {
      urlOptions.auth_token = { key: authTokenKey, duration: 300 };
    }

    const url = cloudinary.url(publicId, urlOptions);

    res.status(200).json({ url });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Failed to generate document URL." });
  }
};
