import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'node:url';

export * from './NsisComposer.js';
export * from './NsisDiffer.js';
export * from './Nsis7Zipper.js';

const __filename = fileURLToPath(import.meta.url);
const DIR_VENDER = path.resolve(path.dirname(__filename), '../../../vender/');
const DIR_NSIS = path.resolve(DIR_VENDER, 'nsis-3.06.1');

export interface INsisBuildOptions {
    mute: boolean;
}

export async function nsisBuild(cwd: string, script: string, options: INsisBuildOptions = {
    mute: false,
}) {
    console.log('# NSIS 스크립트 파일 : ', script);

    const args = [
        path.win32.normalize(
            path.resolve(DIR_NSIS, 'makensis.exe')
        ),
        '/NOCD',
        '/INPUTCHARSET',
        'UTF8',
        path.win32.normalize(path.resolve(script))
    ];
    if (process.platform !== 'win32') {
        args.unshift('wine');
    }

    const [command, ...rest] = args;
    const child = spawn(command, rest, {cwd});

    await new Promise((resolve, reject) => {

        child.on('error', reject);
        child.on('close', (code, signal) => {

            if (code !== 0) {
                return reject(new Error(`ERROR_EXIT_CODE code = ${code}`));
            }
            resolve({code, signal});
        });

        if (!options.mute) {
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        }

    });

}
