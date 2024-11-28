 const express = require("express");
const http = require("http");
const cors = require("cors");
const { userJoin, getUsers, userLeave } = require("./utils/user");

const app = express();
const server = http.createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server);

app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/", (req, res) => {
  res.send("server");
});

// socket.io
let imageUrl, userRoom;

io.on("connection", (socket) => {
  socket.on("user-joined", (data) => {
    const { roomId, userId, userName, host, presenter } = data;
    userRoom = roomId;
    const user = userJoin(socket.id, userName, roomId, host, presenter);
    const roomUsers = getUsers(user.room);
    socket.join(user.room);

    // Welcome message to the new user
    socket.emit("message", {
      username: "System",
      message: "Welcome to ChatRoom",
    });

    // Notify others in the room that a user has joined (pop-up)
    socket.broadcast.to(user.room).emit("user-status", {
      message: `${user.username} has joined`,
    });

    // Update the room's user list
    io.to(user.room).emit("users", roomUsers);

    // Send the canvas image if available
    io.to(user.room).emit("canvasImage", imageUrl);
  });

  socket.on("drawing", (data) => {
    imageUrl = data;
    socket.broadcast.to(userRoom).emit("canvasImage", imageUrl);
  });

  socket.on("messageResponse", (message) => {
    const user = getUsers(userRoom).find((u) => u.id === socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        username: user.username,
        message,
      });
    }
  });

  socket.on("disconnect", () => {
    const userLeaves = userLeave(socket.id);
    const roomUsers = getUsers(userRoom);

    if (userLeaves) {
      // Notify others in the room that a user has left (pop-up)
      io.to(userLeaves.room).emit("user-status", {
        message: `${userLeaves.username} left the chat`,
      });

      // Update the room's user list
      io.to(userLeaves.room).emit("users", roomUsers);
    }
  });
});

// serve on port
const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`server is listening on http://localhost:${PORT}`)
);
