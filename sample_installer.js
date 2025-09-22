import path, {dirname} from 'path';
import {exec} from 'child_process';
import yargs from 'yargs';
import {hideBin} from "yargs/helpers";
import {fileURLToPath} from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = yargs(hideBin(process.argv)).parseSync();

// node_modules 모듈 폴더 참조 경로 추가해줌
// process.mainModule.paths.unshift(path.resolve(__dirname, 'dist'));
// process.mainModule.paths.unshift(__dirname);
// console.error('__dirname: ', __dirname);

npmPackage();

function npmPackage(done) {
    //const folder = './assets/project';
    const folder = getArgv('dir', true);
    const isRun = getArgv('run') || false;

    var command, args;
    if (isRun) {
        command = path.resolve(__dirname, './dist/bin/run');
        args = ' --x86';
    } else {
        command = path.resolve(__dirname, './dist/bin/build');
        args = ' --tasks win-x86';
    }
    args = args + ' --mirror https://dl.nwjs.io/ .';
    command = 'node "' + command + '"' + args;

    // cd assets/project && npm pack
    // "cd assets/project" 명령 대신 cwd를 지정함
    const option = {
        shell: true,
        cwd: folder
    };
    execute(command, option, function () {
        console.log('# 패키지 완료');
        console.log('');
        if (done) done();
    });
}

//--------------------------
// command-line arguments 파싱
//--------------------------

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

//--------------------------
// exec
//--------------------------
/*
// "cd assets/project" 명령 대신 cwd를 지정함
execute('dir', {
  shell: true,
  cwd: folder
});
*/
function execute(command, options, cb) {
    console.log('');
    console.log('# ', command);
    options = options || {};
    if (options.shell === undefined) options.shell = true;

    // 실시간 로그 표시
    var child = exec(command, options, function (error, stdout, stderr) {
        if (error !== null) console.log('exec error: ', error);
        if (stdout) console.log('stdout: ' + stdout);
        if (stderr) console.log('stderr: ', stderr);
        if (cb) cb();
    });
    // child.stdout.setEncoding('utf8');
    // child.stdout.pipe(process.stdout);

    child.on('close', function (code) {
        console.log('# child process 닫기 ' + code);
    });
}

//--------------------------
// useCodePage - exec 출력창에서 한글깨짐 방지
//--------------------------

/*
// Webstorm 터미널 창에서 stdout 결과 한끌깨짐 현상 방지
// window code page : 949 (한글깨짐)
// code page : 65001(utf-8로 변경하여 한글깨짐 방지)
// 터미널 종료하면 다시 원상태로 돌아감. (유지 할려면 레지스트리 변경 해야함)
function useCodePage(cb) {
    if (cb) {
        _run(cb);
    } else {
        return util.promise(_run);
    }

    function _run(done) {
        exec('chcp 65001', {}, function () {
            done();
        });
    }
}
*/
