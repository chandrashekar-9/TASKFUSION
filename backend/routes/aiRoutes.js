import express from "express";
import dotenv from "dotenv";
import Task from "../model/Task.js";
import auth from "../middleware/auth.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "../config/logger.js";

dotenv.config();

const router = express.Router();

// Apply middleware to all routes
router.use(auth);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Submit Task (DIRECT & FAST)
router.post("/generate", async (req, res) => {
    logger.info("[DIRECT API] Received generate request");
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt is required" });

    try {
        // A. Generate Content Immediately
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        logger.info("[DIRECT API] Generation successful");

        // B. Store in Database (History)
        const task = await Task.create({
            prompt,
            status: "completed",
            result: text,
            userId: req.user.id
        });

        // C. Return to User Instantly
        res.json({ taskId: task._id, result: text, message: "Task completed" });

    } catch (error) {
        logger.error("Gemini API Error:", error);

        // Log failed attempt
        await Task.create({
            prompt,
            status: "failed",
            error: error.message,
            userId: req.user.id
        });

        const status = error.status || 500;
        res.status(status).json({ message: error.message || "AI Generation Failed", error: error.message });
    }
});

import { addTaskToQueue } from "../rabbitmq/producer.js";

// 1.1 Submit Task (ASYNC / QUEUE)
router.post("/generate-async", async (req, res) => {
    logger.info("[ASYNC API] Received generate request");
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt is required" });

    try {
        // Create Task in "pending" state
        const task = await Task.create({
            prompt,
            status: "pending",
            userId: req.user.id
        });

        // Add to Queue
        await addTaskToQueue({ taskId: task._id, prompt });

        logger.info(`[ASYNC API] Task ${task._id} queued`);
        res.json({ taskId: task._id, message: "Task queued for processing" });

    } catch (error) {
        logger.error("Queue Error:", error);
        res.status(500).json({ message: "Queue Failed", error: error.message });
    }
});

// 2. Poll Status
router.get("/status/:id", async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        res.json(task);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// 3. Get User History
router.get("/history", async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(10);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// 4. Clear All History
router.delete("/history", async (req, res) => {
    try {
        logger.info(`[DELETE ALL] Request by User: ${req.user.id}`);
        const result = await Task.deleteMany({ userId: req.user.id });
        logger.info(`[DELETE ALL] Deleted ${result.deletedCount} tasks.`);
        res.json({ message: "All history deleted", count: result.deletedCount });
    } catch (err) {
        logger.error(`[DELETE ALL] Error:`, err);
        res.status(500).json({ message: "Server Error" });
    }
});

// 5. Delete Task by ID
router.delete("/history/:id", async (req, res) => {
    try {
        logger.info(`[DELETE] Request for ID: ${req.params.id} by User: ${req.user.id}`);

        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

        if (!task) {
            logger.warn(`[DELETE] FAILED: Task not found or unauthorized for User ${req.user.id}. Task ID: ${req.params.id}`);
            return res.status(404).json({ message: "Task not found" });
        }

        logger.info(`[DELETE] SUCCESS: Task ${task._id} deleted.`);
        res.json({ message: "Task deleted" });
    } catch (err) {
        logger.error(`[DELETE] ERROR:`, err);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

export default router;
