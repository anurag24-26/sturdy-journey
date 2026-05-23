const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const {
  register,
  login,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/push-token", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { pushToken: req.body.token });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


module.exports = router;