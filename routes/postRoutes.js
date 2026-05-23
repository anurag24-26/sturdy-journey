const express = require("express");
const router = express.Router();
const multer = require("multer");

const auth = require("../middleware/authMiddleware");

const {
  createPost,
  getPosts,
} = require("../controllers/postController");

const storage = multer.diskStorage({});

const upload = multer({
  storage,
});

router.post(
  "/",
  auth,
  upload.single("media"),
  createPost
);

router.get("/", auth, getPosts);

module.exports = router;