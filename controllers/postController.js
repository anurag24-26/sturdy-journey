const Post = require("../models/Post");
const uploadToB2 = require("../services/uploadService");
const Notification = require("../models/Notification");
const User = require("../models/User");

// CREATE POST
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

    const populatedPost = await Post.findById(post._id)
      .populate("user", "name email");
      const io = req.app.get("io");

const users = await User.find({
  _id: { $ne: req.user.id },
});

for (const user of users) {

  const notification = await Notification.create({
    sender: req.user.id,
    receiver: user._id,
    type: "post",
    post: post._id,
    text: `${populatedPost.user.name} posted a new memory ❤️`,
  });

  if (user.socketId) {
    io.to(user.socketId).emit(
      "new_notification",
      notification
    );
  }
}


    res.json(populatedPost);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};


// GET POSTS
const getPosts = async (req, res) => {
  try {

    const posts = await Post.find()
      .populate("user", "name email")
      .populate("comments.user", "name email")
      .sort({ createdAt: -1 });

    res.json(posts);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};


// ADD COMMENT
const addComment = async (req, res) => {
  try {

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        message: "Comment text required",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const comment = {
      user: req.user.id,
      text,
    };

    post.comments.push(comment);

    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate("comments.user", "name email");

    const newComment =
      updatedPost.comments[updatedPost.comments.length - 1];
      const io = req.app.get("io");

const postOwner = await User.findById(post.user);

if (
  postOwner &&
  postOwner._id.toString() !== req.user.id
) {

  const notification = await Notification.create({
    sender: req.user.id,
    receiver: postOwner._id,
    type: "comment",
    post: post._id,
    text: `${newComment.user.name} commented on your post 💬`,
  });

  if (postOwner.socketId) {
    io.to(postOwner.socketId).emit(
      "new_notification",
      notification
    );
  }
}


    res.json(newComment);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};


// GET COMMENTS
const getComments = async (req, res) => {
  try {

    const post = await Post.findById(req.params.id)
      .populate("comments.user", "name email");

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    res.json(post.comments);

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
  addComment,
  getComments,
};