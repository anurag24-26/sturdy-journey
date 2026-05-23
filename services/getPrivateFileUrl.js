const b2 = require("../config/backblaze");

// In-memory cache: fileName → { url, expiresAt }
const urlCache = new Map();

const getPrivateFileUrl = async (fileName) => {
  const now = Date.now();
  const cached = urlCache.get(fileName);

  // Return cached URL if still has >5 min left
  if (cached && cached.expiresAt > now + 5 * 60 * 1000) {
    return cached.url;
  }

  await b2.authorize();

  const authResponse = await b2.getDownloadAuthorization({
    bucketId: process.env.B2_BUCKET_ID,
    fileNamePrefix: fileName,
    validDurationInSeconds: 86400, // 24 hours
  });

  const url =
    `https://f002.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}` +
    `?Authorization=${authResponse.data.authorizationToken}`;

  // Cache it for 24h minus 5min safety buffer
  urlCache.set(fileName, {
    url,
    expiresAt: now + (86400 - 300) * 1000,
  });

  return url;
};

module.exports = getPrivateFileUrl;