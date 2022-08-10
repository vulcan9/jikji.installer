/* tslint:disable:no-trailing-whitespace */

import { resolve, win32 } from 'path';

import { fixWindowsVersion } from '../util';

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

	// Output.
	output: string;

	// 압축 파일 풀기 기능 지원
	resource?: any; // {src: string, dest: string};
	uninstall?: string;
	associate?: any[];
	// App 복사 기능 지원
	childApp?: {name: string, excludes?: string[], dest: string};
	appName: string;
	// nwFiles: string[];
}

/***********************************************

 NSIS : https://nsis.sourceforge.io/Docs/
 https://gist.github.com/SeonHyungJo/18c68d71925f6ccadce6fc75750b7fe0

 ************************************************/

export class NsisComposer {

	protected fixedVersion: string;

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
		this.options.languages = this.options.languages && this.options.languages.length > 0 ? this.options.languages : [ 'English' ];

		this.fixedVersion = fixWindowsVersion(this.options.version);

		if(this.options.appName) this.options.appName = '$LOCALAPPDATA\\' + this.options.appName;

		// process.stdout.write('this.options 설정값: \n' + JSON.stringify(this.options.childApp, null, 4) + '\n');
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

;####################################################################################################################
; define Settings
;####################################################################################################################

# setup 파일 경로
!define OUTFILE_NAME				"${ win32.normalize(resolve(this.options.output)) }"

; nw 실행시 생성되는 chrome app 폴더 경로
!define CHROME_APP_LAUNCHER 			"${ this.options.appName }"

;----------------------------------------------------------
; 배포 프로그램 이름, 버전 및 기타 변수
;----------------------------------------------------------
!define PRODUCT_NAME 			"${ this.options.productName }"
!define PRODUCT_VERSION 		"${ this.options.version }"
!define PRODUCT_PUBLISHER 		"${ this.options.publisher }"
!define PRODUCT_COMPANY 		"${ this.options.companyName }"
!define PRODUCT_WEBSITE 		"${ this.options.web }"

!define EXE_FILE_DIR 			"$PROGRAMFILES\\\${PRODUCT_COMPANY}\\\${PRODUCT_NAME}"
!define EXE_FILE_NAME 			"${ this.options.exeName }"
!define EXE_FILE_FULL_NAME		"${ this.options.exeName }.exe"
!define PROGRAM_GROUP_NAME		"${ this.options.programGroupName }"			; 프로그램 그룹 이름
!define	UNINSTALL_NAME			"uninstall.exe"									; 언인스톨러 이름

;----------------------------------------------------------
; 레지스트리 키 지정
;----------------------------------------------------------

!define REG_ROOT_KEY 			"HKLM"
!define REG_UNROOT_KEY 			"HKLM"
!define REG_APPDIR_KEY 			"Software\\Microsoft\\Windows\\CurrentVersion\\App Path\\\${EXE_FILE_FULL_NAME}"
!define REG_UNINST_KEY 			"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\\${PRODUCT_NAME}"

;##########################################################
; NSIS Settings
;##########################################################

${ await this.NSISSettings() }

;##########################################################
; MUI Settings
;##########################################################

${ await this.MUISettings() }

${ await this.MUIPages() }

;----------------------------------------------------------
; Language Files
;----------------------------------------------------------
!insertmacro MUI_LANGUAGE "Korean"						; 언어 설정.

;####################################################################################################################
; SECTION
;####################################################################################################################

# 한글 특화 부분 - 이름에 따라서 바꿔주자.
!define	EUL_RUL								"를"				; 을/를 문제 해결을 위한 define. $PRODUCT 에 따라 바뀐다.
!define I_KA								"이"				; 이/가 문제 해결을 위한 define. $PRODUCT 에 따라 바뀐다.

# 언어 설정
LangString TXT_VERSION_UNINSTALL			\${LANG_KOREAN}		"이전 버전을 제거하는 중입니다. 잠시 기다려 주세요."
LangString TXT_UNINSTALL					\${LANG_KOREAN}		"프로그램을 제거하는 중입니다. 잠시 기다려 주세요."
LangString TXT_SECTION_UNINSTALL			\${LANG_KOREAN}		"이전 버전 삭제"
LangString TXT_EXTRACTING					\${LANG_KOREAN}		"설치하는 동안 잠시 기다려 주세요."
LangString TXT_SECTION_COPY					\${LANG_KOREAN}		"프로그램 설치"
LangString TXT_SECTION_COPY_RESOURCE		\${LANG_KOREAN}		"구성 요소 설치"
LangString TXT_SECTION_CREATEDESKTOPICON	\${LANG_KOREAN}		"바탕 화면에 단축 아이콘 생성"
LangString TXT_SECTION_CREATEQUICKLAUNCH	\${LANG_KOREAN}		"빠른 실행 단축 아이콘 생성"
LangString TXT_SECTION_CREATSTARTMENU		\${LANG_KOREAN}		"시작 메뉴 단축 아이콘 생성"

LangString TXT_PROGRAM_GROUP_NAME			\${LANG_KOREAN}		"\${PROGRAM_GROUP_NAME}"

LangString TXT_DELETE_ALL_FILES				\${LANG_KOREAN}		\\
"프로그램이 설치된후 생성된 파일등이 설치 폴더($INSTDIR)에 일부 남아 있습니다.\\
$\\r$\\n$\\r$\\n프로그램이 설치 되었던 폴더를 완전히 삭제하시겠습니까?"

LangString TXT_STILL_RUN_EXIT_PROGRAM		\${LANG_KOREAN}		\\
"\${PRODUCT_NAME} 프로그램이 실행중 입니다.\\
$\\r$\\n$\\r$\\n프로그램을 강제 종료하시겠습니까?"

LangString TXT_INSTALL_CANCEL				\${LANG_KOREAN}		\\
"프로그램 설치를 종료합니다.\\
$\\r$\\n$\\r$\\n\${PRODUCT_NAME} 프로그램 종료 후 다시 시도 바랍니다."

LangString TXT_UNINSTALL_CANCEL				\${LANG_KOREAN}		\\
"프로그램 제거를 종료합니다.\\
$\\r$\\n$\\r$\\n\${PRODUCT_NAME} 프로그램 종료 후 다시 시도 바랍니다."

# Section 이름 : [/o] [([!]|[-])section_name] [section index output]
; (!) 설치 구성요소 박스에서 BOLD 표시됨
; (-) 감추기
; (/o) 체크 해지 상태

;##########################################################
; 기능 정의
;##########################################################

${ await this.checkAndCloseApp() }

${ await this.fileAssociation() }

;##########################################################
; 인스톨
;##########################################################

${ await this.prevUninstall() }

;----------------------------------------------------------
; 파일 설치, 제거
;----------------------------------------------------------

${ await this.installAppLauncher() }
${ await this.installChildApp() }
${ await this.childAppProcess() }
${ await this.installResource() }

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
	WriteRegStr \${REG_ROOT_KEY} "\${REG_APPDIR_KEY}" "Install_Dir" "$INSTDIR"
	WriteRegStr \${REG_ROOT_KEY} "\${REG_APPDIR_KEY}" "" 			"$INSTDIR\\\${EXE_FILE_FULL_NAME}"

	;-------------
	; registry - uninstall info
	WriteRegStr \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}" "DisplayName" 			"$(^Name)"
	WriteRegStr \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}" "UninstallString" 		"$INSTDIR\\\${UNINSTALL_NAME}"
	WriteRegStr \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}" "DisplayIcon" 			"$INSTDIR\\\${EXE_FILE_FULL_NAME}"

	WriteRegStr \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}" "DisplayVersion" 		"\${PRODUCT_VERSION}"
	WriteRegStr \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}" "URLInfoAbout" 			"\${PRODUCT_WEBSITE}"
	WriteRegStr \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}" "Publisher" 			"\${PRODUCT_PUBLISHER}"

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

${ await this.createProgramGroup() }

${ await this.createDesktopIcon() }

${ await this.createQuickIcon() }

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

	; App에서 필요한 uninstall 과정 진행
	Call un.ChildAppProcess
	
	; 설치 파일 제거
	Call un.Install_App_Launcher
	Call un.Install_App_Child
	Call un.Install_Resource

	SetDetailsPrint both
	
	${ await this.deleteProgramGroup() }
	${ await this.deleteIcons() }

	;-------------
	; 등록 정보 지우기
	DeleteRegKey \${REG_ROOT_KEY} "\${REG_APPDIR_KEY}"
	DeleteRegKey \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}"

	Call un.FileAssociate
SectionEnd

;####################################################################################################################
; 유틸 함수
;####################################################################################################################

Function .onInit
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
Unicode 					true
SetCompress					off										; 압축 여부(auto|force|off) ( off 로 놓으면 테스트 하기 편하다 )
#SetCompressor				lzma									; 압축방식 (zlib|bzip2|lzma)
SetCompressor 				${ this.options.solid ? '/SOLID' : '' } ${ this.options.compression }

ShowInstDetails 			hide									; 설치내용 자세히 보기 여부(hide|show|nevershow)
ShowUninstDetails 			hide									; 언인스톨 자세히 보기 여부(hide|show|nevershow)
SetOverwrite				on										; 파일 복사시 기본적으로 덮어쓰기 한다(디폴트) (on|off|try|ifnewer|lastused)

AutoCloseWindow				true									; 완료후 설치프로그램 자동 닫기
AllowRootDirInstall			false									; 루트 폴더에 설치하지 못하도록 한다.
CRCCheck					on										; 시작시 CRC 검사를 한다. (디폴트) (on|off|force)
XPStyle						on										; xp manifest 사용 여부

Name 						"\${PRODUCT_NAME}"						; 기본 이름
OutFile 					"\${OUTFILE_NAME}"						; 출력 파일
InstallDir 					"\${EXE_FILE_DIR}"						; 설치 폴더
InstallDirRegKey			\${REG_ROOT_KEY} "\${REG_APPDIR_KEY}" "Install_Dir"

;----------------------------------------------------------
; Request application privileges for Windows Vista
;----------------------------------------------------------
RequestExecutionLevel admin

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

#!define MUI_COMPONENTSPAGE_SMALLDESC						; 설치 옵션 설명칸이 작게..
!define MUI_COMPONENTSPAGE_NODESC							; 설치 옵션 설명칸 없음

;----------------------------------------------------------
; installer or uninstaller 닫을 경우 경고 메시지 상자를 출력
;----------------------------------------------------------
!define MUI_ABORTWARNING									; 설치 취소시 경고 메시지 뿌리기
!define MUI_UNABORTWARNING

;----------------------------------------------------------
; finishpage noAutoClose
;----------------------------------------------------------
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_UNFINISHPAGE_NOAUTOCLOSE						; 언인스톨 종료시 자동으로 닫히지 않게 하기.

!define MUI_FINISHPAGE_RUN 	"$INSTDIR\\\${EXE_FILE_FULL_NAME}"	; 종료후 프로그램 자동 실행 여부 물어 보기
;!define MUI_FINISHPAGE_RUN_NOTCHECKED						; 자동 실행을 기본적으로 체크 안하길 원할경우.

;##########################################################
; MUI Pages : https://nsis.sourceforge.io/Docs/Modern%20UI/Readme.html
;##########################################################

#!define MUI_THEME "\${NSISDIR}\\Contrib\\Graphics"
!define MUI_THEME "${ this.options.theme ? win32.normalize(resolve(this.options.theme)) : '\${NSISDIR}\\theme'}"

!define MUI_INSTFILESPAGE_PROGRESSBAR colored				; Default: smooth ("" | colored | smooth)
!define MUI_INSTALLCOLORS	"203864 bdc4d1"					; 설치 화면 글자/배경색 지정
#!define MUI_LICENSEPAGE_BGCOLOR /windows					; 라이센스 배경 컬러 (/windows | /grey | color)

;----------------------------------------------------------
; 인스톨러 & 언인스톨러 아이콘 설정
;----------------------------------------------------------
!define MUI_ICON 							"\${MUI_THEME}\\install.ico"
!define MUI_UNICON 							"\${MUI_THEME}\\uninstall.ico"

;----------------------------------------------------------
; Page Design
;----------------------------------------------------------

#!define MUI_HEADERIMAGE_RIGHT								; 헤더 비트맵을 오른쪽에 표시
#!define MUI_BGCOLOR 203864 									; 헤더 배경색 Default: FFFFFF
#!define MUI_TEXTCOLOR bdc4d1 								; 헤더 글자색 Default: 000000
#!define MUI_HEADER_TRANSPARENT_TEXT

; Header image (150x53)
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP_NOSTRETCH
!define MUI_HEADERIMAGE_BITMAP 				"\${MUI_THEME}\\header.bmp"
!define MUI_HEADERIMAGE_UNBITMAP_NOSTRETCH
!define MUI_HEADERIMAGE_UNBITMAP 			"\${MUI_THEME}\\header-uninstall.bmp"

; Welcome & Finish page image (164x290)
!define MUI_WELCOMEFINISHPAGE_BITMAP_NOSTRETCH
!define MUI_WELCOMEFINISHPAGE_BITMAP 		"\${MUI_THEME}\\wizard.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP_NOSTRETCH
!define MUI_UNWELCOMEFINISHPAGE_BITMAP 		"\${MUI_THEME}\\wizard-uninstall.bmp"

		`;
	}

	protected async MUIPages(): Promise<string> {
		return `
;----------------------------------------------------------
; Installer page
;----------------------------------------------------------
!insertmacro MUI_PAGE_WELCOME							; 시작 환영 페이지
!insertmacro MUI_PAGE_LICENSE "${ this.options.license ? win32.normalize(resolve(this.options.license)) : ''}"
!insertmacro MUI_PAGE_COMPONENTS						; 컴포넌트 선택
!insertmacro MUI_PAGE_DIRECTORY							; 디렉토리 선택
!insertmacro MUI_PAGE_INSTFILES							; 설치중
!insertmacro MUI_PAGE_FINISH							; 종료 페이지 보이기

;----------------------------------------------------------
; Uninstaller pages
;----------------------------------------------------------
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM							; 언인스톨
#!insertmacro MUI_UNPAGE_LICENSE "textfile"
#!insertmacro MUI_UNPAGE_COMPONENTS
#!insertmacro MUI_UNPAGE_DIRECTORY
!insertmacro MUI_UNPAGE_INSTFILES						; 파일 삭제 진행 상황
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
	SetDetailsPrint listonly		; none|listonly|textonly|both|lastused
	
	; 실행 종료시까지 기다림 (/S: silent)
	ExecWait "$6 /S _?=$INSTDIR" ;Do not copy the uninstaller to a temp file

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

	protected async createProgramGroup(): Promise<string> {
		return `
;----------------------------------------------------------
; 프로그램 그룹 생성
;----------------------------------------------------------

; 프로그램 폴더 설치시 "현재사용자" 에게만 설치할 것인지 "모든 사용자" 에게 설치할 것인지를 결정 (current|all)
!define	SHELL_VAR_CONTEXT_PROGG		"all"					; 프로그램 그룹 생성에서 사용
!define	SHELL_VAR_CONTEXT_ICON		"current"				; 단축아이콘 생성에서 사용

Section $(TXT_SECTION_CREATSTARTMENU)

	; 시작 메뉴 단축 아이콘 - $SMPROGRAMS
	; 위치 : C:/ProgramData/Microsoft/Windows/Start Menu/Programs/

	SetShellVarContext	\${SHELL_VAR_CONTEXT_PROGG}
	SetOutPath			"$SMPROGRAMS\\$(TXT_PROGRAM_GROUP_NAME)\\"
	SetOutPath			"$INSTDIR"
	CreateShortCut		"$SMPROGRAMS\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME}.lnk"			"$INSTDIR\\\${EXE_FILE_FULL_NAME}" 	"" "" 0
	CreateShortCut		"$SMPROGRAMS\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME} 제거.lnk"	"$INSTDIR\\\${UNINSTALL_NAME}"	"" "" 0

	; 시작 메뉴 단축 아이콘 - $STARTMENU
	; 위치 : C:\\Users\\pdi10\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu

	SetShellVarContext	\${SHELL_VAR_CONTEXT_ICON}
	SetOutPath			"$STARTMENU\\Programs\\$(TXT_PROGRAM_GROUP_NAME)\\"
	SetOutPath			"$INSTDIR"
	CreateShortCut		"$STARTMENU\\Programs\\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME}.lnk" 		"$INSTDIR\\\${EXE_FILE_FULL_NAME}" "" "" 0
	CreateShortCut		"$STARTMENU\\Programs\\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME} 제거.lnk"	"$INSTDIR\\\${UNINSTALL_NAME}"	"" "" 0
SectionEnd

		`;
	}

	protected async createDesktopIcon(): Promise<string> {
		return `
;----------------------------------------------------------
; 바탕화면에 바로가기 아이콘 - $DESKTOP
;----------------------------------------------------------

Section $(TXT_SECTION_CREATEDESKTOPICON)
	SetShellVarContext	\${SHELL_VAR_CONTEXT_ICON}
	SetOutPath			$INSTDIR
	CreateShortCut 		"$DESKTOP\\\${EXE_FILE_NAME}.lnk" "$INSTDIR\\\${EXE_FILE_FULL_NAME}" "" "" 0
SectionEnd

		`;
	}

	protected async createQuickIcon(): Promise<string> {
		return `
;----------------------------------------------------------
; 빠른 실행 아이콘 - $QUICKLAUNCH (도구 모음 > shell:quick launch)
;----------------------------------------------------------

Section $(TXT_SECTION_CREATEQUICKLAUNCH)
	SetShellVarContext	\${SHELL_VAR_CONTEXT_ICON}
	SetOutPath			$INSTDIR
	CreateShortCut		"$QUICKLAUNCH\\\${EXE_FILE_NAME}.lnk" "$INSTDIR\\\${EXE_FILE_FULL_NAME}" "" "" 0
SectionEnd

		`;
	}

	protected async deleteProgramGroup(): Promise<string> {
		return `
	;-------------
	; 프로그램 그룹 지우기
	SetShellVarContext	\${SHELL_VAR_CONTEXT_PROGG}								; 설치할때 프로그램 그룹이 설치된 위치.
	RMDir /r			"$SMPROGRAMS\\$(TXT_PROGRAM_GROUP_NAME)"				; 프로그램 그룹 지우기

	SetShellVarContext	\${SHELL_VAR_CONTEXT_ICON}
	RMDir /r			"$STARTMENU\\Programs\\$(TXT_PROGRAM_GROUP_NAME)\\"		; 시작 메뉴 아이콘 그룹 지우기

		`;
	}

	protected async deleteIcons(): Promise<string> {
		return `
	;-------------
	; 단축 아이콘 지우기
	SetShellVarContext current									; current 시작 단축 아이콘 지우기
		Delete	"$DESKTOP\\\${EXE_FILE_NAME}.lnk"						; 바탕화면 단축 아이콘
		Delete	"$QUICKLAUNCH\\\${EXE_FILE_NAME}.lnk"					; 빠른 실행
		;Delete	"$STARTMENU\\Programs\\(EXE_FILE_NAME).lnk"				; 시작 메뉴
		;Delete	"$SMSTARTUP\\\${EXE_FILE_NAME}.lnk"
		
	SetShellVarContext all										; all 시작 단축 아이콘 지우기
		Delete	"$DESKTOP\\\${EXE_FILE_NAME}.lnk"						; 바탕화면 단축 아이콘
		Delete	"$QUICKLAUNCH\\\${EXE_FILE_NAME}.lnk"					; 빠른 실행
		;Delete	"$STARTMENU\\Programs\\\${EXE_FILE_NAME}.lnk"			; 시작 메뉴
		;Delete	"$SMSTARTUP\\\${EXE_FILE_NAME}.lnk"
		
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

		let resourceExcludesString: string = '';
		if(this.options.resource && this.options.resource.src) {
			resourceExcludesString = ('/x "' + this.options.resource.src + '"');
		}
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
	File /nonfatal /a /r ${resourceExcludesString} .\\*.*
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
	StrCmp "\${CHROME_APP_LAUNCHER}" "" ok
		;MessageBox MB_OK "삭제: \${CHROME_APP_LAUNCHER}"
		RMDir /r "\${CHROME_APP_LAUNCHER}"
	ok:
FunctionEnd
		`;
	}

	protected async installChildApp(): Promise<string> {
		const childApp = this.options.childApp;
		if(!childApp || !childApp.dest) {
			return `
!macro Install_App_Child
!macroend
Function un.Install_App_Child
FunctionEnd
			`;
		}

		// /x "assets" /x "package.json"
		const childAppExcludesString = childApp.excludes.map(p => ('/x "' + p + '"')).join(' ');
		const chromeAppName = childApp.name ? '$LOCALAPPDATA\\' + childApp.name : '';

		return `
;----------------------------
; Child App 복사
;----------------------------

!define CHROME_APP_CHILD			"${ chromeAppName }"

# 서브 App 리소스 (nwJS App) - 런처가 실행할 app
!define CHILD_APP_DEST 				"${ childApp.dest ? win32.normalize(childApp.dest) : ''}"

; Program Files 폴더에서 nwJS App을 런처로 사용하고자 할 경우 권한 문제가 발생한다.
; 설치된 $INSTDIR 폴더는 런처 app 으로 사용하고
; nwJS 실행파일 리소스를 권한이 필요없는 폴더로 복사하여 실행 한다.
; 하나의 nwJS 리소스로 런처 및 app으로 구동 시킬수 없다.
!macro Install_App_Child

	StrCmp "\${CHILD_APP_DEST}" "" skipChildApp
		StrCpy $9 "\${CHILD_APP_DEST}"
		RMDir /r $9

		; child app 설치 위치 
		SetOutPath $9
		
		; nwJS 설치 (installer 파일 그대로 사용),
		;File /r /x "assets" /x "package.json" .\\*.*
		File /nonfatal /a /r ${childAppExcludesString} /x "uninstall" .\\*.*
		
		; uninstall 폴더 따로 처리 (excludes 목록이 /r 처리되기 때문에 파일 유실됨)
		File /nonfatal /a /r "uninstall"
	skipChildApp:
!macroend

Function un.Install_App_Child
	; childApp 폴더 삭제
	RMDir /r "\${CHILD_APP_DEST}"
	
	; nw 실행시 생성되는 chrome app 폴더 삭제
	StrCmp "\${CHROME_APP_CHILD}" "" skipChildApp
		;MessageBox MB_OK "삭제: \${CHROME_APP_CHILD}"
		RMDir /r "\${CHROME_APP_CHILD}"
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

		const resource: any = this.options.resource;
		const otherUninstall = this.options.uninstall ? win32.normalize(this.options.uninstall) : '';
		if(!resource && !otherUninstall) return empty;

		const resourceSrc = resource.src ? win32.normalize(resource.src) : '';
		const resourceDest = resource.dest ? win32.normalize(resource.dest) : '';

		return `
;----------------------------
; 버전별 리소스 폴더 생성
;----------------------------

# 압축 파일 extract 정보 
!define RESOURCE_SRC 				"${ resourceSrc }"
!define RESOURCE_DEST 				"${ resourceDest }"
!define OTHER_UNINSTALL_DEST 		"${ otherUninstall }"

!macro Install_Resource
	StrCmp "\${RESOURCE_DEST}" "" ok
	RMDir /r 	"\${RESOURCE_DEST}"
	
	StrCmp "\${RESOURCE_SRC}" "" ok
		SetOutPath				"\${RESOURCE_DEST}"
		File /nonfatal /a /r 	"\${RESOURCE_SRC}\\*"
		;File /nonfatal /a /r 	assets\\*
	ok:
!macroend

; 버전별 리소스 폴더 삭제
Function un.Install_Resource
	StrCmp "\${RESOURCE_DEST}" "" skipDest
		Delete 		"\${RESOURCE_DEST}\\*.*"
		RMDir /r 	"\${RESOURCE_DEST}"
		
	skipDest:
		; 추가로 지정한 폴더 지우기
		StrCmp "\${OTHER_UNINSTALL_DEST}" "" ok
			Delete 		"\${OTHER_UNINSTALL_DEST}\\*.*"
			RMDir /r 	"\${OTHER_UNINSTALL_DEST}"
			
			; 파일이 아직 남아 있으면..
			IfFileExists \${OTHER_UNINSTALL_DEST}*.* 0 ok
				RMDir /r 		"\${OTHER_UNINSTALL_DEST}"
				RMDir /REBOOTOK "\${OTHER_UNINSTALL_DEST}"
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
	# $INSTDIR : "C:\\Program Files (x86)\\tovsoft\\Test App"
	StrCpy $1 "${ exeFileFullName }"
		
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
	# $INSTDIR : "C:\\Program Files (x86)\\tovsoft\\Test App"
	StrCpy $1 "${ exeFileFullName }"
		
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
		if(!associate || associate.length < 1) {
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
			if(!info.ext) return '';

			const ext = info.ext;
			const fileClass = info.fileClass || ('Ext.' + ext);
			const description = info.description || '';
			const icon = '$INSTDIR\\' + win32.normalize(info.icon) || exePath + ',0';
			const commandText = info.commandText || 'Open with \${EXE_FILE_NAME} Application';
			const command = info.command || exePath + ' $\\"%1$\\"';

			/*
			;!insertmacro APP_ASSOCIATE 		"확장자명" "확장자 유형" "확장자 설명"
			;									"아이콘"
			;									"COMMANDTEXT" "COMMAND"

			!insertmacro APP_ASSOCIATE 			"jik" "Jik-ji.project" "JIK-JI Editor Project File"
												"$INSTDIR\assets\exeIcon.ico"
												"Open with Jik-ji Editor" "$INSTDIR\${EXE_FILE_FULL_NAME} $\"%1$\""
			!insertmacro APP_ASSOCIATE 			"jikp" "Jik-ji.project" "JIK-JI Editor Project File"
												"$INSTDIR\assets\exeIcon.ico"
												"Open with Jik-ji Editor" "$INSTDIR\${EXE_FILE_FULL_NAME} $\"%1$\""
			*/
			// 	!insertmacro APP_ASSOCIATE "확장자명" "확장자 유형" "확장자 설명" "아이콘" "COMMANDTEXT" "COMMAND"
			return `!insertmacro APP_ASSOCIATE "${ext}" "${fileClass}" "${description}" "${icon}" "${commandText}" "${command}"`;
		}).join('\n\t');

		const APP_UNASSOCIATE = associate.map((info) => {
			if(!info.ext) return '';
			const ext = info.ext;
			const fileClass = info.fileClass || ('Ext.' + ext);

			/*
            ; !insertmacro APP_UNASSOCIATE 		"확장자명" "확장자 유형"
            !insertmacro APP_UNASSOCIATE 		"jik" "Jikji.project"
            !insertmacro APP_UNASSOCIATE 		"jikp" "Jikji.project"
            */
			// !insertmacro APP_UNASSOCIATE	"jikp" "Jikji.project"
			return `!insertmacro APP_UNASSOCIATE "${ext}" "${fileClass}"`;
		}).join('\n\t');

		return `
;----------------------------------------------------------
; 파일 실행 확장자 등록
;----------------------------------------------------------

; File Association
!include "FileAssociation.nsh"

Function FileAssociate
	${ APP_ASSOCIATE }
	
	; explorer 갱신
	!insertmacro UPDATEFILEASSOC
FunctionEnd

Function un.FileAssociate
	${ APP_UNASSOCIATE }
	
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
		if(!childApp || !childApp.dest) {
			return `
!macro ChildAppProcess
!macroend
Function un.ChildAppProcess
FunctionEnd
			`;
		}

		return `
;----------------------------------------------------------
; App 호출하여 특정 로직을 실행
;----------------------------------------------------------

!include "StdUtils.nsh"
;ShowInstDetails show

!macro ChildAppProcess
    ;MessageBox MB_OK "\${CHILD_APP_DEST}"
!macroend

Function un.ChildAppProcess
	StrCmp "\${CHILD_APP_DEST}" "" skipChildProcess

		# "C:/Users/pdi10/AppData/Local/testApp5"
		# DetailPrint 'CHROME_APP_LAUNCHER: "\${CHROME_APP_LAUNCHER}"'
		
		# "C:/Users/pdi10/AppData/Local/jikji.editor.testapp"
		# DetailPrint 'CHROME_APP_CHILD: "\${CHROME_APP_CHILD}"'
		
		# "C:/Users/pdi10/AppData/Local/jikji.editor.demo.setup/testapp"
		# DetailPrint 'CHILD_APP_DEST: "\${CHILD_APP_DEST}"'
		
		# "testApp3.exe"
		# DetailPrint 'EXE_FILE_FULL_NAME: "\${EXE_FILE_FULL_NAME}"'
		
		Var /GLOBAL childAppPath
		StrCpy $childAppPath "\${CHILD_APP_DEST}\\\${EXE_FILE_FULL_NAME}"
		
		Var /GLOBAL uninstallAppFolder
		StrCpy $uninstallAppFolder "\${CHILD_APP_DEST}\\uninstall"
		
		DetailPrint 'childAppPath: "$childAppPath"'
		DetailPrint 'uninstallAppFolder: "$uninstallAppFolder"'
		
		# child app 호출하여 필요한 uninstall 과정 진행
		# exe 파일을 실행한다. try to launch the process
		
		\${StdUtils.ExecShellWaitEx} $0 $1 "$childAppPath" "open" "$uninstallAppFolder"
		
    	# returns "ok", "no_wait" or "error".
		StrCmp $0 "error" ExecFailed 			;check if process failed to create
		StrCmp $0 "no_wait" WaitNotPossible 	;check if process can be waited for - always check this!
		StrCmp $0 "ok" WaitForProc 				;make sure process was created successfully
		Abort
		
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
			Goto skipChildProcess
	skipChildProcess:
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

}

// NSIS 사용시에 2GB 이상의 대용량 배포의 문제점
// https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=sbspace&logNo=130163195164
// NSIS를 이용한 압축 파일 배포(NSIS 7Z PLUGIN)
// https://www.yuno.org/426
// Nsis7z plug-in
// https://nsis.sourceforge.io/Nsis7z_plug-in



