import fs from "fs-extra";
import path from "path";
import { Builder, IBuilderOptions } from "./Builder.js";
import { BuildConfig } from "./config/BuildConfig.js";
import { findRuntimeRoot } from "./util/index.js";

export const NW_FOLDER_NAME = 'nw';

export class Builder_onlyLauncher extends Builder {

    constructor(options: IBuilderOptions = {}, public dir: string) {
        super(options, dir);

        // this.options.productName = this.options.productName || 'NO_PRODUCT_NAME';
        // this.options.companyName = this.options.companyName || 'NO_COMPANY_NAME';
        // this.options.description = this.options.description || 'NO_DESCRIPTION';
        // this.options.version = this.options.version || 'NO_PRODUCT_VERSION';
        // this.options.copyright = this.options.copyright || 'NO_COPYRIGHT';
        // this.options.publisher = this.options.publisher || 'NO_PUBLISH';
        //
        // this.options.exeName = this.options.exeName || 'NO_FILE_NAME';
        // this.options.programGroupName = this.options.programGroupName || 'NO_PROGRAM_GROUP';
        //
        // this.options.compression = this.options.compression || 'lzma';
        // this.options.solid = Boolean(this.options.solid);
        // this.options.languages = this.options.languages && this.options.languages.length > 0 ? this.options.languages : ['English'];
        //
        // this.fixedVersion = fixWindowsVersion(this.options.version);
        //
        // if (this.options.appName) this.options.appName = '$LOCALAPPDATA\\' + this.options.appName;

        // process.stdout.write('this.options 설정값: \n' + JSON.stringify(this.options.childApp, null, 4) + '\n');

        console.error('Builder_onlyLauncher: ', this.options.destination);
    }
    
    // const sourceDir = await this.buildDirTarget(platform, arch, runtimeDir, pkg, config);

    protected async buildDirTarget(platform: string, arch: string, runtimeDir: string, pkg: any, config: BuildConfig): Promise<string> {

        // nwJS 압축 해지 폴더 경로
        const runtimeRoot = await findRuntimeRoot(platform, runtimeDir);

        // 설치에 포함시킬 root 폴더
        const targetDir = path.resolve(this.dir, config.output, this.parseOutputPattern(config.outputPattern, {
            name: pkg.name,
            version: pkg.version,
            platform, arch,
        }, pkg, config));

        const appRoot = path.resolve(targetDir, './');
        await fs.emptyDir(targetDir);
        await fs.ensureDir(appRoot);

        // 불필요한 언어팩을 제외하고 복사
        // 임시 nwJS 폴더 경로
        const nwRoot = path.resolve(targetDir, NW_FOLDER_NAME);
        await (async () => {
            await this.copyNwFolder(runtimeRoot, nwRoot);
            if (config.ffmpegIntegration) {
                await this.integrateFFmpeg(platform, arch, targetDir, pkg, config);
            }
            
            // zip 압축 효과 없음
            // - zip 했을때: 100M
            // - 원본 폴더 포함시켰을때: 75M
            // zip: 설치 중에 압축 해제 속도를 우선시해야 할 때 (zip 한 번만 풀면 끝)
            // 거의 항상 원본 → NSIS 직접 압축이 더 유리
            /*
            // zip으로 묶기, 임시 폴더 정리
            await folderZip(targetDir, nwRoot, path.resolve(targetDir, 'nw.zip'));
            await fs.remove(nwRoot);
            */
        })()

        // 런처먄 설치하므로 package.json 파일은 불필요함
        config.excludes.push('package.json');
        // 기타 배포할 파일들을 복사
        await this.copyFiles(platform, targetDir, appRoot, pkg, config);

        /*
        //  nw.exe 파일 속성 변경
        await this.prepareWinBuild(targetDir, appRoot, pkg, config);
        // nw.exe 이름 변경
        await this.renameWinApp(nwRoot, appRoot, pkg, config); 
        */

    // console.error('# runtimeDir: ', runtimeDir);
    // console.error('# appRoot: ', appRoot);
    // console.error('# runtimeRoot: ', runtimeRoot);
    // console.error('# targetDir: ', targetDir);
        return targetDir;
    }

    // protected async copyFiles(platform: string, targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {
    //     super.copyFiles(platform, targetDir, appRoot, pkg, config);

    //     // uninstall 폴더 위치 설정
    // }

    protected async copyNwFolder(runtimeRoot: string, nwRoot: string) {
        // 불필요한 언어팩을 제외하고 복사
        const regexp = /.+\\locales$/g;
        await fs.copy(runtimeRoot, nwRoot, {
            // false (기본값): 심볼릭 링크를 그대로 복사
            // true: 심볼릭 링크를 따라가서 실제 파일/폴더 내용을 복사
            //dereference: true,
            filter: (src, dest) => !regexp.test(src)
        });

        // 필요한 언어팩 복사
        ['en-US.pak', 'ko.pak'].forEach(async (filename) => {
            const src = path.resolve(runtimeRoot, 'locales', filename);
            const dest = path.resolve(nwRoot, 'locales', filename);
            await fs.copy(src, dest);
        });
    }

    // 런처먄 설치하므로 package.json 파일은 불필요함
    protected async writeStrippedManifest(path: string, pkg: any, config: BuildConfig) {
        if (config.onlyLauncher) return;
        super.writeStrippedManifest(path, pkg, config);
    }

    /* 
    //  exe 파일 속성 변경
    protected updateWinResources(targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {

        return new Promise((resolve, reject) => {

            const pathStr = path.resolve(targetDir, 'nw.exe');
            const rc = {
                'product-version': fixWindowsVersion(config.win.productVersion),
                'file-version': fixWindowsVersion(config.win.fileVersion),
                'version-string': {
                    ProductName: config.win.productName,
                    CompanyName: config.win.companyName,
                    FileDescription: config.win.fileDescription,
                    LegalCopyright: config.win.copyright,
                    ...config.win.versionStrings,
                },
                'icon': config.win.icon ? path.resolve(this.dir, config.win.icon) : undefined,
            };

            // exe 파일에 아이콘 적용
            rcedit(pathStr, rc, (err: Error) => err ? reject(err) : resolve());
            console.log('\x1b[31m%s\x1b[0m', '# (주의) 아이콘 변경: nw.exe의 코드 사인은 유지되지 않습니다.');
            
            // resolve();
        });
    }
    */

    /*
    윈도우용만 남겨놓기로...darwin, osx, mac, linux
    rcedit icon 변경 skip
    버전 롤백(리스트) 기능 X
    */
}

