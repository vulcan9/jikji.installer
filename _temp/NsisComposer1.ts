
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

export class NsisComposer1 {

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

        `;
    }

    public async make1(): Promise<string> {

        return `
${ NsisComposer1.DIVIDER }
#
# Generated by nsis-gen.
#
${ NsisComposer1.DIVIDER }

${ await this.makeStrings() }

${ await this.makeGeneral() }

${ await this.makeModernUI() }

${ await this.makeVersioning() }

${ await this.makeHooks() }

${ await this.makeInstallSection() }

${ await this.makeUninstallSection() }`;

    }

    //---------------------------------------------
    //
    //---------------------------------------------

    protected async makeStrings(): Promise<string> {
        return `${ NsisComposer1.DIVIDER }
#
# Strings
#
${ NsisComposer1.DIVIDER }

!define _APPNAME "${ this.options.appName }"
!define _COMPANYNAME "${ this.options.companyName }"
!define _DESCRIPTION "${ this.options.description }"
!define _VERSION "${ this.fixedVersion }"
!define _COPYRIGHT "${ this.options.copyright }"
!define _OUTPUT "${ win32.normalize(resolve(this.options.output)) }"

${ this.options.languages.map((language) => {
    return NsisComposer1.STRINGS[language] ? NsisComposer1.STRINGS[language] : '';
}) }`;

        //-------------
        // END
    }

    //---------------------------------------------
    //
    //---------------------------------------------

    protected async makeGeneral(): Promise<string> {
        return `${ NsisComposer1.DIVIDER }
#
# General
#
${ NsisComposer1.DIVIDER }

Unicode true

Name "\${_APPNAME}"
Caption "\${_APPNAME}"
BrandingText "\${_APPNAME} \${_VERSION}"

# 아이콘 설정
${this.options.icon ? `!define _ICON  "${ win32.normalize(resolve(this.options.icon)) }"` : ''}
${this.options.unIcon ? `!define _UNICON  "${ win32.normalize(resolve(this.options.unIcon)) }"` : ''}

SetCompressor ${ this.options.solid ? '/SOLID' : '' } ${ this.options.compression }
OutFile "\${_OUTPUT}"

# 설치 폴더
InstallDir "${ this.options.installDirectory }"
InstallDirRegKey HKCU "Software\\\${_APPNAME}" "InstallDir"

RequestExecutionLevel user
XPStyle on`;

        //-------------
        // END
    }

    //---------------------------------------------
    //
    //---------------------------------------------

    protected async makeModernUI(): Promise<string> {
        return `${ NsisComposer1.DIVIDER }
#
# Modern UI
#
${ NsisComposer1.DIVIDER }

!include "MUI2.nsh"

!define MUI_ICON "\${_ICON}"
!define MUI_UNICON "\${_UNICON}"

Function CreateDesktopShortcut
    CreateShortcut "$DESKTOP\\\${_APPNAME}.lnk" "$INSTDIR\\\${_APPNAME}.exe"
FunctionEnd

!define MUI_STARTMENUPAGE_REGISTRY_ROOT "HKCU"
!define MUI_STARTMENUPAGE_REGISTRY_KEY "Software\\\${_APPNAME}"
!define MUI_STARTMENUPAGE_REGISTRY_VALUENAME "StartMenuFolder"

!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_TEXT "$(CREATE_DESKTOP_SHORTCUT)"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION CreateDesktopShortcut

Var StartMenuFolder

!define MUI_FINISHPAGE_RUN "$INSTDIR\\\${_APPNAME}.exe"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_STARTMENU "Application" $StartMenuFolder
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

${
    this.options.languages.map((language) => {
        return `!insertmacro MUI_LANGUAGE "${ language }"`;
    }).join('\n')
}

${
    this.options.languages.length > 1
    ? `!insertmacro MUI_RESERVEFILE_LANGDLL`
    : ''
}`;

        //-------------
        // END
    }

    //---------------------------------------------
    //
    //---------------------------------------------

    protected async makeVersioning(): Promise<string> {
        return `${ NsisComposer1.DIVIDER }
#
# Versioning
#
${ NsisComposer1.DIVIDER }

VIProductVersion "\${_VERSION}"
VIAddVersionKey /LANG=0 "ProductName" "\${_APPNAME}"
VIAddVersionKey /LANG=0 "CompanyName" "\${_COMPANYNAME}"
VIAddVersionKey /LANG=0 "FileDescription" "$\{_DESCRIPTION}"
VIAddVersionKey /LANG=0 "FileVersion" "\${_VERSION}"
VIAddVersionKey /LANG=0 "LegalCopyright" "\${_COPYRIGHT}"`;

        //-------------
        // END
    }

    //---------------------------------------------
    //
    //---------------------------------------------

    protected async makeHooks(): Promise<string> {
        return `${ NsisComposer1.DIVIDER }
#
# Hooks
#
${ NsisComposer1.DIVIDER }

Function .onInit

    ${
        this.options.languages.length > 1
        ? `!insertmacro MUI_LANGDLL_DISPLAY`
        : ''
    }

FunctionEnd`;

        //-------------
        // END
    }

    //---------------------------------------------
    //
    //---------------------------------------------

    protected async makeInstallSection(): Promise<string> {
        return `${ NsisComposer1.DIVIDER }
#
# Install
#
${ NsisComposer1.DIVIDER }

Section -Install

SetShellVarContext current
SetOverwrite ifnewer

WriteRegStr HKCU "Software\\\${_APPNAME}" "InstallDir" "$INSTDIR"

${ await this.makeInstallerFiles() }

!insertmacro MUI_STARTMENU_WRITE_BEGIN "Application"

    CreateDirectory "$SMPROGRAMS\\$StartMenuFolder"
    CreateShortcut "$SMPROGRAMS\\$StartMenuFolder\\\${_APPNAME}.lnk" "$INSTDIR\\\${_APPNAME}.exe"
    CreateShortcut "$SMPROGRAMS\\$StartMenuFolder\\Uninstall.lnk" "$INSTDIR\\Uninstall.exe"

!insertmacro MUI_STARTMENU_WRITE_END

  WriteUninstaller "$INSTDIR\\Uninstall.exe"

SectionEnd`;

        //-------------
        // END
    }

    //---------------------------------------------
    //
    //---------------------------------------------

    protected async makeUninstallSection(): Promise<string> {
        return `${ NsisComposer1.DIVIDER }
#
# Uninstall
#
${ NsisComposer1.DIVIDER }

Section Uninstall

# FIXME: Remove installed files only.
RMDir /r "$INSTDIR\\"

!insertmacro MUI_STARTMENU_GETFOLDER "Application" $StartMenuFolder

Delete "$SMPROGRAMS\\$StartMenuFolder\\\${_APPNAME}.lnk"
Delete "$SMPROGRAMS\\$StartMenuFolder\\Uninstall.lnk"
RMDir "$SMPROGRAMS\\$StartMenuFolder"

Delete "$DESKTOP\\\${_APPNAME}.lnk"

DeleteRegKey HKCU "Software\\\${_APPNAME}"

SectionEnd`;

        //-------------
        // END
    }

    //---------------------------------------------
    //
    //---------------------------------------------

    protected async makeInstallerFiles(): Promise<string> {
        return `SetOutPath "$INSTDIR"
FILE /r .\\*.*`;

        //-------------
        // END
    }

}
