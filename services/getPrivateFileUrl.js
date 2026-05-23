const b2 = require("../config/backblaze");

const urlCache = new Map();

/**
 * Robustly extract a clean fileName from whatever is stored in DB.
 * Handles plain filenames, full B2 URLs, signed URLs, double-encoded URLs.
 */
function extractFileName(raw) {
  if (!raw) return "";

  const withoutQuery = raw.split("?")[0];

  // Pull everything after /file/BUCKET_NAME/
  const urlMatch = withoutQuery.match(/\/file\/[^/]+\/(.+)$/);
  if (urlMatch) return decodeURIComponent(urlMatch[1]);

  return decodeURIComponent(withoutQuery);
}

const getPrivateFileUrl = async (fileName) => {
  try {
    if (!fileName) return "";

    const cleanName = extractFileName(fileName);
    if (!cleanName) return "";

    const now = Date.now();
    const cached = urlCache.get(cleanName);

    // Serve from cache if it won't expire in the next 5 minutes
    if (cached && cached.expiresAt > now + 5 * 60 * 1000) {
      return cached.url;
    }

    // authorize() returns the correct downloadUrl for your B2 region
    const authRes = await b2.authorize();
    // e.g. "https://f005.backblazeb2.com" — never hardcode this
    const downloadUrl = authRes.data.downloadUrl;

    const authResponse = await b2.getDownloadAuthorization({
      bucketId: process.env.B2_BUCKET_ID,
      fileNamePrefix: cleanName,
      validDurationInSeconds: 86400,
    });

    // Encode special chars but keep forward-slashes for sub-folder support
    const encodedName = encodeURIComponent(cleanName).replace(/%2F/g, "/");

    const url =
      `${downloadUrl}/file/${process.env.B2_BUCKET_NAME}/${encodedName}` +
      `?Authorization=${authResponse.data.authorizationToken}`;

    urlCache.set(cleanName, {
      url,
      expiresAt: now + (86400 - 300) * 1000,
    });

    return url;
  } catch (e) {
    console.error("B2 PRIVATE URL ERROR:", e.message);
    throw e;
  }
};

module.exports = getPrivateFileUrl;