import { ECSClient } from "@aws-sdk/client-ecs";
import dotenv from "dotenv";

dotenv.config();

const KAFKA_SERVICE_URI = process.env.KAFKA_SERVICE_URI || '';
const KAFKA_USERNAME = process.env.KAFKA_USERNAME || '';
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD || '';
const REGION = process.env.REGION || '';
const ECS_ACCESS_KEY = process.env.ACCESS_KEY || '';
const ECS_SECRET_KEY = process.env.SECRET_KEY || '';
const CLUSTER = process.env.CLUSTER || '';
const TASK = process.env.TASK || '';
const SUBNETS = [
    process.env.SUBNET1 || '',
    process.env.SUBNET2 || '',
    process.env.SUBNET3 || ''
];
const SECURITY_GROUPS = [ process.env.SECURITY_GROUP || '' ];
const PORT = 8000; // Reverse Proxy Port

// Singleton ECS Client
let ecs_client: ECSClient | null = null;

const get_ecs_client = (): ECSClient => {
    if (!ecs_client) {
        ecs_client = new ECSClient({
            region: REGION,
            credentials: {
                accessKeyId: ECS_ACCESS_KEY,
                secretAccessKey: ECS_SECRET_KEY,
            }
        });
    }
    return ecs_client;
};

export const config = {
    kafka_service_uri: KAFKA_SERVICE_URI,
    kafka_username: KAFKA_USERNAME,
    kafka_password: KAFKA_PASSWORD, 
    region: REGION,
    ecs_access_key: ECS_ACCESS_KEY,
    ecs_secret_key: ECS_SECRET_KEY,
    cluster: CLUSTER,
    task: TASK,
    subnets: SUBNETS,
    security_groups: SECURITY_GROUPS,
    port: PORT,
    get_ecs_client,
};
