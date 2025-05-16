import { FastifyRequest, FastifyReply } from "fastify";
import { generateSlug } from "random-word-slugs";
import { RunTaskCommand } from "@aws-sdk/client-ecs";
import { config } from "../config/ecs.config";

export const init_project = async (request: FastifyRequest, reply: FastifyReply) => {
    const { project_name, git_url } = request.body as { project_name: string; git_url: string };
}

export const deploy_project = async (request: FastifyRequest, reply: FastifyReply) => {
    const { git_url, slug } = request.body as { git_url: string; slug: string };
    const project_slug = slug ? slug : generateSlug();

    const ecs_client = config.get_ecs_client();

    // Spin the container to build the project
    const command = new RunTaskCommand({
        cluster: config.cluster,
        taskDefinition: config.task,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: config.subnets,
                securityGroups: config.security_groups
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'build-server-image',
                    environment: [
                        { name: 'GIT_REPOSITORY_URL', value: git_url },
                        { name: 'PROJECT_ID', value: project_slug },
                        { name: 'ACCESS_KEY', value: config.ecs_access_key || '' },
                        { name: 'SECRET_KEY', value: config.ecs_secret_key || '' },
                        { name: 'SERVICE_URI', value: config.service_uri || '' },
                    ]
                }
            ]
        }
    });

    // Send the command to ECS
    await ecs_client.send(command);

    return reply.send({
        status: 'queued',
        data: {
            project_slug,
            url: `http://${project_slug}.localhost:${config.port}`
        }
    });
}
