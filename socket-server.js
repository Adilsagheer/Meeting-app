// Example server for Socket.IO (run separately)
const { Server } = require("socket.io");
const http = require("http");
const axios = require("axios");

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "*" }
});

let participants = {};
let joinRequests = {};

function emitPeerIds(code) {
  const ids = Array.from(io.sockets.adapter.rooms.get(code) || []);
  io.to(code).emit("peer-ids", ids);
}

io.on("connection", (socket) => {
  const code = socket.handshake.query.code;
  socket.join(code);

  socket.on("join", ({ code, user }) => {
    if (!participants[code]) participants[code] = [];
    if (!participants[code].includes(user)) participants[code].push(user);
    io.to(code).emit("participants", participants[code]);
    emitPeerIds(code);
  });

  socket.on("leave", ({ code, user }) => {
    if (participants[code]) {
      participants[code] = participants[code].filter(u => u !== user);
      io.to(code).emit("participants", participants[code]);
      emitPeerIds(code);
    }
  });

  socket.on("disconnect", () => {
    // Remove user from all rooms
    Object.keys(participants).forEach(room => {
      participants[room] = participants[room].filter(u => u !== socket.id);
      io.to(room).emit("participants", participants[room]);
      emitPeerIds(room);
    });
  });

  socket.on("chat", (msg) => {
    io.to(code).emit("chat", msg);
  });

  // WebRTC signaling events
  socket.on("ready", ({ code, user }) => {
    socket.to(code).emit("ready", { user, socketId: socket.id });
  });

  socket.on("offer", ({ code, offer, to, from }) => {
    socket.to(to).emit("offer", { offer, from, socketId: socket.id });
  });

  socket.on("answer", ({ code, answer, to, from }) => {
    socket.to(to).emit("answer", { answer, from, socketId: socket.id });
  });

  socket.on("ice-candidate", ({ code, candidate, to, from }) => {
    socket.to(to).emit("ice-candidate", { candidate, from, socketId: socket.id });
  });

  // Handle join requests
  socket.on("join-request", async ({ code, email, name }) => {
    // Fetch host (admin) for this meeting from DB
    let hostEmail = null;
    try {
      const res = await axios.get(`http://localhost:3000/api/meeting?code=${code}`);
      hostEmail = res.data.host;
    } catch (e) {}
    // Find host socket in this room
    let hostSocketId = null;
    if (hostEmail && participants[code]) {
      for (const id of Object.keys(io.sockets.sockets)) {
        const s = io.sockets.sockets[id];
        if (s.handshake.query.code === code && participants[code][0] === hostEmail) {
          hostSocketId = id;
          break;
        }
      }
    }
    if (!joinRequests[code]) joinRequests[code] = [];
    joinRequests[code].push({ email, name, socketId: socket.id });
    // Notify only the host (admin) of the request
    if (hostSocketId) {
      io.to(hostSocketId).emit("join-request-received", { email, name, code });
    }
  });

  // Admin approves a join request
  socket.on("approve-join", ({ code, email }) => {
    io.to(code).emit("join-approved", { email });
  });

  // Admin denies a join request
  socket.on("deny-join", ({ code, email }) => {
    io.to(code).emit("join-denied", { email });
  });
});

server.listen(3001, () => {
  console.log("Socket.IO server running on port 3001");
});
