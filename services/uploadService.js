const b2 = require("../config/backblaze");
const fs = require("fs");

const uploadToB2 = async (file) => {
  await b2.authorize();

  const uploadUrlResponse =
    await b2.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID,
    });

  const uploadUrl =
    uploadUrlResponse.data.uploadUrl;

  const uploadAuthToken =
    uploadUrlResponse.data.authorizationToken;

  const fileBuffer =
    fs.readFileSync(file.path);

  const fileName =
    `${Date.now()}-${file.originalname}`;

  await b2.uploadFile({
    uploadUrl,
    uploadAuthToken,
    fileName,
    data: fileBuffer,
  });

  fs.unlinkSync(file.path);

  // IMPORTANT
  return fileName;
};

module.exports = uploadToB2;