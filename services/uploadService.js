const b2 = require("../config/backblaze");
const fs = require("fs");
const path = require("path");

// ── MIME lookup by extension (more reliable than trusting multer's mimetype) ──
const MIME_MAP = {
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".gif":  "image/gif",
  ".mp4":  "video/mp4",
  ".mov":  "video/quicktime",
  ".m4v":  "video/x-m4v",
};

const uploadToB2 = async (file) => {
  await b2.authorize();

  const uploadUrlResponse = await b2.getUploadUrl({
    bucketId: process.env.B2_BUCKET_ID,
  });

  const { uploadUrl, authorizationToken: uploadAuthToken } =
    uploadUrlResponse.data;

  const fileBuffer = fs.readFileSync(file.path);

  // Derive MIME from extension first; fall back to what multer detected
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = MIME_MAP[ext] || file.mimetype || "b2/x-auto";

  // Sanitise the original filename (spaces / special chars break B2 paths)
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;

  console.log(`B2 UPLOADING: ${fileName} (${mime}, ${fileBuffer.length} bytes)`);

  const result = await b2.uploadFile({
    uploadUrl,
    uploadAuthToken,
    fileName,
    data:          fileBuffer,
    mime,
    contentLength: fileBuffer.length,   // required – omitting this causes silent failures
    onUploadProgress: null,
  });

  // Always clean up the temp file regardless of outcome
  fs.unlink(file.path, () => {});

  // Verify B2 actually stored the file — if fileId is missing the upload failed
  const uploadedId   = result?.data?.fileId;
  const uploadedName = result?.data?.fileName;

  if (!uploadedId) {
    console.error("B2 UPLOAD FAILED — no fileId returned:", result?.data);
    throw new Error(`B2 upload failed for ${fileName}: no fileId in response`);
  }

  console.log(`B2 UPLOAD OK: ${uploadedName} (id: ${uploadedId})`);

  // Return only the plain filename — getPrivateFileUrl will build the signed URL
  return fileName;
};

module.exports = uploadToB2;