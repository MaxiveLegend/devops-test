const { Database } = require("sqlite3")
const amqp = require('amqplib')
const DB = new Database("users.db");

console.log("Starting service...")
const CREATE_QUERY =
    `CREATE TABLE IF NOT EXISTS banned_users(
        id int PRIMARY KEY,
        name text
    );`;

const INSERT_QUERY = `INSERT INTO banned_users VALUES(1, "Max");`
const GET_QUERY = `SELECT * FROM banned_users`;

DB.serialize(() => {
    DB.run(CREATE_QUERY, (error) => {
        if (error) console.error(error);
    });

    DB.all(GET_QUERY, (error, rows) => {
        if (error) console.error(error);
        if (rows.length) return;
        DB.run(INSERT_QUERY, (error) => {
            if (error) console.error(error);
            console.log("got here")
        })
    });
});

async function consumeMessages() {
    // Connect to rabbitmq server
    const connection = await amqp.connect('amqp://rabbitmq:5672');

    // Create a channel
    const channel = await connection.createChannel();

    // Declare a queue
    await channel.assertQueue('queue', { durable: false });

    // Consume messages from the queue
    channel.consume('queue', async (message) => {
        const request = message.content.toString();
        console.log(`Received request: ${request}`);

        DB.all(GET_QUERY, (error, rows) => {
            if (error) console.error(error);
    
            // Send back the response (banned users)
            channel.sendToQueue('response_queue', Buffer.from(JSON.stringify(rows)), {
                correlationId: message.properties.correlationId,
            });

            // Acknowledge that the message has been processed
            channel.ack(message);
        });
    });
}

consumeMessages();