import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export function buildCloneRepo (repoDir: string) {
    return new Promise((resolve) => {
        // const repoDir = 'clone_repo_dir/' + id;
        const childProcess = exec(`cd ${path.join(__dirname, repoDir)} && npm install --legacy-peer-deps && npm run build`);
        
        childProcess.stdout?.on('data', (data) => console.log('Out: ' + data));
        childProcess.stderr?.on('data', (data) => console.log('Error: ' + data));

        childProcess.on('close', (code) => resolve(''));
    })
}

// return all files for selected directory
export function getFilePathArray (folderPath: string): string[] {
    let filePathArray: string[] = [];

    const allFilesAndFolders = fs.readdirSync(folderPath);
    allFilesAndFolders.forEach(file => {
        const fullPath = path.join(folderPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            filePathArray = filePathArray.concat(getFilePathArray(fullPath));
        } else {
            filePathArray.push(path.relative(__dirname, fullPath));
        }
    });    

    return filePathArray;
}

// convert path to posix
export function convertPath2Posix (windowsPath: string): string {
    return windowsPath.replace(/^\\\\\?\\/,"").replace(/\\/g,'\/').replace(/\/\/+/g,'\/');
}