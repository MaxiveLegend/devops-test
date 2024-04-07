const express = require('express');
const amqp = require('amqplib');

const router = express.Router();

router.get('/', async (req, res) => {
    const response = await sendRequest();
    
    res.json(response);
});

async function sendRequest() {
    const connection = await amqp.connect('amqp://rabbitmq:5672');

    const channel = await connection.createChannel();

    const replyQueue = await channel.assertQueue('response_queue');

    // Generate a unique correlation ID for this request
    const correlationId = Math.floor(Math.random() * 100000).toString();

    // Set up a consumer for the reply queue
    const consumePromise = new Promise((resolve, reject) => {
        channel.consume(replyQueue.queue, (message) => {
            if (message.properties.correlationId === correlationId) {
                resolve(message.content.toString());
            }
        }, { noAck: true });
    });

    // Send the request
    const requestData = 'Get banned users'; // Example request data
    channel.sendToQueue('queue', Buffer.from(requestData), {
        correlationId: correlationId,
        replyTo: replyQueue.queue,
    });

    console.log('Request sent: ', requestData);

    // Wait for response
    const response = await consumePromise;

    // Close the channel and connection
    await channel.close();
    await connection.close();

    console.log("finished, returning data")

    // Return the response received from rabbitmq
    return JSON.parse(response);
}

module.exports = router;