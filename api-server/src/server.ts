import fastify from "fastify";
import cors from '@fastify/cors';
import dotenv from "dotenv";
import { server_routes } from "./routes/server.routes";
import { http_server } from "./socket/server.socket";

dotenv.config();

const server = fastify({ logger: true });
const PORT = process.env.PORT || 9000;
const SOCKET_PORT = process.env.SOCKET_PORT || 9001;

server.register(cors, {
    origin: '*',
    credentials: false,
});

server.register(server_routes, { prefix: '/api' });

http_server.listen(SOCKET_PORT, () => {
    server.log.info(`Socket Server is running at ${SOCKET_PORT}`);
});

server.listen({ port: Number(PORT) }, (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
    server.log.info(`API Server is running at ${address}`);
});