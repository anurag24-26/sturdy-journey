const b2 = require("../config/backblaze");

const urlCache = new Map();

/**
 * Robustly extract a clean fileName from whatever is stored in DB.
 * Handles:
 *   - plain filenames:  "1779524072906-abc.jpeg"
 *   - full B2 URLs:     "https://f002.backblazeb2.com/file/BUCKET/1779524072906-abc.jpeg"
 *   - signed URLs:      "https://f002.backblazeb2.com/file/BUCKET/1779524072906-abc.jpeg?Authorization=..."
 *   - double-encoded:   anything where the path segment itself starts with "https%3A" or "https:"
 */
function extractFileName(raw) {
  if (!raw) return "";

  // Strip query string (auth token, etc.)
  const withoutQuery = raw.split("?")[0];

  // If it looks like a URL, pull everything after /file/BUCKET_NAME/
  // This regex matches the last occurrence of /file/<anything>/ to be safe
  const urlMatch = withoutQuery.match(
    /\/file\/[^/]+\/(.+)$/
  );

  if (urlMatch) {
    // Decode any percent-encoding (e.g. %2F → / for sub-folders)
    return decodeURIComponent(urlMatch[1]);
  }

  // Already a plain filename — still decode just in case
  return decodeURIComponent(withoutQuery);
}

const getPrivateFileUrl = async (fileName) => {
  try {
    if (!fileName) return "";

    // Normalise whatever shape the DB stored
    const cleanName = extractFileName(fileName);

    if (!cleanName) return "";

    const now = Date.now();
    const cached = urlCache.get(cleanName);

    // Serve from cache if it won't expire in the next 5 minutes
    if (cached && cached.expiresAt > now + 5 * 60 * 1000) {
      return cached.url;
    }

    await b2.authorize();

    const authResponse = await b2.getDownloadAuthorization({
      bucketId: process.env.B2_BUCKET_ID,
      fileNamePrefix: cleanName,
      validDurationInSeconds: 86400,
    });

    // Encode special characters but keep forward-slashes readable
    const encodedName = encodeURIComponent(cleanName).replace(/%2F/g, "/");

    const url =
      `https://f002.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${encodedName}` +
      `?Authorization=${authResponse.data.authorizationToken}`;

    urlCache.set(cleanName, {
      url,
      expiresAt: now + (86400 - 300) * 1000, // expire 5 min before token does
    });

    return url;
  } catch (e) {
    console.log("B2 PRIVATE URL ERROR:", e);
    throw e;
  }
};

module.exports = getPrivateFileUrl;