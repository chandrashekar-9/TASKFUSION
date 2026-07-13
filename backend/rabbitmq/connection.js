import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";

let connection = null;
let channel = null;

export const connectRabbitMQ = async () => {
    if (connection) return { connection, channel };

    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertQueue("task_queue", { durable: true });

        console.log("✅ Connected to RabbitMQ");
        return { connection, channel };
    } catch (err) {
        console.error("❌ RabbitMQ Connection Error:", err.message);
        // Do not exit process, allow server to run without RabbitMQ
        return null;
    }
};

export const getChannel = () => channel;
