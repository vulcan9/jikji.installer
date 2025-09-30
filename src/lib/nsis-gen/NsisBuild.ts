import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const DIR_VENDER = path.resolve(path.dirname(__filename), '../../../vender/');
const DIR_NSIS = path.resolve(DIR_VENDER, 'nsis-3.06.1');

export interface INsisBuildOptions {
    mute: boolean;
    output: string;
    preserveScript: boolean;
}

export async function nsisBuild(cwd: string, script: string, options: INsisBuildOptions = {
    mute: false,
    output: '',
    preserveScript: false
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

            if (!options.preserveScript) removeScript(script);
            if (code !== 0) return reject(new Error(`ERROR_EXIT_CODE code = ${code}`));

            console.log('\x1b[31m%s\x1b[0m', '# 코드 사인은 자동화되지 않았습니다.');
            console.log('\x1b[31m%s\x1b[0m', '# 설치 파일은 USB 토큰을 통해 직접 코드 서명하셔야 합니다.');
            console.log('\x1b[31m%s\x1b[0m', '# (주의. rcedit) nw.exe도 아이콘 변조로 인해 다시 서명해야 함.');
            // TODO: codeSign({});

            resolve({code, signal});
        });

        if (!options.mute) {
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
        }
    });

}

function removeScript(script: string) {
    console.log('# NSIS 스크립트 파일 삭제 (--preserveScript): ', script);
    fs.removeSync(script);
}
