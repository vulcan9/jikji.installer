
import { normalize } from 'path';

import { WinConfig } from './WinConfig';
import { MacConfig } from './MacConfig';
import { LinuxConfig } from './LinuxConfig';
import { NsisConfig } from './NsisConfig';

export class BuildConfig {

    public nwVersion: string = 'lts';
    public nwFlavor: string = 'normal';

    public output: string = './dist/';
    public outputPattern: string = '${NAME}-${VERSION}-${PLATFORM}-${ARCH}';
    public packed: boolean = false;
    public targets: string[] = [];
    public files: string[] = [ '**/*' ];
    public excludes: string[] = [];

    // 압축 파일 풀기 기능 지원
    public extract: {src?: string, dest?: string} = {};
    // nwJS App 복사 기능 지원
    public copyApp: {excludes?: string[], dest?: string} = {};
    // public nwFiles: string[] = [];
    public appName: string = '';

    public win: WinConfig = new WinConfig();
    public mac: MacConfig = new MacConfig();
    public linux: LinuxConfig = new LinuxConfig();
    public nsis: NsisConfig = new NsisConfig();

    public appId: string = undefined;
    public ffmpegIntegration: boolean = false;
    public strippedProperties: string[] = [ 'scripts', 'devDependencies', 'build' ];
    public overriddenProperties: any = {};

    constructor(pkg: any = {}) {

        const options = pkg.build ? pkg.build : {};

        Object.keys(this).map((key) => {
            if(options[key] !== undefined) {
                switch(key) {
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

        this.appId = this.appId ? this.appId : (pkg.domain || pkg.name);

        if(this.win.versionStrings.ProductName && !this.win.productName) {
            console.warn('DEPRECATED: build.win.versionStrings.ProductName is deprecated, use build.win.productName instead.');
            this.win.productName = this.win.versionStrings.ProductName;
        }
        if(this.win.versionStrings.CompanyName && !this.win.companyName) {
            console.warn('DEPRECATED: build.win.versionStrings.CompanyName is deprecated, use build.win.companyName instead.');
            this.win.companyName = this.win.versionStrings.CompanyName;
        }
        if(this.win.versionStrings.FileDescription && !this.win.fileDescription) {
            console.warn('DEPRECATED: build.win.versionStrings.FileDescription is deprecated, use build.win.fileDescription instead.');
            this.win.fileDescription = this.win.versionStrings.FileDescription;
        }
        if(this.win.versionStrings.LegalCopyright && !this.win.copyright) {
            console.warn('DEPRECATED: build.win.versionStrings.LegalCopyright is deprecated, use build.win.copyright instead.');
            this.win.copyright = this.win.versionStrings.LegalCopyright;
        }

        this.win.productName = this.win.productName ? this.win.productName : pkg.name;
        this.win.companyName = this.win.companyName ? this.win.companyName : this.win.productName;
        this.win.fileDescription = this.win.fileDescription ? this.win.fileDescription : pkg.description;
        this.win.productVersion = this.win.productVersion ? this.win.productVersion : pkg.version;
        this.win.fileVersion = (this.win.fileVersion || this.nwVersion ) || this.win.productVersion;

        this.mac.name = this.mac.name ? this.mac.name : pkg.name;
        this.mac.displayName = this.mac.displayName ? this.mac.displayName : this.mac.name;
        this.mac.version = this.mac.version ? this.mac.version : pkg.version;
        this.mac.description = this.mac.description ? this.mac.description : pkg.description;

        if(pkg.extract) {
            if(pkg.extract.src) this.extract.src = normalize(pkg.extract.src);
            if(pkg.extract.dest) this.extract.dest = normalize(pkg.extract.dest);
        }

        if(pkg.copyApp) {
            if(pkg.copyApp.excludes) this.copyApp.excludes = pkg.copyApp.excludes;
            if(pkg.copyApp.dest) this.copyApp.dest = normalize(pkg.copyApp.dest);
        }
        this.appName = pkg.name;
    }

}
