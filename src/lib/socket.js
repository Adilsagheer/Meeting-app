// Socket.IO client setup
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export default function getSocket(meetingCode) {
  return io(SOCKET_URL, { query: { code: meetingCode }, autoConnect: true });
}
