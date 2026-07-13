import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" },
    prompt: { type: String, required: true },
    result: { type: String },
    error: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "logindata", required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Task", taskSchema);
