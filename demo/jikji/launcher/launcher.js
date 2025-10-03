var process = window.process;
var nw = window.nw;
var APP = nw.App;

var WIN = nw.Window.get();
// WIN.showDevTools();

// 디버그 빌드: package.json 파일에서 "nwFlavor": "sdk" 설정
console.error('APP.argv: ' + APP.argv);
var filePath = findAssociation(APP.argv);


/* 
// 하나의 문자열로 전달됨: APP.argv[0]
['"C:\Users\pdi10\AppData\Local\jikji.editor.demo.setup\app\Jik-ji Editor Demo.exe" 
-launcher="C:\Program Files (x86)\tovsoft\Jik-ji Editor Demo\Jik-ji Editor Demo.exe" 
--disable-backgrounding-occluded-windows --disable-raf-throttling --disable-background-timer-throttling --disable-renderer-accessibility --disable-file-system --enable-local-file-accesses --disable-web-security --allow-file-access-from-files --allow-file-access --allow-insecure-localhost --allow-running-insecure-content --enable-webfonts-intervention-trigger --allow-running-insecure-content --ignore-certificate-errors --ignore-urlfetcher-cert-requests --allow-http-background-page --allow-http-screen-capture --js-flags="--harmony --expose-gc" --user-data-dir="C:\Users\pdi10\AppData\Local\jikji.editor.demo\User Data" --no-sandbox --no-zygote 
"C:\Users\pdi10\AppData\Local\jikji.editor.demo.setup\firstrun\3.3.77" 
"C:\Users\pdi10\Desktop\새로운 프로젝트.jik"']
*/

// launcher.js 에서 이벤트 콜백으로 호출됨
// 두번째 열려고 하는 (더블클릭) 파일 부터 전달됨
// Launcher 실행중 다시 open 호출됨 (파일 더블클릭)
APP.on('open', function (argString) {
    // Parse argString to find out what args were passed to the second instance.
    // console.error('open APP.argv: ', APP.argv)
    console.error('# App Open Event args: ' + argString);

    // 두번째 열려고 하는 (더블클릭) 파일 부터 전달됨
    // argString:
    // "C:\Program Files (x86)\tovsoft\Test App\testApp3.exe"
    // --user-data-dir="C:\Users\pdi10\AppData\Local\testApp5\User Data"
    // --no-sandbox
    // --no-zygote
    // --flag-switches-begin
    // --flag-switches-end
    // --nwapp="C:\Program Files (x86)\tovsoft\Test App"
    // --original-process-start-time=13252122332435843
    // "D:\Jik-ji Project\jikji.installer\dist\ss.ta5"

    var filePath = findAssociation(argString);
    // fileAssociation(filePath, openWorkspaceGuilde);
});

function findAssociation(argString) {
    // (2023.07.14) 배열로 전달되는 경우도 있음
    if (Array.isArray(argString)) argString = argString[0];
    if (!argString) return;
    
    var regExp = /(".+?"|[^:\s])+((\s*:\s*(".+?"|[^\s])+)|)|(".+?"|[^"\s])+/img;
    var args = argString.match(regExp) || [];
    var filePath = args[args.length - 1];
    
    console.error('# filePath: ' + filePath);
    if (filePath) alert('파일 연결: ' + filePath);
    return filePath;
}


    ////////////////////////////////////////////////////////
    // 중복 실행, file Association 호출 검사
    ////////////////////////////////////////////////////////

    // open 이벤트에 전달되는 이자와 비슷한 형식으로 구성
    // 마지막 전달된 인자가 더블클릭된 파일 경로임
    /*
    # App Open Event args:
    "C:\Users\pdi10\AppData\Local\jikji.editor.demo.setup\app\Jik-ji Editor Demo.exe" \
        -launcher="C:\Program Files (x86)\tovsoft\Jik-ji Editor Demo\Jik-ji Editor Demo.exe" \

        --disable-backgrounding-occluded-windows --disable-raf-throttling \
        ... --js-flags="--harmony --expose-gc" \
        --user-data-dir="C:\Users\pdi10\AppData\Local\jikji.editor.demo\User Data" \

        "C:\Users\pdi10\AppData\Local\jikji.editor.demo.setup\firstrun\3.3.50" \
        "C:\Users\pdi10\Desktop\Donga_모듈로드 (url parameter 전달) (1).jik"
    */

    /*
    # argv: 처음 실행시
    [
        //"C:\Users\pdi10\AppData\Local\jikji.editor.demo.setup\app\Jik-ji Editor Demo.exe",
        '-launcher="C:\Program Files (x86)\tovsoft\Jik-ji Editor Demo\Jik-ji Editor Demo.exe"'
        '"C:\Users\pdi10\Desktop\Donga_모듈로드 (url parameter 전달) (1).jik"'
    ]
    (function (){
        var argv = APP.argv;
        var argString = '"' + process.execPath + '" ' + argv.join(' ');
        callAssociation(argString);
    })();
    */
