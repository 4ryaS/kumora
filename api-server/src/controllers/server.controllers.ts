import { FastifyRequest, FastifyReply } from "fastify";
import { generateSlug } from "random-word-slugs";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";

const ECS_ACCESS_KEY = process.env.ACCESS_KEY || '';
const ECS_SECRET_KEY = process.env.SECRET_KEY || '';

const ecs_client = new ECSClient({
    credentials: {
        accessKeyId: ECS_ACCESS_KEY,
        secretAccessKey: ECS_SECRET_KEY,
    }
});

const config = {
    CLUSTER: process.env.CLUSTER || '',
    TASK: process.env.TASK || '',
};

export const build_project = async (request: FastifyRequest, reply: FastifyReply) => {
    const { git_url: String } = request.body as { git_url: string };
    const project_slug = generateSlug();

    // Spin the container to build the project
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK
    });
}