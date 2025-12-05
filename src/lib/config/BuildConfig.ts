import { normalize } from 'path';

import { LinuxConfig } from './LinuxConfig.js';
import { MacConfig } from './MacConfig.js';
import { NsisConfig } from './NsisConfig.js';
import { WinConfig } from './WinConfig.js';

export class BuildConfig {

    public nwVersion: string = 'lts';
    public nwFlavor: string = 'normal';

    public output: string = './dist/';
    public outputPattern: string = '${NAME}-${VERSION}-${PLATFORM}-${ARCH}';
    public packed: boolean = false;
    public targets: string[] = [];
    public files: string[] = ['**/*'];
    public excludes: string[] = [];

    // 압축 파일 풀기 기능 지원 : {src: string, dest: string}
    public resource?: any = {};
    public uninstall?: string = '';
    // 파일 확장자 등록 : [{description, ext, fileClass, icon}]
    public associate?: any[] = [];
    // nwJS App 복사 기능 지원 : {name: string, excludes?: string[], dest: string}
    public childApp?: any = {};
    // public nwFiles: string[] = [];

    public appId: string = '';
    public setupFolderName: string = '';

    public win: WinConfig = new WinConfig();
    public mac: MacConfig = new MacConfig();
    public linux: LinuxConfig = new LinuxConfig();
    public nsis: NsisConfig = new NsisConfig();

    public ffmpegIntegration: boolean = false;
    public strippedProperties: string[] = [
        'scripts',
        'devDependencies',
        'build'
    ];
    public overriddenProperties: any = {};
    // VC++ Redistributable 설치 체크 과정을 추가할지 여부
    public install_visualCpp: boolean = false;
    // child App을 호출하는 launcher만 Program Files 폴더에 설치
    public onlyLauncher: boolean = false;
    // nwJS 리소스 복사할 폴더명 (패키징을 위해 복사할 임시 폴더 이름)
    public nwFolderName: string = 'nw';

    // 코드사인 정보를 설정
    public codesign?: any = undefined;

    constructor(pkg: any = {}) {

        const options = pkg.build ? pkg.build : {};

        // Object.keys(this)로 접근하면 optional(?)로 설정된 속성은 누락됨
        // (JS 런타임 객체에는 존재하지 않으면 key 누락됨)
        // 초기값이 지정되어 있지 않으면 순환 속성에서 누락됨
        // undefined 값이라도 지정해 주어야 함
        Object.keys(options).map((key) => {
            if (key in this && options[key] !== undefined) {
                // console.log('# key: ', key);

                switch (key) {
                    case 'win':
                        this.win = new WinConfig(options.win);
                        break;
                    case 'mac':
                        this.mac = new MacConfig(options.mac);
                        break;
                    case 'linux':
                        this.linux = new LinuxConfig(options.linux);
                        break;
                    case 'nsis':
                        this.nsis = new NsisConfig(options.nsis);
                        break;
                    default:
                        (<any>this)[key] = options[key];
                        break;
                }
            }
        });

        this.output = normalize(this.output);

        if(!this.appId) this.appId = (pkg.domain || pkg.name);

        if (this.win.versionStrings.ProductName && !this.win.productName) {
            console.warn('DEPRECATED: build.win.versionStrings.ProductName is deprecated, use build.win.productName instead.');
            this.win.productName = this.win.versionStrings.ProductName;
        }
        if (this.win.versionStrings.CompanyName && !this.win.companyName) {
            console.warn('DEPRECATED: build.win.versionStrings.CompanyName is deprecated, use build.win.companyName instead.');
            this.win.companyName = this.win.versionStrings.CompanyName;
        }
        if (this.win.versionStrings.FileDescription && !this.win.fileDescription) {
            console.warn('DEPRECATED: build.win.versionStrings.FileDescription is deprecated, use build.win.fileDescription instead.');
            this.win.fileDescription = this.win.versionStrings.FileDescription;
        }
        if (this.win.versionStrings.LegalCopyright && !this.win.copyright) {
            console.warn('DEPRECATED: build.win.versionStrings.LegalCopyright is deprecated, use build.win.copyright instead.');
            this.win.copyright = this.win.versionStrings.LegalCopyright;
        }

        this.win.productName = this.win.productName ? this.win.productName : pkg.name;
        this.win.companyName = this.win.companyName ? this.win.companyName : this.win.productName;
        this.win.fileDescription = this.win.fileDescription ? this.win.fileDescription : pkg.description;
        this.win.productVersion = this.win.productVersion ? this.win.productVersion : pkg.version;
        this.win.fileVersion = (this.win.fileVersion || this.nwVersion) || this.win.productVersion;

        this.mac.name = this.mac.name ? this.mac.name : pkg.name;
        this.mac.displayName = this.mac.displayName ? this.mac.displayName : this.mac.name;
        this.mac.version = this.mac.version ? this.mac.version : pkg.version;
        this.mac.description = this.mac.description ? this.mac.description : pkg.description;

        // console.info('this: \n' + JSON.stringify(this, null, 4) + '\n');
        // console.info('pkg: \n' + JSON.stringify(pkg, null, 4) + '\n');

        // if(this.resource) {
        //     this.resource.src = this.resource.src ? normalize(this.resource.src) : '';
        //     this.resource.dest = this.resource.dest ? normalize(this.resource.dest) : '';
        // }
        //
        // if(this.childApp) {
        //     this.childApp.name = this.childApp.name || '';
        //     this.childApp.excludes = this.childApp.excludes || [];
        //     this.childApp.dest = this.childApp.dest ? normalize(this.childApp.dest) : '';
        // }
        
        this.setupFolderName = `${this.appId}.setup`;
    }

}
