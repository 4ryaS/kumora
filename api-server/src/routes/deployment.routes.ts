import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { init_project, deploy_project } from "../controllers/deployment.controllers";
import { get_logs } from "../controllers/logs.controllers";

const deployment_routes = (fastify: FastifyInstance, options: any) => {
    // POST /project
    fastify.post('/project', init_project);
    
    // POST /deploy
    fastify.post('/deploy', deploy_project);

    // GET /logs/:deployment_id
    fastify.get('/logs/:deployment_id', get_logs);
}

export default fp(deployment_routes);
