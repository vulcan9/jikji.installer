import fs from 'fs';
import path, {dirname} from 'path';
import yargs from 'yargs';
import {hideBin} from "yargs/helpers";
import {fileURLToPath} from "node:url";

// dist 경로의 파일을 참조해야함
// ./dist/lib/index.js
import {codeSign, extractPFX, self_certificate} from "./dist/lib/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = yargs(hideBin(process.argv)).parseSync();

// node_modules 모듈 폴더 참조 경로 추가해줌
// process.mainModule.paths.unshift(path.resolve(__dirname, 'dist'));
// process.mainModule.paths.unshift(__dirname);

// const testFile = path.resolve(__dirname, './assets/project/dist_sample/testApp5-0.1.11 (win x86).exe');
// console.error('testFile: ', testFile);
run_codeSign();

//--------------------------
// command-line arguments 파싱
//--------------------------

// const isRun = getArgv('run') || false;

// argv에 value 없이 이름만 있어도 기본값 true를 가짐
// 예 : (--up) === (--up=true)
function getArgv(name, theowError) {
    let value = argv[name];
    if (value === undefined && theowError) {
        throw new Error('Argument --' + name + ' undefined');
    }
    if (value === undefined || value === null) return;
    if (typeof value !== 'string') return value;

    const val = value.toLowerCase();
    if (val === 'true') return true;
    if (val === 'false') return false;

    return isNaN(value) ? value : Number(value);
}

async function run_codeSign() {

    const testFile = getArgv('file', true);
    console.error('테스트 파일 : ', testFile);
    try {
        fs.accessSync(testFile, fs.constants.F_OK);
    } catch (err) {
        console.error(`❌  테스트 파일 '${testFile}'에 접근할 수 없거나 읽기 권한이 없습니다.`);
        console.error(`❌  "npm run sample" 실행하여 exe 파일을 먼저 만드세요.`);
        return;
    }

    // -----------------------
    // 테스트용 인증서 확인 (생성)
    // -----------------------

    const certOptions = {
        // 인증서의 이름
        certName: 'SelfSigned_테스트',
        // 인증서 저장소
        certPath: 'Cert:\\CurrentUser\\My'
    };
    self_certificate(certOptions);

    // -----------------------
    // 테스트용 pfx 파일 확인 (생성)
    // -----------------------

    // PFX 비밀번호
    const password = '1234';

    const pfxPath = extractPFX({
        password,
        ...certOptions,
        // PFX 파일 저장 경로
        outputFolder: path.resolve(__dirname, 'certs')
    });

    // -----------------------
    // 테스트용 파일에 코드 서명
    // -----------------------

    // testFile="./assets/project/dist_sample/testApp5-0.1.11 (win x86).exe"
    const file = path.resolve(testFile);
    const ext = path.extname(file);
    // 확장자 제외한 파일명만 추출
    const fileName = path.basename(file, ext);
    const output = path.join(path.dirname(file), `${fileName}-sined${ext}`);

    await codeSign({
        pfxPath,
        password,
        // 코드사인을 적용할 exe, dll 파일
        target: file,
        // 코드사인을 적용한 파일 경로
        // - output 설정하지 않으면 원본에 사인
        // - 설정하면 복사본에 사인
        output
    });

    // -----------------------
    // 인증서를 로컬 신뢰 루트 저장소에 설치
    // -----------------------
    
    // `SmartScreen/UAC` 경고 제거 테스트까지 하고 싶다면, 직접 루트 저장소에 등록
    // certutil -addstore "Root" C:\certs\mytest.cer

    console.error('\n# EXIT\n');
}
