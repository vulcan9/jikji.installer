import fs from "fs-extra";
import path from "path";
import Ansi from "../AnsiCode.js";
import { Builder, IBuilderOptions } from "./Builder.js";
import { BuildConfig } from "./config/BuildConfig.js";
import { findRuntimeRoot } from "./util/index.js";

export class Builder_onlyLauncher extends Builder {

    constructor(options: IBuilderOptions = {}, public dir: string) {
        super(options, dir);
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
        const nwRoot = path.resolve(targetDir, config.nwFolderName);
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

        console.log(Ansi.green);
        console.log('# Builder_onlyLauncher: ', this.options.destination);
    // console.log('# runtimeDir: ', runtimeDir);
    // console.log('# appRoot: ', appRoot);
    // console.log('# runtimeRoot: ', runtimeRoot);
        console.log('# targetDir: ', targetDir);
        console.log('# exeName: ', config.win.exeName);
        console.log(Ansi.reset);
        
        
        // 런처먄 설치하므로 package.json 파일은 불필요함
        config.excludes.push('package.json');
        // 기타 배포할 파일들을 복사
        await this.copyFiles(platform, targetDir, appRoot, pkg, config);

        // exe 파일 속성 변경
        await this.prepareWinBuild(targetDir, appRoot, pkg, config);
        // nw.exe 이름 변경
        // await this.renameWinApp(targetDir, appRoot, pkg, config); 

        return targetDir;
    }

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

    // jikji.editor.launcher.exe 파일의 속성 변경
    protected async prepareWinBuild(targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {
        
        // console.error('config: ', config)

        // 런처 exe
        const launcherName_origin = 'jikji.editor.launcher';
        const launcherExe_origin = `${launcherName_origin}.exe`;
        const launcherIni_origin = `${launcherName_origin}.ini`;
        // 런처 exe 새이름
        const launcherName = config.win.exeName;
        const launcherExe = `${launcherName}.exe`;
        const launcherIni = `${launcherName}.ini`;

        // 런처 exe 이름 변경
        let launcherExePath = path.resolve(targetDir, launcherExe_origin);
        let launcherIniPath = path.resolve(targetDir, launcherIni);
        if (launcherName !== launcherName_origin) {
            launcherExePath = path.resolve(targetDir, launcherExe);
            await fs.rename(path.resolve(targetDir, launcherExe_origin), launcherExePath);
            await fs.rename(path.resolve(targetDir, launcherIni_origin), launcherIniPath);
            config.childApp.excludes.push(launcherExe);
            config.childApp.excludes.push(launcherIni);
        }
        config.childApp.excludes.push('uninstall.exe');
        config.childApp.excludes.push('package.json');
        
        // 런처 exe 속성 변경 (+코드사인)
        await this.updateWinResources(launcherExePath, config, {
            OriginalFilename: launcherExe,
            ProductVersion: "1.0.0.2",
            FileVersion: "1.0.0.2",
            FileDescription: `${config.win.fileDescription} 런처`,
        });

        /**
        # 작업 표시줄 아이콘 안바뀜 현상
        - package.json 파일에 다음 추가
            "window": { "icon": "assets/favicon.png" },
            "icons": { "256": "./assets/favicon.png" }
        - ~\User Data\Default\Web Applications\ 폴더에 아이콘이 바뀌어야 함
        - (참고) nwJS(8039 이슈) 기본 아이콘으로 표시되는 현상

        # 점프리스트 아이콘 (작업 표시줄 오른클릭 메뉴 리스트의 아이콘) 
        - %LOCALAPPDATA%\Microsoft\Windows\Explorer 아래 iconcache_*.db 삭제
        - Explorer 재시작
        */
        
        // -------------------
        // nw.exe 변경
        const nw_origin = 'nw.exe';
        const nwPath_origin = path.resolve(targetDir, config.nwFolderName, nw_origin);
        // nw.exe 새이름
        const nwName = config.childApp.nwName;
        const nwNameExe = `${nwName}.exe`;

        // nw.exe 이름 변경
        let nwExePath = nwPath_origin;
        if (nwName && nw_origin !== nwNameExe) {
            nwExePath = path.resolve(targetDir, config.nwFolderName, nwNameExe);
            await fs.rename(nwPath_origin, nwExePath);
        }

        // nw.exe 속성 변경 (+코드사인)
        await this.updateWinResources(nwExePath, config, {
            OriginalFilename: nwNameExe
        });

        // -------------------
        // ini 파일 내용 수정
        
        // ##__PackageJsonAppName_## : ${config.appId}.setup
        // ##__nwExeName__## : nwName
        (() => {
            var data = fs.readFileSync(launcherIniPath, { encoding: 'utf-8' });
            data = data.replace(/##__PackageJsonAppName_##/, config.setupFolderName);
            data = data.replace(/##__nwExeName__##/, nwName);
            fs.outputFileSync(launcherIniPath, data);
        })();
        
        // -------------------
        // child app (launcher)
        // onlyLauncher App을 위한 package json 파일 수정
        (() => {
            let launcherPackageJsonPath = path.resolve(targetDir, 'launcher/package.json');
            var data = fs.readFileSync(launcherPackageJsonPath, { encoding: 'utf-8' });
            var obj = JSON.parse(data);
            // launcher App 이름 : jikji.new.name.launcher
            obj['name'] = config.childApp.name;
            obj['domain'] = config.childApp.name;
            fs.outputJsonSync(launcherPackageJsonPath, obj, {spaces: 4});
        })();
        
        // -------------------
        // child app (uninstall)
        // onlyLauncher App을 uninstall 하기위한 package json 파일 수정
        (() => {
            let uninstallPackageJsonPath = path.resolve(targetDir, 'uninstall/package.json');
            var data = fs.readFileSync(uninstallPackageJsonPath, { encoding: 'utf-8' });
            var obj = JSON.parse(data);
            // uninstall App 이름 : jikji.new.name.uninstall
            obj['name'] = `${config.appId}.uninstall`;
            obj['domain'] = `${config.appId}.uninstall`;
            fs.outputJsonSync(uninstallPackageJsonPath, obj, {spaces: 4});
        })();
        
    }
}
