import { FastifyRequest, FastifyReply } from "fastify";
import { generateSlug } from "random-word-slugs";
import { RunTaskCommand } from "@aws-sdk/client-ecs";
import { config } from "../config/ecs.config";
import { project_schema } from "../schemas/project.schemas";
import { PrismaClient } from "@prisma/client";

const prisma_client = new PrismaClient({});

export const init_project = async (request: FastifyRequest, reply: FastifyReply) => {
    const safe_parsed_result = project_schema.safeParse(request.body as { project_name: string; git_url: string });

    if (safe_parsed_result.error) {
        return reply.status(400).send({
            error: safe_parsed_result.error.errors
        });
    }
    
    const { project_name, git_url } = safe_parsed_result.data;

    const project = await prisma_client.project.create({
        data: {
            name: project_name,
            git_url: git_url,
            subdomain: generateSlug()
        }
    });

    return reply.status(200).send({
        status: 'success',
        data: {
            project,
        }
    });
}

export const deploy_project = async (request: FastifyRequest, reply: FastifyReply) => {
    const { project_id } = request.body as { project_id: string; };

    const project = await prisma_client.project.findUnique({
        where: {
            id: project_id
        }
    });

    if (!project) {
        return reply.status(404).send({
            error: 'Project Not Found!'
        });
    }

    // Check for exisiting deployment
    const existing_deployment = await prisma_client.deployment.findFirst({
        where: {
            project_id: project_id,
            status: {
                in: ['QUEUED', 'IN_PROGRESS']
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    if (existing_deployment) {
        return reply.status(409).send({
            error: 'A deployment is already in progress for this project.',
            data: {
                deployment_id: existing_deployment.id,
                status: existing_deployment.status
            }
        });
    }

    // No running deployment, proceed to create a new one
    const deployment = await prisma_client.deployment.create({
        data: {
            project: { connect: { id: project_id } },
            status: 'QUEUED'
        }
    });

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
                        { name: 'GIT_REPOSITORY_URL', value: project.git_url },
                        { name: 'PROJECT_ID', value: project.id },
                        { name: 'DEPLOYMENT_ID', value: deployment.id },
                        { name: 'ACCESS_KEY', value: config.ecs_access_key || '' },
                        { name: 'SECRET_KEY', value: config.ecs_secret_key || '' },
                        { name: 'KAFKA_SERVICE_URI', value: config.kafka_service_uri || '' },
                        { name: 'KAFKA_USERNAME', value: config.kafka_username || '' },
                        { name: 'KAFKA_PASSWORD', value: config.kafka_password || '' },
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
            project_id,
            url: `http://${project_id}.localhost:${config.port}`
        }
    });
}
