const fastify = require('fastify')({
    logger: true
});

const PORT = process.env.PORT || 8000;

fastify.listen({ port: PORT }, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    fastify.log.info(`Reverse Proxy Server is running at ${address}`);
});