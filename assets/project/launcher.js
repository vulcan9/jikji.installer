
var process = window.process;
var nw = window.nw;
var APP = nw.App;

var WIN = nw.Window.get();
WIN.showDevTools();

console.error('APP.argv: ', APP.argv[0])
