import { Server } from "socket.io";
import { createServer } from "http";
import { createClient } from "@clickhouse/client";
const { Kafka } = require('kafkajs');
import * as fs from 'fs';
import * as path from 'path';
import { config } from "dotenv";

config();

const CLICKHOUSE_HOST = process.env.CLICKHOUSE_HOST || '';
const CLICKHOUSE_DATABASE = process.env.CLICKHOUSE_DATABASE || '';
const CLICKHOUSE_USERNAME = process.env.CLICKHOUSE_USERNAME || '';
const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD || '';

const KAFKA_SERVICE_URI = process.env.KAFKA_SERVICE_URI || '';
const KAFKA_USERNAME = process.env.KAFKA_USERNAME || '';
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD || '';

const clickhouse_client = createClient({
    host: CLICKHOUSE_HOST,
    database: CLICKHOUSE_DATABASE,
    username: CLICKHOUSE_USERNAME,
    password: CLICKHOUSE_PASSWORD

});

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

export { io, http_server };