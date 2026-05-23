const b2 = require("../config/backblaze");

const getPrivateFileUrl = async (
  fileName
) => {
  await b2.authorize();

  const authResponse =
    await b2.getDownloadAuthorization({
      bucketId: process.env.B2_BUCKET_ID,
      fileNamePrefix: fileName,
      validDurationInSeconds: 86400,
    });

  return `https://f002.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}?Authorization=${authResponse.data.authorizationToken}`;
};

module.exports = getPrivateFileUrl;