"use client";
// Dashboard page for creating/joining meetings
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Button from "@/components/Button";
import Skeleton from "@/components/Skeleton";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [meetingCode, setMeetingCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    setTimeout(() => setLoading(false), 600); // Simulate loading
  }, []);

  if (loading) return <Skeleton type="dashboard" />;

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/";
    return null;
  }

  const handleCreate = async () => {
    const code = uuidv4().slice(0, 8);
    // Create meeting in DB with current user as host
    await fetch("/api/meeting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, host: user.email }),
    });
    // Auto-approve creator
    if (typeof window !== "undefined") {
      localStorage.setItem(`approved_${code}`, "true");
      window.location.href = `/meeting/${code}`;
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (meetingCode) {
      window.location.href = `/meeting/${meetingCode}/request`;
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-lg p-8 w-full max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 text-blue-700 dark:text-blue-300">
          Dashboard
        </h1>
        <Button
          onClick={handleCreate}
          className="w-full mb-4 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
        >
          Create New Meeting
        </Button>
        <form onSubmit={handleJoin} className="flex flex-col items-center w-full">
          <input
            className="border p-2 rounded mb-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-zinc-800 dark:text-white dark:border-zinc-700"
            type="text"
            placeholder="Enter meeting code"
            value={meetingCode}
            onChange={(e) => setMeetingCode(e.target.value)}
          />
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Join Meeting
          </Button>
        </form>
      </div>
    </main>
  );
}
