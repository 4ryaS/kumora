const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');
const Valkey = require("ioredis");
const dotenv = require('dotenv');

dotenv.config();

const PROJECT_ID = process.env.PROJECT_ID;
const S3_ACCESS_KEY = process.env.ACCESS_KEY;
const S3_SECRET_KEY = process.env.SECRET_KEY;
const SERVICE_URI = process.env.SERVICE_URI;

const publisher = new Valkey(SERVICE_URI);

const s3_client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
    }
});

const publish_log = (log) => {
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }));
}

const init = async () => {
    console.log("Executing script.js");
    publish_log("Build Process Started");
    const output_dir_path = path.join(__dirname, 'output');

    // Run npm install and npm run dist in the 'output' directory
    const child_proc = exec(`cd ${output_dir_path} && npm install && npm run build`);

    child_proc.stdout.on('data', (data) => {
        console.log(data.toString());
        publish_log(data.toString());
    });

    child_proc.stdout.on('error', (error) => {
        console.log('Error:', error.toString());
        publish_log(`error: ${error.toString()}`);
    });

    child_proc.on('close', async () => {
        console.log('Build Complete!');
        publish_log('Build Complete!');

        // Define the path to the dist directory
        const dist_dir_path = path.join(__dirname, 'output', 'dist');

        // Read the contents of the dist directory
        const dist_dir_contents = fs.readdirSync(dist_dir_path, { recursive: true });

        publish_log(`Uploading In Progress`);
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
            publish_log(`Uploaded: ${file_path}`);
        }
        console.log('Upload Successful!');
        publish_log(`Upload Successful!`);

        process.exit(0);
    });
}

init().catch((err) => {
    console.error('Fatal Error:', err);
    publish_log(`Fatal Error: ${err.message}`);
    process.exit(1); // Exit with error
});