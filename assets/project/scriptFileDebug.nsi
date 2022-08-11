

;####################################################################################################################
; define Settings
;####################################################################################################################

# setup ���� ���
!define OUTFILE_NAME              "D:\Jik-ji Project\jikji.installer\dist_sample\testApp5-0.1.11 (win x86).exe"

; nw ����� �����Ǵ� chrome app ���� ���
!define CHROME_APP_LAUNCHER       "$LOCALAPPDATA\testApp5"

;----------------------------------------------------------
; ���� ���α׷� �̸�, ���� �� ��Ÿ ����
;----------------------------------------------------------
!define PRODUCT_NAME              "Test App"
!define PRODUCT_VERSION           "0.1.11.0"
!define PRODUCT_PUBLISHER         "(��) ������Ʈ"
!define PRODUCT_COMPANY           "tovsoft"
!define PRODUCT_WEBSITE           "https://tovsoft.co.kr/"

!define EXE_FILE_DIR             "$PROGRAMFILES\${PRODUCT_COMPANY}\${PRODUCT_NAME}"
!define EXE_FILE_NAME             "testApp3"
!define EXE_FILE_FULL_NAME        "testApp3.exe"
!define PROGRAM_GROUP_NAME        "������Ʈ"               ; ���α׷� �׷� �̸�
!define UNINSTALL_NAME            "uninstall.exe"                                    ; ���ν��緯 �̸�

;----------------------------------------------------------
; ������Ʈ�� Ű ����
;----------------------------------------------------------

!define REG_ROOT_KEY              "HKLM"
!define REG_UNROOT_KEY            "HKLM"
!define REG_APPDIR_KEY            "Software\Microsoft\Windows\CurrentVersion\App Path\${EXE_FILE_Ffile:/D:/Jik-ji%20Project/jikji.installer/assets/project/scriptFile.nsiULL_NAME}"
!define REG_UNINST_KEY            "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

;##########################################################
; NSIS Settings
;##########################################################

Unicode                     true
SetCompress                 off                                     ; ���� ����(auto|force|off) ( off �� ������ �׽�Ʈ �ϱ� ���ϴ� )
#SetCompressor              lzma                                    ; ������ (zlib|bzip2|lzma)
SetCompressor                lzma

ShowInstDetails             hide                                      ; ��ġ���� �ڼ��� ���� ����(hide|show|nevershow)
ShowUninstDetails           hide                                      ; ���ν��� �ڼ��� ���� ����(hide|show|nevershow)
SetOverwrite                on                                        ; ���� ����� �⺻������ ����� �Ѵ�(����Ʈ) (on|off|try|ifnewer|lastused)

AutoCloseWindow             true                                      ; �Ϸ��� ��ġ���α׷� �ڵ� �ݱ�
AllowRootDirInstall         false                                     ; ��Ʈ ������ ��ġ���� ���ϵ��� �Ѵ�.
CRCCheck                    on                                        ; ���۽� CRC �˻縦 �Ѵ�. (����Ʈ) (on|off|force)
XPStyle                     on                                        ; xp manifest ��� ����

Name                        "${PRODUCT_NAME}"                        ; �⺻ �̸�
OutFile                     "${OUTFILE_NAME}"                        ; ��� ����
InstallDir                  "${EXE_FILE_DIR}"                        ; ��ġ ����
InstallDirRegKey            ${REG_ROOT_KEY} "${REG_APPDIR_KEY}" "Install_Dir"

;----------------------------------------------------------
; Request application privileges for Windows Vista
;----------------------------------------------------------
RequestExecutionLevel admin



;##########################################################
; MUI Settings
;##########################################################


;----------------------------------------------------------
; MUI ȭ�� ����
;----------------------------------------------------------
!include "MUI2.nsh"

BrandingText "${PRODUCT_COMPANY} - ${PRODUCT_WEBSITE}"

#!define MUI_COMPONENTSPAGE_SMALLDESC                        ; ��ġ �ɼ� ����ĭ�� �۰�..
!define MUI_COMPONENTSPAGE_NODESC                            ; ��ġ �ɼ� ����ĭ ����

;----------------------------------------------------------
; installer or uninstaller ���� ��� ��� �޽��� ���ڸ� ���
;----------------------------------------------------------
!define MUI_ABORTWARNING                                    ; ��ġ ��ҽ� ��� �޽��� �Ѹ���
!define MUI_UNABORTWARNING

;----------------------------------------------------------
; finishpage noAutoClose
;----------------------------------------------------------
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_UNFINISHPAGE_NOAUTOCLOSE                             ; ���ν��� ����� �ڵ����� ������ �ʰ� �ϱ�.

!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXE_FILE_FULL_NAME}"    ; ������ ���α׷� �ڵ� ���� ���� ���� ����
;!define MUI_FINISHPAGE_RUN_NOTCHECKED                           ; �ڵ� ������ �⺻������ üũ ���ϱ� ���Ұ��.

;##########################################################
; MUI Pages : https://nsis.sourceforge.io/Docs/Modern%20UI/Readme.html
;##########################################################

#!define MUI_THEME                           "${NSISDIR}\Contrib\Graphics"
!define MUI_THEME                             "D:\Jik-ji Project\jikji.installer\assets\project\theme"

!define MUI_INSTFILESPAGE_PROGRESSBAR colored                    ; Default: smooth ("" | colored | smooth)
!define MUI_INSTALLCOLORS                     "203864 bdc4d1"    ; ��ġ ȭ�� ����/���� ����
#!define MUI_LICENSEPAGE_BGCOLOR /windows                        ; ���̼��� ��� �÷� (/windows | /grey | color)

;----------------------------------------------------------
; �ν��緯 & ���ν��緯 ������ ����
;----------------------------------------------------------
!define MUI_ICON                              "${MUI_THEME}\install.ico"
!define MUI_UNICON                            "${MUI_THEME}\uninstall.ico"

;----------------------------------------------------------
; Page Design
;----------------------------------------------------------

#!define MUI_HEADERIMAGE_RIGHT                                   ; ��� ��Ʈ���� �����ʿ� ǥ��
#!define MUI_BGCOLOR 203864                                      ; ��� ���� Default: FFFFFF
#!define MUI_TEXTCOLOR bdc4d1                                    ; ��� ���ڻ� Default: 000000
#!define MUI_HEADER_TRANSPARENT_TEXT

; Header image (150x53)
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP_NOSTRETCH
!define MUI_HEADERIMAGE_BITMAP                 "${MUI_THEME}\header.bmp"
!define MUI_HEADERIMAGE_UNBITMAP_NOSTRETCH
!define MUI_HEADERIMAGE_UNBITMAP               "${MUI_THEME}\header-uninstall.bmp"

; Welcome & Finish page image (164x290)
!define MUI_WELCOMEFINISHPAGE_BITMAP_NOSTRETCH
!define MUI_WELCOMEFINISHPAGE_BITMAP           "${MUI_THEME}\wizard.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP_NOSTRETCH
!define MUI_UNWELCOMEFINISHPAGE_BITMAP         "${MUI_THEME}\wizard-uninstall.bmp"




;----------------------------------------------------------
; Installer page
;----------------------------------------------------------
!insertmacro MUI_PAGE_WELCOME                            ; ���� ȯ�� ������
!insertmacro MUI_PAGE_LICENSE "D:\Jik-ji Project\jikji.installer\assets\project\assets\LICENSE.txt"
!insertmacro MUI_PAGE_COMPONENTS                         ; ������Ʈ ����
!insertmacro MUI_PAGE_DIRECTORY                          ; ���丮 ����
!insertmacro MUI_PAGE_INSTFILES                          ; ��ġ��
!insertmacro MUI_PAGE_FINISH                             ; ���� ������ ���̱�

;----------------------------------------------------------
; Uninstaller pages
;----------------------------------------------------------
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM                          ; ���ν���
#!insertmacro MUI_UNPAGE_LICENSE "textfile"
#!insertmacro MUI_UNPAGE_COMPONENTS
#!insertmacro MUI_UNPAGE_DIRECTORY
!insertmacro MUI_UNPAGE_INSTFILES                        ; ���� ���� ���� ��Ȳ
#!insertmacro MUI_UNPAGE_FINISH



;----------------------------------------------------------
; Language Files
;----------------------------------------------------------
!insertmacro MUI_LANGUAGE "Korean"                                 ; ��� ����.

;####################################################################################################################
; SECTION
;####################################################################################################################

# �ѱ� Ưȭ �κ� - �̸��� ���� �ٲ�����.
!define EUL_RUL                             "��"                   ; ��/�� ���� �ذ��� ���� define. $PRODUCT �� ���� �ٲ��.
!define I_KA                                "��"                   ; ��/�� ���� �ذ��� ���� define. $PRODUCT �� ���� �ٲ��.

# ��� ����
LangString TXT_VERSION_UNINSTALL            ${LANG_KOREAN}        "���� ������ �����ϴ� ���Դϴ�. ��� ��ٷ� �ּ���."
LangString TXT_UNINSTALL                    ${LANG_KOREAN}        "���α׷��� �����ϴ� ���Դϴ�. ��� ��ٷ� �ּ���."
LangString TXT_SECTION_UNINSTALL            ${LANG_KOREAN}        "���� ���� ����"
LangString TXT_EXTRACTING                   ${LANG_KOREAN}        "��ġ�ϴ� ���� ��� ��ٷ� �ּ���."
LangString TXT_SECTION_COPY                 ${LANG_KOREAN}        "���α׷� ��ġ"
LangString TXT_SECTION_COPY_RESOURCE        ${LANG_KOREAN}        "���� ��� ��ġ"
LangString TXT_SECTION_CREATEDESKTOPICON    ${LANG_KOREAN}        "���� ȭ�鿡 ���� ������ ����"
LangString TXT_SECTION_CREATEQUICKLAUNCH    ${LANG_KOREAN}        "���� ���� ���� ������ ����"
LangString TXT_SECTION_CREATSTARTMENU       ${LANG_KOREAN}        "���� �޴� ���� ������ ����"

LangString TXT_PROGRAM_GROUP_NAME           ${LANG_KOREAN}        "${PROGRAM_GROUP_NAME}"

LangString TXT_DELETE_ALL_FILES             ${LANG_KOREAN}        \
"���α׷��� ��ġ���� ������ ���ϵ��� ��ġ ����($INSTDIR)�� �Ϻ� ���� �ֽ��ϴ�.\
$\r$\n$\r$\n���α׷��� ��ġ �Ǿ��� ������ ������ �����Ͻðڽ��ϱ�?"

LangString TXT_STILL_RUN_EXIT_PROGRAM       ${LANG_KOREAN}        \
"${PRODUCT_NAME} ���α׷��� ������ �Դϴ�.\
$\r$\n$\r$\n���α׷��� ���� �����Ͻðڽ��ϱ�?"

LangString TXT_INSTALL_CANCEL               ${LANG_KOREAN}        \
"���α׷� ��ġ�� �����մϴ�.\
$\r$\n$\r$\n${PRODUCT_NAME} ���α׷� ���� �� �ٽ� �õ� �ٶ��ϴ�."

LangString TXT_UNINSTALL_CANCEL             ${LANG_KOREAN}        \
"���α׷� ���Ÿ� �����մϴ�.\
$\r$\n$\r$\n${PRODUCT_NAME} ���α׷� ���� �� �ٽ� �õ� �ٶ��ϴ�."

# Section �̸� : [/o] [([!]|[-])section_name] [section index output]
; (!) ��ġ ������� �ڽ����� BOLD ǥ�õ�
; (-) ���߱�
; (/o) üũ ���� ����

;##########################################################
; ��� ����
;##########################################################


;----------------------------------------------------------
; ������ �������� ���α׷� ����.
;----------------------------------------------------------

; ������ �������� ���α׷� ����.
Function CheckAndCloseApp
    # EXE_FILE_FULL_NAME ������ ���� define �Ǳ� ���� ȣ��� ���� �����Ƿ� �ϵ� �ڵ���
    # $INSTDIR : "C:\Program Files (x86)\tovsoft\Test App"
    StrCpy $1 "testApp3.exe"

    loop:
        nsProcess::_FindProcess "$1"
        Pop $R0
        StrCmp $R0 0 processFound done

    processFound:
        StrCmp $R8 "first" kill

        MessageBox MB_ICONINFORMATION|MB_YESNO "��ġ�� $(TXT_STILL_RUN_EXIT_PROGRAM)" IDNO cancel
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

; (uninstall) ������ �������� ���α׷� ����.
Function un.CheckAndCloseApp
    # EXE_FILE_FULL_NAME ������ ���� define �Ǳ� ���� ȣ��� ���� �����Ƿ� �ϵ� �ڵ���
    # $INSTDIR : "C:\Program Files (x86)\tovsoft\Test App"
    StrCpy $1 "testApp3.exe"

    loop:
        nsProcess::_FindProcess "$1"
        Pop $R0
        StrCmp $R0 0 processFound done

    processFound:
        StrCmp $R8 "first" kill

        MessageBox MB_ICONINFORMATION|MB_YESNO "��ġ�� $(TXT_STILL_RUN_EXIT_PROGRAM)" IDNO cancel
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



;----------------------------------------------------------
; ���� ���� Ȯ���� ���
;----------------------------------------------------------

; File Association
!include "FileAssociation.nsh"

Function FileAssociate
    !insertmacro APP_ASSOCIATE "ta5" "Testapp5.project" "JIK-JI Editor Project File" "$INSTDIR\assets\exeIcon.ico" "Open with ${EXE_FILE_NAME} Application" "$INSTDIR\${EXE_FILE_FULL_NAME} $\"%1$\""

    ; explorer ����
    !insertmacro UPDATEFILEASSOC
FunctionEnd

Function un.FileAssociate
    !insertmacro APP_UNASSOCIATE "ta5" "Testapp5.project"

    ; explorer ����
    !insertmacro UPDATEFILEASSOC
FunctionEnd



;##########################################################
; �ν���
;##########################################################


;----------------------------------------------------------
# ���� ���� ����
;----------------------------------------------------------

Section $(TXT_SECTION_UNINSTALL)
    ; ��ġ ���� "RO" �� Read Only (���� �Ұ�)
    SectionIn RO

    Push $6
    ReadRegStr "$6" ${REG_UNROOT_KEY} "${REG_UNINST_KEY}" "UninstallString" ; �������� ��ġ���� Ȯ��

    StrCmp "$6" "" done

    ClearErrors
    DetailPrint $(TXT_VERSION_UNINSTALL)
    SetDetailsPrint listonly                          ; none|listonly|textonly|both|lastused

    ; ���� ����ñ��� ��ٸ� (/S: silent)
    ExecWait "$6 /S _?=$INSTDIR"                      ;Do not copy the uninstaller to a temp file

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



;----------------------------------------------------------
; ���� ��ġ, ����
;----------------------------------------------------------


;----------------------------
; Launcher App ��ġ
;----------------------------

; ������丮���� ���� ��ġ�� ���Ұ�� �Ʒ��� ���� ����� ����Ѵ�.
;SetOutPath $INSTDIR\assets
;File .\assets\*.*

; ��ġ ����. resource�� ������ ��ġ �Ѵ�.
!macro Install_App_Launcher
    SetOutPath "$INSTDIR"
    ;File /nonfatal /a /r .\*.*
    File /nonfatal /a /r /x "uninstall\*" /x "theme\*" /x "engFolder\*" /x "assets\*" /x "�ѱ� ����\*" .\*.*
!macroend

Function un.Install_App_Launcher

    ; install ���� �����.
    ; �ش� ���͸��� ��ġ�� ���� �̿ܿ� �ٸ� ������ �ִٸ� �ش� ���͸��� �������� ���� ����
    RMDir /r "$INSTDIR"

    ; ������ ���� ���� ������..
    IfFileExists $INSTDIR\*.* 0 skipDelete

        ; ���� Ȯ�� �޼���
        ;MessageBox MB_ICONINFORMATION|MB_YESNO $(TXT_DELETE_ALL_FILES) IDNO skipDelete

        RMDir /r "$INSTDIR"
        RMDir /REBOOTOK "$INSTDIR"
    skipDelete:

    ; nw ����� �����Ǵ� chrome app ���� ����
    StrCmp "${CHROME_APP_LAUNCHER}" "" ok
        ;MessageBox MB_OK "����: ${CHROME_APP_LAUNCHER}"
        RMDir /r "${CHROME_APP_LAUNCHER}"
    ok:
FunctionEnd


;----------------------------
; Child App ����
;----------------------------

!define CHROME_APP_CHILD            "$LOCALAPPDATA\jikji.editor.testapp"

# ���� App ���ҽ� (nwJS App) - ��ó�� ������ app
!define CHILD_APP_DEST              "$LOCALAPPDATA\jikji.editor.demo.setup\testapp"

; Program Files �������� nwJS App�� ��ó�� ����ϰ��� �� ��� ���� ������ �߻��Ѵ�.
; ��ġ�� $INSTDIR ������ ��ó app ���� ����ϰ�
; nwJS �������� ���ҽ��� ������ �ʿ���� ������ �����Ͽ� ���� �Ѵ�.
; �ϳ��� nwJS ���ҽ��� ��ó �� app���� ���� ��ų�� ����.
!macro Install_App_Child

    StrCmp "${CHILD_APP_DEST}" "" skipChildApp
        StrCpy $9 "${CHILD_APP_DEST}"
        RMDir /r $9

        ; child app ��ġ ��ġ
        SetOutPath $9

        ; nwJS ��ġ (installer ���� �״�� ���),
        ;File /r /x "assets" /x "package.json" .\*.*
        File /nonfatal /a /r /x "package.json\*" /x "test.bin\*" /x "README.md\*" /x "index.html\*" /x "�ѱ� ����\*" /x "uninstall\*" /x "theme\*" /x "engFolder\*" /x "assets\*" .\*.*

        ; uninstall ���� ���� ó�� (excludes ����� /r ó���Ǳ� ������ ���� ���ǵ�)
        ;File /nonfatal /a /r "uninstall"

        ; moves ��� ���� ó��
        ;File /nonfatal /a /r "uninstall"
        ;File /nonfatal /a /r "uninstall\*"
	File /nonfatal /a /r "theme\*"
	File /nonfatal /a /r "engFolder\*"
	File /nonfatal /a /r "assets\*"

    skipChildApp:
!macroend

Function un.Install_App_Child
    ; childApp ���� ����
    RMDir /r "${CHILD_APP_DEST}"

    ; nw ����� �����Ǵ� chrome app ���� ����
    StrCmp "${CHROME_APP_CHILD}" "" skipChildApp
        ;MessageBox MB_OK "����: ${CHROME_APP_CHILD}"
        RMDir /r "${CHROME_APP_CHILD}"
    skipChildApp:
FunctionEnd


;----------------------------------------------------------
; App ȣ���Ͽ� Ư�� ������ ����
;----------------------------------------------------------

!include "StdUtils.nsh"
;ShowInstDetails show

!macro ChildAppProcess
    ;MessageBox MB_OK "${CHILD_APP_DEST}"
!macroend

Function un.ChildAppProcess

    Var /GLOBAL chromiumUninstallApp
    StrCpy $chromiumUninstallApp "$LOCALAPPDATA\testApp5.uninstall"

    StrCmp $chromiumUninstallApp "" skipChildProcess

    StrCmp "${CHILD_APP_DEST}" "" skipChildProcess

        # "C:/Users/pdi10/AppData/Local/testApp5"
        # DetailPrint 'CHROME_APP_LAUNCHER: "${CHROME_APP_LAUNCHER}"'

        # "C:/Users/pdi10/AppData/Local/jikji.editor.testapp"
        # DetailPrint 'CHROME_APP_CHILD: "${CHROME_APP_CHILD}"'

        # "C:/Users/pdi10/AppData/Local/jikji.editor.demo.setup/testapp"
        # DetailPrint 'CHILD_APP_DEST: "${CHILD_APP_DEST}"'

        # "testApp3.exe"
        # DetailPrint 'EXE_FILE_FULL_NAME: "${EXE_FILE_FULL_NAME}"'

        Var /GLOBAL childAppPath
        StrCpy $childAppPath "${CHILD_APP_DEST}\${EXE_FILE_FULL_NAME}"

        Var /GLOBAL uninstallAppFolder
        StrCpy $uninstallAppFolder "${CHILD_APP_DEST}\uninstall"

        DetailPrint 'childAppPath: "$childAppPath"'
        DetailPrint 'uninstallAppFolder: "$uninstallAppFolder"'

        # child app ȣ���Ͽ� �ʿ��� uninstall ���� ����
        # exe ������ �����Ѵ�. try to launch the process

        ${StdUtils.ExecShellWaitEx} $0 $1 "$childAppPath" "open" "$uninstallAppFolder"

        # returns "ok", "no_wait" or "error".
        StrCmp $0 "error" ExecFailed               ;check if process failed to create
        StrCmp $0 "no_wait" WaitNotPossible        ;check if process can be waited for - always check this!
        StrCmp $0 "ok" WaitForProc                 ;make sure process was created successfully
        Abort

        # ���� �Ϸ� ��ٸ���
        ExecFailed:
            DetailPrint "Failed to create process (error code: $1)"
            Goto WaitDone

        WaitNotPossible:
            DetailPrint "Can not wait for process."
            Goto WaitDone

        WaitForProc:
            DetailPrint "Waiting for process. ..."
            ${StdUtils.WaitForProcEx} $2 $1
            DetailPrint "Process just terminated (exit code: $2)"
            Goto WaitDone

        WaitDone:
            ;MessageBox MB_OK "���� : $chromiumUninstallApp"
            Sleep 500

            ; chromium Uninstall App ���� ����
            RMDir /r $chromiumUninstallApp
            Goto skipChildProcess

    skipChildProcess:
FunctionEnd



;----------------------------------------------------------
# ��ġ : �⺻ ���� ����
;----------------------------------------------------------

Section !$(TXT_SECTION_COPY)
    ; ��ġ ���� "RO" �� Read Only (���� �Ұ�)
    SectionIn RO

    DetailPrint "���α׷��� $(TXT_EXTRACTING)"
    SetDetailsPrint listonly

    ; ��ġ ���� ���� (��ó)
    !insertmacro Install_App_Launcher

    ; ��ó - app ȣ�� ������ ��� sub app�� �����ص�
    !insertmacro Install_App_Child
    !insertmacro ChildAppProcess

    SetDetailsPrint both

    ;-------------
    ; �������� ���
    ; registry - installation path
    WriteRegStr ${REG_ROOT_KEY} "${REG_APPDIR_KEY}" "Install_Dir"  "$INSTDIR"
    WriteRegStr ${REG_ROOT_KEY} "${REG_APPDIR_KEY}" ""             "$INSTDIR\${EXE_FILE_FULL_NAME}"

    ;-------------
    ; registry - uninstall info
    WriteRegStr ${REG_UNROOT_KEY} "${REG_UNINST_KEY}" "DisplayName"           "$(^Name)"
    WriteRegStr ${REG_UNROOT_KEY} "${REG_UNINST_KEY}" "UninstallString"       "$INSTDIR\${UNINSTALL_NAME}"
    WriteRegStr ${REG_UNROOT_KEY} "${REG_UNINST_KEY}" "DisplayIcon"           "$INSTDIR\${EXE_FILE_FULL_NAME}"

    WriteRegStr ${REG_UNROOT_KEY} "${REG_UNINST_KEY}" "DisplayVersion"        "${PRODUCT_VERSION}"
    WriteRegStr ${REG_UNROOT_KEY} "${REG_UNINST_KEY}" "URLInfoAbout"          "${PRODUCT_WEBSITE}"
    WriteRegStr ${REG_UNROOT_KEY} "${REG_UNINST_KEY}" "Publisher"             "${PRODUCT_PUBLISHER}"

    ; create Uninstaller
    WriteUninstaller "$INSTDIR\${UNINSTALL_NAME}"

    Call FileAssociate
SectionEnd
!macro Install_Resource
!macroend
Function un.Install_Resource
FunctionEnd
;----------------------------------------------------------
# ��ġ : ���ҽ� ���� ����
;----------------------------------------------------------

; ������ ���ҽ� ������ ���� �����ϱ�
Section $(TXT_SECTION_COPY_RESOURCE)
    ; ��ġ ���� "RO" �� Read Only (���� �Ұ�)
    SectionIn RO

    DetailPrint "������Ҹ� $(TXT_EXTRACTING)"
    SetDetailsPrint listonly

    !insertmacro Install_Resource

    SetDetailsPrint both

SectionEnd

;##########################################################
; ��ġ (��Ÿ)
;##########################################################


;----------------------------------------------------------
; ���α׷� �׷� ����
;----------------------------------------------------------

; ���α׷� ���� ��ġ�� "��������" ���Ը� ��ġ�� ������ "��� �����" ���� ��ġ�� �������� ���� (current|all)
!define SHELL_VAR_CONTEXT_PROGG        "all"                    ; ���α׷� �׷� �������� ���
!define SHELL_VAR_CONTEXT_ICON        "current"                 ; ��������� �������� ���

Section $(TXT_SECTION_CREATSTARTMENU)

    ; ���� �޴� ���� ������ - $SMPROGRAMS
    ; ��ġ : C:/ProgramData/Microsoft/Windows/Start Menu/Programs/

    SetShellVarContext    ${SHELL_VAR_CONTEXT_PROGG}
    SetOutPath            "$SMPROGRAMS\$(TXT_PROGRAM_GROUP_NAME)\"
    SetOutPath            "$INSTDIR"
    CreateShortCut        "$SMPROGRAMS\$(TXT_PROGRAM_GROUP_NAME)\${EXE_FILE_NAME}.lnk"            "$INSTDIR\${EXE_FILE_FULL_NAME}"     "" "" 0
    CreateShortCut        "$SMPROGRAMS\$(TXT_PROGRAM_GROUP_NAME)\${EXE_FILE_NAME} ����.lnk"       "$INSTDIR\${UNINSTALL_NAME}"         "" "" 0

    ; ���� �޴� ���� ������ - $STARTMENU
    ; ��ġ : C:\Users\pdi10\AppData\Roaming\Microsoft\Windows\Start Menu

    SetShellVarContext    ${SHELL_VAR_CONTEXT_ICON}
    SetOutPath            "$STARTMENU\Programs\$(TXT_PROGRAM_GROUP_NAME)\"
    SetOutPath            "$INSTDIR"
    CreateShortCut        "$STARTMENU\Programs\$(TXT_PROGRAM_GROUP_NAME)\${EXE_FILE_NAME}.lnk"         "$INSTDIR\${EXE_FILE_FULL_NAME}" "" "" 0
    CreateShortCut        "$STARTMENU\Programs\$(TXT_PROGRAM_GROUP_NAME)\${EXE_FILE_NAME} ����.lnk"    "$INSTDIR\${UNINSTALL_NAME}"     "" "" 0
SectionEnd




;----------------------------------------------------------
; ����ȭ�鿡 �ٷΰ��� ������ - $DESKTOP
;----------------------------------------------------------

Section $(TXT_SECTION_CREATEDESKTOPICON)
    SetShellVarContext     ${SHELL_VAR_CONTEXT_ICON}
    SetOutPath             $INSTDIR
    CreateShortCut         "$DESKTOP\${EXE_FILE_NAME}.lnk" "$INSTDIR\${EXE_FILE_FULL_NAME}" "" "" 0
SectionEnd




;----------------------------------------------------------
; ���� ���� ������ - $QUICKLAUNCH (���� ���� > shell:quick launch)
;----------------------------------------------------------

Section $(TXT_SECTION_CREATEQUICKLAUNCH)
    SetShellVarContext    ${SHELL_VAR_CONTEXT_ICON}
    SetOutPath            $INSTDIR
    CreateShortCut        "$QUICKLAUNCH\${EXE_FILE_NAME}.lnk" "$INSTDIR\${EXE_FILE_FULL_NAME}" "" "" 0
SectionEnd



;##########################################################
; ���ν���
;##########################################################

;----------------------------------------------------------
; ���ν���
;----------------------------------------------------------

Section Uninstall

    DetailPrint $(TXT_UNINSTALL)
    SetDetailsPrint listonly

    ; uninstall ���� �����.
    Delete "$INSTDIR\${UNINSTALL_NAME}"

    ; App���� �ʿ��� uninstall ���� ����
    Call un.ChildAppProcess

    ; ��ġ ���� ����
    Call un.Install_App_Launcher
    Call un.Install_App_Child
    Call un.Install_Resource

    SetDetailsPrint both


    ;-------------
    ; ���α׷� �׷� �����
    SetShellVarContext    ${SHELL_VAR_CONTEXT_PROGG}                                ; ��ġ�Ҷ� ���α׷� �׷��� ��ġ�� ��ġ.
    RMDir /r              "$SMPROGRAMS\$(TXT_PROGRAM_GROUP_NAME)"                   ; ���α׷� �׷� �����

    SetShellVarContext    ${SHELL_VAR_CONTEXT_ICON}
    RMDir /r              "$STARTMENU\Programs\$(TXT_PROGRAM_GROUP_NAME)\"        ; ���� �޴� ������ �׷� �����



    ;-------------
    ; ���� ������ �����
    SetShellVarContext current                                    ; current ���� ���� ������ �����
        Delete    "$DESKTOP\${EXE_FILE_NAME}.lnk"                        ; ����ȭ�� ���� ������
        Delete    "$QUICKLAUNCH\${EXE_FILE_NAME}.lnk"                    ; ���� ����
        ;Delete   "$STARTMENU\Programs\(EXE_FILE_NAME).lnk"              ; ���� �޴�
        ;Delete   "$SMSTARTUP\${EXE_FILE_NAME}.lnk"

    SetShellVarContext all                                        ; all ���� ���� ������ �����
        Delete    "$DESKTOP\${EXE_FILE_NAME}.lnk"                        ; ����ȭ�� ���� ������
        Delete    "$QUICKLAUNCH\${EXE_FILE_NAME}.lnk"                    ; ���� ����
        ;Delete   "$STARTMENU\Programs\${EXE_FILE_NAME}.lnk"            ; ���� �޴�
        ;Delete   "$SMSTARTUP\${EXE_FILE_NAME}.lnk"



    ;-------------
    ; ��� ���� �����
    DeleteRegKey ${REG_ROOT_KEY} "${REG_APPDIR_KEY}"
    DeleteRegKey ${REG_UNROOT_KEY} "${REG_UNINST_KEY}"

    Call un.FileAssociate
SectionEnd

;####################################################################################################################
; ��ƿ �Լ�
;####################################################################################################################

Function .onInit
    ; ������ �������� ���α׷� ����.
    Call CheckAndCloseApp
FunctionEnd

;��ġ���н�
Function .onInstFailed
    ; ������ �������� ���α׷� ����.
    Call CheckAndCloseApp

    Delete "$INSTDIR\*.*"
    RMDir /r "$INSTDIR"

    SetAutoClose true
FunctionEnd

Function un.onInit
    ; ������ �������� ���α׷� ����.
    Call un.CheckAndCloseApp
FunctionEnd

;----------------------------------------------------------
; END
