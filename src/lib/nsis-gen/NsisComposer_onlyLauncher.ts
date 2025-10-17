/* tslint:disable:no-trailing-whitespace */

import { win32 } from 'path';
import Ansi from '../../AnsiCode.js';
import { INsisComposerOptions, NsisComposer } from './NsisComposer.js';

export class NsisComposer_onlyLauncher extends NsisComposer {

    constructor(protected options: INsisComposerOptions) {
        super(options);
    }

    // Program Files/ App 설치
    protected async installAppLauncher(): Promise<string> {
        // 제외 목록 (nw 폴더는 child app으로 설치)
        let excludes: string[] = [
            this.options.nwFolderName
        ];
        if (this.options.resource) {
            excludes = excludes.concat(this.options.resource.map(p => p.src));
        }
        const EXCLUDE_LIST = excludes.map(p => `/x "${win32.normalize(p)}"`).join(' ');

        console.log(Ansi.green);
        console.log('onlyLauncher: ', this.options.onlyLauncher);
        console.log('# App 제외 목록: \n', EXCLUDE_LIST, '\n');
        console.log(Ansi.reset);
        console.log('\n');
        return `
;----------------------------
; Launcher App 설치
;----------------------------

; 서브디렉토리에도 파일 설치를 원할경우 아래와 같은 방법을 사용한다.
;SetOutPath $INSTDIR\\assets
;File .\\assets\\*.*

; 설치 파일. resource는 별도로 설치 한다.
!macro Install_App_Launcher
    SetOutPath "$INSTDIR"
    ;File /nonfatal /a /r .\\*.*
    File /nonfatal /a /r ${EXCLUDE_LIST} .\\*.*
!macroend

Function un.Install_App_Launcher
    
    ; install 폴더 지우기.
    ; 해당 디렉터리에 설치한 파일 이외에 다른 파일이 있다면 해당 디렉터리는 삭제되지 않을 것임
    RMDir /r "$INSTDIR"

    ; 파일이 아직 남아 있으면..
    IfFileExists $INSTDIR\\*.* 0 skipDelete
        
        ; 삭제 확인 메세지
        ;MessageBox MB_ICONINFORMATION|MB_YESNO $(TXT_DELETE_ALL_FILES) IDNO skipDelete
        
        RMDir /r "$INSTDIR"
        RMDir /REBOOTOK "$INSTDIR"
    skipDelete:

    ; nw 실행시 생성되는 chrome app 폴더 삭제
    StrCmp "\${CHROME_APP_PATH}" "" ok
        ;MessageBox MB_OK "삭제: \${CHROME_APP_PATH}"
        RMDir /r "\${CHROME_APP_PATH}"
    ok:
FunctionEnd
        `;
    }
    
    // AppData/Local/ child App 설치
    protected async installChildApp(): Promise<string> {
        const nwFolderName = this.options.nwFolderName;
        const childApp = this.options.childApp;
        if (!childApp || !childApp.dest) {
            return `
!macro Install_App_Child
!macroend
Function un.Install_App_Child
FunctionEnd
            `;
        }

        const chromeLauncherPath = childApp.name ? '$LOCALAPPDATA\\' + childApp.name : '';
        const nwRoot = childApp.dest ? win32.normalize(childApp.dest) : '';
        
        console.log('\n');
        console.log(Ansi.yellow);
        
        console.log(`* EXE_FILE_NAME: ${this.options.exeName}`);
        console.log(`* APP ID: ${this.options.appId}`);
        console.log(`* CHROME_APP_PATH: ${this.chromeAppPath}`);
        console.log(`* CHROME_LAUNCHER_PATH: ${chromeLauncherPath}`);
        console.log('');

        console.log(`* APP_PATH: ${this.appPath}`);
        console.log(`* NW_PATH: ${nwRoot}`);
        console.log(Ansi.reset);
        console.log('\n');

        const excludes = childApp.excludes || [];
        const moves: string[] = childApp.moves || [];

        // /x "assets" /x "package.json"
        // const list: string[] = excludes.concat(moves);
        // const childAppExcludesString = list.map(p => (`/x "${ win32.normalize(p) }"`)).join(' ');

        // childApp 에만 있는 리소스
        // File /nonfatal /a /r "uninstall"
        const MOVE_LIST = (() => {
            return childApp.moves.map((p) => {
                const src = win32.normalize((p));
                const dest = win32.normalize((childApp.dest + '/' + p));
                return `
        ;MessageBox MB_OK "moves 목록: $INSTDIR\\${src}"
        ;File /nonfatal /a /r "${src}"
        ;CopyFiles /SILENT "$INSTDIR\\${src}\\*.*" "${dest}"
        Rename "$INSTDIR\\${src}" "${dest}"
            `;
            }).join('');
        })();

        // 제외 처리는 폴더 복사 후 삭제 방식으로 (제외 옵션 없음)
        const EXCLUDE_LIST = (() => {
            const list: string[] = excludes.concat(moves);
            return list.map(p => {
                // (윈도우 Vista 이후) NSIS의 nsExec 또는 ExecWait로 시스템 명령을 호출
                // ; /E → 하위폴더까지 복사
                // ; /XD → 특정 폴더 제외
                // ; /XF → 특정 파일 제외
                // nsExec::Exec 'robocopy "$INSTDIR" "$9" *.* /E /XD logs temp /XF debug.txt config.dev.json'
                return (p.includes('.') ? '/XF' : '/XD') + ` "${win32.normalize(p)}"`;
            }).join(' ');
        })();

        console.log(Ansi.green);
        console.log('# Child App 리소스 이동: \n', MOVE_LIST);
        console.log('# Child App 제외 목록: \n', EXCLUDE_LIST, '\n');
        console.log(Ansi.reset);
        console.log('\n');

        return `
;----------------------------
; Child App 복사
;----------------------------

!define CHROME_LAUNCHER_PATH            "${chromeLauncherPath}"

# 서브 App 리소스 (nwJS App) - 런처가 실행할 app
!define NW_PATH                  "${nwRoot}"

; Program Files 폴더에서 nwJS App을 런처로 사용하고자 할 경우 권한 문제가 발생한다.
; 설치된 $INSTDIR 폴더는 런처 app 으로 사용하고
; nwJS 실행파일 리소스를 권한이 필요없는 폴더로 복사하여 실행 한다.
; 하나의 nwJS 리소스로 런처 및 app으로 구동 시킬수 없다.
!macro Install_App_Child

    StrCmp "\${NW_PATH}" "" skipChildApp
        StrCpy $9 "\${NW_PATH}"
        RMDir /r $9

        ; child app 설치 위치 
        SetOutPath $9

        # nwJS 설치
        File /nonfatal /a /r ${nwFolderName}\\*.*
        
        # moves 목록 따로 처리
        # File /nonfatal /a /r "uninstall"
        ${MOVE_LIST}
        
        # 제외 목록이 적용된 childApp 복사
        nsExec::ExecToStack 'robocopy "$INSTDIR" "$9" *.* /E ${EXCLUDE_LIST}'

    skipChildApp:
!macroend

Function un.Install_App_Child
    ; childApp 폴더 삭제
    RMDir /r "\${NW_PATH}"
    
    ; nw 실행시 생성되는 chrome app 폴더 삭제
    StrCmp "\${CHROME_LAUNCHER_PATH}" "" skipChildApp
        ;MessageBox MB_OK "삭제: \${CHROME_LAUNCHER_PATH}"
        RMDir /r "\${CHROME_LAUNCHER_PATH}"
    skipChildApp:
FunctionEnd
        `;
    }

}


