import { FastifyRequest, FastifyReply } from "fastify";
import { generateSlug } from "random-word-slugs";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import dotenv from "dotenv";

dotenv.config();

const ECS_ACCESS_KEY = process.env.ACCESS_KEY || '';
const ECS_SECRET_KEY = process.env.SECRET_KEY || '';
const SUBNETS = [ process.env.SUBNET1 || '', process.env.SUBNET2 || '', process.env.SUBNET3 || '' ]
const SECURITY_GROUPS = [ process.env.SECURITY_GROUP || '' ];
const PORT = 8000; // Reverse Proxy Port

const ecs_client = new ECSClient({
    region: 'ap-south-1',
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
    const { git_url } = request.body as { git_url: string };
    const project_slug = generateSlug();

    // Spin the container to build the project
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: SUBNETS,
                securityGroups: SECURITY_GROUPS
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'build-server-image',
                    environment: [
                        { name: 'GIT_REPOSITORY_URL', value: git_url },
                        { name: 'PROJECT_ID', value: project_slug },
                        { name: 'ACCESS_KEY', value: ECS_ACCESS_KEY || '' },
                        { name: 'SECRET_KEY', value: ECS_SECRET_KEY || '' },
                    ]
                }
            ]
        }
    });
    await ecs_client.send(command);
    return reply.send({
        status: 'queued',
        data: {
            project_slug,
            url: `http://${project_slug}.localhost:${PORT}`
        }
    }); 
}