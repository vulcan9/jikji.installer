var process = window.process;
var nw = window.nw;
var APP = nw.App;

var WIN = nw.Window.get();
// WIN.showDevTools();

console.error('APP.argv: ', APP.argv[0])

APP.on('open', function (argString) {
    // Parse argString to find out what args were passed to the second instance.
    // console.error('open APP.argv: ', APP.argv)
    console.error('open argString: ', argString)

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
    // "D:\Jik-ji Project\jikji.installer\dist_sample\ss.ta5"

    var regExp = /(".+?"|[^:\s])+((\s*:\s*(".+?"|[^\s])+)|)|(".+?"|[^"\s])+/img;
    var args = argString.match(regExp) || [];
    var filePath = args[args.length - 1];
    console.error('filePath: ', filePath);
});
