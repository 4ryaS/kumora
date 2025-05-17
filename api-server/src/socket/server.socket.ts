import { Server } from "socket.io";
import { createServer } from "http";
import { createClient } from "@clickhouse/client";
import { Kafka, EachBatchPayload } from "kafkajs";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

config();

const CLICKHOUSE_SERVICE_URI = process.env.CLICKHOUSE_SERVICE_URI || '';

const KAFKA_SERVICE_URI = process.env.KAFKA_SERVICE_URI || '';
const KAFKA_USERNAME = process.env.KAFKA_USERNAME || '';
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD || '';

const clickhouse_client = createClient({ url: CLICKHOUSE_SERVICE_URI });

const kafka = new Kafka({
    clientId: `api-server`,
    brokers: [KAFKA_SERVICE_URI],
    ssl: {
        ca: [fs.readFileSync(path.join(__dirname, 'kafka_ca.pem'), 'utf-8')]
    },
    sasl: {
        username: KAFKA_USERNAME,
        password: KAFKA_PASSWORD,
        mechanism: 'plain'
    },
});

const consumer = kafka.consumer({ groupId: 'api-server-logs-consumer' });

const http_server = createServer();

const io = new Server(http_server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('subscribe', (channel) => {
        socket.join(channel);
        socket.emit('message', `joined ${channel}`);
    });
    
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const init_kafka_consumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topics: ['container-logs'] });

    await consumer.run({
        autoCommit: false,
        eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsetsIfNecessary }: EachBatchPayload) => {
            const messages = batch.messages;
            console.log(`Received ${messages.length} messages`);
            
            for (const message of messages) {
                const string_message = message.value?.toString() || '';
                const { DEPLOYMENT_ID, log } = JSON.parse(string_message);
                console.log({ log, DEPLOYMENT_ID });

                const { query_id } = await clickhouse_client.insert({
                    table: 'log_events',
                    values: [{ event_id: uuidv4(), deployment_id: DEPLOYMENT_ID, log }],
                    format: 'JSONEachRow'
                });

                console.log(query_id);

                resolveOffset(message.offset);
                await commitOffsetsIfNecessary();
                await heartbeat();
            }
        }
    });
}

init_kafka_consumer();

export { io, http_server };
