import fs from 'fs-extra';
import { execSync } from 'node:child_process';
import * as os from 'node:os';
import path from 'path';
import Ansi from '../AnsiCode.js';
import { CodeSignToolDownloader } from './CodeSignToolDownloader.js';

function toPowershell(args: string[]) {
    const cmd = args.join(' ').replace(/"/g, '\\"');
    const command = `powershell -Command "${cmd}"`;
    console.log(`[command] ${command}`);
    return command;
}

function help(ar: string[]) {
    ar.forEach((log) => {
        // console.log(`%c${log}`, 'color:green');
        console.log(Ansi.green, log);
    });
}

// --------------------------------------------
// 테스트용 자체 서명(Self-Signed Certificate) 만들기
// --------------------------------------------

type CertOptions = {
    // 인증서의 이름: 'SelfSigned_테스트';
    // CN=SelfSigned_테스트
    certName: string;
    // 인증서 저장소: 'Cert:\\CurrentUser\\My';
    certPath: string;
}

export function self_certificate(options: CertOptions) {
    const {certName, certPath} = options;

    if (!certName) {
        console.error('❌  인증서 이름(CN=xxx)이 지정되지 않았습니다.');
        return;
    }

    console.log(`\n# 인증서 확인중 ...`);

    // 1. 현재 사용자 인증서 저장소에서 동일 이름 인증서가 있는지 확인
    // Get-ChildItem -Path Cert:\\CurrentUser\\My | Where-Object { $_.Subject -eq 'CN=${certName}' }
    let checkCommand = toPowershell([
        `Get-ChildItem -Path '${certPath}'`,
        '|',
        `Where-Object { $_.Subject -eq 'CN=${certName}' }`
    ]);

    const result = execSync(checkCommand, {encoding: 'utf8'}).trim();
    if (result) {
        console.log(`# 이미 인증서가 존재합니다: CN=${certName}`);
        console.log('# 인증서: ', result.split('\n')[0]);
        helper();
        return false;
    }

    // 2. 없으면 새 인증서 생성
    /*
    New-SelfSignedCertificate -Type CodeSigningCert
                                  -Subject 'CN=${certName}'
                                  -CertStoreLocation Cert:\\CurrentUser\\My
    */
    let createCommand = toPowershell([
        'New-SelfSignedCertificate',
        '-Type CodeSigningCert',
        `-Subject 'CN=${certName}'`,
        `-CertStoreLocation '${certPath}'`
    ]);

    try {
        execSync(createCommand, {stdio: 'inherit'});
        console.log(`# ✅  인증서 생성 완료: CN=${certName}`);
        helper();
    } catch (error: any) {
        console.log(`❌  인증서 생성 실패: CN=${certName}`);
        console.error(error.message);
    }

    function helper() {
        help([
            '# [생성된 인증서 확인(삭제) 방법]',
            '\t- Win + R > certmgr.msc 실행',
            '\t- 인증서 관리자 창이 열립니다.',
            '\t- 왼쪽 트리에서 (개인 > 인증서) 선택',
            `\t- 방금 만든 CN=${certName} 인증서를 확인`,
            '\t* (삭제: 우클릭 삭제)'
        ]);
    }
}

// --------------------------------------------
// 인증서를 pfx로 내보내기
// --------------------------------------------

type ExportOptions = CertOptions & {
    // PFX 비밀번호
    password: string;
    // PFX 파일 저장 경로 (폴더)
    outputFolder: string;
}

export function extractPFX(options: ExportOptions) {
    const {certName, certPath, password, outputFolder} = options;
    const pfxPath = path.resolve(outputFolder, `${certName}.pfx`);

    console.log(`\n# PFX 파일 확인중 ...`);

    if (fs.existsSync(pfxPath)) {
        console.log(`✅  PFX 파일 확인: ${pfxPath}`);
        return pfxPath;
    }

    // outputFolder 폴더 없으면 생성
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, {recursive: true});
    }

    /*
    $pwd = ConvertTo-SecureString -String '비밀번호' -Force -AsPlainText;
    Export-PfxCertificate -Cert (Get-ChildItem -Path Cert:\CurrentUser\My |
                          Where-Object { $_.Subject -eq 'MyTestCert' })
                          -FilePath C:\certs\mytest.pfx -Password $pwd
    */
    let command = toPowershell([
        `$pwd = ConvertTo-SecureString -String '${password}' -Force -AsPlainText;`,
        'Export-PfxCertificate -Cert',
        `(Get-ChildItem -Path '${certPath}' | Where-Object { $_.Subject -eq 'CN=${certName}' })`,
        `-FilePath '${pfxPath}'`,
        '-Password $pwd -Force'
    ]);

    try {
        execSync(command, {stdio: 'inherit'});
        console.log(`✅  PFX 파일 내보내기 완료: ${pfxPath}`);
        return pfxPath;
    } catch (error: any) {
        console.error('❌  PFX 파일 내보내기 중 오류: ', error.message);
        return null;
    }
}

// -------------------------------------------
// 코드 서명 (Code Signing)
// -------------------------------------------

type SignOptions = {
    pfxPath: string,
    password: string,
    timeStamp?: string,
    // 코드사인을 적용할 exe, dll 파일
    target: string,
    // 코드사인을 적용한 파일 경로
    // - output 설정하지 않으면 원본에 사인
    // - 설정하면 복사본에 사인
    output?: string
}

export async function codeSign(options: SignOptions) {
    const ext = path.extname(options.target);
    if (!/\.(exe|dll|msi)$/.test(ext)) {
        console.error('❌  코드 사인 대상 파일이 exe 또는 dll 파일인지 확인하세요');
        console.error('❌  코드 사인 대상 파일: ', options.target);
        return;
    }

    // SDK 설치 상태 체크
    await checkCodeSignTool();

    // signtool로 서명하기
    await sign(options);
}

// SDK 설치 확인 경로
const WIN_11_SDK_DIR = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin';

// SDK 설치 상태 확인, (다운로드, 설치)
async function checkCodeSignTool() {
    console.log(`\n# SDK 설치 상태 확인중 ...`);

    const sdkPath = WIN_11_SDK_DIR;
    if (fs.existsSync(sdkPath)) {
        console.log('✅  Windows SDK 이미 설치됨:', sdkPath);
        return;
    }

    // ------------------
    // SDK 설치 파일 다운로드 체크 (없으면 다운로드됨)
    // ------------------

    const downloader = new CodeSignToolDownloader({
        // useCaches: true,
        // showProgress: !this.options.mute,
        // forceCaches: this.options.forceCaches,
        // destination: this.options.destination,
    });
    const sdkFile = await downloader.fetchAndExtract();
    console.log('(코드 사인) SDK: ', sdkFile);

    // ------------------
    // Windows SDK 설치
    // ------------------

    console.log('Windows SDK 설치 진행...');
    helper();

    try {
        // silent 설치 옵션
        // /quiet : 사용자 UI 없이 설치 (오래걸리므로 직접 설치하도록 함)
        // /passive : 최소 UI 모드, 진행률 바(progress bar)는 나오고, 사용자가 클릭할 필요는 없음
        // /norestart : 재부팅이 필요한 설치일때 강제 재부팅 하지 않고 표시만 해줌
        const installCmd = `'${sdkFile}' /norestart`;
        execSync(installCmd, {stdio: 'inherit'});

        /*
        // 로그 반환값 없음
        const code = await (new Promise<number | null>((resolve, reject) => {
            const child = spawn(sdkFile, [
                // '/passive',
                '/norestart'
            ], {stdio: 'inherit'});

            child.on('exit', resolve);
        }));
        console.log('Installer exited with code', code);
        */

        // 설치 재확인
        if (fs.existsSync(sdkPath)) {
            console.log('✅  Windows SDK 설치 완료');
            return;
        }

        console.error('❌  Windows SDK가 정상적으로 설치되지 않음');
    } catch (err: any) {
        console.error('❌  Windows SDK 설치 실패:', err.message);
    }
    process.exit(1);

    function helper() {
        help([
            '# Windows SDK 설치(GUI)창 안내에 따라 직접 설치하세요.',
            '\t- (필수) Windows SDK Signing Tools for Desktop Apps (코드 서명 도구 signtool.exe 제공)',
            '\t- (선택) Windows App Certification Kit (테스트용으로 앱 유효성 검사할 때 필요. 단순히 코드 서명만 한다면 생략 가능)',
            '\t- (선택) Application Verifier for Windows (런타임 동작 테스트용. 코드 서명과는 무관. 필요 없다면 해제해도 됨)',
        ]);
    }
}

// signtool로 서명
/*
signtool sign
         /f C:\certs\mytest.pfx
         /p 비밀번호
         /fd sha256 /tr http://timestamp.digicert.com
         /td sha256 dist\myapp.exe
*/
async function sign(options: SignOptions) {
    const {
        pfxPath,
        password,
        timeStamp = 'http://timestamp.digicert.com',
        // 서명할 대상 파일 (빌드 결과물 exe/msi)
        target,
        output
    } = options;

    console.log(`\n# 코드 사인 준비중 ...`);
    console.log('(코드 사인) target: ', target);
    console.log('(코드 사인) output: ', output);

    if (!pfxPath) {
        console.error('❌  pfx 파일이 없습니다.');
        return;
    }

    try {
        const signtoolPath = findSigntoolPath();

        const outputPath = output || target;
        if (output && output !== target) {
            await fs.copy(target, output, {overwrite: true});
        }

        // 경로에 공백이 있는 실행 파일은 & 연산자를 사용
        let command = toPowershell([
            `& '${signtoolPath}' sign /f '${pfxPath}'`,
            `/p '${password}' `,
            `/tr '${timeStamp}' `,
            '/td sha256',
            '/fd sha256',
            `'${outputPath}'`
        ]);

        execSync(command, {stdio: 'inherit'});
        console.log('✅  코드 사인 성공!');
        // rename
        // if (output) await fs.move(target, output, {overwrite: true});
        helper(outputPath, pfxPath);

    } catch (err: any) {
        console.error('❌  코드 사인 실패:', err.message);
        process.exit(1);
    }

    function helper(outputPath, pfxPath) {
        const fileName = path.basename(outputPath);
        const certName = path.basename(pfxPath, path.extname(pfxPath));
        help([
            '# 서명 결과 확인',
            `\t- ${fileName} 파일의 속성 > 디지털 서명 탭 > ${certName} 인증서 확인`,
            '\t- (테스트 인증서일때) 신뢰 기관에 등록되지 않은 인증서이므로 (SmartScreen/UAC)에서는 여전히 "알 수 없는 게시자"로 뜸.',
            '\t- 신뢰 기관에 등록된 인증서 사용하면 "알 수 없는 게시자" 경고가 사라짐'
        ]);

    }
}

// signtool 경로 자동 탐색하기
function findSigntoolPath(): string {
    // 환경변수로 지정되어 있으면 우선 사용
    if (process.env.SIGNTOOL_PATH) return process.env.SIGNTOOL_PATH;

    const base = WIN_11_SDK_DIR;
    if (!fs.existsSync(base)) throw new Error('Windows SDK not found. Please install Windows 10/11 SDK.');

    // bin 안에 있는 버전 목록
    const versions = fs.readdirSync(base).filter((dir) => /^\d+\.\d+\.\d+\.\d+$/.test(dir));
    if (versions.length === 0) throw new Error('No Windows SDK versions found under ' + base);

    // 가장 최신 버전 선택
    versions.sort((a, b) => (a > b ? 1 : -1));
    const latest = versions[versions.length - 1];

    const arch = handleArch();
    const signtoolPath = path.join(base, latest, arch, 'signtool.exe');
    if (!fs.existsSync(signtoolPath)) throw new Error('signtool.exe not found in ' + signtoolPath);

    return signtoolPath;
}

function handleArch() {
    const arch: string = os.arch();
    switch (arch) {
        case 'x86':
        case 'ia32':
            return 'x86';
        case 'x64':
            return 'x64';
        case 'arm64':
            return 'arm64';
        default:
            throw new Error('ERROR_UNKNOWN_PLATFORM');
    }
}
