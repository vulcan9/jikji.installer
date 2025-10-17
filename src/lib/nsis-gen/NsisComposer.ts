/* tslint:disable:no-trailing-whitespace */

import { dirname, resolve, win32 } from 'path';

import { fileURLToPath } from 'node:url';
import { fixWindowsVersion } from '../util/index.js';

export interface INsisComposerOptions {

    // Basic.
    productName: string;
    companyName: string;
    description: string;
    version: string;
    copyright: string;
    publisher?: string;

    theme: string;
    license: string;
    web: string;

    exeName: string;
    programGroupName: string;

    // Compression.
    compression: 'zlib' | 'bzip2' | 'lzma';
    solid: boolean;

    languages: string[];
    installDirectory: string;
    // VC++ Redistributable 설치 체크 과정을 추가할지 여부
    install_visualCpp: boolean;
    // child App을 호출하는 launcher만 Program Files 폴더에 설치
    onlyLauncher: boolean;

    // Output.
    output: string;

    // 압축 파일 풀기 기능 지원
    resource?: { src: string, dest: string }[]; // [{src: string, dest: string};]
    uninstall?: string;
    associate?: any[];
    // App 복사 기능 지원
    childApp?: {
        name: string,
        // nw.exe rename 할때 사용할 이름(.exe 생략한 이름 부분)
        nwName: string,
        excludes?: string[], moves: string[],
        dest: string,
        uninstallApp?: string
        uninstallAppFolder?: string
    };

    appId: string;
    setupFolderName: string;
    // nwFiles: string[];
    
    // nwJS 리소스 복사할 폴더명
    nwFolderName: string;
}

/***********************************************

 NSIS : https://nsis.sourceforge.io/Docs/
 https://gist.github.com/SeonHyungJo/18c68d71925f6ccadce6fc75750b7fe0

 # : 프리프로세서 주석.
 NSIS 컴파일러의 프리프로세서 단계에서 무시됨.
 보통 !define, !include 같은 ! 명령어와 같이 쓰일 때 문맥상 맞음.

 ; : 일반 주석.
 NSIS 실행 스크립트 단계에서 무시됨.
 Section, Exec, File 같은 명령들과 함께 쓰일 때 문맥상 맞음.

 ! : 프리프로세서(Preprocessor) 명령어. 컴파일 시점에 처리.
 최종 설치 실행 파일(setup.exe)이 만들어지기 전에 NSIS 컴파일러가 읽어서 처리

 ************************************************/

export class NsisComposer {

    protected fixedVersion: string = '';

    // (사용 안함)
    // 프로그램 링크를 그룹화 하기 위해 appID 설정
    // 새 APP_ID (Jump List)를 생성하여 강제 갱신
    protected appUserModelID: string;

    // 크롬 App 생성 폴더 경로
    protected chromeAppPath: string;
    // child app 폴더 전체 경로
    protected appPath: string;

    constructor(protected options: INsisComposerOptions) {

        this.options.productName = this.options.productName || 'NO_PRODUCT_NAME';
        this.options.companyName = this.options.companyName || 'NO_COMPANY_NAME';
        this.options.description = this.options.description || 'NO_DESCRIPTION';
        this.options.version = this.options.version || 'NO_PRODUCT_VERSION';
        this.options.copyright = this.options.copyright || 'NO_COPYRIGHT';
        this.options.publisher = this.options.publisher || 'NO_PUBLISH';

        this.options.exeName = this.options.exeName || 'NO_FILE_NAME';
        this.options.programGroupName = this.options.programGroupName || 'NO_PROGRAM_GROUP';

        this.options.compression = this.options.compression || 'lzma';
        this.options.solid = Boolean(this.options.solid);
        this.options.languages = this.options.languages && this.options.languages.length > 0 ? this.options.languages : ['English'];

        this.fixedVersion = fixWindowsVersion(this.options.version);

        // process.stdout.write('this.options 설정값: \n' + JSON.stringify(this.options.childApp, null, 4) + '\n');
        
        // 프로그램 링크를 그룹화 하기 위해 appID 설정
        this.appUserModelID = this.options.childApp ? (this.options.childApp.nwName || this.options.childApp.name) : this.options.exeName;

        // child app id 폴더 경로
        this.chromeAppPath = win32.normalize(`$LOCALAPPDATA/${this.options.appId}`);
        // child app id + '.setup' 폴더 경로
        this.appPath = win32.normalize(`$LOCALAPPDATA/${this.options.setupFolderName}`);
    }

    public async make(): Promise<string> {

        /*
        ; SetShellVarContext (기본값 current) 따라 변하는 폴더 위치
        ; $APPDATA (current:AppData/Roaming, all:ProgramData)
        ; $LOCALAPPDATA (current: AppData/Local, all:ProgramData)

        ;디버깅
        ;MessageBox MB_OK "${OTHER_UNINSTALL_DEST}"
        */
        return `

# child app 폴더 경로 (~.setup)
Var /GLOBAL APP_PATH

;####################################################################################################################
; define Settings
;####################################################################################################################

# setup 파일 경로
!define OUTFILE_NAME              "${win32.normalize(resolve(this.options.output))}"

; nw 실행시 생성되는 chrome app 폴더 경로
!define CHROME_APP_PATH           "${this.chromeAppPath}"

;----------------------------------------------------------
; 배포 프로그램 이름, 버전 및 기타 변수
;----------------------------------------------------------
!define PRODUCT_NAME              "${this.options.productName}"
!define PRODUCT_VERSION           "${this.options.version}"
!define PRODUCT_PUBLISHER         "${this.options.publisher}"
!define PRODUCT_COMPANY           "${this.options.companyName}"
!define PRODUCT_WEBSITE           "${this.options.web}"

!define EXE_FILE_DIR             "$PROGRAMFILES\\\${PRODUCT_COMPANY}\\\${PRODUCT_NAME}"
!define EXE_FILE_NAME             "${this.options.exeName}"
!define EXE_FILE_FULL_NAME        "${this.options.exeName}.exe"
!define PROGRAM_GROUP_NAME        "${this.options.programGroupName}"               ; 프로그램 그룹 이름
!define UNINSTALL_NAME            "uninstall.exe"                                    ; 언인스톨러 이름

;----------------------------------------------------------
; 레지스트리 키 지정
;----------------------------------------------------------

#admin
!define REG_ROOT_KEY              "HKLM"
!define REG_UNROOT_KEY            "HKLM"

#user
#!define REG_ROOT_KEY              "HKCU"
#!define REG_UNROOT_KEY            "HKCU"

!define REG_APPDIR_KEY            "Software\\Microsoft\\Windows\\CurrentVersion\\App Path\\\${EXE_FILE_FULL_NAME}"
!define REG_UNINST_KEY            "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\\${PRODUCT_NAME}"

;##########################################################
; NSIS Settings
;##########################################################

${await this.NSISSettings()}

;##########################################################
; MUI Settings
;##########################################################

${await this.MUISettings()}

${await this.MUIPages()}

;----------------------------------------------------------
; Language Files
;----------------------------------------------------------
!insertmacro MUI_LANGUAGE "Korean"                                 ; 언어 설정.

;####################################################################################################################
; SECTION
;####################################################################################################################

# 한글 특화 부분 - 이름에 따라서 바꿔주자.
!define EUL_RUL                             "를"                   ; 을/를 문제 해결을 위한 define. $PRODUCT 에 따라 바뀐다.
!define I_KA                                "이"                   ; 이/가 문제 해결을 위한 define. $PRODUCT 에 따라 바뀐다.

# 언어 설정
LangString TXT_VERSION_UNINSTALL            \${LANG_KOREAN}        "이전 버전을 제거하는 중입니다. 잠시 기다려 주세요."
LangString TXT_UNINSTALL                    \${LANG_KOREAN}        "프로그램을 제거하는 중입니다. 잠시 기다려 주세요."
LangString TXT_SECTION_UNINSTALL            \${LANG_KOREAN}        "이전 버전 삭제"
LangString TXT_EXTRACTING                   \${LANG_KOREAN}        "설치하는 동안 잠시 기다려 주세요."
LangString TXT_SECTION_COPY                 \${LANG_KOREAN}        "프로그램 설치"
LangString TXT_SECTION_COPY_RESOURCE        \${LANG_KOREAN}        "구성 요소 설치"
LangString TXT_SECTION_COPY_VISUAL_CPP      \${LANG_KOREAN}        "Visual C++ Redistributable 설치 확인"
LangString TXT_SECTION_CREATEDESKTOPICON    \${LANG_KOREAN}        "바탕 화면에 단축 아이콘 생성"
LangString TXT_SECTION_CREATEQUICKLAUNCH    \${LANG_KOREAN}        "빠른 실행 단축 아이콘 생성"
LangString TXT_SECTION_CREATSTARTMENU       \${LANG_KOREAN}        "시작 메뉴 단축 아이콘 생성"

LangString TXT_PROGRAM_GROUP_NAME           \${LANG_KOREAN}        "\${PROGRAM_GROUP_NAME}"

LangString TXT_DELETE_ALL_FILES             \${LANG_KOREAN}        \\
"프로그램이 설치된후 생성된 파일등이 설치 폴더($INSTDIR)에 일부 남아 있습니다.\\
$\\r$\\n$\\r$\\n프로그램이 설치 되었던 폴더를 완전히 삭제하시겠습니까?"

LangString TXT_STILL_RUN_EXIT_PROGRAM       \${LANG_KOREAN}        \\
"\${PRODUCT_NAME} 프로그램이 실행중 입니다.\\
$\\r$\\n$\\r$\\n프로그램을 강제 종료하시겠습니까?"

LangString TXT_INSTALL_CANCEL               \${LANG_KOREAN}        \\
"프로그램 설치를 종료합니다.\\
$\\r$\\n$\\r$\\n\${PRODUCT_NAME} 프로그램 종료 후 다시 시도 바랍니다."

LangString TXT_UNINSTALL_CANCEL             \${LANG_KOREAN}        \\
"프로그램 제거를 종료합니다.\\
$\\r$\\n$\\r$\\n\${PRODUCT_NAME} 프로그램 종료 후 다시 시도 바랍니다."

# Section 이름 : [/o] [([!]|[-])section_name] [section index output]
; (!) 설치 구성요소 박스에서 BOLD 표시됨
; (-) 감추기
; (/o) 체크 해지 상태

;##########################################################
; 기능 정의
;##########################################################

${await this.checkAndCloseApp()}

${await this.fileAssociation()}

;##########################################################
; 인스톨
;##########################################################

${await this.prevUninstall()}

;----------------------------------------------------------
; 파일 설치, 제거
;----------------------------------------------------------

${await this.installAppLauncher()}
${await this.installResource()}
${await this.installChildApp()}
${await this.childAppProcess()}

;----------------------------------------------------------
# 설치 : 기본 파일 복사
;----------------------------------------------------------

Section !$(TXT_SECTION_COPY)
    ; 설치 섹션 "RO" 는 Read Only (해제 불가)
    SectionIn RO

    DetailPrint "프로그램을 $(TXT_EXTRACTING)"
    SetDetailsPrint listonly

    ; 설치 파일 복사 (런처)
    !insertmacro Install_App_Launcher

    ; 런처 - app 호출 구조인 경우 sub app을 복사해둠
    !insertmacro Install_App_Child
    !insertmacro ChildAppProcess
    
    SetDetailsPrint both
    
    ;-------------
    ; 실행파일 등록
    ; registry - installation path
    WriteRegStr \${REG_ROOT_KEY} "\${REG_APPDIR_KEY}" "Install_Dir"  "$INSTDIR"
    WriteRegStr \${REG_ROOT_KEY} "\${REG_APPDIR_KEY}" ""             "$INSTDIR\\\${EXE_FILE_FULL_NAME}"

    ;-------------
    ; registry - uninstall info
    WriteRegStr \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}" "DisplayName"           "$(^Name)"
    WriteRegStr \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}" "UninstallString"       "$INSTDIR\\\${UNINSTALL_NAME}"
    WriteRegStr \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}" "DisplayIcon"           "$INSTDIR\\\${EXE_FILE_FULL_NAME}"

    WriteRegStr \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}" "DisplayVersion"        "\${PRODUCT_VERSION}"
    WriteRegStr \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}" "URLInfoAbout"          "\${PRODUCT_WEBSITE}"
    WriteRegStr \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}" "Publisher"             "\${PRODUCT_PUBLISHER}"

    ; create Uninstaller
    WriteUninstaller "$INSTDIR\\\${UNINSTALL_NAME}"

    Call FileAssociate
SectionEnd

;----------------------------------------------------------
# 설치 : 리소스 파일 복사
;----------------------------------------------------------

; 버전별 리소스 폴더로 압축 해지하기
Section $(TXT_SECTION_COPY_RESOURCE)
    ; 설치 섹션 "RO" 는 Read Only (해제 불가)
    SectionIn RO

    DetailPrint "구성요소를 $(TXT_EXTRACTING)"
    SetDetailsPrint listonly
    
    !insertmacro Install_Resource
    
    SetDetailsPrint both
    
SectionEnd

;##########################################################
; 설치 (기타)
;##########################################################

${await this.install_Visual_Cpp_Redistributable()}

${await this.createProgramGroup()}

${await this.createDesktopIcon()}

${await this.createQuickIcon()}

;##########################################################
; 언인스톨
;##########################################################

;----------------------------------------------------------
; 언인스톨
;----------------------------------------------------------

Section Uninstall

    DetailPrint $(TXT_UNINSTALL)
    SetDetailsPrint listonly
    
    ; uninstall 파일 지우기.
    Delete "$INSTDIR\\\${UNINSTALL_NAME}"

    ; Child App에서 필요한 uninstall 과정 진행
    Call un.ChildAppProcess
    
    ; 설치 파일 제거
    Call un.Install_App_Launcher
    Call un.Install_App_Child
    Call un.Install_Resource

    SetDetailsPrint both
    
    ;-------------
    ; 등록 정보 지우기
    DeleteRegKey \${REG_ROOT_KEY} "\${REG_APPDIR_KEY}"
    DeleteRegKey \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}"

    ${await this.deleteIcons()}
    ${await this.deleteProgramGroup()}

    Call un.FileAssociate
SectionEnd

;####################################################################################################################
; 유틸 함수
;####################################################################################################################

Function .onInit
    ; 전역 변수 초기화
    StrCpy $APP_PATH "${this.appPath}"

    ; 기존에 실행중인 프로그램 종료.
    Call CheckAndCloseApp
FunctionEnd

;설치실패시
Function .onInstFailed
    ; 기존에 실행중인 프로그램 종료.
    Call CheckAndCloseApp

    Delete "$INSTDIR\\*.*"
    RMDir /r "$INSTDIR"

    SetAutoClose true
FunctionEnd

Function un.onInit
    ; 기존에 실행중인 프로그램 종료.
    Call un.CheckAndCloseApp
FunctionEnd

;----------------------------------------------------------
; END
        `;
    }

    //////////////////////////////////////////////////////////////////
    // MUI, Page
    //////////////////////////////////////////////////////////////////

    protected async NSISSettings(): Promise<string> {
        return `
Unicode                     true
SetCompress                 off                                     ; 압축 여부(auto|force|off) ( off 로 놓으면 테스트 하기 편하다 )
#SetCompressor              lzma                                    ; 압축방식 (zlib|bzip2|lzma)
SetCompressor               ${this.options.solid ? '/SOLID' : ''} ${this.options.compression}

ShowInstDetails             hide                                      ; 설치내용 자세히 보기 여부(hide|show|nevershow)
ShowUninstDetails           hide                                      ; 언인스톨 자세히 보기 여부(hide|show|nevershow)
SetOverwrite                on                                        ; 파일 복사시 기본적으로 덮어쓰기 한다(디폴트) (on|off|try|ifnewer|lastused)

AutoCloseWindow             true                                      ; 완료후 설치프로그램 자동 닫기
AllowRootDirInstall         false                                     ; 루트 폴더에 설치하지 못하도록 한다.
CRCCheck                    on                                        ; 시작시 CRC 검사를 한다. (디폴트) (on|off|force)
XPStyle                     on                                        ; xp manifest 사용 여부

Name                        "\${PRODUCT_NAME}"                        ; 기본 이름
OutFile                     "\${OUTFILE_NAME}"                        ; 출력 파일
InstallDir                  "\${EXE_FILE_DIR}"                        ; 설치 폴더
InstallDirRegKey            \${REG_ROOT_KEY} "\${REG_APPDIR_KEY}" "Install_Dir"

;----------------------------------------------------------
; Request application privileges for Windows Vista
;----------------------------------------------------------

RequestExecutionLevel admin
# RequestExecutionLevel user
        `;
    }

    // MUI (NSIS Modern User Interface)
    // https://nsis.sourceforge.io/Docs/Modern%20UI/Readme.html
    protected async MUISettings(): Promise<string> {
        return `
;----------------------------------------------------------
; MUI 화면 설정
;----------------------------------------------------------
!include "MUI2.nsh"

BrandingText "\${PRODUCT_COMPANY} - \${PRODUCT_WEBSITE}"

#!define MUI_COMPONENTSPAGE_SMALLDESC                        ; 설치 옵션 설명칸이 작게..
!define MUI_COMPONENTSPAGE_NODESC                            ; 설치 옵션 설명칸 없음

;----------------------------------------------------------
; installer or uninstaller 닫을 경우 경고 메시지 상자를 출력
;----------------------------------------------------------
!define MUI_ABORTWARNING                                    ; 설치 취소시 경고 메시지 뿌리기
!define MUI_UNABORTWARNING

;----------------------------------------------------------
; finishpage noAutoClose
;----------------------------------------------------------
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_UNFINISHPAGE_NOAUTOCLOSE                             ; 언인스톨 종료시 자동으로 닫히지 않게 하기.

!define MUI_FINISHPAGE_RUN "$INSTDIR\\\${EXE_FILE_FULL_NAME}"    ; 종료후 프로그램 자동 실행 여부 물어 보기
;!define MUI_FINISHPAGE_RUN_NOTCHECKED                           ; 자동 실행을 기본적으로 체크 안하길 원할경우.

;##########################################################
; MUI Pages : https://nsis.sourceforge.io/Docs/Modern%20UI/Readme.html
;##########################################################

#!define MUI_THEME                           "\${NSISDIR}\\Contrib\\Graphics"
!define MUI_THEME                             "${this.options.theme ? win32.normalize(resolve(this.options.theme)) : '\${NSISDIR}\\theme'}"

!define MUI_INSTFILESPAGE_PROGRESSBAR colored                    ; Default: smooth ("" | colored | smooth)
!define MUI_INSTALLCOLORS                     "203864 bdc4d1"    ; 설치 화면 글자/배경색 지정
#!define MUI_LICENSEPAGE_BGCOLOR /windows                        ; 라이센스 배경 컬러 (/windows | /grey | color)

;----------------------------------------------------------
; 인스톨러 & 언인스톨러 아이콘 설정
;----------------------------------------------------------
!define MUI_ICON                              "\${MUI_THEME}\\install.ico"
!define MUI_UNICON                            "\${MUI_THEME}\\uninstall.ico"

;----------------------------------------------------------
; Page Design
;----------------------------------------------------------

#!define MUI_HEADERIMAGE_RIGHT                                   ; 헤더 비트맵을 오른쪽에 표시
#!define MUI_BGCOLOR 203864                                      ; 헤더 배경색 Default: FFFFFF
#!define MUI_TEXTCOLOR bdc4d1                                    ; 헤더 글자색 Default: 000000
#!define MUI_HEADER_TRANSPARENT_TEXT

; Header image (150x53)
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP_NOSTRETCH
!define MUI_HEADERIMAGE_BITMAP                 "\${MUI_THEME}\\header.bmp"
!define MUI_HEADERIMAGE_UNBITMAP_NOSTRETCH
!define MUI_HEADERIMAGE_UNBITMAP               "\${MUI_THEME}\\header-uninstall.bmp"

; Welcome & Finish page image (164x290)
!define MUI_WELCOMEFINISHPAGE_BITMAP_NOSTRETCH
!define MUI_WELCOMEFINISHPAGE_BITMAP           "\${MUI_THEME}\\wizard.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP_NOSTRETCH
!define MUI_UNWELCOMEFINISHPAGE_BITMAP         "\${MUI_THEME}\\wizard-uninstall.bmp"

        `;
    }

    protected async MUIPages(): Promise<string> {
        return `
;----------------------------------------------------------
; Installer page
;----------------------------------------------------------
!insertmacro MUI_PAGE_WELCOME                            ; 시작 환영 페이지
!insertmacro MUI_PAGE_LICENSE "${this.options.license ? win32.normalize(resolve(this.options.license)) : ''}"
!insertmacro MUI_PAGE_COMPONENTS                         ; 컴포넌트 선택
!insertmacro MUI_PAGE_DIRECTORY                          ; 디렉토리 선택
!insertmacro MUI_PAGE_INSTFILES                          ; 설치중
!insertmacro MUI_PAGE_FINISH                             ; 종료 페이지 보이기

;----------------------------------------------------------
; Uninstaller pages
;----------------------------------------------------------
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM                          ; 언인스톨
#!insertmacro MUI_UNPAGE_LICENSE "textfile"
#!insertmacro MUI_UNPAGE_COMPONENTS
#!insertmacro MUI_UNPAGE_DIRECTORY
!insertmacro MUI_UNPAGE_INSTFILES                        ; 파일 삭제 진행 상황
#!insertmacro MUI_UNPAGE_FINISH

        `;
    }

    //////////////////////////////////////////////////////////////////
    // SECTION
    //////////////////////////////////////////////////////////////////

    protected async prevUninstall(): Promise<string> {
        return `
;----------------------------------------------------------
# 이전 버전 삭제
;----------------------------------------------------------

Section $(TXT_SECTION_UNINSTALL)
    ; 설치 섹션 "RO" 는 Read Only (해제 불가)
    SectionIn RO

    Push $6
    ReadRegStr "$6" \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}" "UninstallString" ; 기존버전 설치유뮤 확인
    
    StrCmp "$6" "" done

    ClearErrors
    DetailPrint $(TXT_VERSION_UNINSTALL)
    SetDetailsPrint listonly                          ; none|listonly|textonly|both|lastused
    
    #############################################
    # 인스톨러에서 uninstall.exe 호출할때 /from=installer 매개변수 전달함
    # (uninstall 단독 실행시에만 로그아웃하기 위함)
    # 여기에서 호출되는 uninstall.exe 에는 파라메터를 넘겨준다
    #############################################
    
    # 실행 종료시까지 기다림 (/S: silent)
    ExecWait "$6 /from=installer /S _?=$INSTDIR"                      ;Do not copy the uninstaller to a temp file

    /*
    IfErrors no_remove_uninstaller done
        ;You can either use Delete /REBOOTOK in the uninstaller or add some code
        ;here to remove the uninstaller. Use a registry key to check
        ;whether the user has chosen to uninstall. If you are using an uninstaller
        ;components page, make sure all sections are uninstalled.
    no_remove_uninstaller:
        MessageBox MB_OK "no_remove_uninstaller"
    */
  
    done:
        SetDetailsPrint both
        
SectionEnd

        `;
    }

    /*
    ; 새 Jump List를 생성 (링크 경로 갱신되지 않는 현상 제거)
    ; WinShell.dll : 설치 폴더\Plugin\... 에 집어 넣음
    ; https://nsis.sourceforge.io/WinShell_plug-in
    
    // Jump List 갱신되지 않는것은 child App (nwJS와 관련 있음)

    protected setShortCut_withAppID(link, uninstall) {

        let script = `
    CreateShortCut        "${link}.lnk"            "$INSTDIR\\\${EXE_FILE_FULL_NAME}"     "" "" 0
    ; 링크 경로 갱신되지 않는 현상 제거 (AppID 설정)
    WinShell::SetLnkAUMI  "${link}.lnk"            "${this.appUserModelID}"
    Pop $0  ; $0 == "OK" 이면 성공
        `;

        if (!uninstall) return script;
        script += `    CreateShortCut        "${link} 제거.lnk"       "$INSTDIR\\\${UNINSTALL_NAME}"         "" "" 0`;
        return script;
    }

    protected deleteShortCut_withAppID(link, del) {
        let script = `
    ; AppID 설정 제거
    WinShell::UninstAppUserModelId "${this.appUserModelID}"
    WinShell::UninstShortcut "${link}.lnk"
        `;

        if (!del) return script;
        script += `    Delete "${link}.lnk"`;
        return script;
    }

    // Jump List 아이콘 강제 갱신
    protected setResetJumpList(link, uninstall) {
        return `
Section "Reset JumpList"
    ; AppID 설정
    ;WinShell::SetCurrentProcessExplicitAppUserModelID "${this.appUserModelID}"
    
    ; AppID 설정, shell32.dll 내 API 호출 ($0 값이 0 이면 성공)
    System::Call 'shell32::SetCurrentProcessExplicitAppUserModelID(w "${this.appUserModelID}") i .r0'
    DetailPrint "AppID set to ${this.appUserModelID}"
SectionEnd
        `;
    }
    */

    protected async createProgramGroup(): Promise<string> {
        return `
;----------------------------------------------------------
; 프로그램 그룹 생성
;----------------------------------------------------------

; 프로그램 폴더 설치시 "현재사용자" 에게만 설치할 것인지 "모든 사용자" 에게 설치할 것인지를 결정 (current|all)
!define SHELL_VAR_CONTEXT_PROGG        "all"                    ; 프로그램 그룹 생성에서 사용
!define SHELL_VAR_CONTEXT_ICON        "current"                 ; 단축아이콘 생성에서 사용

Section $(TXT_SECTION_CREATSTARTMENU)

    ; 시작 메뉴 단축 아이콘 - $SMPROGRAMS
    ; 위치 : C:/ProgramData/Microsoft/Windows/Start Menu/Programs/

    SetShellVarContext    \${SHELL_VAR_CONTEXT_PROGG}
    SetOutPath            "$SMPROGRAMS\\\$(TXT_PROGRAM_GROUP_NAME)\\"
    SetOutPath            "$INSTDIR"
    CreateShortCut        "$SMPROGRAMS\\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME}.lnk"            "$INSTDIR\\\${EXE_FILE_FULL_NAME}"     "" "" 0
    CreateShortCut        "$SMPROGRAMS\\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME} 제거.lnk"       "$INSTDIR\\\${UNINSTALL_NAME}"         "" "" 0

    ; 시작 메뉴 단축 아이콘 - $STARTMENU
    ; 위치 : C:\\Users\\pdi10\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu

    SetShellVarContext    \${SHELL_VAR_CONTEXT_ICON}
    SetOutPath            "$STARTMENU\\Programs\\\$(TXT_PROGRAM_GROUP_NAME)\\"
    SetOutPath            "$INSTDIR"
    CreateShortCut        "$STARTMENU\\Programs\\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME}.lnk"         "$INSTDIR\\\${EXE_FILE_FULL_NAME}" "" "" 0
    CreateShortCut        "$STARTMENU\\Programs\\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME} 제거.lnk"    "$INSTDIR\\\${UNINSTALL_NAME}"     "" "" 0
SectionEnd

        `;
    }

    protected async createDesktopIcon(): Promise<string> {
        return `
;----------------------------------------------------------
; 바탕화면에 바로가기 아이콘 - $DESKTOP
;----------------------------------------------------------

Section $(TXT_SECTION_CREATEDESKTOPICON)
    SetShellVarContext     \${SHELL_VAR_CONTEXT_ICON}
    SetOutPath             $INSTDIR
    CreateShortCut         "$DESKTOP\\\${EXE_FILE_NAME}.lnk" "$INSTDIR\\\${EXE_FILE_FULL_NAME}" "" "" 0
SectionEnd

        `;
    }

    protected async createQuickIcon(): Promise<string> {
        return `
;----------------------------------------------------------
; 빠른 실행 아이콘 - $QUICKLAUNCH (도구 모음 > shell:quick launch)
;----------------------------------------------------------

Section $(TXT_SECTION_CREATEQUICKLAUNCH)
    SetShellVarContext    \${SHELL_VAR_CONTEXT_ICON}
    SetOutPath            $INSTDIR
    CreateShortCut        "$QUICKLAUNCH\\\${EXE_FILE_NAME}.lnk" "$INSTDIR\\\${EXE_FILE_FULL_NAME}" "" "" 0
SectionEnd

        `;
    }

    protected async deleteIcons(): Promise<string> {
        return `
    ;-------------
    ; 단축 아이콘 지우기
    SetShellVarContext \${SHELL_VAR_CONTEXT_ICON}                          ; current 시작 단축 아이콘 지우기
        Delete    "$DESKTOP\\\${EXE_FILE_NAME}.lnk"                        ; 바탕화면 단축 아이콘
        Delete    "$QUICKLAUNCH\\\${EXE_FILE_NAME}.lnk"                    ; 빠른 실행
        ;Delete   "$STARTMENU\\Programs\\\$(EXE_FILE_NAME).lnk"              ; 시작 메뉴
        ;Delete   "$SMSTARTUP\\\${EXE_FILE_NAME}.lnk"
        
    SetShellVarContext \${SHELL_VAR_CONTEXT_PROGG}                         ; all 시작 단축 아이콘 지우기
        Delete    "$DESKTOP\\\${EXE_FILE_NAME}.lnk"                        ; 바탕화면 단축 아이콘
        Delete    "$QUICKLAUNCH\\\${EXE_FILE_NAME}.lnk"                    ; 빠른 실행
        ;Delete   "$STARTMENU\\Programs\\\${EXE_FILE_NAME}.lnk"            ; 시작 메뉴
        ;Delete   "$SMSTARTUP\\\${EXE_FILE_NAME}.lnk"
        
        `;
    }

    protected async deleteProgramGroup(): Promise<string> {
        return `
    ;-------------
    ; 링크 지우기 & 프로그램 그룹 지우기 (빈 폴더 일때만 삭제함)
    # RmDir : 빈 폴더 일때만 삭제
    # RmDir /r : 폴더 안의 내용과 폴더 모두 삭제
    
    SetShellVarContext    \${SHELL_VAR_CONTEXT_PROGG}                                ; 설치할때 프로그램 그룹이 설치된 위치.
    Delete        "$SMPROGRAMS\\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME}.lnk"
    Delete        "$SMPROGRAMS\\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME} 제거.lnk"
    RMDir         "$SMPROGRAMS\\\$(TXT_PROGRAM_GROUP_NAME)"                           ; 프로그램 그룹 지우기

    SetShellVarContext    \${SHELL_VAR_CONTEXT_ICON}
    Delete        "$STARTMENU\\Programs\\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME}.lnk"
    Delete        "$STARTMENU\\Programs\\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME} 제거.lnk"
    RMDir         "$STARTMENU\\Programs\\\$(TXT_PROGRAM_GROUP_NAME)"                  ; 시작 메뉴 아이콘 그룹 지우기

        `;
    }

    //////////////////////////////////////////////////////////////////
    // 파일 설치, 제거
    //////////////////////////////////////////////////////////////////

    /*
    ; 파일 경로가 긴경우 "File: failed opening file" 에러 발생함
    ; https://stackoverrun.com/ko/q/7088595

    ; File /nonfatal 은 특정 디렉토리가 없으면 오류없이 무시
    ; macro를 사용해야 파일 사이즈가 자동으로 계산된다. (function 은 안됨)
    ;https://nsis.sourceforge.io/Macro_vs_Function
    */

    protected async installAppLauncher(): Promise<string> {
        let excludes: string[] = [];

        // const childApp = this.options.childApp;
        // if(childApp && childApp.moves) {
        //     excludes = excludes.concat(childApp.moves || []);
        // }

        if (this.options.resource) {
            excludes = excludes.concat(this.options.resource.map(p => p.src));
        }

        // 제외 목록
        const excludesList = excludes.map(p => `/x "${win32.normalize(p)}"`).join(' ');
        // excludesList = ('/x "' + this.options.resource.src + '"');

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
    File /nonfatal /a /r ${excludesList} .\\*.*
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

    protected async installChildApp(): Promise<string> {
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
                // 폴더는 '\*.*' 붙여줌
                // const path = (p.includes('.')) ? p : `${p}/*.*`;
                return `/x "${win32.normalize(p)}"`;
            }).join(' ');
        })();

        const DELETE_LIST = (() => {
            return excludes.map(p => {
                const path = win32.normalize(nwRoot + '/' + p);
                // 비어있지 않은 폴더도 삭제하려면 /r 옵션을 줘야함
                return (p.includes('.') ? 'Delete' : 'RMDir /r') + ` "${path}"\n`;
            }).join(' ');
        })();

        console.error('# 리소스 이동: \n', MOVE_LIST);
        console.error('# nwJS 설치: \n', EXCLUDE_LIST);
        console.error('# 삭제: \n', DELETE_LIST);
        console.error('\n');

        return `
;----------------------------
; Child App 복사
;----------------------------

!define CHROME_LAUNCHER_PATH       "${chromeLauncherPath}"

# 서브 App 리소스 (nwJS App) - 런처가 실행할 app
!define NW_ROOT                     "${nwRoot}"

; Program Files 폴더에서 nwJS App을 런처로 사용하고자 할 경우 권한 문제가 발생한다.
; 설치된 $INSTDIR 폴더는 런처 app 으로 사용하고
; nwJS 실행파일 리소스를 권한이 필요없는 폴더로 복사하여 실행 한다.
; 하나의 nwJS 리소스로 런처 및 app으로 구동 시킬수 없다.
!macro Install_App_Child

    StrCmp "\${NW_ROOT}" "" skipChildApp
        StrCpy $9 "\${NW_ROOT}"
        RMDir /r $9

        ; child app 설치 위치 
        SetOutPath $9
        
        # moves 목록 따로 처리
        # File /nonfatal /a /r "uninstall"
        ${MOVE_LIST}
        
        # child uninstall App 프로세스가 완전히 종료되지 않아 파일을 사용중이라 
        # 삭제 및 덮어쓰기가 불가한 상태였음 - 에러 발생함
        # exit 코드가 주석처리 되어 있었음 ㅠㅠ
        # MessageBox MB_OK "# 이곳에서 문제 발생"

        #-------------------
        # nwJS 설치 (installer 파일 그대로 사용)
        #-------------------
        
        # 방법 1: 
        # /r 옵션이 있을때는 폴더명 뒤에 \\*.* 을 붙여줘야 하위 경로까지 패턴 매칭되지 않음
        # File /nonfatal /a /r [/x 경로 패턴] .\\*.*
        # File /nonfatal /a ${EXCLUDE_LIST} .\\*.*
        CopyFiles /SILENT "$INSTDIR\\*.*" "$9"
        
        # chrome app 리소스 따로 복사해 줘야함
        # CopyFiles /SILENT /FILESONLY "$INSTDIR\\*.*" "${nwRoot}"
        # CopyFiles /SILENT "$INSTDIR\\locales\\*.*" "${nwRoot}\\locales"
        # CopyFiles /SILENT "$INSTDIR\\swiftshader\\*.*" "${nwRoot}\\swiftshader"
        CopyFiles /SILENT "$INSTDIR\\locales\\*.*" "$9\\locales"
        CopyFiles /SILENT "$INSTDIR\\swiftshader\\*.*" "$9\\swiftshader"
        
        
        # 방법 2: nwJS 설치 (installer 파일 그대로 사용)
        # resource로 정의된 리스트는 $INSTDIR 폴더에서 제외됨
        # moves 목록은 이미 실행됬으므로 전체 폴더를 카피해도 됨 (chrome app만 남아있음)
        # CopyFiles /SILENT "$INSTDIR\\*.*" "${nwRoot}"
        
        # 제외 목록 삭제
        ${DELETE_LIST}
        
    skipChildApp:
!macroend

Function un.Install_App_Child
    ; childApp 폴더 삭제
    RMDir /r "\${NW_ROOT}"
    
    ; nw 실행시 생성되는 chrome app 폴더 삭제
    StrCmp "\${CHROME_LAUNCHER_PATH}" "" skipChildApp
        ;MessageBox MB_OK "삭제: \${CHROME_LAUNCHER_PATH}"
        RMDir /r "\${CHROME_LAUNCHER_PATH}"
    skipChildApp:
FunctionEnd
        `;
    }

    /*
    ; download & copy the 'FindProcDLL.dll' in your NSIS plugins directory
    ; (...nsis/Plugins[/platform])
    ; https://nsis.sourceforge.io/Nsisunz_plug-in
    ; https://nsis.sourceforge.io/ZipDLL_plug-in
    */
    protected async installResource(): Promise<string> {
        const empty = `
!macro Install_Resource
!macroend
Function un.Install_Resource
FunctionEnd
        `;

        const resource: { src: string, dest: string }[] = this.options.resource || [];
        const otherUninstall = this.options.uninstall ? win32.normalize(this.options.uninstall) : '';
        if (!resource && !otherUninstall) return empty;

        // const resourceSrc = resource.src ? win32.normalize(resource.src) : '';
        // const resourceDest = resource.dest ? win32.normalize(resource.dest) : '';

        /*
        !define RESOURCE_SRC                 "${ resourceSrc }"
        !define RESOURCE_DEST                "${ resourceDest }"

        !macro Install_Resource
            StrCmp   "\${RESOURCE_DEST}" "" ok
            RMDir /r "\${RESOURCE_DEST}"
            StrCmp "\${RESOURCE_SRC}" "" ok
                SetOutPath                "\${RESOURCE_DEST}"
                File /nonfatal /a /r      "\${RESOURCE_SRC}\\*"
                ;File /nonfatal /a /r      assets\\*
            ok:
        !macroend
        */
        const ADD_LIST = resource.map((obj) => {
            if (!obj.src || !obj.dest) return '';
            const src = win32.normalize(obj.src);
            const dest = win32.normalize(obj.dest);
            return `
    RMDir /r                  "${dest}"
    SetOutPath                "${dest}"
    File /nonfatal /a /r      "${src}\\*"
                `;
        }).join('\n\n');

        /*
        ; 버전별 리소스 폴더 삭제
        Function un.Install_Resource
            StrCmp "${RESOURCE_DEST}" "" skipDest
                Delete         "${RESOURCE_DEST}\*.*"
                RMDir /r       "${RESOURCE_DEST}"

                ...
        FunctionEnd
        */
        const REMOVE_LIST = resource.map((obj) => {
            if (!obj.src || !obj.dest) return '';
            // const src = win32.normalize(obj.src);
            const dest = win32.normalize(obj.dest);
            return `
    Delete         "${dest}\\*.*"
    RMDir /r       "${dest}"
            `;
        }).join('');

        return `
;----------------------------
; 버전별 리소스 폴더 생성
;----------------------------

# 압축 파일 extract 정보 
!define OTHER_UNINSTALL_DEST         "${otherUninstall}"

!macro Install_Resource
    ${ADD_LIST}
!macroend

; 버전별 리소스 폴더 삭제
Function un.Install_Resource
    ${REMOVE_LIST}
    
    #skipDest:
        ; 추가로 지정한 폴더 지우기
        StrCmp "\${OTHER_UNINSTALL_DEST}" "" ok
            Delete      "\${OTHER_UNINSTALL_DEST}\\*.*"
            RMDir /r    "\${OTHER_UNINSTALL_DEST}"
            
        ; 파일이 아직 남아 있으면..
        IfFileExists \${OTHER_UNINSTALL_DEST}*.* 0 ok
            RMDir /r         "\${OTHER_UNINSTALL_DEST}"
            RMDir /REBOOTOK  "\${OTHER_UNINSTALL_DEST}"
    ok:
    
FunctionEnd
        `;
    }

    //////////////////////////////////////////////////////////////////
    // Util
    //////////////////////////////////////////////////////////////////

    /*
    ; 기존에 실행중인 프로그램 종료.
    ; https://nsis.sourceforge.io/FindProcDLL_plug-in
    ; --> FindProcDLL, KillProcDLL 동작하지 않음 (아래 NsProcess 사용함)
    */

    /*
    ; NsProcess plugin : 기존에 실행중인 프로그램 종료.
    ; https://nsis.sourceforge.io/NsProcess_plugin
    ; Download v1.6: nsProcess.zip (14 KB) 다운 받아
    ; nsProcessW.dll 을 nsProcess.dll 이름 바꿔서 Plugins/...unicord 폴더에 넣어줌
    */
    protected async checkAndCloseApp(): Promise<string> {
        const exeFileFullName = this.options.exeName + '.exe';

        // const childApp = this.options.childApp;
        // const childAppPath = (!childApp || !childApp.dest) ? exeFileFullName : childApp.dest + '/' + exeFileFullName;
        // ;StrCpy $3 "${ win32.normalize(childAppPath) }"

        return `
;----------------------------------------------------------
; 기존에 실행중인 프로그램 종료.
;----------------------------------------------------------

; 기존에 실행중인 프로그램 종료.
Function CheckAndCloseApp
    # EXE_FILE_FULL_NAME 변수가 아직 define 되기 전에 호출될 수도 있으므로 하드 코딩함
    StrCpy $1 "${exeFileFullName}"
        
    loop:
        nsProcess::_FindProcess "$1"
        Pop $R0
        StrCmp $R0 0 processFound done

    processFound:
        StrCmp $R8 "first" kill

        MessageBox MB_ICONINFORMATION|MB_YESNO "설치할 $(TXT_STILL_RUN_EXIT_PROGRAM)" IDNO cancel
        StrCpy $R8 "first"
        Goto kill

    kill:
        nsProcess::_KillProcess "$1"
        Pop $R0
        Sleep 500
        Goto loop

    cancel:
        MessageBox MB_OK "$(TXT_INSTALL_CANCEL)"
        Quit
    
    done:
FunctionEnd

; (uninstall) 기존에 실행중인 프로그램 종료.
Function un.CheckAndCloseApp
    # EXE_FILE_FULL_NAME 변수가 아직 define 되기 전에 호출될 수도 있으므로 하드 코딩함
    StrCpy $1 "${exeFileFullName}"
        
    loop:
        nsProcess::_FindProcess "$1"
        Pop $R0
        StrCmp $R0 0 processFound done

    processFound:
        StrCmp $R8 "first" kill

        MessageBox MB_ICONINFORMATION|MB_YESNO "설치할 $(TXT_STILL_RUN_EXIT_PROGRAM)" IDNO cancel
        StrCpy $R8 "first"
        Goto kill

    kill:
        nsProcess::_KillProcess "$1"
        Pop $R0
        Sleep 500
        Goto loop

    cancel:
        MessageBox MB_OK "$(TXT_UNINSTALL_CANCEL)"
        Quit
    
    done:
FunctionEnd
        `;
    }

    /*
    ; 파일 실행 확장자 등록
    ; FileAssociation.nsh : 설치 폴더\NSIS\Include 에 집어 넣음
    ; https://nsis.sourceforge.io/File_Association
    ; !include "FileAssociation.nsh"
    */
    protected async fileAssociation(): Promise<string> {
        const associate = this.options.associate;
        if (!associate || associate.length < 1) {
            return `
Function FileAssociate
FunctionEnd
Function un.FileAssociate
FunctionEnd
            `;
        }

        // associate: [{ext, fileClass, description, icon}]
        const exePath = '$INSTDIR\\\${EXE_FILE_FULL_NAME}';
        const APP_ASSOCIATE = associate.map((info) => {
            if (!info.ext) return '';

            const ext = info.ext;
            const fileClass = info.fileClass || ('Ext.' + ext);
            const description = info.description || '';
            const icon = '$INSTDIR\\' + win32.normalize(info.icon) || exePath + ',0';
            const commandText = info.commandText || 'Open with \${EXE_FILE_NAME} Application';
            // "%1" : 더블 클릭한 파일의 전체 경로 (절대 경로)
            // $\\"%1$\\" --> "%1"
            const command = info.command || exePath + ' $\\"%1$\\"';

            /*
            ;!insertmacro APP_ASSOCIATE      "확장자명" "확장자 유형" "확장자 설명"
            ;                                "아이콘"
            ;                                "COMMANDTEXT" "COMMAND"

            !insertmacro APP_ASSOCIATE       "jik" "Jik-ji.project" "JIK-JI Editor Project File"
                                             "$INSTDIR\assets\exeIcon.ico"
                                             "Open with Jik-ji Editor" "$INSTDIR\${EXE_FILE_FULL_NAME} $\"%1$\""
            !insertmacro APP_ASSOCIATE       "jikp" "Jik-ji.project" "JIK-JI Editor Project File"
                                             "$INSTDIR\assets\exeIcon.ico"
                                             "Open with Jik-ji Editor" "$INSTDIR\${EXE_FILE_FULL_NAME} $\"%1$\""
            */
            // !insertmacro APP_ASSOCIATE "확장자명" "확장자 유형" "확장자 설명" "아이콘" "COMMANDTEXT" "COMMAND"
            return `!insertmacro APP_ASSOCIATE "${ext}" "${fileClass}" "${description}" "${icon}" "${commandText}" "${command}"`;
        }).join('\n\t');

        console.log('APP_ASSOCIATE: ', APP_ASSOCIATE);
            
        const APP_UNASSOCIATE = associate.map((info) => {
            if (!info.ext) return '';
            const ext = info.ext;
            const fileClass = info.fileClass || ('Ext.' + ext);

            /*
            ; !insertmacro APP_UNASSOCIATE       "확장자명" "확장자 유형"
            !insertmacro APP_UNASSOCIATE         "jik" "Jikji.project"
            !insertmacro APP_UNASSOCIATE         "jikp" "Jikji.project"
            */
            // !insertmacro APP_UNASSOCIATE      "jikp" "Jikji.project"
            return `!insertmacro APP_UNASSOCIATE "${ext}" "${fileClass}"`;
        }).join('\n\t');

        return `
;----------------------------------------------------------
; 파일 실행 확장자 등록
;----------------------------------------------------------

; File Association
!include "FileAssociation.nsh"

Function FileAssociate
    ${APP_ASSOCIATE}
    
    ; explorer 갱신
    !insertmacro UPDATEFILEASSOC
FunctionEnd

Function un.FileAssociate
    ${APP_UNASSOCIATE}
    
    ; explorer 갱신
    !insertmacro UPDATEFILEASSOC
FunctionEnd

        `;
    }

    //////////////////////////////////////////////////////////////////
    // Auth, Logout
    //////////////////////////////////////////////////////////////////

    /*
    ; exe 실행
    ; download & copy the 'StdUtils.dll' in your NSIS plugins directory
    ; (...nsis/Plugins[/platform])
    ; https://nsis.sourceforge.io/StdUtils_plug-in
    ; http://muldersoft.com/docs/stdutils_readme.html
    ; !include "StdUtils.nsh"
    ; https://github.com/lordmulder/stdutils/blob/master/Examples/StdUtils/ShellExecWait.nsi
    */
    protected async childAppProcess(): Promise<string> {
        const childApp = this.options.childApp;
        if (!childApp || !childApp.dest) {
            return `
!macro ChildAppProcess
!macroend
Function un.ChildAppProcess
FunctionEnd
            `;
        }

        // Uninstall App  : childApp의 uninstall 폴더의 package.json 파일 name
        const chromiumUninstallApp = childApp.uninstallApp || '';
        const uninstallAppFolder = childApp.uninstallAppFolder || '\${NW_ROOT}\\uninstall';
        
        const nwName = childApp.nwName || 'nw';
        const childAppName = this.options.onlyLauncher ? `${nwName}.exe` : '\${EXE_FILE_FULL_NAME}'
        
        return `
;----------------------------------------------------------
; App 호출하여 특정 로직을 실행
;----------------------------------------------------------

!include "StdUtils.nsh"
;ShowInstDetails show

!macro ChildAppProcess
    ;MessageBox MB_OK "\${NW_ROOT}"
!macroend

Function un.ChildAppProcess

    # 런처로 들어온 모든 파라미터를 얻는다
    # \${StdUtils.GetAllParameters} $R0 0
    # MessageBox MB_OK "$R0"

    # /from=installer
    # \${StdUtils.GetParameter} user_var(output) name default
    \${StdUtils.GetParameter} $R0 "from" ""
    ;MessageBox MB_OK "언인스톨 호출: $R0"
    
    # 인스톨러에서 호출된 uninstall.exe이면 child process 실행하지 않는다
    StrCmp $R0 "installer" skipChildProcess

    ####################################
    # uninstall.exe 단독으로 실행된 경우
    ####################################

    Var /GLOBAL chromiumUninstallApp
    StrCpy $chromiumUninstallApp "${win32.normalize(chromiumUninstallApp)}"
        
    StrCmp $chromiumUninstallApp "" skipChildProcess
        
    StrCmp "\${NW_ROOT}" "" skipChildProcess

        # "C:/Users/pdi10/AppData/Local/testApp5"
        # DetailPrint 'CHROME_APP_PATH: "\${CHROME_APP_PATH}"'
        # "C:/Users/pdi10/AppData/Local/jikji.editor.testapp"
        # DetailPrint 'CHROME_LAUNCHER_PATH: "\${CHROME_LAUNCHER_PATH}"'
        # "C:/Users/pdi10/AppData/Local/jikji.editor.demo.setup/testapp"
        # DetailPrint 'NW_ROOT: "\${NW_ROOT}"'
        # "testApp3.exe"
        # DetailPrint 'EXE_FILE_FULL_NAME: "${childAppName}"'
        
        Var /GLOBAL childAppPath
        StrCpy $childAppPath "\${NW_ROOT}\\${childAppName}"
        
        Var /GLOBAL uninstallAppFolder
        # StrCpy $uninstallAppFolder "\${NW_ROOT}\\uninstall"
        StrCpy $uninstallAppFolder "${uninstallAppFolder}"

        DetailPrint 'childAppPath: "$childAppPath"'
        DetailPrint 'uninstallAppFolder: "$uninstallAppFolder"'
        
        #############################################
        # child app 호출하여 필요한 uninstall 과정 진행
        # exe 파일을 실행한다. try to launch the process
        #############################################

        ExecWait '"$childAppPath" "$uninstallAppFolder"' $1
    
        ; 필요시 약간의 지연 (파일 핸들 완전히 해제 대기)
        Sleep 1000

        ; ExecWait 결과 확인
        ; $1 : 프로세스의 exit code (보통 0 = 정상 종료)
        StrCmp $1 "" ExecFailed  ; 실행 실패 혹은 중간 취소

        DetailPrint "Uninstall child app exited with code: $1"
        Goto WaitDone

        ; \${StdUtils.ExecShellWaitEx} $0 $1 "$childAppPath" "open" "$uninstallAppFolder"
        # returns "ok", "no_wait" or "error".
        ; StrCmp $0 "error" ExecFailed               ;check if process failed to create
        ; StrCmp $0 "no_wait" WaitNotPossible        ;check if process can be waited for - always check this!
        ; StrCmp $0 "ok" WaitForProc                 ;make sure process was created successfully
        ; Abort
        
        # 실행 완료 기다리기
        ExecFailed:
            DetailPrint "Failed to create process (error code: $1)"
            Goto WaitDone
            
        WaitNotPossible:
            DetailPrint "Can not wait for process."
            Goto WaitDone
            
        WaitForProc:
            DetailPrint "Waiting for process. ..."
            \${StdUtils.WaitForProcEx} $2 $1
            DetailPrint "Process just terminated (exit code: $2)"
            Goto WaitDone
            
        WaitDone:
            ;MessageBox MB_OK "삭제 : $chromiumUninstallApp"
            
            ; chromium Uninstall App 폴더 삭제
            RMDir /r $chromiumUninstallApp
            Goto skipChildProcess
            
    skipChildProcess:
    
    ; Child Uninstall App 종료 보강
    ; 프로세스가 완전히 종료되지 않으면 app(nw) 폴더가 완전히 삭제되지 않음
    nsProcess::_KillProcess "${childAppName}"
    Sleep 1000    

FunctionEnd
        `;
    }

    /*
    ; 서버 API 호출
    ; download & copy the 'INetC.dll' in your NSIS plugins directory
    ; (...nsis/Plugins[/platform])
    ; https://nsis.sourceforge.io/Inetc_plug-in
    ; 주의) /HEADER 옵션 : 하나의 변수만 지정할 수 있음
    */

    /*
    protected async callServer(): Promise<string> {
        return `
;----------------------------------------------------------
; 서버 API 전송
;----------------------------------------------------------

Function Logout
    # 데이터를 GET 방식 query 또는 POST 방식 body에 전달해야함

    ;MessageBox MB_OK "로그아웃 테스트"

    # /HEADER 하나의 변수만 지정할 수 있음
    # inetc::post "" /NOCANCEL /SILENT /HEADER "licenseKey: 2022-0705-IDCB-0FF7-76A2" "http://localhost:5300/checkLogoutLicense.ax" "$EXEDIR\\post_reply.json" /END

    # body에 text 파일 내용이 들어감 (licenseKey=&macAddr=)
    ;inetc::post "$EXEDIR\\test.txt" /FILE /NOCANCEL /SILENT "http://localhost:5300/checkLogoutLicense.ax" "$EXEDIR\\post_reply.json" /END
    # body에 들어갈 내용 직접 입력
    inetc::post "licenseKey=A&macAddr=B" /NOCANCEL /SILENT "http://localhost:5300/checkLogoutLicense.ax" "$EXEDIR\\post_reply.json" /END

    Pop $0 # return value = exit code, "OK" if OK
    MessageBox MB_OK "Download Status: $0"
    
    FileOpen $0 $EXEDIR\\post_reply.json r
    FileRead $0 $1
    DetailPrint $1
    FileClose $0
    ;MessageBox MB_OK "video found"
    
    Delete "$EXEDIR\\post_reply.json"
FunctionEnd
        `;
    }
    */

    protected async install_Visual_Cpp_Redistributable(): Promise<string> {
        if (!this.options.install_visualCpp) return '';

        // VC++ Redistributable 설치 레지스트리 키
        // 64bit OS, x64 런타임        : HKLM\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\\x64
        // 64bit OS, x86 런타임 (WOW64): HKLM\SOFTWARE\WOW6432Node\Microsoft\VisualStudio\14.0\VC\Runtimes\\x86
        // 32bit OS, x86 런타임        : HKLM\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\\x86
        // Installed 값이 1이면 VC++ 런타임이 설치된 것

        // const x64 = 'SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64';
        // const x64File = 'vc_redist.x64.exe';
        // const x86wow = 'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x86';
        const x86 = 'SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x86';

        // 인스톨러에 VC++ Redistributable 포함 (x86)
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const DIR_VENDER = resolve(__dirname, '../../../vender/');
        const x86File = 'VC_redist.x86.exe';
        const x86FilePath = win32.normalize(resolve(DIR_VENDER, x86File));
        console.log('x86FilePath: ', x86FilePath);

        const dll = '$WINDIR\\SysWOW64\\VCRUNTIME140.dll';
        return `
;----------------------------------------------------------
; Visual C++ Redistributable 설치 확인
; - pdftocairo.exe 실행할 때 VCRUNTIME140.dll 필요
; - pdftocairo가 x86 환경이 필요하므로 VC_redist.x86.exe을 설치함
; - (무조건 x86 VC++ Redistributable 체크/설치)
;----------------------------------------------------------

RequestExecutionLevel admin
!include "FileFunc.nsh"
!include "x64.nsh"

Var VCOK
Var EXITCODE

Section $(TXT_SECTION_COPY_VISUAL_CPP)

    SetOutPath $INSTDIR 
;MessageBox MB_OK "$INSTDIR"
    
    ;---------------------
    ; VC++ Redistributable (x86) 설치 확인
    ;---------------------
    
    ; 먼저 64bit OS에서 WOW6432Node (32bit view) 확인
    ; SetRegView 32 를 사용하면 64-bit OS에서는 WOW6432Node를, 32-bit OS에서는 기본 경로를 조회합니다.
    SetRegView 32
    ReadRegDWORD $0 HKLM "${x86}" "Installed"
    IntCmp $0 1 vc_installed vc_check_sys32 vc_check_sys32
    
; 테스트    
;Goto vc_install
        
    vc_check_sys32:
        IfFileExists "${dll}" vc_installed vc_not_installed
        
    vc_not_installed:
        StrCpy $VCOK "0"
        Goto vc_check_done
        
    vc_installed:
        StrCpy $VCOK "1"
        
    vc_check_done:
        ; 이후 레지스트리 뷰는 기본(64)로 복구
        SetRegView 64

    ; 이미 설치되어 있으면 건너뜀
    StrCmp $VCOK "1" vc_done vc_install

    ;---------------------
    ; 설치 진행
    ;---------------------
    
    vc_install:
        ;인스톨러 생성 시, 지정한 파일을 NSIS 설치 패키지 안에 포함시킴
        ;설치 과정에서 $INSTDIR\\${x86FilePath} 경로에 풀려 있게 됩
        File "${x86FilePath}"
        
        DetailPrint "VC++ Redistributable (x86) not found. Installing..."
        ExecWait '"$INSTDIR\\${x86File}" /quiet /norestart' $EXITCODE
        StrCmp $EXITCODE "0" vc_after_install vc_install_failed

    vc_install_failed:
        DetailPrint "Warning: VC++ installer returned non-zero exit code $EXITCODE"
        MessageBox MB_OK "VC++ Redistributable 설치에 실패했거나 사용자가 설치를 취소했습니다.\\n앱 실행에 문제가 있을 수 있습니다."
        Goto vc_done

    ;---------------------
    ; 설치 후 재확인
    ;---------------------
    
    vc_after_install:
        SetRegView 32
        ReadRegDWORD $0 HKLM "${x86}" "Installed"
        IntCmp $0 1 vc_after_ok vc_after_check_sys32 vc_after_check_sys32

    vc_after_check_sys32:
        IfFileExists "${dll}" vc_after_ok vc_after_not_ok
        
    vc_after_not_ok:
        MessageBox MB_OK "VC++ Redistributable 설치 후 파일이 확인되지 않습니다.\\n앱 실행에 문제가 있을 수 있습니다."
        StrCpy $VCOK "0"
        Goto vc_after_done
    vc_after_ok:
        StrCpy $VCOK "1"
    vc_after_done:
        SetRegView 64
        Goto vc_done

    vc_done:
        ;MessageBox MB_OK "VC++ Redistributable 설치 확인됨"
        DetailPrint "VC++ Redistributable (x86) check complete."

SectionEnd

        `;
    }
}

// NSIS 사용시에 2GB 이상의 대용량 배포의 문제점
// https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=sbspace&logNo=130163195164
// NSIS를 이용한 압축 파일 배포(NSIS 7Z PLUGIN)
// https://www.yuno.org/426
// Nsis7z plug-in
// https://nsis.sourceforge.io/Nsis7z_plug-in



