/**
 * ---------------------------------------------------------------------
 * Created by (pdi1066@naver.com) on 2022-08-10 0010.
 * ---------------------------------------------------------------------
 */

// uninstall 과정이 시작되기 전 필요한 작업을 함
// (NSIS에서 복잡한 작업을 하기가 힘들기 때문에)

var process = window.process;
var nw = window.nw;
var APP = nw.App;
var WIN = nw.Window.get();
var argv = APP.argv;

console.log('argv: ', argv);
// alert('argv: ' + argv);

// WIN.showDevTools();

setTimeout(function(){
    // alert('unstall.js 호출됨');
    // process.exit(1);
    nw.App.quit();
}, 0);

