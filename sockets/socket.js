const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = (io) => {

  io.on("connection", async (socket) => {

    console.log("User Connected");

    const token = socket.handshake.auth.token;

    if (token) {
      try {

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );

        await User.findByIdAndUpdate(
          decoded.id,
          {
            socketId: socket.id,
          }
        );

      } catch (error) {
        console.log(error);
      }
    }

    socket.on("disconnect", async () => {

      try {

        await User.findOneAndUpdate(
          { socketId: socket.id },
          { socketId: "" }
        );

      } catch (error) {
        console.log(error);
      }

      console.log("User Disconnected");
    });
  });
};