const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');
const dotenv = require('dotenv');

dotenv.config();

const PROJECT_ID = process.env.PROJECT_ID;
const S3_ACCESS_KEY = process.env.ACCESS_KEY;
const S3_SECRET_KEY = process.env.SECRET_KEY;

const s3_client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
    }
});

const init = async () => {
    console.log("Executing script.js");
    const output_dir_path = path.join(__dirname, 'output');

    // Run npm install and npm run build in the 'output' directory
    const process = exec(`cd ${output_dir_path} && npm install && npm run build`);

    process.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    process.stdout.on('error', (error) => {
        console.log('Error:', error.toString());
    });

    process.on('close', async () => {
        console.log('Build Complete!');
        
        // Define the path to the build directory
        const build_dir_path = path.join(__dirname, 'output', 'build');
        
        // Read the contents of the build directory
        const build_dir_contents = fs.readdirSync(build_dir_path, { recursive: true });

        for (const file_path of build_dir_contents) {
            if (fs.lstatSync(file_path).isDirectory()) continue;

            console.log('Uploading', file_path);

            const command = new PutObjectCommand({
                Bucket: 'kumora',
                Key: `__outputs/${PROJECT_ID}/${file_path}`,
                Body: fs.createReadStream(file_path),
                ContentType: mime.lookup(file_path)
            });

            await s3_client.send(command);
            console.log('Uploaded:', file_path);
        }
        console.log('Upload Successful!');
    });
}

init();