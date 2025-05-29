// Meeting model for MongoDB
import mongoose from "mongoose";

const MeetingSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  host: { type: String, required: true },
  participants: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  chat: [{ sender: String, message: String, timestamp: Date }],
});

export default mongoose.models.Meeting || mongoose.model("Meeting", MeetingSchema);
