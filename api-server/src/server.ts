import fastify from "fastify";
import dotenv from "dotenv";

dotenv.config();

const server = fastify({ logger: true });
const PORT = process.env.PORT || 9000;

server.listen({ port: Number(PORT) }, (err, address) => {
    if (err) {
        server.log.error(err);
        process.exit(1);
    }
    server.log.info(`API Server is running at ${address}`);
});