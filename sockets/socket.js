module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User Connected");

    socket.on("disconnect", () => {
      console.log("User Disconnected");
    });
  });
};