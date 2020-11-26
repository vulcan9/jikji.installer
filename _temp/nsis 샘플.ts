
import { relative, resolve, win32 } from 'path';

import { readdir, lstat } from 'fs-extra';

import { fixWindowsVersion } from '../util';

export interface INsisComposerOptions {

	// Basic.
	appName: string;
	companyName: string;
	description: string;
	version: string;
	copyright: string;

	icon: string;
	unIcon: string;

	// Compression.
	compression: 'zlib' | 'bzip2' | 'lzma';
	solid: boolean;

	languages: string[];

	installDirectory: string;

	// Output.
	output: string;

}

export class NsisComposer {

	public static DIVIDER = '################################################################################';

	public static STRINGS: any = {
		'English': `
LangString CREATE_DESKTOP_SHORTCUT 1033 "Create Desktop Shortcut"
LangString INSTALLING 1033 "Installing"
        `,
		'SimpChinese': `
LangString CREATE_DESKTOP_SHORTCUT 2052 "创建桌面快捷方式"
LangString INSTALLING 2052 "正在安装"
        `,
		'TradChinese': `
LangString CREATE_DESKTOP_SHORTCUT 1028 "建立桌面捷徑"
LangString INSTALLING 1028 "安裝中"
        `,
		'PortugueseBR': `
LangString CREATE_DESKTOP_SHORTCUT 1046 "Criar atalho na área de trabalho"
LangString INSTALLING 1046 "Instalando"
        `,
		'German': `
LangString CREATE_DESKTOP_SHORTCUT 1031 "Verknüpfung auf Desktop anlegen"
LangString INSTALLING 1031 "Installiere"
        `,
		'Korean': `
LangString CREATE_DESKTOP_SHORTCUT 1042 "바탕화면에 바로가기 아이콘 생성"
LangString INSTALLING 1042 "설치중"
        `,
	};

	protected fixedVersion: string;

	constructor(protected options: INsisComposerOptions) {

		if(!this.options.appName) {
			this.options.appName = 'NO_APPNAME';
		}

		if(!this.options.companyName) {
			this.options.companyName = 'NO_COMPANYNAME';
		}

		if(!this.options.description) {
			this.options.description = 'NO_DESCRIPTION';
		}

		if(!this.options.version) {
			this.options.version = 'NO_VERSION';
		}

		if(!this.options.copyright) {
			this.options.copyright = 'NO_COPYRIGHT';
		}

		this.options.compression = this.options.compression || 'lzma';
		this.options.solid = this.options.solid ? true : false;
		this.options.languages = this.options.languages && this.options.languages.length > 0 ? this.options.languages : [ 'English' ];

		this.fixedVersion = fixWindowsVersion(this.options.version);

	}

	public async make(): Promise<string> {
		return `

#############################################################################################################
##
## 2004-01-09 새로운 구조로 최초 작성
##      01-29 템플릿 구성 시작
##      10-05 NOTEPAD 샘플 작성
##
## NSIS 예제 파일 작성 : hardkoder@gmail.com ( www.kipple.pe.kr )
##
#############################################################################################################

# 기본 내용 설정 (언어 종속)
!define TXT_NAME_K  			"메모장"					; 프로그램 이름
!define TXT_PUBLISHER_K			"키플"					; 프로그램 추가/제거에 보일 publisher 이름
!define TXT_LNKNAME_K			"메모장"					; 프로그램 그룹의 링크 이름
!define TXT_PROGRAM_GROUP_NAME_K	"키플"					; 프로그램 그룹 이름
!define TXT_BRANDING_K			"메모장 설치"				; 하단 branding text
!define TXT_COPANY_NAME_K		"키플"					; 인스톨러에 표시될 회사 이름
!define TXT_UNINST_DISPNAME_K		"메모장"					; 언인스톨러에 표시될 이름
!define TXT_UNINST_LNKNAME_K		"프로그램 제거"				; 언인스톨러 링크 이름
!define TXT_HOMEPAGE_URL_K		"http://www.kipple.pe.kr"		; 홈페이지 주소
!define TXT_LICENSE_FILENAME_K		"_license.rtf"				; 라이센스 파일이름
!define TXT_VI_COMPANY_NAME_K		"키플"					; 버전정보 - 회사명
!define TXT_VI_COPYRIGHT_K		"저작권(C) 2004 키플"			;         - 저작권 정보
!define TXT_PROGRAM_GROUP_PARENT_K	"키플"					; 프로그램 그룹 이름

# 한글 특화 부분 - 이름에 따라서 바꿔주자.
!define	EUL_RUL				"를"					; 을/를 문제 해결을 위한 define. $PRODUCT 에 따라 바뀐다.
!define I_KA				"이"					; 이/가 문제 해결을 위한 define. $PRODUCT 에 따라 바뀐다.
!define KOREAN_RUL								; mui 외의 부분에서 을/를 문제가 발생하는것을 해결하기 위한부분- NSIS2.0 패치가 적용되어야 작동한다.
#!define KOREAN_EUL								;

# 기본 내용 설정 (언어 비종속)
!define APP_VER				"V1.0 베타"				; 프로그램 버전
!define	APP_INSTDIR			"NOTEPAD"				; Program Files 에 설치될 폴더 이름.
;!define APP_COMPANYDIR			"KIPPLE"				; Program Files\COMPANY NAME\PROGRAM NAME 에 설치될 경우  - 안쓸경우 NULL string("") 대신 주석처리하도록 한다.
!define	APP_REGPOS			"SOFTWARE\KIPPLE\NOTEPAD"		; 설치 폴더가 저장될 위치, 프로그램이 HKCU 에 데이타 저장하는 레지스트리 - 언인스톨시 삭제될 레지스트리 위치
!define	APP_OUTNAME			"NOTEPADSETUP.EXE"			; setup 파일명
!define	APP_CLASSNAME			"Notepad"				; app class name
!define	APP_EXENAME			"NOTEPAD.EXE"				; 설치 완료후 실행될 실행 파일 이름
!define	APP_UNINST_ICON			${APP_EXENAME}				; 언인스톨러에 표시될 아이콘
!define	APP_UNINST_REGNAME		"NOTEPAD"				; 언인스톨 정보가 저장될 레지스트리 위치
!define	APP_UNINST_EXENAME		"uninstall.exe"				; 언인스톨러 이름
!define	APP_AUTORUN_REGNAME		"NOTEPAD"				; 시스템 시작시 자동 시작 레지스트리 이름
!define	APP_ROOT_KEY			"HKLM"					; 설치정보를 저장할 위치를 지정 - HKLM 혹은 HKCU
!define	APP_AUTORUN_ROOT_KEY		"HKCU"					; 자동 실행시 저장할 위치를 지정 - HKLM 혹은 HKCU
!define	APP_SHELL_VAR_CONTEXT_PROGG	"all"					; 프로그램 그룹 SetShellVarContext 에서 사용할 파라메터 (all|current)
!define	APP_SHELL_VAR_CONTEXT_ICON	"current"				; 단축아이콘 생성 SetShellVarContext 에서 사용할 파라메터 (all|current)
!define	APP_AUTORUN_SHELL_VAR_CTX	"current"				; "시스템 시작시 자동 실행"시 SetShellVarContext 에서 사용할 파라메터 (all|current)
!define APP_VI_PRODUCT_VER		"1.0.0.1"					; 버전정보 - 버전

# section 설정
#!define CFG_SEC_AUTORUN							; AUTORUN SECTION 사용 여부
#!define CFG_SEC_AUTORUN_USE_REG						; AUTORUN 에 REGISTRY 를 사용할지 여부 - 안쓰면 단축아이콘으로 등록된다.
#!define CFG_SEC_AUTORUN_SECTIONIN	"1"					; AUTORUN SECTION 영역 지정
#!define CFG_SEC_AUTORUN_AUTORUN_PARAM	""					; AUTORUN 할때 시작 파라메터 지정

!define CFG_SEC_DESKTOPICON							; 바탕화면 아이콘 생성
!define CFG_SEC_QUICKLAUNCHICON							; 빠른 실행 아이콘 생성
#!define CFG_SEC_STARTMENUICON							; 시작 메뉴 아이콘 생성

#!define CFG_SEC_HOMEPAGE							; 홈페이지

!define CFG_ETC_SPLASH								; splash 사용 여부
!define CFG_ETC_SPLASH_FILENAME		"_splash.bmp"				; SPLASH 파일명.
!define CFG_ETC_SPLASH_FADEIN		"1000"					; splash fade in 시간 (ms)

!define CFG_FUNC_AUTOINSTALL    						; "/A" 옵션으로 Auto Install 지원 여부 - 사용하려면 NSISAutoSetupPlugin.dll 이 필요하다.
;!define CFG_FUNC_CHECKNT							; 프로그램이 NT(2000/XP) 전용일 경우 경고 메시지 출력


##### MUI 기본 정의 #########################################################################################
SetCompress				off					; 압축 여부(auto|force|off) ( off 로 놓으면 테스트 하기 편하다 )
SetCompressor				lzma					; 압축방식 (zlib|bzip2|lzma)


##### 기본 INCLUDE ##########################################################################################
!include "MUI.nsh"								; MUI 사용을 위해서..
!include "sections.nsh"								; section selection 매크로 사용
!define MUI_CUSTOMFUNCTION_GUIINIT .muiCustomGuiInit				; MUI 커스텀 GUI INIT 함수 정의


##### MUI 처리 ##############################################################################################

# MUI 기본 설정
;!define MUI_COMPONENTSPAGE_SMALLDESC						; 설치 옵션 설명칸이 작게..
!define MUI_COMPONENTSPAGE_NODESC						; 설치 옵션 설명칸 없음

!define MUI_FINISHPAGE_RUN 	"$INSTDIR\${APP_EXENAME}"			; 종료후 프로그램 자동 실행 여부 물어 보기
;!define MUI_FINISHPAGE_RUN_NOTCHECKED						; 자동 실행을 기본적으로 체크 안하길 원할경우.

!define MUI_UNFINISHPAGE_NOAUTOCLOSE						; 언인스톨 종료시 자동으로 닫히지 않게 하기.

#!define MUI_ICON		"${NSISDIR}\Contrib\Graphics\Icons\win-install.ico"
#!define MUI_UNICON		"${NSISDIR}\Contrib\Graphics\Icons\win-uninstall.ico"

!define MUI_ICON		"${NSISDIR}\Contrib\Graphics\Icons\nsis1-install.ico"
!define MUI_UNICON		"${NSISDIR}\Contrib\Graphics\Icons\nsis1-uninstall.ico"



# MUI 기본 설정 (잘 안쓰는것들)
#!define MUI_FINISHPAGE_RUN_NOTCHECKED						; 자동 실행을 기본적으로 체크 안하길 원할경우.
#!define MUI_HEADERBITMAP_RIGHT							; 헤더 비트맵을 오른쪽에 표시
#!define MUI_ABORTWARNING							; 설치 취소시 경고 메시지 뿌리기
#!define MUI_INSTALLCOLORS	"FFFFFF 000000"					; 설치 화면 글자/배경색 지정
#!define MUI_PROGRESSBAR colored
!define MUI_HEADERIMAGE								; HEADER 비트맵 보일까 말까 여부.
!define MUI_HEADERIMAGE_BITMAP	"${NSISDIR}\Contrib\Graphics\header\win-k.bmp"	; 상단 이미지

# MUI 페이지 설정	(contrib\Modern UI\Readme.html 참조)
!insertmacro MUI_PAGE_WELCOME							; 시작 환영 페이지
!insertmacro MUI_PAGE_LICENSE $(TXT_LICENSE_FILENAME)				; 저작권
!insertmacro MUI_PAGE_COMPONENTS						; 컴포넌트 선택
!insertmacro MUI_PAGE_DIRECTORY							; 디렉토리 선택
!insertmacro MUI_PAGE_INSTFILES							; 설치중
!insertmacro MUI_PAGE_FINISH							; 종료 페이지 보이기
!insertmacro MUI_UNPAGE_CONFIRM							; 언인스톨
!insertmacro MUI_UNPAGE_INSTFILES						; 파일 삭제 진행 상황
!insertmacro MUI_RESERVEFILE_INSTALLOPTIONS					; 뭘까???
!insertmacro MUI_LANGUAGE "Korean"						; 언어 설정.


##### 커스텀 콜백 함수 ######################################################################################

# GUI 초기화에서 호출
Function My_GuiInit
	;call CheckNt								; NT 전용 어플리케이션 메시지
FunctionEnd


# Section_Copy 에서 파일 복사.
Function My_CopyFile

	; 기존에 실행중인 프로그램 종료.
	Push ${APP_CLASSNAME}
	Call CheckAndCloseApp

	; 파일 복사
	SetOutPath $INSTDIR
	File .\NOTEPAD.EXE							; 여기에 설치를 원하는 파일을 나열한다.

	; 서브디렉토리에도 파일 설치를 원할경우 아래와 같은 방법을 사용한다.
	;SetOutPath $INSTDIR\subdir
	;File .\subdir\subfile.dll

FunctionEnd

# Section_CreateProgramGroup 에서 프로그램 링크 추가
Function My_CreateProgramGroup
	#CreateShortCut		"$SMPROGRAMS\$(TXT_PROGRAM_GROUP_NAME)\${TXT_NAME_K}.lnk"	"$INSTDIR\${APP_EXENAME}" "" "" 0
FunctionEnd


# uninstall 작업 수행
Function un.My_Uninstall
	; 기존에 실행중인 프로그램 종료.
	Push ${APP_CLASSNAME}
	Call un.CheckAndCloseApp

	Sleep 1000

	; 파일 삭제
	Delete $INSTDIR\notepad.exe
	RMDir  $INSTDIR\

FunctionEnd



#############################################################################################################
##### 여기부터 템플릿 : 별로 변경할 필요가 없다는 뜻  #######################################################
#############################################################################################################


##### 텍스트 설정 ###########################################################################################
LangString TXT_NAME				${LANG_KOREAN}		"${TXT_NAME_K}"
LangString TXT_PUBLISHER			${LANG_KOREAN}		"${TXT_PUBLISHER_K}"
LangString TXT_LNKNAME				${LANG_KOREAN}		"${TXT_LNKNAME_K}"
LangString TXT_PROGRAM_GROUP_NAME		${LANG_KOREAN}		"${TXT_PROGRAM_GROUP_NAME_K}"
LangString TXT_PROGRAM_GROUP_PARENT		${LANG_KOREAN}		"${TXT_PROGRAM_GROUP_PARENT_K}"
LangString TXT_HOMEPAGE_URL			${LANG_KOREAN}		"${TXT_HOMEPAGE_URL_K}"
LangString TXT_BRANDING				${LANG_KOREAN}		"${TXT_BRANDING_K}"
LangString TXT_COPANY_NAME			${LANG_KOREAN}		"${TXT_COPANY_NAME_K}"
LangString TXT_UNINST_DISPNAME			${LANG_KOREAN}		"${TXT_UNINST_DISPNAME_K}"
LangString TXT_UNINST_LNKNAME			${LANG_KOREAN}		"${TXT_UNINST_LNKNAME_K}"
LicenseLangString TXT_LICENSE_FILENAME	${LANG_KOREAN}	"${TXT_LICENSE_FILENAME_K}"


# 설치파일 버전 정보
VIProductVersion				"${APP_VI_PRODUCT_VER}"
VIAddVersionKey "ProductName"			"${TXT_NAME_K}"
VIAddVersionKey "Comments"			"${TXT_NAME_K} 설치 파일 (${__DATE__} ${__TIME__})"
VIAddVersionKey "FileDescription"		"${TXT_NAME_K} 설치 파일"
VIAddVersionKey "FileVersion"			"${APP_VER}"
VIAddVersionKey "CompanyName"			"${TXT_VI_COMPANY_NAME_K}"
VIAddVersionKey "LegalCopyright"		"${TXT_VI_COPYRIGHT_K}"

#VIAddVersionKey /LANG=${LANG_ENGLISH}		"ProductName"		"${TXT_NAME_E}"
#VIAddVersionKey /LANG=${LANG_ENGLISH}		"Comments"		"${TXT_NAME_E} Setup File (${__DATE__} ${__TIME__})"
#VIAddVersionKey /LANG=${LANG_ENGLISH}		"FileDescription"	"${TXT_NAME_E} Setup File"
#VIAddVersionKey /LANG=${LANG_ENGLISH}		"FileVersion"		"${APP_VER}"
#VIAddVersionKey /LANG=${LANG_ENGLISH}		"CompanyName"		"${TXT_VI_COMPANY_NAME_E}"
#VIAddVersionKey /LANG=${LANG_ENGLISH}		"LegalCopyright"	"${TXT_VI_COPYRIGHT_E}"

# 고정 내용 설정 (언어 종속)
LangString TXT_DEFAULT_INSTALL			${LANG_KOREAN}		"기본설치"
LangString TXT_DEFAULT_REINSTALL		${LANG_KOREAN}		"재설치"

# 언어 설정
LangString TXT_SECTION_COPY			${LANG_KOREAN}		"프로그램 파일 복사"
LangString TXT_SECTION_PROGRAMGROUP		${LANG_KOREAN}		"프로그램 그룹 생성"
LangString TXT_SECTION_LAUNCHWHENSYSTEMRUN	${LANG_KOREAN}		"윈도우 시작시 자동 시작"
LangString TXT_SECTION_CREATEDESKTOPICON	${LANG_KOREAN}		"바탕 화면에 단축 아이콘 생성"
LangString TXT_SECTION_CREATEQUICKLAUNCH	${LANG_KOREAN}		"빠른 실행 단축 아이콘 생성"
LangString TXT_SECTION_CREATSTARTMENU		${LANG_KOREAN}		"시작 메뉴 단축 아이콘 생성"
LangString TXT_SECTION_OPENHOMEPAGE		${LANG_KOREAN}		"홈페이지 열기"

LangString TXT_DELETE_ALL_FILES			${LANG_KOREAN}		"프로그램이 설치된후 생성된 파일등이 설치 폴더($INSTDIR)에 일부 남아 있습니다.$\r$\n$\r$\n 프로그램이 설치 되었던 폴더를 완전히 삭제하시겠습니까?"
LangString TXT_STILLRUN_EXIT_PROGRAM		${LANG_KOREAN}		"실행중 입니다. 프로그램을 먼저 종료해 주세요."
LangString TXT_THIS_IS_NT_ONLY_APP		${LANG_KOREAN}		"이 프로그램은 Windows NT/2000/xp/2003 에서만 실행됩니다."
LangString TXT_NEED_ADMIN_PRIVILEGE		${LANG_KOREAN}		"이 프로그램은 시스템의 관리자 권한(Administrator)을 가진 사용자만이 설치할 수 있습니다.$\r$\n$\r$\n관리자 권한이 없을경우 정상 설치되지 않습니다.$\r$\n$\r$\n설치를 중단하시겠습니까?"


##### NSIS 기본 설정#########################################################################################

# NSIS 기본 설정
ShowInstDetails			show							; 설치내용 자세히 보기 여부(hide|show|nevershow)
ShowUninstDetails		show							; 언인스톨 자세히 보기 여부(hide|show|nevershow)
AutoCloseWindow			true							; 완료후 설치프로그램 자동 닫기
AllowRootDirInstall		false							; 루트 폴더에 설치하지 못하도록 한다.
CRCCheck			on							; 시작시 CRC 검사를 한다. (디폴트) (on|off|force)
SetOverwrite			on							; 파일 복사시 기본적으로 덮어쓰기 한다(디폴트) (on|off|try|ifnewer)
XPStyle				on							; xp manifest 사용 여부
Name				"$(TXT_NAME) ${APP_VER}"				; 기본 이름
OutFile				"${APP_OUTNAME}"					; 출력 파일
InstType			"$(TXT_DEFAULT_INSTALL)"				; 기본 설치 타입 종류
InstType			"$(TXT_DEFAULT_REINSTALL)"
BrandingText			"$(TXT_BRANDING)"					; 하단 인스톨러 텍스트 바꿀때 사용
LicenseBkColor			F5F5FF							; 라이센스 배경 컬러

!ifdef APP_COMPANYDIR
	InstallDir		"$PROGRAMFILES\${APP_COMPANYDIR}\${APP_INSTDIR}"	; 기본 설치 폴더 선택
!else
	InstallDir		"$PROGRAMFILES\${APP_INSTDIR}"				; 기본 설치 폴더 선택
!endif



##### SECTION 정의 ##########################################################################################


## 기본 파일 복사 ##
Section !$(TXT_SECTION_COPY) Section_Copy						; 파일 복사 섹션 ( ! 로 시작되면 BOLD 표시 )
	SectionIn 1	2 RO								; 설치 섹션 "RO" 는 Read Only (해제 불가)

	; custom 파일 카피
	Call My_CopyFile

	; 설치 위치 정보 저장 ( HKCU 와 HKLM 두군에 다 )
	WriteRegStr HKCU  ${APP_REGPOS} "ProgramFolder"  "$INSTDIR"
	WriteRegStr HKCU  ${APP_REGPOS} "ProgramPath"	 "$INSTDIR\${APP_EXENAME}"
	WriteRegStr HKLM  ${APP_REGPOS} "ProgramFolder"	 "$INSTDIR"
	WriteRegStr HKLM  ${APP_REGPOS} "ProgramPath"	 "$INSTDIR\${APP_EXENAME}"

	; 실행파일 등록
	WriteRegStr ${APP_ROOT_KEY} "Software\Microsoft\Windows\CurrentVersion\App Paths\${APP_EXENAME}" ""				'"$INSTDIR\${APP_EXENAME}"'
	WriteRegStr ${APP_ROOT_KEY} "Software\Microsoft\Windows\CurrentVersion\App Paths\${APP_EXENAME}" "Path"				'"$INSTDIR\${APP_EXENAME}"'

	; 언인스톨 정보
	WriteRegStr ${APP_ROOT_KEY} "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_UNINST_REGNAME}" "DisplayName"		"$(TXT_UNINST_DISPNAME)"
	WriteRegStr ${APP_ROOT_KEY} "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_UNINST_REGNAME}" "UninstallString"	'"$INSTDIR\${APP_UNINST_EXENAME}"'
	WriteRegStr ${APP_ROOT_KEY} "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_UNINST_REGNAME}" "DisplayIcon"		'"$INSTDIR\${APP_UNINST_ICON}"'

	; 언인스톨러 생성
	WriteUninstaller "$INSTDIR\${APP_UNINST_EXENAME}"				; 언인스톨러 만들기

SectionEnd

## 프로그램 그룹 생성 ##
Section $(TXT_SECTION_PROGRAMGROUP) Section_CreateProgramGroup
	SectionIn 1 2

	; 폴더 생성
	SetShellVarContext	${APP_SHELL_VAR_CONTEXT_PROGG}				; 프로그램 폴더 설치시 "현재사용자" 에게만 설치할 것인지 "모든 사용자" 에게 설치할 것인지를 결정 (current|all)
	SetOutPath		"$SMPROGRAMS\$(TXT_PROGRAM_GROUP_NAME)\"
	SetOutPath		$INSTDIR
	CreateShortCut		"$SMPROGRAMS\$(TXT_PROGRAM_GROUP_NAME)\$(TXT_LNKNAME).lnk"		"$INSTDIR\${APP_EXENAME}" "" "" 0
	CreateShortCut		"$SMPROGRAMS\$(TXT_PROGRAM_GROUP_NAME)\$(TXT_UNINST_LNKNAME).lnk"	"$INSTDIR\${APP_UNINST_EXENAME}" "" "" 0

	; 콜백함수 호출
	Call My_CreateProgramGroup

SectionEnd

## 바탕화면 아이콘 ##
!ifdef CFG_SEC_DESKTOPICON
Section $(TXT_SECTION_CREATEDESKTOPICON) Section_CreateDesktopShortcut
	SectionIn 1

	call GetParameters					; /S 옵션을 사용할 경우.. SetCurInstType 처리가 정상작동 안하므로 강제로 처리하기..
	Pop $0
	StrCmp $0 "/S" 0 Next
	StrCmp $8 "first" Next
	 return							; not first !!!
	Next:

	; 바탕화면 아이콘 생성
	SetShellVarContext	${APP_SHELL_VAR_CONTEXT_ICON}
	SetOutPath		$INSTDIR
	CreateShortCut	"$DESKTOP\$(TXT_LNKNAME).lnk" "$INSTDIR\${APP_EXENAME}" "" "" 0
	;WriteINIStr		"$DESKTOP\$(TXT_LNKNAME).url" "InternetShortcut" "URL" "${TXT_HOMEPAGE_URL_K}"
	;WriteINIStr		"$DESKTOP\$(TXT_LNKNAME).url" "InternetShortcut" "IconFile" "$INSTDIR\${APP_EXENAME}"
	;WriteINIStr		"$DESKTOP\$(TXT_LNKNAME).url" "InternetShortcut" "IconIndex" "0"

SectionEnd
!endif

## 빠른 실행 아이콘 ##
!ifdef CFG_SEC_QUICKLAUNCHICON
Section $(TXT_SECTION_CREATEQUICKLAUNCH) Section_CreateQuickLaunchShortcut
	SectionIn 1

	call GetParameters					; /S 옵션을 사용할 경우.. SetCurInstType 처리가 정상작동 안하므로 강제로 처리하기..
	Pop $0
	StrCmp $0 "/S" 0 Next
	StrCmp $8 "first" Next
	 return							; not first !!!
	Next:

	; 빠른 실행에 단축 아이콘 생성
	SetShellVarContext	${APP_SHELL_VAR_CONTEXT_ICON}
	SetOutPath		$INSTDIR
	CreateShortCut	"$QUICKLAUNCH\$(TXT_LNKNAME).lnk" "$INSTDIR\${APP_EXENAME}" "" "" 0
SectionEnd
!endif

## 시작 메뉴 단축 아이콘 ##
!ifdef CFG_SEC_STARTMENUICON
Section $(TXT_SECTION_CREATSTARTMENU) Section_CreateStartmenuShortcut
	SectionIn 3
	; 시작 메뉴에 단축 아이콘 생성
	SetShellVarContext	${APP_SHELL_VAR_CONTEXT_ICON}
	SetOutPath		$INSTDIR
	CreateShortCut	"$STARTMENU\$(TXT_LNKNAME).lnk" "$INSTDIR\${APP_EXENAME}" "" "" 0
SectionEnd
!endif


## 윈도우 시작시 자동 시작 등록 ##
!ifdef CFG_SEC_AUTORUN
Section $(TXT_SECTION_LAUNCHWHENSYSTEMRUN)	Section_LaunchWhenSystemRun
	SectionIn ${CFG_SEC_AUTORUN_SECTIONIN}

	!ifndef CFG_SEC_AUTORUN_AUTORUN_PARAM
	!define CFG_SEC_AUTORUN_AUTORUN_PARAM ""
	!endif

	!ifdef CFG_SEC_AUTORUN_USE_REG								; 레지스트리 등록하는 방법
		WriteRegStr	${APP_AUTORUN_ROOT_KEY}  "Software\Microsoft\Windows\CurrentVersion\Run" "${APP_AUTORUN_REGNAME}" '"$INSTDIR\${APP_EXENAME}" ${CFG_SEC_AUTORUN_AUTORUN_PARAM}'
	!else											; 시작프로그램에 단축아이콘 등록하는 방법
		SetShellVarContext ${APP_AUTORUN_SHELL_VAR_CTX}					; 전체 사용자, 현재 사용자 여부 (current|all)
		CreateShortCut	"$SMSTARTUP\$(TXT_LNKNAME).lnk"	 "$INSTDIR\${APP_EXENAME} ${CFG_SEC_AUTORUN_AUTORUN_PARAM}" "" "" 0
	!endif ; CFG_SEC_AUTORUN_USE_REG
SectionEnd
!endif ; CFG_SEC_AUTORUN

## 홈페이지 ##
!ifdef CFG_SEC_HOMEPAGE
Section $(TXT_SECTION_OPENHOMEPAGE) Section_OpenHomepage
	SectionIn 3
	Exec '"explorer" "$(TXT_HOMEPAGE_URL)"'
SectionEnd
!endif ; CFG_SEC_HOMEPAGE


## 언인스톨 ##
Section "Uninstall"

	; 커스텀 uninstall 작업 처리
	Call un.My_Uninstall

	; uninstall 파일 지우기.
	Delete "$INSTDIR\${APP_UNINST_EXENAME}"

	; 설치된 폴더 지우기.
	RMDir  "$INSTDIR"

	; 파일이 아직 남아 있으면..
	IfFileExists $INSTDIR\*.* 0 SkipDel
		MessageBox MB_ICONINFORMATION|MB_YESNO $(TXT_DELETE_ALL_FILES) IDNO SkipDel
		RMDir /r "$INSTDIR"
		RMDir /REBOOTOK "$INSTDIR"
	SkipDel:

	; 설치 위치 및 APP 정보 삭제
	DeleteRegKey	HKLM  ${APP_REGPOS}
	DeleteRegKey	HKCU  ${APP_REGPOS}

	; 탐색기 메뉴 삭제
	DeleteRegKey HKEY_CLASSES_ROOT "Directory\shell\GomAudio.Play"
	DeleteRegKey HKEY_CLASSES_ROOT "Directory\shell\GomAudio.Add"

	; 프로그램 그룹 지우기
	SetShellVarContext	${APP_SHELL_VAR_CONTEXT_PROGG}					; 설치할때 프로그램 그룹이 설치된 위치.
	RMDir	/r			"$SMPROGRAMS\$(TXT_PROGRAM_GROUP_NAME)"			; 프로그램 그룹 지우기

	StrCmp $(TXT_PROGRAM_GROUP_PARENT) "" Skip
		RMDir "$SMPROGRAMS\$(TXT_PROGRAM_GROUP_PARENT)"
	Skip:

	; 실행파일 등록 지우기
	DeleteRegKey	${APP_ROOT_KEY} "Software\Microsoft\Windows\CurrentVersion\App Paths\${APP_EXENAME}"
	SetShellVarContext current								; current 시작 단축 아이콘 지우기
		Delete	"$SMSTARTUP\$(TXT_LNKNAME).lnk"
		Delete	"$DESKTOP\$(TXT_LNKNAME).lnk"						; 바탕화면 단축 아이콘
		Delete	"$DESKTOP\$(TXT_LNKNAME).url"						; 바탕화면 단축 아이콘
		Delete	"$QUICKLAUNCH\$(TXT_LNKNAME).lnk"					; 빠른 실행
		Delete	"$STARTMENU\$(TXT_LNKNAME).lnk"						; 시작 메뉴
	SetShellVarContext all									; all 시작 단축 아이콘 지우기
		Delete	"$SMSTARTUP\$(TXT_LNKNAME).lnk"
		Delete	"$DESKTOP\$(TXT_LNKNAME).lnk"						; 바탕화면 단축 아이콘
		Delete	"$DESKTOP\$(TXT_LNKNAME).url"						; 바탕화면 단축 아이콘
		Delete	"$QUICKLAUNCH\$(TXT_LNKNAME).lnk"					; 빠른 실행
		Delete	"$STARTMENU\$(TXT_LNKNAME).lnk"						; 시작 메뉴

	; 언인스톨 정보 지우기
	DeleteRegKey	${APP_ROOT_KEY} "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_UNINST_REGNAME}"

	; 자동 시작 정보 지우기
	DeleteRegValue ${APP_AUTORUN_ROOT_KEY}  "Software\Microsoft\Windows\CurrentVersion\Run" "${APP_AUTORUN_REGNAME}"

SectionEnd	; "Uninstall"


##### 내부 함수 #############################################################################################

## 초기화 작업 하기 ##
Function .onInit

	; 스플래쉬 처리
	!ifdef CFG_ETC_SPLASH
		ReserveFile "${CFG_ETC_SPLASH_FILENAME}"				; solid compressing 을 위한 file reserve
		ReserveFile	"${NSISDIR}\Plugins\advsplash.dll"

		ClearErrors
		ReadRegStr $R0 HKLM  "SOFTWARE\Microsoft\Windows NT\CurrentVersion" CurrentVersion
		IfErrors NotNT								; 98 에서는 가끔 뻗는다. NT 가 아니면 splash 를 보이지 않게 한다.
		SetOutPath $TEMP

		File /oname=spltmp.bmp ${CFG_ETC_SPLASH_FILENAME}
		;File /oname=spltmp.wav "splashshit.wav"				; 사운드 출력할라면..
		advsplash::show 2000 ${CFG_ETC_SPLASH_FADEIN} 0 0xff00ff $TEMP\spltmp	; (delay, fadein, fadeout, keycolor, filename)
		Pop $0	; $0 has '1' if the user closed the splash screen early,
				; '0' if everything closed normal, and '-1' if some error occured.
		Delete $TEMP\spltmp.bmp
		;Delete $TEMP\spltmp.wav
		NotNT:
	!endif	; CFG_ETC_SPLASH

	; 기존 설치된 폴더를 찾는다.
	ReadRegStr $R0 "${APP_ROOT_KEY}" "${APP_REGPOS}" "ProgramFolder"		; 기존에 설치된 폴더 찾기
	StrCmp $R0 "" Skip								; 기존 설치 정보가 없으면 skip
		IfFileExists "$R0\*.*"	 0 Skip						; 기존폴더에 파일이 없으면 skip
		ReadRegStr $INSTDIR "${APP_ROOT_KEY}" "${APP_REGPOS}" "ProgramFolder"	; 설치 폴더를 기존 설치 폴더로 세팅
		return
	Skip:

	StrCpy $8 "first"								; 처음 설치 여부 변수 세팅 - 처음이다..

FunctionEnd


## GUI 초기화 할때 처리 ##
Function .muiCustomGuiInit

	call My_GuiInit									; custom init
	call CheckAccountType								; ADMIN 권한을 가지고 있는지 체크한다.

!ifdef CFG_FUNC_AUTOINSTALL								; /A 옵션 처리
	call GetParameters
	call CheckAndRunAutoInstall
!endif


	; 설치가 반복될때 바탕화면 아이콘등이 반복적으로 설치되는것을 막고자 할때 아래 코드를 사용한다.
	; 이전 프로그램 설치 여부를 레지스트리 존재 여부로 판단한다.
	ReadRegStr $R0  HKLM "${APP_REGPOS}" "ProgramFolder"				; 기존에 설치된 폴더 찾기
	StrCmp $R0 "" End								; $R0 가 "" 이면 goto End
		; 이미 이전에 설치된 적이 있었기 때문에 불필요한 단축 아이콘을 만들지 않도록 한다.
		SetCurInstType 1							; "재설치" 타입 세팅.
		return
	End:
	SetCurInstType 0								; "기본설치" 타입 세팅

FunctionEnd

## 설치 성공후 ##
Function .onInstSuccess
	; 프로그램 그룹 보여주기
	; Exec '"explorer" "$SMPROGRAMS\$(TXT_PROGRAM_GROUP_NAME)\"'
FunctionEnd


##### 유틸 함수 #############################################################################################

;----------------------------------------------------------------------------------------
; 프로그램의 클래스를 이용하여서 프로그램이 실행중인지 체크하고, 종료시킨다.
; 호출전 Push 로 꼭 함수 이름을 보내줘야 한다.
Function CheckAndCloseApp
	Pop	$R0					; GET WINDOW CLASS NAME
	loop1:
		FindWindow $R1 "$R0"
		IntCmp $R1 0 done1
		SendMessage $R1 16 0 0							; WM_CLOSE
		SendMessage $R1 2 0 0							; WM_DESTROY
		Sleep 3000
		FindWindow $R1 "$R0"
		IntCmp $R1 0 done1
		MessageBox MB_OK "$(TXT_NAME)${I_KA} $(TXT_STILLRUN_EXIT_PROGRAM)"
		goto loop1
	done1:
FunctionEnd


;----------------------------------------------------------------------------------------
; NT 전용 프로그램일 경우 NT 전용 경고 메시지 출력 함수
!ifdef CFG_FUNC_CHECKNT
Function CheckNt
	Push $R0
	ReadRegStr $R0 HKLM  "SOFTWARE\Microsoft\Windows NT\CurrentVersion" CurrentVersion
	StrCmp $R0 "" win9x
		Pop $R0
		return
	win9x:
		MessageBox MB_OK $(TXT_THIS_IS_NT_ONLY_APP)
		Pop $R0
		abort
FunctionEnd
!endif ; CFG_FUNC_CHECKNT

;----------------------------------------------------------------------------------------
; 어드민여부를 체크하고, 경고메시지 출력후 설치를 중단한다
; contrib\UserInfo\userinfo.nsi 참고
Function CheckAccountType
	ReserveFile	"${NSISDIR}\Plugins\UserInfo.dll"				; solid compressing 을 위한 file reserve
	ClearErrors
	UserInfo::GetName
	IfErrors done									; win9x 이다..
	Pop $0
	UserInfo::GetAccountType
	Pop $1
	StrCmp $1 "Admin" done 0							; admin 이면 ok
	MessageBox MB_YESNO  $(TXT_NEED_ADMIN_PRIVILEGE) IDNO done
	abort										; 설치 중단.
	done:
FunctionEnd


;----------------------------------------------------------------------------------------
; 프로그램의 클래스를 이용하여서 프로그램이 실행중인지 체크하고, 종료시킨다.
; 호출전 Push 로 꼭 윈도우 클래스 이름을 보내줘야 한다.
; uninstall 전용
Function un.CheckAndCloseApp
	Pop	$R0					; GET WINDOW CLASS NAME
	loop1:
		FindWindow $R1 "$R0"
		IntCmp $R1 0 done1
		;SendMessage $R1 16 0 0							; WM_CLOSE
		SendMessage $R1 2 0 0							; WM_DESTROY
		Sleep 3000
		FindWindow $R1 "$R0"
		IntCmp $R1 0 done1
		MessageBox MB_OK "$(TXT_NAME)${I_KA} $(TXT_STILLRUN_EXIT_PROGRAM)"
		goto loop1
	done1:
FunctionEnd


;----------------------------------------------------------------------------------------
; command line param 을 구한다.
; input, none
; output, top of stack (replaces, with e.g. whatever)
; modifies no other variables.
!ifdef CFG_FUNC_AUTOINSTALL
Function GetParameters

	Push $R0
	Push $R1
	Push $R2
	Push $R3

	StrCpy $R2 1
	StrLen $R3 $CMDLINE

	;Check for quote or space
	StrCpy $R0 $CMDLINE $R2
	StrCmp $R0 '"' 0 +3
		StrCpy $R1 '"'
		Goto loop
	StrCpy $R1 " "

	loop:
		IntOp $R2 $R2 + 1
		StrCpy $R0 $CMDLINE 1 $R2
		StrCmp $R0 $R1 get
		StrCmp $R2 $R3 get
		Goto loop

	get:
		IntOp $R2 $R2 + 1
		StrCpy $R0 $CMDLINE 1 $R2
		StrCmp $R0 " " get
		StrCpy $R0 $CMDLINE "" $R2

	Pop $R3
	Pop $R2
	Pop $R1
	Exch $R0

FunctionEnd
!endif ; CFG_FUNC_AUTOINSTALL


;----------------------------------------------------------------------------------------
; /A 옵션으로 실행하면
; 자동 실행을 처리한다.
!ifdef CFG_FUNC_AUTOINSTALL
Function CheckAndRunAutoInstall
	ReserveFile	"${NSISDIR}\Plugins\NSISAutoSetupPlugin.dll"			; solid compressing 을 위한 file reserve
	Pop $0
	StrCmp $0 "/A" 0 END
		SetOutPath $TEMP							; 임시 폴더에 플러그인 복사후
		;File NSISAutoSetupPlugin.dll
		;CallInstDLL $TEMP\NSISAutoSetupPlugin.dll /NOUNLOAD StartAutoSetup	; 플러그인 처리
		NSISAutoSetupPlugin::StartAutoSetup /NOUNLOAD
	END:
FunctionEnd
!endif ; CFG_FUNC_AUTOINSTALL

        `;
	}

}
