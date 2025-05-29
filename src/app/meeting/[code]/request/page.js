// Request Access page for meeting join approval
"use client";
import { useState, useEffect, useRef } from "react";
import getSocket from "@/lib/socket";
import Button from "@/components/Button";
import Skeleton from "@/components/Skeleton";

export default function RequestAccess({ params }) {
  const code = params.code;
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("pending"); // pending, approved, denied
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
    setUser(JSON.parse(stored));
    // Check if user is host (admin) for this meeting
    fetch(`/api/meeting?code=${code}`)
      .then(res => res.json())
      .then(meeting => {
        if (meeting && meeting.host === JSON.parse(stored).email) {
          // Host should not see request page, redirect to meeting
          if (typeof window !== "undefined") {
            localStorage.setItem(`approved_${code}`, "true");
            window.location.href = `/meeting/${code}`;
          }
          return;
        }
        socketRef.current = getSocket(code);
        // Listen for approval/denial
        socketRef.current.on("join-approved", ({ email }) => {
          if (email === JSON.parse(stored)?.email) {
            localStorage.setItem(`approved_${code}`, "true");
            setStatus("approved");
            setTimeout(() => {
              window.location.href = `/meeting/${code}`;
            }, 1000);
          }
        });
        socketRef.current.on("join-denied", ({ email }) => {
          if (email === JSON.parse(stored)?.email) {
            setStatus("denied");
          }
        });
        setTimeout(() => setLoading(false), 400);
      });
    return () => socketRef.current && socketRef.current.disconnect();
  }, [code]);

  const handleRequest = () => {
    if (user) {
      socketRef.current.emit("join-request", { code, email: user.email, name: user.displayName || user.email });
      setStatus("pending");
    }
  };

  if (loading) return <Skeleton type="meeting" />;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-lg p-8 w-full max-w-md flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300">Request to Join Meeting</h2>
        {status === "pending" && <>
          <p className="mb-4 text-zinc-600 dark:text-zinc-300">Click below to request access. The meeting admin must approve your request.</p>
          <Button onClick={handleRequest} className="w-full mb-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">Send Join Request</Button>
          <p className="text-sm text-zinc-500 mt-2">Waiting for admin approval...</p>
        </>}
        {status === "approved" && <p className="text-green-600 font-semibold">Approved! Redirecting to meeting...</p>}
        {status === "denied" && <p className="text-red-600 font-semibold">Your request was denied by the admin.</p>}
      </div>
    </main>
  );
}
