// Meeting page: video, chat, and screen sharing UI will be added here
"use client";
import { getMediaStream } from "@/utils/webrtc";
import { useEffect, useRef, useState } from "react";
import getSocket from "@/lib/socket";
import Button from "@/components/Button";
import Skeleton from "@/components/Skeleton";

export default function Meeting({ params }) {
  const { code } = params;
  const [user, setUser] = useState(null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const videoRef = useRef();
  const [screenSharing, setScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef();

  useEffect(() => {
    setLoading(true);
    const stored = localStorage.getItem("user");
    if (!stored) {
      if (typeof window !== "undefined") {
        localStorage.setItem("redirectAfterAuth", window.location.pathname);
        window.location.href = "/";
      }
      return;
    }
    // Check if user is host (admin) for this meeting
    fetch(`/api/meeting?code=${code}`)
      .then(res => res.json())
      .then(meeting => {
        const isHost = meeting && meeting.host === JSON.parse(stored).email;
        const approvedKey = `approved_${code}`;
        const isApproved = localStorage.getItem(approvedKey) === "true";
        if (!isHost && !isApproved) {
          if (typeof window !== "undefined") {
            window.location.href = `/meeting/${code}/request`;
          }
          return;
        }
        setUser(JSON.parse(stored));
        socketRef.current = getSocket(code);
        socketRef.current.on("chat", (msg) => setChat((c) => [...c, msg]));
        setTimeout(() => setLoading(false), 600); // Simulate loading
      });
    return () => socketRef.current && socketRef.current.disconnect();
  }, [code]);

  useEffect(() => {
    getMediaStream(videoRef, screenSharing);
  }, [screenSharing]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message) {
      socketRef.current.emit("chat", { sender: user?.email, message });
      setMessage("");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) return <Skeleton type="meeting" />;

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-zinc-900 dark:to-zinc-800">
      <section className="flex-1 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-300">Meeting: {code}</h2>
        <video ref={videoRef} autoPlay playsInline className="w-full max-w-lg bg-black rounded mb-4 aspect-video shadow-lg" />
        <div className="flex gap-2 mb-4">
          <Button onClick={() => setScreenSharing((v) => !v)} className="bg-gray-700 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-900">
            {screenSharing ? "Stop Screen Share" : "Share Screen"}
          </Button>
          <Button onClick={handleCopy} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
            {copied ? "Link Copied!" : "Copy Meeting Link"}
          </Button>
          <Button onClick={() => setShowChat((v) => !v)} className="bg-gray-300 text-gray-700 hover:bg-gray-400 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-800">
            {showChat ? "Hide Chat" : "Show Chat"}
          </Button>
        </div>
      </section>
      {showChat && (
        <aside className="w-full md:w-80 bg-white dark:bg-zinc-900 p-4 flex flex-col shadow-lg border-l border-gray-200 dark:border-zinc-800">
          <div className="flex-1 overflow-y-auto mb-2">
            {chat.map((msg, i) => (
              <div key={i} className="mb-1"><b>{msg.sender}:</b> {msg.message}</div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex">
            <input
              className="flex-1 border p-2 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <Button className="rounded-none rounded-r bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800" type="submit">Send</Button>
          </form>
        </aside>
      )}
    </main>
  );
}

export async function getServerSideProps(context) {
  return { props: { params: context.params } };
}
