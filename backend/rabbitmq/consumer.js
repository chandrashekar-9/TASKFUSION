import { getChannel } from "./connection.js";
import Task from "../model/Task.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const startWorker = async () => {
    const channel = getChannel();
    if (!channel) return console.error("RabbitMQ Channel missing");

    console.log("👷 waiting for tasks...");

    channel.consume("task_queue", async (msg) => {
        if (!msg) return;

        const { taskId, prompt } = JSON.parse(msg.content.toString());
        console.log(`[Worker] Processing task: ${taskId}`);

        // Update status to processing
        await Task.findByIdAndUpdate(taskId, { status: "processing" });

        try {
            // Call Gemini API
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Update task with result
            await Task.findByIdAndUpdate(taskId, { status: "completed", result: text });
            console.log(`[Worker] Completed task: ${taskId}`);

            channel.ack(msg);
        } catch (err) {
            console.error(`[Worker] Failed task: ${taskId}`, err);
            await Task.findByIdAndUpdate(taskId, { status: "failed", error: err.message });
            channel.ack(msg); // Ack effectively removes it from queue, we don't want it to loop forever
        }
    });
};
