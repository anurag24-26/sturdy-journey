const express = require("express");
const router = express.Router();
const multer = require("multer");

const auth = require("../middleware/authMiddleware");

const {
  createPost,
  getPosts,
  addComment,
  getComments,
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


// COMMENTS
router.post("/:id/comments", auth, addComment);

router.get("/:id/comments", auth, getComments);

module.exports = router;