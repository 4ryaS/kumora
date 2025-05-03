import Valkey from "ioredis";
import { Server } from "socket.io";
import { createServer } from "http";
import { config } from "dotenv";

config();

const SERVICE_URI = process.env.SERVICE_URI || '';
const subscriber = new Valkey(SERVICE_URI);

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
        socket.emit('message:', `joined ${channel}`);
    });
    
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const init_subscription = async () => {
    console.log('Subscribed to logs!');
    subscriber.psubscribe('logs:*');
    subscriber.on('pmessage', (pattern, channel, message) => {
        io.to(channel).emit('message:', message);
    });
}

init_subscription();

export { io, http_server };