const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');
const { Kafka } = require('kafkajs');
const dotenv = require('dotenv');

dotenv.config();

const PROJECT_ID = process.env.PROJECT_ID;
const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID;

const S3_ACCESS_KEY = process.env.ACCESS_KEY;
const S3_SECRET_KEY = process.env.SECRET_KEY;

const KAFKA_SERVICE_URI = process.env.KAFKA_SERVICE_URI;
const KAFKA_USERNAME = process.env.KAFKA_USERNAME;
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD;

const s3_client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
    }
});

const kafka = new Kafka({
    clientId: `build-server-${DEPLOYMENT_ID}`,
    brokers: [KAFKA_SERVICE_URI],
    ssl: {
        ca: [fs.readFileSync(path.join(__dirname, 'kafka_ca.pem'), 'utf-8')]
    },
    sasl: {
        username: KAFKA_USERNAME,
        password: KAFKA_PASSWORD,
        mechanism: 'plain'
    },
});

const producer = kafka.producer();

const publish_log = async (log) => {
    return await producer.send({
        topic: `container-logs`,
        messages: [{ key: 'log', value: JSON.stringify({ PROJECT_ID, DEPLOYMENT_ID, log }) }]
    });
}

const init = async () => {
    await producer.connect();

    console.log("Executing script.js");
    await publish_log("Build Process Started");
    const output_dir_path = path.join(__dirname, 'output');

    // Run npm install and npm run dist in the 'output' directory
    const child_proc = exec(`cd ${output_dir_path} && npm install && npm run build`);

    child_proc.stdout.on('data', async (data) => {
        console.log(data.toString());
        await publish_log(data.toString());
    });

    child_proc.stdout.on('error', async (error) => {
        console.log('Error:', error.toString());
        await publish_log(`error: ${error.toString()}`);
    });

    child_proc.on('close', async () => {
        console.log('Build Complete!');
        await publish_log('Build Complete!');

        // Define the path to the dist directory
        const dist_dir_path = path.join(__dirname, 'output', 'dist');

        // Read the contents of the dist directory
        const dist_dir_contents = fs.readdirSync(dist_dir_path, { recursive: true });

        await publish_log(`Uploading In Progress`);
        for (const file of dist_dir_contents) {
            const file_path = path.join(dist_dir_path, file);
            if (fs.lstatSync(file_path).isDirectory()) continue;

            console.log('Uploading', file_path);
            publish_log(`Uploading: ${file}`);

            const command = new PutObjectCommand({
                Bucket: 'kumora',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(file_path),
                ContentType: mime.lookup(file_path)
            });

            await s3_client.send(command);
            console.log('Uploaded:', file_path);
            await publish_log(`Uploaded: ${file_path}`);
        }
        console.log('Upload Successful!');
        await publish_log(`Upload Successful!`);

        process.exit(0);
    });
}

init().catch((err) => {
    console.error('Fatal Error:', err);
    publish_log(`Fatal Error: ${err.message}`);
    process.exit(1); // Exit with error
});