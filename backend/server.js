import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import dotenv from "dotenv";
import { connectRabbitMQ } from "./rabbitmq/connection.js";
import { createServer } from "http";
import { Server } from "socket.io";
import logger from "./config/logger.js";
import requestLogger from "./middleware/requestLogger.js";

import { metricsMiddleware, metricsEndpoint } from "./middleware/metricsMiddleware.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all for dev
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(metricsMiddleware); // Apply before requestLogger if you want to track logger overhead too, or after. Before is usually better for total duration.
app.use(requestLogger);

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, "../frontend")));

// Redirect root to login page
app.get("/", (req, res) => {
    res.redirect("/login.html");
});

// Metrics Endpoint
// Metrics Endpoint
app.get("/metrics", (req, res, next) => {
    console.log("Accessing /metrics endpoint");
    metricsEndpoint(req, res, next);
});

app.get("/test", (req, res) => res.send("Hello World"));

connectDB();

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

// Internal Webhook for Python Worker
app.post("/internal/webhook", (req, res) => {
    const { taskId, status, result, error } = req.body;

    if (taskId) {
        console.log(`[WEBHOOK] Task ${taskId} completed. Emitting socket event.`);
        io.emit(`task_update_${taskId}`, { taskId, status, result, error });
        res.status(200).send("OK");
    } else {
        res.status(400).send("Missing taskId");
    }
});

// Socket Connection
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// SERVER
// Try to connect to RabbitMQ, but start server regardless
connectRabbitMQ().then(() => {
    logger.info("RabbitMQ initialization attempt completed.");
    httpServer.listen(5000, () => logger.info("Server running on port 5000"));
});