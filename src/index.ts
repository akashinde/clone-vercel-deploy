import { commandOptions, createClient } from 'redis';
import { downloadRepo, uploadBuildFiles } from './aws';
import { buildCloneRepo } from './utils';

const subscriber = createClient();
subscriber.connect();

const publisher = createClient();
publisher.connect();

const ROOT_DIR = 'clone_repo_dir';

// main function
(async () => {
    console.log('Deploy service running');
    while (true) {
        // BRPOP returns last from right and blocks until complete
        const resp = await subscriber.brPop(
            commandOptions({ isolated: true }),
            'build-queue',
            0
        )
        // resp.element -> repoId
        if (resp?.element) {
            console.log(`Building repo: ${resp.element}`);

            await downloadRepo(`${ROOT_DIR}/${resp.element}`);
            await buildCloneRepo(`${ROOT_DIR}/${resp.element}`);
            await uploadBuildFiles(resp.element);

            console.log(`Build complete: ${resp.element}`);
            
            publisher.hSet('status', resp.element, 'build complete');

            console.log('\nWatching for next build...');
        }
    }
})()