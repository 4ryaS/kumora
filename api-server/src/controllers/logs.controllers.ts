import { FastifyRequest, FastifyReply } from "fastify";
import { createClient } from "@clickhouse/client";

const CLICKHOUSE_SERVICE_URI = process.env.CLICKHOUSE_SERVICE_URI || '';
const clickhouse_client = createClient({ url: CLICKHOUSE_SERVICE_URI });

export const get_logs = async (request: FastifyRequest, reply: FastifyReply) => {
    const { deployment_id } = request.params as { deployment_id: string };
    const logs = await clickhouse_client.query({
        query: `SELECT event_id, deployment_id, log, timestamp from log_events where deployment_id = {deployment_id:String}`,
        query_params: {
            deployment_id: deployment_id
        },
        format: 'JSONEachRow'
    });

    const parsed_logs = await logs.json();
    return reply.send({
        logs: parsed_logs
    });
}
