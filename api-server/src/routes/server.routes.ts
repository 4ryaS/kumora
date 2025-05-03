import { FastifyInstance } from "fastify";
import { build_project } from "../controllers/server.controllers";

export const server_routes = (server: FastifyInstance) => {
    server.post('/project', build_project);
}