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

	icon: string;
	unIcon: string;
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

}

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
	}

	// https://nsis.sourceforge.io/
	// NSIS reference: https://nimto.tistory.com/m/71?category=174039
	// NSIS reference 2 : https://nsis.sourceforge.io/Docs/Modern%20UI/Readme.html
	// 나무위키 : https://namu.wiki/w/NSIS
	// 기본 구조 참고함 : https://wonsx.tistory.com/23
	// 샘플 & 해설: https://m.blog.naver.com/PostView.nhn?blogId=ratmsma&logNo=40028387013&proxyReferer=https:%2F%2Fwww.google.com%2F
	// 샘플2 : https://www.newnnow.co.kr/36
	// http://csk6124-textcube.blogspot.com/2011/02/nsis.html
	// https://jabis.tistory.com/3
	// 설치후 사용자 권한으로 작업 실행
	// http://egloos.zum.com/pelican7/v/3086158

	public async make(): Promise<string> {

		return `
;##########################################################
; define Settings
;##########################################################

# setup 파일 경로
!define OUTFILE_NAME				"${ win32.normalize(resolve(this.options.output)) }"

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
!define EXE_FILE_FULL_NAME		"\${EXE_FILE_NAME}.exe"
!define PROGRAM_GROUP_NAME		"${ this.options.programGroupName }"			; 프로그램 그룹 이름
!define	UNINSTALL_NAME			"uninstall.exe"									; 언인스톨러 이름

;----------------------------------------------------------
; 레지스트리 키 지정
;----------------------------------------------------------

!define REG_ROOT_KEY 			"HKLM"
!define REG_UNROOT_KEY 			"HKLM"
!define REG_APPDIR_KEY 			"Software\\Microsoft\\Windows\\CurrentVersion\\App Path\\\${EXE_FILE_FULL_NAME}"
!define REG_UNINST_KEY 			"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\\${PRODUCT_NAME}"

;####################################################################################################################
; MUI Settings
;####################################################################################################################

;----------------------------------------------------------
; Request application privileges for Windows Vista
;----------------------------------------------------------
RequestExecutionLevel admin

;----------------------------------------------------------
; include
;----------------------------------------------------------
!include "MUI2.nsh"

;----------------------------------------------------------
; 인스톨러 & 언인스톨러 아이콘 설정
;----------------------------------------------------------
!define MUI_ICON 		"${ this.options.icon ? win32.normalize(resolve(this.options.icon)) : ''}"
!define MUI_UNICON 		"${ this.options.unIcon ? win32.normalize(resolve(this.options.unIcon)) : ''}"

;----------------------------------------------------------
; installer or uninstaller 닫을 경우 경고 메시지 상자를 출력
;----------------------------------------------------------
!define MUI_ABORTWARNING
!define MUI_UNABORTWARNING

;----------------------------------------------------------
; finishpage noAutoClose
;----------------------------------------------------------
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_UNFINISHPAGE_NOAUTOCLOSE						; 언인스톨 종료시 자동으로 닫히지 않게 하기.

;##########################################################
; MUI Pages
;##########################################################

#!define MUI_COMPONENTSPAGE_SMALLDESC						; 설치 옵션 설명칸이 작게..
!define MUI_COMPONENTSPAGE_NODESC							; 설치 옵션 설명칸 없음

!define MUI_FINISHPAGE_RUN 	"$INSTDIR\\\${EXE_FILE_FULL_NAME}"	; 종료후 프로그램 자동 실행 여부 물어 보기
;!define MUI_FINISHPAGE_RUN_NOTCHECKED						; 자동 실행을 기본적으로 체크 안하길 원할경우.

# MUI 기본 설정 (잘 안쓰는것들)
#!define MUI_HEADERBITMAP_RIGHT								; 헤더 비트맵을 오른쪽에 표시
#!define MUI_ABORTWARNING									; 설치 취소시 경고 메시지 뿌리기
#!define MUI_INSTALLCOLORS	"FFFFFF 000000"					; 설치 화면 글자/배경색 지정
#!define MUI_PROGRESSBAR 	colored

;----------------------------------------------------------
; Page Design
;----------------------------------------------------------
!define MUI_BGCOLOR FFFFFF ; Default: FFFFFF

; installer or uninstaller Header image (150x57)
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP_NOSTRETCH
!define MUI_HEADERIMAGE_BITMAP 				"\${NSISDIR}\\Contrib\\Graphics\\header\\orange.bmp"
!define MUI_HEADERIMAGE_UNBITMAP_NOSTRETCH
!define MUI_HEADERIMAGE_UNBITMAP 			"\${NSISDIR}\\Contrib\\Graphics\\Header\\orange-uninstall.bmp"

; installer Welcome & Finish page image (191x290)
!define MUI_WELCOMEFINISHPAGE_BITMAP_NOSTRETCH
!define MUI_WELCOMEFINISHPAGE_BITMAP 		"\${NSISDIR}\\Contrib\\Graphics\\Wizard\\orange.bmp"

; uninstaller Welcome & Finish page image (191x290)
!define MUI_UNWELCOMEFINISHPAGE_BITMAP_NOSTRETCH
!define MUI_UNWELCOMEFINISHPAGE_BITMAP 		"\${NSISDIR}\\Contrib\\Graphics\\Wizard\\orange-uninstall.bmp"

BrandingText 								"\${PRODUCT_COMPANY} - \${PRODUCT_WEBSITE}"
LicenseBkColor								F5F5FF									; 라이센스 배경 컬러

;####################################################################################################################
; NSIS Settings
;####################################################################################################################

Unicode 					true
SetCompress					off										; 압축 여부(auto|force|off) ( off 로 놓으면 테스트 하기 편하다 )
#SetCompressor				lzma									; 압축방식 (zlib|bzip2|lzma)
SetCompressor 				${ this.options.solid ? '/SOLID' : '' } ${ this.options.compression }

ShowInstDetails 			show									; 설치내용 자세히 보기 여부(hide|show|nevershow)
ShowUninstDetails 			show									; 언인스톨 자세히 보기 여부(hide|show|nevershow)
SetOverwrite				on										; 파일 복사시 기본적으로 덮어쓰기 한다(디폴트) (on|off|try|ifnewer|lastused)

AutoCloseWindow				true									; 완료후 설치프로그램 자동 닫기
AllowRootDirInstall			false									; 루트 폴더에 설치하지 못하도록 한다.
CRCCheck					on										; 시작시 CRC 검사를 한다. (디폴트) (on|off|force)
XPStyle						on										; xp manifest 사용 여부

Name 						"\${PRODUCT_NAME}"						; 기본 이름
OutFile 					"\${OUTFILE_NAME}"						; 출력 파일
InstallDir 					"\${EXE_FILE_DIR}"						; 설치 폴더

InstallDirRegKey \${REG_ROOT_KEY} "\${REG_APPDIR_KEY}" "Install_Dir"

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
!insertmacro MUI_UNPAGE_INSTFILES						; 파일 삭제 진행 상황

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
LangString TXT_UNINSTALL					\${LANG_KOREAN}		"이전 버전을 제거하는 중입니다. 잠시 기다려 주세요."
LangString TXT_SECTION_UNINSTALL			\${LANG_KOREAN}		"이전 버전 삭제"
LangString TXT_EXTRACTING					\${LANG_KOREAN}		"설치하는 동안 잠시 기다려 주세요."
LangString TXT_SECTION_COPY					\${LANG_KOREAN}		"프로그램 설치"
LangString TXT_SECTION_COPY_RESOURCE		\${LANG_KOREAN}		"구성 요소 설치"
LangString TXT_SECTION_CREATEDESKTOPICON	\${LANG_KOREAN}		"바탕 화면에 단축 아이콘 생성"
LangString TXT_SECTION_CREATEQUICKLAUNCH	\${LANG_KOREAN}		"빠른 실행 단축 아이콘 생성"
LangString TXT_SECTION_CREATSTARTMENU		\${LANG_KOREAN}		"시작 메뉴 단축 아이콘 생성"

LangString TXT_DELETE_ALL_FILES				\${LANG_KOREAN}		"프로그램이 설치된후 생성된 파일등이 설치 폴더($INSTDIR)에 일부 남아 있습니다.$\\r$\\n$\\r$\\n프로그램이 설치 되었던 폴더를 완전히 삭제하시겠습니까?"
LangString TXT_PROGRAM_GROUP_NAME			\${LANG_KOREAN}		"\${PROGRAM_GROUP_NAME}"

LangString TXT_STILL_RUN_EXIT_PROGRAM		\${LANG_KOREAN}		"\${PRODUCT_NAME} 프로그램이 실행중 입니다.$\\r$\\n$\\r$\\n프로그램을 강제 종료하시겠습니까?"

# Section 이름 : [/o] [([!]|[-])section_name] [section index output]
; (!) 설치 구성요소 박스에서 BOLD 표시됨
; (-) 감추기
; (/o) 체크 해지 상태

;##########################################################
; 인스톨
;##########################################################

;----------------------------------------------------------
# 이전 버전 삭제
;----------------------------------------------------------

Section -$(TXT_SECTION_UNINSTALL)
	; 설치 섹션 "RO" 는 Read Only (해제 불가)
	SectionIn RO

	Push $6
	ReadRegStr "$6" \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}" "UninstallString" ; 기존버전 설치유뮤 확인
	
	StrCmp "$6" "" done

	ClearErrors
	DetailPrint $(TXT_UNINSTALL)
	
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

SectionEnd

;----------------------------------------------------------
# 설치 : 기본 파일 복사
;----------------------------------------------------------

Section !$(TXT_SECTION_COPY)
	; 설치 섹션 "RO" 는 Read Only (해제 불가)
	SectionIn RO

	DetailPrint $(TXT_EXTRACTING)
	SetDetailsPrint listonly

	; 설치 파일 복사
	Call Install

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

SectionEnd














;----------------------------------------------------------
# 설치 : 리소스 파일 복사
;----------------------------------------------------------

/*
# 기본 압축 해제 명령에 % 표시 기능을 추가 한 명령.
Nsis7z::ExtractWithDetails "DATA.7z" "Installing package %s..." 와 같이 
2번째 파라미터에 스트링을 넘겨 주면 그에 알맞게 % 표시를 해준다. 
위의 명령을 예로 들면 
Installing package %s... 을 
Installing package 퍼센트% ( 현재 용량 / 전체 용량 ) 으로 표시해준다.
*/


; download & copy the 'FindProcDLL.dll' in your NSIS plugins directory
; (...nsis/Plugins[/platform])
; https://nsis.sourceforge.io/Nsisunz_plug-in


Section "Extract"

	/*
	SetOutPath "PATH"
	SetOverwrite ifnewer
	File "7za.exe"
	File "File.7z"
	nsis7z::extract "File.7z"
	delete "7za.exe"
	delete "libraries.7z"
	*/

	CreateDirectory "$PluginsDir\\TestDir"
	nsisunz::Unzip "$PluginsDir\\test.zip" "$PluginsDir\\TestDir"

SectionEnd


/*

압축 해지 및 복사
nwJS 설치
firstrun, (nw) 압축 해지



;TXT_SECTION_COPY_RESOURCE
Function InstallResource
	
	; 여기에 설치를 원하는 파일을 나열한다.
	SetOutPath "$INSTDIR"
	File /r .\\*.*

	; 서브디렉토리에도 파일 설치를 원할경우 아래와 같은 방법을 사용한다.
	;SetOutPath $INSTDIR\\assets
	;File .\\assets\\*.*
FunctionEnd
*/



/*
(un)설치할때
jikji.editor.demo.launcher 제거
jikji.editor.demo 제거
firstrun, (nw) 제거
*/















;##########################################################
; 설치 (기타)
;##########################################################

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
	SetOutPath			$INSTDIR
	CreateShortCut		"$SMPROGRAMS\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME}.lnk"			"$INSTDIR\\\${EXE_FILE_FULL_NAME}" 	"" "" 0
	CreateShortCut		"$SMPROGRAMS\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME} 제거.lnk"	"$INSTDIR\\\${UNINSTALL_NAME}"	"" "" 0

	; 시작 메뉴 단축 아이콘 - $STARTMENU
	; 위치 : C:\\Users\\pdi10\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu

	SetShellVarContext	\${SHELL_VAR_CONTEXT_ICON}
	SetOutPath			"$STARTMENU\\Programs\\$(TXT_PROGRAM_GROUP_NAME)\\"
	SetOutPath			$INSTDIR
	CreateShortCut		"$STARTMENU\\Programs\\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME}.lnk" 		"$INSTDIR\\\${EXE_FILE_FULL_NAME}" "" "" 0
	CreateShortCut		"$STARTMENU\\Programs\\\$(TXT_PROGRAM_GROUP_NAME)\\\${EXE_FILE_NAME} 제거.lnk"	"$INSTDIR\\\${UNINSTALL_NAME}"	"" "" 0
SectionEnd

;----------------------------------------------------------
; 바탕화면에 바로가기 아이콘 - $DESKTOP
;----------------------------------------------------------

Section $(TXT_SECTION_CREATEDESKTOPICON)
	SetShellVarContext	\${SHELL_VAR_CONTEXT_ICON}
	SetOutPath			$INSTDIR
	CreateShortCut 		"$DESKTOP\\\${EXE_FILE_NAME}.lnk" "$INSTDIR\\\${EXE_FILE_FULL_NAME}" "" "" 0
SectionEnd

;----------------------------------------------------------
; 빠른 실행 아이콘 - $QUICKLAUNCH (도구 모음 > shell:quick launch)
;----------------------------------------------------------

Section $(TXT_SECTION_CREATEQUICKLAUNCH)
	SetShellVarContext	\${SHELL_VAR_CONTEXT_ICON}
	SetOutPath			$INSTDIR
	CreateShortCut		"$QUICKLAUNCH\\\${EXE_FILE_NAME}.lnk" "$INSTDIR\\\${EXE_FILE_FULL_NAME}" "" "" 0
SectionEnd

;##########################################################
; 언인스톨
;##########################################################

;----------------------------------------------------------
; 언인스톨
;----------------------------------------------------------

Section Uninstall

	; uninstall 파일 지우기.
	Delete "$INSTDIR\\\${UNINSTALL_NAME}"


	; 설치 파일 제거
	Call un.Install


	;-------------
	; 프로그램 그룹 지우기
	SetShellVarContext	\${SHELL_VAR_CONTEXT_PROGG}								; 설치할때 프로그램 그룹이 설치된 위치.
	RMDir /r			"$SMPROGRAMS\\$(TXT_PROGRAM_GROUP_NAME)"				; 프로그램 그룹 지우기

	SetShellVarContext	\${SHELL_VAR_CONTEXT_ICON}
	RMDir /r			"$STARTMENU\\Programs\\$(TXT_PROGRAM_GROUP_NAME)\\"		; 시작 메뉴 아이콘 그룹 지우기

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

	;-------------
	; 등록 정보 지우기
	DeleteRegKey \${REG_ROOT_KEY} "\${REG_APPDIR_KEY}"
	DeleteRegKey \${REG_UNROOT_KEY} "\${REG_UNINST_KEY}"

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
; 기존에 실행중인 프로그램 종료.
;----------------------------------------------------------

; download & copy the 'FindProcDLL.dll' in your NSIS plugins directory
; (...nsis/Plugins[/platform])
; https://nsis.sourceforge.io/FindProcDLL_plug-in
; https://ko.osdn.net/projects/sfnet_findkillprocuni/releases/

Function CheckAndCloseApp
	loop:
		FindProcDLL::FindProc "\${EXE_FILE_FULL_NAME}"
		StrCmp $R0 1 processFound done

	processFound:
		StrCmp $R8 "first" kill

		;MessageBox MB_OK "$(TXT_STILL_RUN_EXIT_PROGRAM)"
		MessageBox MB_ICONINFORMATION|MB_YESNO "설치할 $(TXT_STILL_RUN_EXIT_PROGRAM)" IDNO done
		StrCpy $R8 "first"
		goto kill

	kill:
		KillProcDLL::KillProc "\${EXE_FILE_FULL_NAME}"
		goto loop

	done:
FunctionEnd

; (uninstall) 기존에 실행중인 프로그램 종료.
Function un.CheckAndCloseApp
	loop:
		FindProcDLL::FindProc "\${EXE_FILE_FULL_NAME}"
		StrCmp $R0 1 processFound done

	processFound:
		StrCmp $R8 "first" kill

		;MessageBox MB_OK "$(TXT_STILL_RUN_EXIT_PROGRAM)"
		MessageBox MB_ICONINFORMATION|MB_YESNO "삭제할 $(TXT_STILL_RUN_EXIT_PROGRAM)" IDNO done
		StrCpy $R8 "first"
		goto kill

	kill:
		KillProcDLL::KillProc "\${EXE_FILE_FULL_NAME}"
		goto loop

	done:
FunctionEnd

;----------------------------------------------------------
; 파일 설치, 제거
;----------------------------------------------------------

Function Install
	
	; 여기에 설치를 원하는 파일을 나열한다.
	SetOutPath "$INSTDIR"
	File /r .\\*.*

	; 서브디렉토리에도 파일 설치를 원할경우 아래와 같은 방법을 사용한다.
	;SetOutPath $INSTDIR\\assets
	;File .\\assets\\*.*
	
FunctionEnd

Function un.Install
	
	; 설치된 폴더 지우기.
	RMDir /r "$INSTDIR"

	; 파일이 아직 남아 있으면..
	IfFileExists $INSTDIR\\*.* 0 skipDelete
		
		; 삭제 확인 메세지
		;MessageBox MB_ICONINFORMATION|MB_YESNO $(TXT_DELETE_ALL_FILES) IDNO skipDelete
		
		RMDir /r "$INSTDIR"
		RMDir /REBOOTOK "$INSTDIR"
	skipDelete:

FunctionEnd

        `;
	}

}
