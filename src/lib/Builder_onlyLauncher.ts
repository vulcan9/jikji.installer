import fs from "fs-extra";
import path from "path";
import { Builder, IBuilderOptions } from "./Builder.js";
import { BuildConfig } from "./config/BuildConfig.js";
import { findRuntimeRoot } from "./util/index.js";

export const NW_FOLDER_NAME = 'nw';

export class Builder_onlyLauncher extends Builder {

    constructor(options: IBuilderOptions = {}, public dir: string) {
        super(options, dir);
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

    // console.error('# runtimeDir: ', runtimeDir);
    // console.error('# appRoot: ', appRoot);
    // console.error('# runtimeRoot: ', runtimeRoot);
        console.error('# targetDir: ', targetDir);
        console.error('# exeName: ', config.win.exeName);
        
        
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
        
        // 런처 exe 속성 변경
        const launcherName_origin = 'jikji.editor.launcher';
        const launcherExe_origin = `${launcherName_origin}.exe`;
        const launcherIni_origin = `${launcherName_origin}.ini`;
        // await this.updateWinResources(path.resolve(targetDir, launcherExe_origin), config);

        // 런처 exe 이름 변경
        const launcherName = config.win.exeName;
        if (launcherName !== launcherName_origin) {
            const launcherExe = `${launcherName}.exe`;
            const launcherIni = `${launcherName}.ini`;
            await fs.rename(path.resolve(targetDir, launcherExe_origin), path.resolve(targetDir, launcherExe));
            await fs.rename(path.resolve(targetDir, launcherIni_origin), path.resolve(targetDir, launcherIni));
            config.childApp.excludes.push(launcherExe);
            config.childApp.excludes.push(launcherIni);
        }

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
        
        // nw.exe 속성 변경
        const nw_origin = 'nw.exe';
        const nwPath_origin = path.resolve(targetDir, NW_FOLDER_NAME, nw_origin);
        await this.updateWinResources(nwPath_origin, config);

        // nw.exe 이름 변경
        const nwName = config.childApp.nwName;
        const nwNameExe = `${nwName}.exe`;
        if (nwName && nw_origin !== nwNameExe) {
            const nwExePath = path.resolve(targetDir, NW_FOLDER_NAME, nwNameExe);
            await fs.rename(nwPath_origin, nwExePath);
        }
    }

    /*
    윈도우용만 남겨놓기로...darwin, osx, mac, linux
    rcedit icon 변경 skip
    버전 롤백(리스트) 기능 X
    */
}

