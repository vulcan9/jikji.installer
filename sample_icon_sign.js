import fs from 'fs-extra';
import { fileURLToPath } from "node:url";
import path, { dirname } from 'path';
import rcedit from 'rcedit';

// dist 경로의 파일을 참조해야함
// ./dist/lib/index.js
import Ansi from './dist/AnsiCode.js';
import { codeSign } from "./dist/lib/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// node_modules 모듈 폴더 참조 경로 추가해줌
// process.mainModule.paths.unshift(path.resolve(__dirname, 'dist'));
// process.mainModule.paths.unshift(__dirname);

const config = {
    productVersion: '1.0.0',
    fileVersion: '1.0.0',
    // 'product-version': fixWindowsVersion(info.ProductVersion),
    // 'file-version': fixWindowsVersion(info.FileVersion),
    versionStrings: {
        ProductName: 'Binder App Launcher',
        CompanyName: 'tovsoft',
        FileDescription: 'Binder App Launcher',
        LegalCopyright: 'tovsoft (c) 2020',
    },
    icon: 'demo/binder_launcher.ico',
    codesign: {
        tockenName: "tovsoft co.,Ltd"
    }
};

run({
    ...config,
    input: path.resolve(__dirname, 'demo/binder_launcher.exe'),
    output: path.resolve(__dirname, 'demo/binder_launcher_signed.exe'),
});

async function run(options) {

    let input = options.input;
    let output = options.output;
    let versionStrings = options.versionStrings;
    let icon = options.icon;

    if (!input) return;
    if (!output) output = input;

    console.log(Ansi.green);
    console.log('# input 파일: ', input);
    console.log('# output 파일: ', output);
    console.log(Ansi.reset);
    
    const productVersion = fixWindowsVersion(options.ProductVersion || '1.0.0');
    const fileVersion = fixWindowsVersion(options.FileVersion || '1.0.0');
    const rc = {
        'product-version': productVersion,
        'file-version': fileVersion,
        'version-string': {
            ...versionStrings,
            ProductVersion: productVersion,
            FileVersion: fileVersion,
        }
    };
    if (icon) rc.icon = icon;

    let tempPath;
    try {
        if (input !== output) {
            await fs.copy(input, output, { overwrite: true });
            tempPath = output;
            input = output;
        }

        // -----------------------
        // 파일 속성 변경
        // -----------------------

        console.log('# 파일 속성: ', rc);
        await rcedit(input, rc);
        console.log(Ansi.yellow, `# exe 속성 변경: ${input}`, Ansi.reset);

        // -----------------------
        // 파일에 코드 서명
        // -----------------------

        if (options.codesign) {
            console.log(Ansi.yellow, '# 코드 사인 적용: ', config.codesign, Ansi.reset);
            await codeSign({
                ...options.codesign,
                // 코드사인을 적용할 exe, dll 파일
                target: input,
                // 코드사인을 적용한 파일 경로
                // - output 설정하지 않으면 원본에 사인
                // - 설정하면 복사본에 사인
                output: output
            });
        }

    } catch (err) {
        console.error(`❌  파일 '${input}'에 접근할 수 없거나 읽기 권한이 없습니다.`);
        console.error(err);
        if (tempPath) fs.removeSync(tempPath);
        process.exit(1);
    }

    console.error('\n# EXIT\n');
}

function fixWindowsVersion(version, build = 0) {
    return /^\d+\.\d+\.\d+$/.test(version)
        ? `${version}.${build}`
        : version;
}
