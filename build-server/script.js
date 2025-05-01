const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

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
        }
    });
}