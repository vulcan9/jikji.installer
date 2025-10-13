
// ANSI 코드 직접 사용
// \x1b[32m: 초록색 시작
// \x1b[31m: 빨강 시작
// \x1b[0m: 리셋
// console.error('\x1b[32m%s\x1b[0m', '내용')
    
// '\x1b[32m%s\x1b[0m'
const Ansi = Object.fromEntries(Object.entries({
    reset: '[0m',

    // Style On
    bold: '[1m',
    italic: '[3m',
    underline: '[4m',
    inverse: '[7m',
    strikethrough: '[9m',

    // Style Off
    boldOff: '[22m',
    italicOff: '[23m',
    underlineOff: '[24m',
    inverseOff: '[27m',
    strikethroughOff: '[29m',

    // Text Colors
    black: '[30m',
    red: '[31m',
    green: '[32m',
    yellow: '[33m',
    blue: '[34m',
    magenta: '[35m',
    cyan: '[36m',
    white: '[37m',
    defaultText: '[39m',

    // Background Colors
    bgBlack: '[40m',
    bgRed: '[41m',
    bgGreen: '[42m',
    bgYellow: '[43m',
    bgBlue: '[44m',
    bgMagenta: '[45m',
    bgCyan: '[46m',
    bgWhite: '[47m',
    defaultBg: '[49m',
}).map(([key, value]) => {
    // console.log(`${key}: ${value}`)
    const literal = `\x1b${value}`;
    return [key, literal];
}));
Ansi.reset = '\x1b[0m';

export default Ansi;