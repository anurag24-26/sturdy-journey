const Post = require("../models/Post");
const uploadToB2 = require("../services/uploadService");

const createPost = async (req, res) => {
  try {
    let mediaUrl = "";
    let mediaType = "text";

    if (req.file) {
      mediaUrl = await uploadToB2(req.file);

      if (req.file.mimetype.startsWith("image")) {
        mediaType = "image";
      } else {
        mediaType = "video";
      }
    }

    const post = await Post.create({
      user: req.user.id,
      text: req.body.text,
      mediaUrl,
      mediaType,
    });

    res.json(post);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  createPost,
  getPosts,
};