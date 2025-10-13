import { spawn } from 'child_process';
import fs from 'fs-extra';
import { fileURLToPath } from 'node:url';
import path from 'path';
import Ansi from '../../AnsiCode.js';


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
    console.log(Ansi.yellow, `# NSIS 스크립트 파일 : ${script}`, Ansi.reset);

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

            console.log(Ansi.magenta);
            console.log('# 코드 사인은 자동화되지 않았습니다.');
            console.log('# 설치 파일은 USB 토큰을 통해 직접 코드 서명하셔야 합니다.');
            console.log('# (주의. rcedit) nw.exe도 아이콘 변조로 인해 다시 서명해야 함.');
            console.log(Ansi.reset);
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
