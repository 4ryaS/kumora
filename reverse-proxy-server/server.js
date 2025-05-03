const fastify = require('fastify')({
    logger: true
});
const http_proxy = require('http-proxy');
const dotenv = require('dotenv');

dotenv.config();

const proxy = http_proxy.createProxy();
const BASE_PATH = process.env.BASE_PATH;
const PORT = process.env.PORT || 8000;

// Catch-all route for all methods and paths
fastify.all('*', async (request, reply) => {
    const host_header = request.headers.host || '';
    const hostname = host_header.split(':')[0];
    const subdomain = hostname.split('.')[0];

    const target = `${BASE_PATH}/${subdomain}`;

    fastify.log.info(`Proxying to: ${target}`);

    return new Promise((resolve, reject) => {
        proxy.web(
            request.raw,
            reply.raw,
            {
                target: target,
                changeOrigin: true
            },
            (err) => {
                fastify.log.error(err);
                reply.send(err);
                reject(err);
            }
        );
    });
});

proxy.on('proxyReq', (proxy_req, req, res) => {
    if (req.url === '/') {
        proxy_req.path += 'index.html';
    }
});

fastify.listen({ port: PORT }, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    fastify.log.info(`Reverse Proxy Server is running at ${address}`);
});