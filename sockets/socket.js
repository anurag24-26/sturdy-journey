const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { Expo } = require("expo-server-sdk");

const expo = new Expo();

// Export this so postController can use it
const sendPushNotification = async (userId, text) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
      await expo.sendPushNotificationsAsync([{
        to: user.pushToken,
        title: "Private Memory ❤️",
        body: text,
        sound: "default",
      }]);
    }
  } catch (e) {
    console.log("Push error:", e.message);
  }
};

module.exports = (io) => {
  io.on("connection", async (socket) => {
    console.log("User Connected");

    const token = socket.handshake.auth.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await User.findByIdAndUpdate(decoded.id, { socketId: socket.id });
      } catch (error) {
        console.log(error);
      }
    }

    socket.on("disconnect", async () => {
      try {
        await User.findOneAndUpdate({ socketId: socket.id }, { socketId: "" });
      } catch (error) {
        console.log(error);
      }
      console.log("User Disconnected");
    });
  });
};

module.exports.sendPushNotification = sendPushNotification;