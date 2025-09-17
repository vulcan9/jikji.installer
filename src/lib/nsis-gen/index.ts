import path from 'path';
import { spawn } from 'child_process';

export * from './NsisComposer';
export * from './NsisDiffer';
export * from './Nsis7Zipper';

const DIR_ASSETS = path.resolve(path.dirname(module.filename), '../../../assets/');
const DIR_NSIS = path.resolve(DIR_ASSETS, 'nsis-3.06.1');

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
