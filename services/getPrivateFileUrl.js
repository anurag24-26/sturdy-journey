const b2 = require("../config/backblaze");

const urlCache = new Map();

const getPrivateFileUrl = async (fileName) => {
  try {
    const now = Date.now();

    const cached = urlCache.get(fileName);

    if (
      cached &&
      cached.expiresAt > now + 5 * 60 * 1000
    ) {
      return cached.url;
    }

    await b2.authorize();

    const authResponse =
      await b2.getDownloadAuthorization({
        bucketId: process.env.B2_BUCKET_ID,
        fileNamePrefix: fileName,
        validDurationInSeconds: 86400,
      });

    const encodedFileName =
      encodeURIComponent(fileName)
        .replace(/%2F/g, "/");

    const url =
      `https://f002.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${encodedFileName}` +
      `?Authorization=${authResponse.data.authorizationToken}`;

    urlCache.set(fileName, {
      url,
      expiresAt:
        now + (86400 - 300) * 1000,
    });

    return url;
  } catch (e) {
    console.log(
      "B2 PRIVATE URL ERROR:",
      e
    );

    throw e;
  }
};

module.exports = getPrivateFileUrl;