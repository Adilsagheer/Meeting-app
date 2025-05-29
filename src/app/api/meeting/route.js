import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Meeting from "@/lib/models/Meeting";

export async function POST(request) {
  await dbConnect();
  const { code, host } = await request.json();
  const meeting = await Meeting.create({ code, host, participants: [host] });
  return NextResponse.json(meeting, { status: 201 });
}

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const meeting = await Meeting.findOne({ code });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(meeting);
}
