import { S3 } from 'aws-sdk';
import path from 'path';
import fs from 'fs';
import { convertPath2Posix, getFilePathArray } from './utils'

require('dotenv').config();

const s3 = new S3({
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    endpoint: process.env.CLOUDFLARE_ENDPOINT
})

export async function downloadRepo (prefix: string) {
    // remove if exist already
    
    // fetch file structure
    console.log('Fetching repo metadata');
    const files = await s3.listObjectsV2({
        Bucket: 'clone-vercel',
        Prefix: prefix,
    }).promise();

    if (files.Contents?.length === 0) {
        console.log('No content available.');
        return;
    }

    // create promises to download and save files
    const allPromises = files.Contents?.forEach(async ({ Key }) => {
        // create promise for each file we save so it won't block other saves.
        return new Promise((resolve) => {
            if (!Key) {
                resolve();
                return;
            }

            // prepare folder structure
            const finalOutPath = path.join(__dirname, Key);
            const outputFile = fs.createWriteStream(finalOutPath);
            const fileDirName = path.dirname(finalOutPath);
            if (!fs.existsSync(fileDirName)) 
                fs.mkdirSync(fileDirName, { recursive: true });
            
            // read and copy file content
            s3.getObject({
                Bucket: 'clone-vercel',
                Key
            })
            .createReadStream()
            .pipe(outputFile)
            .on('finish', () => resolve());
        });
    }) || [];

    console.log('Downloading in progess...');
    await Promise.all(allPromises?.filter(x => x !== undefined));
    console.log('Download complete');
}

export async function uploadBuildFiles (_id: string) {
    const files = getFilePathArray(path.join(__dirname, `clone_repo_dir/${_id}/build`));
    files.forEach(async file => {
        await _uploadFile(file, path.join(__dirname, file));
    });
}

async function _uploadFile (fileName: string, localFilePath: string) {
    const deployPath = convertPath2Posix(fileName).replace('build/', '').replace('clone_repo_dir', 'build');
    const fileContent = fs.readFileSync(localFilePath);
    const response = await s3.upload({
        Body: fileContent,
        Bucket: 'clone-vercel',
        Key: deployPath
    }).promise();
    console.log('Uploaded ', response.Key);
}
