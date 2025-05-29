// Meeting page: video, chat, and screen sharing UI will be added here
"use client";
import { getMediaStream, replaceTrack } from "@/utils/webrtc";
import { useState, useEffect, useRef, useCallback } from "react";
import getSocket from "@/lib/socket";
import Button from "@/components/Button";
import Skeleton from "@/components/Skeleton";
import { v4 as uuidv4 } from "uuid";

export default function Meeting({ params }) {
  // Use params directly (no need to unwrap Promise)
  const code = params.code;
  const [user, setUser] = useState(null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const videoRef = useRef();
  const [screenSharing, setScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [loading, setLoading] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }
  const peerConnections = useRef({});
  let localStream = useRef(null);
  const socketRef = useRef();

  const createPeerConnection = useCallback(async (socketId, isInitiator, remoteOffer) => {
    if (peerConnections.current[socketId]) return;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peerConnections.current[socketId] = pc;
    // Add local tracks
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current));
    }
    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({ ...prev, [socketId]: event.streams[0] }));
    };
    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", { code, candidate: event.candidate, to: socketId, from: socketRef.current.id });
      }
    };
    // Offer/Answer
    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit("offer", { code, offer, to: socketId, from: socketRef.current.id });
    } else if (remoteOffer) {
      await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit("answer", { code, answer, to: socketId, from: socketRef.current.id });
    }
  }, [code]);

  // Track all peer socket IDs
  const [peerIds, setPeerIds] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const isHost = participants[0] === user?.email;

  useEffect(() => {
    setLoading(true);
    const stored = localStorage.getItem("user");
    if (!stored) {
      // Save intended meeting URL and redirect to login
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
        socketRef.current.on("participants", (list) => setParticipants(list));
        socketRef.current.emit("join", { code, user: JSON.parse(stored)?.email });

        // Track all peer socket IDs
        socketRef.current.on("peer-ids", (ids) => {
          setPeerIds(ids.filter(id => id !== socketRef.current.id));
        });

        // WebRTC signaling handlers
        socketRef.current.on("ready", async ({ user: remoteUser, socketId }) => {
          if (socketRef.current.id === socketId) return;
          await createPeerConnection(socketId, true);
        });
        socketRef.current.on("offer", async ({ offer, from, socketId }) => {
          await createPeerConnection(from, false, offer);
        });
        socketRef.current.on("answer", async ({ answer, from }) => {
          if (peerConnections.current[from]) {
            await peerConnections.current[from].setRemoteDescription(new RTCSessionDescription(answer));
          }
        });
        socketRef.current.on("ice-candidate", async ({ candidate, from }) => {
          if (peerConnections.current[from] && candidate) {
            try {
              await peerConnections.current[from].addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {}
          }
        });
        socketRef.current.on("leave", ({ user: leftUser, socketId }) => {
          if (peerConnections.current[socketId]) {
            peerConnections.current[socketId].close();
            delete peerConnections.current[socketId];
            setRemoteStreams((prev) => {
              const copy = { ...prev };
              delete copy[socketId];
              return copy;
            });
          }
        });
        // Notify others ready for connection
        socketRef.current.emit("ready", { code, user: JSON.parse(stored)?.email, socketId: socketRef.current.id });
        setTimeout(() => setLoading(false), 600); // Simulate loading
      });
    return () => {
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      socketRef.current && socketRef.current.disconnect();
    };
  }, [code, createPeerConnection]);

  // On peerIds update, create connections to all peers if not already connected
  useEffect(() => {
    peerIds.forEach((id) => {
      if (id !== socketRef.current.id && !peerConnections.current[id]) {
        createPeerConnection(id, true);
      }
    });
  }, [peerIds, createPeerConnection]);

  useEffect(() => {
    getMediaStream(videoRef, screenSharing).then((stream) => {
      if (stream) {
        localStream.current = stream;
        // Replace tracks in all peer connections
        Object.values(peerConnections.current).forEach(pc => {
          stream.getTracks().forEach(track => replaceTrack(pc, track));
        });
      }
    });
  }, [screenSharing]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message) {
      const msgObj = { id: uuidv4(), sender: user?.email, message, timestamp: Date.now() };
      socketRef.current.emit("chat", msgObj);
      setMessage("");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleCamera = () => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach(track => {
        track.enabled = !cameraOn;
      });
      setCameraOn(v => !v);
    }
  };

  const toggleMic = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = !micOn;
      });
      setMicOn(v => !v);
    }
  };

  const endCall = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }
    socketRef.current.emit("leave", { code, user: user?.email });
    socketRef.current.disconnect();
    window.location.href = "/dashboard";
  };

  useEffect(() => {
    // Log number of users in the meeting
    console.log(`Participants (${participants.length}):`, participants);
    // Log camera status for each user (self and remote)
    const cameraStatus = {};
    cameraStatus[user?.email || 'You'] = cameraOn;
    Object.entries(remoteStreams).forEach(([id, stream]) => {
      // We don't have email for remote, so just log socketId
      cameraStatus[`Remote (${id})`] = !!(stream && stream.getVideoTracks().some(track => track.enabled));
    });
    console.log('Camera status:', cameraStatus);
  }, [participants, cameraOn, remoteStreams, user]);

  useEffect(() => {
    if (!user) return;
    // Listen for join requests if host
    if (isHost && socketRef.current) {
      socketRef.current.on("join-request-received", ({ email, name }) => {
        setJoinRequests((prev) => {
          if (prev.some(r => r.email === email)) return prev;
          return [...prev, { email, name }];
        });
      });
    }
    return () => {
      if (socketRef.current) socketRef.current.off("join-request-received");
    };
  }, [isHost, user]);

  const handleApprove = (email) => {
    socketRef.current.emit("approve-join", { code, email });
    setJoinRequests((prev) => prev.filter(r => r.email !== email));
    // Set localStorage for approved user (simulate client-side approval)
    if (typeof window !== "undefined") {
      localStorage.setItem(`approved_${code}`, "true");
    }
  };
  const handleDeny = (email) => {
    socketRef.current.emit("deny-join", { code, email });
    setJoinRequests((prev) => prev.filter(r => r.email !== email));
  };

  if (loading) return <Skeleton type="meeting" />;

  return (
    <main className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-zinc-900 dark:to-zinc-800">
      {isHost && joinRequests.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-zinc-900 shadow-lg rounded-lg p-4 border border-blue-200 dark:border-zinc-700">
          <h3 className="font-bold mb-2 text-blue-700 dark:text-blue-300">Join Requests</h3>
          {joinRequests.map(req => (
            <div key={req.email} className="flex items-center gap-2 mb-2">
              <span>{req.name} ({req.email})</span>
              <Button onClick={() => handleApprove(req.email)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">Approve</Button>
              <Button onClick={() => handleDeny(req.email)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">Deny</Button>
            </div>
          ))}
        </div>
      )}
      <section className="flex-1 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-300">Meeting: {code}</h2>
        <div className="flex flex-wrap gap-4 justify-center items-center w-full mb-4">
          <div>
            <video ref={videoRef} autoPlay playsInline muted className="w-64 h-40 bg-black rounded shadow-lg mb-2" />
            <div className="text-xs text-center font-semibold">You</div>
          </div>
          {Object.entries(remoteStreams).map(([id, stream]) => (
            <div key={id}>
              <VideoTile stream={stream} />
              <div className="text-xs text-center font-semibold">Participant</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          <Button onClick={endCall} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">End Call</Button>
          <Button onClick={toggleCamera} className={cameraOn ? "bg-gray-700 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-900" : "bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"}>
            {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
          </Button>
          <Button onClick={toggleMic} className={micOn ? "bg-gray-700 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-900" : "bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"}>
            {micOn ? "Mute Mic" : "Unmute Mic"}
          </Button>
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
        {/* Participants List */}
        <div className="w-full flex flex-wrap gap-2 mb-4">
          <div className="bg-white dark:bg-zinc-800 rounded p-2 shadow text-sm">
            <b>Participants:</b> {participants.length > 0 ? participants.join(", ") : "No one else yet"}
          </div>
        </div>
      </section>
      {showChat && (
        <aside className="w-full md:w-80 bg-white dark:bg-zinc-900 p-4 flex flex-col shadow-lg border-l border-gray-200 dark:border-zinc-800">
          <div className="flex-1 overflow-y-auto mb-2">
            {chat.map((msg) => (
              <div key={msg.id || msg.timestamp} className="mb-1"><b>{msg.sender}:</b> {msg.message}</div>
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

function VideoTile({ stream }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={ref} autoPlay playsInline className="w-64 h-40 bg-black rounded shadow-lg mb-2" />;
}
