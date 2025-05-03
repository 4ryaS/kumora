import fastify from "fastify";
import dotenv from "dotenv";
import { server_routes } from "./routes/server.routes";

dotenv.config();

const server = fastify({ logger: true });
const PORT = process.env.PORT || 9000;

server.register(server_routes, { prefix: '/api' });

server.listen({ port: Number(PORT) }, (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
    server.log.info(`API Server is running at ${address}`);
});