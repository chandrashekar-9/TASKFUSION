import { getChannel } from "./connection.js";
import { v4 as uuidv4 } from 'uuid';
import logger from "../config/logger.js";

export const addTaskToQueue = async ({ taskId, prompt }) => {
    const channel = getChannel();
    if (!channel) throw new Error("RabbitMQ channel not available");

    const queueName = "celery"; // Celery's default queue

    // Celery Message Protocol
    const message = {
        id: uuidv4(),
        task: "tasks.generate_text_task",
        args: [prompt, taskId.toString()],
        kwargs: {},
        retries: 0,
        eta: null
    };

    // Headers are required by Celery
    const properties = {
        contentType: 'application/json',
        contentEncoding: 'utf-8',
        deliveryMode: 2, // Persistent
        headers: {
            lang: 'py',
            task: 'tasks.generate_text_task',
            id: message.id,
            argsrepr: `('${prompt.slice(0, 10)}...', '${taskId}')`,
            kwargsrepr: '{}',
        }
    };

    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), properties);
    logger.info(`[x] Sent Celery task: ${message.id} for MongoTask: ${taskId}`);
};
