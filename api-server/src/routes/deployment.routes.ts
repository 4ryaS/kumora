import { FastifyInstance } from "fastify";
import { init_project, deploy_project } from "../controllers/deployment.controllers";

export const deployment_routes = (server: FastifyInstance) => {
    // POST /project
    server.post('/project', init_project);
    
    // POST /deploy
    server.post('/deploy', deploy_project);
}