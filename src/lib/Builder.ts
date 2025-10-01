import path from 'path';

import fs from 'fs-extra';
import semver from 'semver';

import createDebug from 'debug';
import globby from 'globby';
import plist from 'plist';
import rcedit from 'rcedit';

import { Downloader } from './Downloader.js';
import { FFmpegDownloader } from './FFmpegDownloader.js';
import { DownloaderBase, NsisVersionInfo } from './common/index.js';
import { BuildConfig } from './config/index.js';
import { NsisComposer_onlyLauncher } from './nsis-gen/NsisComposer_onlyLauncher.js';
import { INsisComposerOptions, nsisBuild, NsisComposer, NsisDiffer } from './nsis-gen/index.js';
import {
    compress,
    copyFileAsync,
    findExcludableDependencies,
    findExecutable,
    findFFmpeg,
    findRuntimeRoot,
    fixWindowsVersion,
    mergeOptions,
    tmpDir,
    tmpName
} from './util/index.js';

const debug = createDebug('build:builder');

export interface IParseOutputPatternOptions {
    name: string;
    version: string;
    platform: string;
    arch: string;
}

export interface IBuilderOptions {
    win?: boolean;
    mac?: boolean;
    linux?: boolean;
    x86?: boolean;
    x64?: boolean;
    tasks?: string[];
    chromeApp?: boolean;
    mirror?: string;
    concurrent?: boolean;
    mute?: boolean;
    forceCaches?: boolean;
    destination?: string;
    preserveSource?: boolean,
    preserveArchive?: boolean,
    preserveScript?: boolean,
}

export class Builder {

    public static DEFAULT_OPTIONS: IBuilderOptions = {
        win: false,
        mac: false,
        linux: false,
        x86: false,
        x64: false,
        tasks: [],
        chromeApp: false,
        mirror: Downloader.DEFAULT_OPTIONS.mirror,
        concurrent: false,
        mute: false,
        forceCaches: Downloader.DEFAULT_OPTIONS.forceCaches,
        destination: DownloaderBase.DEFAULT_DESTINATION,
        // 압축 소스 폴더 보존
        preserveSource: false,
        // 압축 파일 보존
        preserveArchive: false,
        // true 이면 생성한 NSIS 스크립트 파일 삭제하지 않음
        preserveScript: false,
    };

    public options: IBuilderOptions;

    constructor(options: IBuilderOptions = {}, public dir: string) {

        this.options = mergeOptions(Builder.DEFAULT_OPTIONS, options);

        debug('in constructor', 'dir', dir);
        debug('in constructor', 'options', this.options);
    }

    public async build(pkg: any) {
        const tasks: string[][] = [];

        [
            'win',
            'mac',
            'linux'
        ].map((platform) => {
            [
                'x86',
                'x64'
            ].map((arch) => {
                if ((<any>this.options)[platform] && (<any>this.options)[arch]) {
                    tasks.push([
                        platform,
                        arch
                    ]);
                }
            });
        });

        for (const task of <any>this.options.tasks) {
            const [platform, arch] = task.split('-');

            if ([
                'win',
                'mac',
                'linux'
            ].indexOf(platform) >= 0) {
                if ([
                    'x86',
                    'x64'
                ].indexOf(arch) >= 0) {
                    tasks.push([
                        platform,
                        arch
                    ]);
                }
            }

        }

        if (!this.options.mute) {
            console.info('Starting building tasks...', {
                tasks,
                concurrent: this.options.concurrent,
            });
        }

        if (tasks.length === 0) {
            throw new Error('ERROR_NO_TASK');
        }

        if (this.options.concurrent) {
            await Promise.all(
                tasks.map(async ([platform, arch]) => {
                    const options: any = {};
                    options[platform] = true;
                    options[arch] = true;
                    options.mirror = this.options.mirror;
                    options.concurrent = false;
                    options.mute = true;

                    const builder = new Builder(options, this.dir);

                    const started = Date.now();

                    if (!this.options.mute) {
                        console.info(`Building for ${platform}, ${arch} starts...`);
                    }

                    await builder.build(pkg);

                    if (!this.options.mute) {
                        console.info(
                            `Building for ${platform}, ${arch} ends within ${this.getTimeDiff(started)}s.`
                        );
                    }
                })
            );

        } else {

            const config = new BuildConfig(pkg);
            debug('in build', 'config', config);

            for (const [platform, arch] of tasks) {
                const started = Date.now();
                if (!this.options.mute) {
                    console.info(`Building for ${platform}, ${arch} starts...`);
                }

                try {
                    await this.buildTask(platform, arch, pkg, config);
                } catch (err) {
                    console.warn(err);
                }
                if (!this.options.mute) {
                    console.info(`Building for ${platform}, ${arch} ends within ${this.getTimeDiff(started)}s.`);
                }
            }

        }
    }

    protected getTimeDiff(started: number) {
        return ((Date.now() - started) / 1000).toFixed(2);
    }

    protected async writeStrippedManifest(path: string, pkg: any, config: BuildConfig) {

        const json: any = {};

        for (const key in pkg) {
            if (pkg.hasOwnProperty(key) && config.strippedProperties.indexOf(key) === -1) {
                if (config.overriddenProperties && config.overriddenProperties.hasOwnProperty(key)) {
                    json[key] = config.overriddenProperties[key];
                } else {
                    json[key] = pkg[key];
                }
            }
        }

        await fs.writeFile(path, JSON.stringify(json));
    }

    protected parseOutputPattern(pattern: string, options: IParseOutputPatternOptions, pkg: any, config: BuildConfig) {

        return pattern.replace(/\$\{\s*(\w+)\s*\}/g, (match: string, key: string) => {
            switch (key.toLowerCase()) {
                case 'name':
                    return options.name;
                case 'version':
                    return options.version;
                case 'platform':
                    return options.platform;
                case 'arch':
                    return options.arch;
                default:
                    throw new Error('ERROR_KEY_UNKNOWN');
            }
        });
    }

    protected combineExecutable(executable: string, nwFile: string) {
        return new Promise((resolve, reject) => {

            const nwStream = fs.createReadStream(nwFile);
            const stream = fs.createWriteStream(executable, {
                flags: 'a',
            });

            nwStream.on('error', reject);
            stream.on('error', reject);
            stream.on('finish', resolve);

            nwStream.pipe(stream);
        });
    }

    protected async readPlist(path: string): Promise<any> {
        const data = await fs.readFile(path, {encoding: 'utf8'});
        return plist.parse(data.toString()) as any;
    }

    protected async writePlist(path: string, p: any) {
        return fs.writeFile(path, plist.build(p));
    }

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

            console.log('\x1b[31m%s\x1b[0m', '# (주의) 아이콘 변경: nw.exe의 코드 사인은 유지되지 않습니다.');
            rcedit(pathStr, rc, (err: Error) => err ? reject(err) : resolve());
        });
    }

    protected async renameWinApp(targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {
        const src = path.resolve(targetDir, 'nw.exe');
        const dest = path.resolve(targetDir, `${config.win.exeName}.exe`);
        return await fs.rename(src, dest);
    }

    protected async updatePlist(targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {
        const pathStr = path.resolve(targetDir, './nwjs.app/Contents/Info.plist');
        const plistObj = await this.readPlist(pathStr);
        plistObj.CFBundleIdentifier = config.appId;
        plistObj.CFBundleName = config.mac.name;
        plistObj.CFBundleExecutable = config.mac.displayName;
        plistObj.CFBundleDisplayName = config.mac.displayName;
        plistObj.CFBundleVersion = config.mac.version;
        plistObj.CFBundleShortVersionString = config.mac.version;

        for (const key in config.mac.plistStrings) {
            if (config.mac.plistStrings.hasOwnProperty(key)) {
                plistObj[key] = config.mac.plistStrings[key];
            }
        }
        await this.writePlist(pathStr, plistObj);
    }

    protected async updateHelperPlist(targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {
        if (!this.canRenameMacHelperApp(pkg, config)) {
            return;
        }

        const helperPath = await this.findMacHelperApp(targetDir);
        const pathStr = path.resolve(helperPath, 'Contents/Info.plist');
        const bin = pkg.product_string + ' Helper';

        const plistObj = await this.readPlist(pathStr);
        plistObj.CFBundleIdentifier = config.appId + '.helper';
        plistObj.CFBundleDisplayName = bin;
        plistObj.CFBundleExecutable = bin;
        plistObj.CFBundleName = bin;

        await this.writePlist(pathStr, plistObj);
    }

    protected async updateMacIcons(targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {
        const copyIcon = async (iconPath: string, dest: string) => {
            if (!iconPath) {
                // use the default
                return;
            }
            await fs.copy(path.resolve(this.dir, iconPath), dest);
        };

        await copyIcon(config.mac.icon, path.resolve(targetDir, './nwjs.app/Contents/Resources/app.icns'));
        await copyIcon(config.mac.documentIcon, path.resolve(targetDir, './nwjs.app/Contents/Resources/document.icns'));
    }

    protected async fixMacMeta(targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {

        const files = await globby(['**/InfoPlist.strings'], {
            cwd: targetDir,
        });

        for (const file of files) {
            const pathStr = path.resolve(targetDir, file);

            // Different versions has different encodings for `InforPlist.strings`.
            // We determine encoding by evaluating bytes of `CF` here.
            const data = await fs.readFile(pathStr);
            const encoding = data.indexOf(Buffer.from('43004600', 'hex')) >= 0 ? 'ucs2' : 'utf8';
            const strings = data.toString(encoding);

            const newStrings = strings.replace(/([A-Za-z]+)\s+=\s+"(.+?)";/g, (match: string, key: string, value: string) => {
                switch (key) {
                    case 'CFBundleName':
                        return `${key} = "${config.mac.name}";`;
                    case 'CFBundleDisplayName':
                        return `${key} = "${config.mac.displayName}";`;
                    case 'CFBundleGetInfoString':
                        return `${key} = "${config.mac.version}";`;
                    case 'NSContactsUsageDescription':
                        return `${key} = "${config.mac.description}";`;
                    case 'NSHumanReadableCopyright':
                        return `${key} = "${config.mac.copyright}";`;
                    default:
                        return `${key} = "${value}";`;
                }
            });

            await fs.writeFile(pathStr, Buffer.from(newStrings, encoding));
        }
    }

    protected async renameMacApp(targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {
        const app = path.resolve(targetDir, 'nwjs.app');
        const bin = path.resolve(app, './Contents/MacOS/nwjs');
        let dest = bin.replace(/nwjs$/, config.mac.displayName);

        await fs.rename(bin, dest);
        dest = app.replace(/nwjs\.app$/, `${config.mac.displayName}.app`);

        return await fs.rename(app, dest);
    }

    protected async renameMacHelperApp(targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {
        if (!this.canRenameMacHelperApp(pkg, config)) {
            return;
        }

        const app = await this.findMacHelperApp(targetDir);
        const bin = path.resolve(app, './Contents/MacOS/nwjs Helper');
        let dest = bin.replace(/nwjs Helper$/, `${pkg.product_string} Helper`);
        await fs.rename(bin, dest);

        dest = app.replace(/nwjs Helper\.app$/, `${pkg.product_string} Helper.app`);
        return await fs.rename(app, dest);
    }

    protected canRenameMacHelperApp(pkg: any, config: BuildConfig): boolean {
        if (semver.lt(config.nwVersion, '0.24.4')) {
            // this version doesn't support Helper app renaming.
            return false;
        }
        if (!pkg.product_string) {
            // we can't rename the Helper app as we don't have a new name.
            return false;
        }
        return true;
    }

    protected async findMacHelperApp(targetDir: string): Promise<string> {
        const pathStr = path.resolve(targetDir, './nwjs.app/Contents/Versions');

        // what version are we actually dealing with?
        const versions = await fs.readdir(pathStr);

        if (!versions || versions.length !== 1) {
            throw new Error("Can't rename the Helper as we can't find it");
        }

        return path.resolve(pathStr, versions[0], 'nwjs Helper.app');
    }

    protected async fixLinuxMode(targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {
        const pathStr = path.resolve(targetDir, 'nw');
        await fs.chmod(pathStr, 0o744);
    }

    protected async renameLinuxApp(targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {
        const src = path.resolve(targetDir, 'nw');
        const dest = path.resolve(targetDir, `${pkg.name}`);
        return await fs.rename(src, dest);
    }

    protected async prepareWinBuild(targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {
        await this.updateWinResources(targetDir, appRoot, pkg, config);
    }

    protected async prepareMacBuild(targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {
        await this.updateHelperPlist(targetDir, appRoot, pkg, config);
        await this.updatePlist(targetDir, appRoot, pkg, config);
        await this.updateMacIcons(targetDir, appRoot, pkg, config);
        await this.fixMacMeta(targetDir, appRoot, pkg, config);
    }

    protected async prepareLinuxBuild(targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {
        await this.fixLinuxMode(targetDir, appRoot, pkg, config);
    }

    protected async copyFiles(platform: string, targetDir: string, appRoot: string, pkg: any, config: BuildConfig) {
        const generalExcludes = [
            '**/node_modules/.bin',
            '**/node_modules/*/{ example, examples, test, tests }',
            '**/{ .DS_Store, .git, .hg, .svn, *.log }',
        ];

        const dependenciesExcludes = await findExcludableDependencies(this.dir, pkg)
            .then((excludable) => {
                return excludable.map(excludable => [
                    excludable,
                    `${excludable}/**/*`
                ]);
            })
            .then((excludes) => {
                return Array.prototype.concat.apply([], excludes);
            });

        debug('in copyFiles', 'dependenciesExcludes', dependenciesExcludes);

        const ignore = [
            ...config.excludes,
            ...generalExcludes,
            ...dependenciesExcludes,
            ...[
                config.output,
                `${config.output}/**/*`
            ]
        ];

        debug('in copyFiles', 'ignore', ignore);

        const files: string[] = await globby(config.files, {
            cwd: this.dir,
            // TODO: https://github.com/isaacs/node-glob#options, warn for cyclic links.
            // (2025.09.19 ~) 링크 참조일때 무한 순환참조 가능성이 있으므로 false 설정함
            follow: false,
            mark: true,
            ignore,
        });

        debug('in copyFiles', 'config.files', config.files);
        debug('in copyFiles', 'files', files);

        if (config.packed) {
            switch (platform) {
                case 'win32':
                case 'win':
                case 'linux':
                    const nwFile = await tmpName({
                        postfix: '.zip',
                    });

                    await compress(this.dir, files.filter((file) => !file.endsWith('/')), 'zip', nwFile);

                    const {path: tempDir} = await tmpDir();
                    await this.writeStrippedManifest(path.resolve(tempDir, 'package.json'), pkg, config);
                    await compress(tempDir, ['./package.json'], 'zip', nwFile);
                    await fs.remove(tempDir);

                    const executable = await findExecutable(platform, targetDir);
                    await this.combineExecutable(executable, nwFile);

                    await fs.remove(nwFile);
                    break;
                case 'darwin':
                case 'osx':
                case 'mac':
                    for (const file of files) {
                        await copyFileAsync(path.resolve(this.dir, file), path.resolve(appRoot, file));
                    }
                    await this.writeStrippedManifest(path.resolve(appRoot, 'package.json'), pkg, config);
                    break;
                default:
                    throw new Error('ERROR_UNKNOWN_PLATFORM');
            }

        } else {
            for (const file of files) {
                await copyFileAsync(path.resolve(this.dir, file), path.resolve(appRoot, file));
            }
            await this.writeStrippedManifest(path.resolve(appRoot, 'package.json'), pkg, config);
        }
    }

    protected async integrateFFmpeg(platform: string, arch: string, targetDir: string, pkg: any, config: BuildConfig) {

        const downloader = new FFmpegDownloader({
            platform, arch,
            version: config.nwVersion,
            useCaches: true,
            showProgress: !this.options.mute,
            destination: this.options.destination,
            forceCaches: this.options.forceCaches
        });

        if (!this.options.mute) {
            console.info('Fetching FFmpeg prebuilt...', {
                platform: downloader.options.platform,
                arch: downloader.options.arch,
                version: downloader.options.version,
            });
        }

        const ffmpegDir = await downloader.fetchAndExtract();
        const src = await findFFmpeg(platform, ffmpegDir);
        const dest = await findFFmpeg(platform, targetDir);
        await fs.copy(src, dest);
    }

    protected getNsisComposerOptions(config: BuildConfig): INsisComposerOptions {
        return {

            // Basic.
            productName: config.win.productName,
            companyName: config.win.companyName,
            description: config.win.fileDescription,
            version: fixWindowsVersion(config.win.productVersion),
            copyright: config.win.copyright,

            publisher: config.win.publisher,
            exeName: config.win.exeName,
            programGroupName: config.win.programGroupName,

            theme: config.nsis.theme ? path.resolve(this.dir, config.nsis.theme) : '',
            license: config.nsis.license ? path.resolve(this.dir, config.nsis.license) : '',
            web: config.nsis.web,

            // Compression.
            compression: 'lzma',
            solid: true,

            languages: config.nsis.languages,
            installDirectory: config.nsis.installDirectory,
            install_visualCpp: config.install_visualCpp,
            onlyLauncher: config.onlyLauncher,

            // Output.
            output: config.output,
            // output: targetNsis,
            appName: config.appName,
            childApp: config.childApp,
            resource: config.resource,
            uninstall: config.uninstall,
            associate: config.associate

        };
    }

    protected async buildNsisDiffUpdater(platform: string, arch: string, versionInfo: NsisVersionInfo, fromVersion: string, toVersion: string, pkg: any, config: BuildConfig) {

        const targetNsis = path.resolve(this.dir, config.output, `${pkg.name}-${toVersion} (${platform} ${arch})-(update from ${fromVersion}).exe`);
        const fromDir = path.resolve(this.dir, config.output, (await versionInfo.getVersion(fromVersion)).source);
        const toDir = path.resolve(this.dir, config.output, (await versionInfo.getVersion(toVersion)).source);

        const data = await (new NsisDiffer(fromDir, toDir, {
            ...this.getNsisComposerOptions(config),
            output: targetNsis,
        })).make();

        const script = await tmpName();
        await fs.writeFile(script, data);

        await nsisBuild(toDir, script, {
            mute: !!this.options.mute,
            output: targetNsis,
            preserveScript: this.options.preserveScript || false
        });
        await versionInfo.addUpdater(toVersion, fromVersion, arch, targetNsis);
    }

    protected async buildDirTarget(platform: string, arch: string, runtimeDir: string, pkg: any, config: BuildConfig): Promise<string> {

        // nwJS 압축 해지 폴더 경로
        const runtimeRoot = await findRuntimeRoot(platform, runtimeDir);

        // 설치에 포함시킬  폴더
        const targetDir = path.resolve(this.dir, config.output, this.parseOutputPattern(config.outputPattern, {
            name: pkg.name,
            version: pkg.version,
            platform, arch,
        }, pkg, config));
        
        // 설치에 포함시킬 nwJS 폴더 경로
        const appRoot = path.resolve(targetDir, (() => {
            switch (platform) {
                case 'win32':
                case 'win':
                case 'linux':
                    return './';
                case 'darwin':
                case 'osx':
                case 'mac':
                    return './nwjs.app/Contents/Resources/app.nw/';
                default:
                    throw new Error('ERROR_UNKNOWN_PLATFORM');
            }
        })());

        await fs.emptyDir(targetDir);
        await fs.copy(runtimeRoot, targetDir, {
            // false (기본값): 심볼릭 링크를 그대로 복사
            // true: 심볼릭 링크를 따라가서 실제 파일/폴더 내용을 복사
            //dereference: true,
        });
        if (config.ffmpegIntegration) {
            await this.integrateFFmpeg(platform, arch, targetDir, pkg, config);
        }
        await fs.ensureDir(appRoot);

        // Copy before refining might void the effort.
        switch (platform) {
            case 'win32':
            case 'win':
                await this.prepareWinBuild(targetDir, appRoot, pkg, config);
                await this.copyFiles(platform, targetDir, appRoot, pkg, config);
                await this.renameWinApp(targetDir, appRoot, pkg, config);
                break;
            case 'darwin':
            case 'osx':
            case 'mac':
                await this.prepareMacBuild(targetDir, appRoot, pkg, config);
                await this.copyFiles(platform, targetDir, appRoot, pkg, config);
                // rename Helper before main app rename.
                await this.renameMacHelperApp(targetDir, appRoot, pkg, config);
                await this.renameMacApp(targetDir, appRoot, pkg, config);
                break;
            case 'linux':
                await this.prepareLinuxBuild(targetDir, appRoot, pkg, config);
                await this.copyFiles(platform, targetDir, appRoot, pkg, config);
                await this.renameLinuxApp(targetDir, appRoot, pkg, config);
                break;
            default:
                throw new Error('ERROR_UNKNOWN_PLATFORM');
        }

        return targetDir;
    }

    protected async buildArchiveTarget(type: string, sourceDir: string) {

        const targetArchive = path.resolve(path.dirname(sourceDir), `${path.basename(sourceDir)}.${type}`);
        await fs.remove(targetArchive);

        const files = await globby(['**/*'], {
            cwd: sourceDir,
        });
        await compress(sourceDir, files, type, targetArchive);

        return targetArchive;
    }

    protected async buildNsisTarget(platform: string, arch: string, sourceDir: string, pkg: any, config: BuildConfig) {

        if (platform !== 'win') {
            if (!this.options.mute) {
                console.info(`Skip building nsis target for ${platform}.`);
            }
            return;
        }

        const versionInfo = new NsisVersionInfo(path.resolve(this.dir, config.output, 'versions.nsis.json'));
        const targetNsis = path.resolve(path.dirname(sourceDir), `${path.basename(sourceDir)}.exe`);

        const options = {
            ...this.getNsisComposerOptions(config),
            output: targetNsis,
        };
        const composer = (config.onlyLauncher) ? new NsisComposer_onlyLauncher(options) : new NsisComposer(options);
        const data = await composer.make();

        // const data = await (new NsisComposer({
        //     ...this.getNsisComposerOptions(config),
        //     output: targetNsis,
        // })).make();

        const script = await tmpName();
        await fs.writeFile(script, data);

        await nsisBuild(sourceDir, script, {
            mute: !!this.options.mute,
            output: targetNsis,
            preserveScript: this.options.preserveScript || false
        });

        await versionInfo.addVersion(pkg.version, '', sourceDir);
        await versionInfo.addInstaller(pkg.version, arch, targetNsis);

        if (config.nsis.diffUpdaters) {
            for (const version of await versionInfo.getVersions()) {
                if (semver.gt(pkg.version, version)) {
                    await this.buildNsisDiffUpdater(platform, arch, versionInfo, version, pkg.version, pkg, config);
                }
            }
        }

        await versionInfo.save();
    }

    protected async buildNsis7zTarget(platform: string, arch: string, sourceDir: string, pkg: any, config: BuildConfig) {

        if (platform !== 'win') {
            if (!this.options.mute) {
                console.info(`Skip building nsis7z target for ${platform}.`);
            }
            return;
        }

        const versionInfo = new NsisVersionInfo(path.resolve(this.dir, config.output, 'versions.nsis.json'));
        // 압축파일 (경로)
        // sourceDir : 압축 대상 폴더 경로
        const sourceArchive = await this.buildArchiveTarget('7z', sourceDir);
        // 인스톨 exe 파일 생성 경로
        const targetNsis = path.resolve(path.dirname(sourceDir), `${path.basename(sourceDir)}.exe`);

        const options = {
            ...this.getNsisComposerOptions(config),
            output: targetNsis,
        };
        const composer = (config.onlyLauncher) ? new NsisComposer_onlyLauncher(options) : new NsisComposer(options);
        const data = await composer.make();

        // const data = await (new Nsis7Zipper(sourceArchive, {
        //     ...this.getNsisComposerOptions(config),
        //     output: targetNsis,
        // })).make();

        const script = await tmpName();
        await fs.writeFile(script, data);

        await nsisBuild(sourceDir, script, {
            mute: !!this.options.mute,
            output: targetNsis,
            preserveScript: this.options.preserveScript || false
        });

        await versionInfo.addVersion(pkg.version, '', sourceDir);
        await versionInfo.addInstaller(pkg.version, arch, targetNsis);

        if (config.nsis.diffUpdaters) {
            for (const version of await versionInfo.getVersions()) {
                if (semver.gt(pkg.version, version)) {
                    await this.buildNsisDiffUpdater(platform, arch, versionInfo, version, pkg.version, pkg, config);
                }
            }
        }

        await versionInfo.save();
        return sourceArchive;
    }

    protected async buildTask(platform: string, arch: string, pkg: any, config: BuildConfig) {

        if (platform === 'mac' && arch === 'x86' && !config.nwVersion.includes('0.12.3')) {
            if (!this.options.mute) {
                console.info(`The NW.js binary for ${platform}, ${arch} isn't available for ${config.nwVersion}, skipped.`);
            }
            throw new Error('ERROR_TASK_MAC_X86_SKIPPED');
        }

        const downloader = new Downloader({
            platform, arch,
            version: config.nwVersion,
            flavor: config.nwFlavor,
            mirror: this.options.mirror,
            useCaches: true,
            showProgress: !this.options.mute,
            forceCaches: this.options.forceCaches,
            destination: this.options.destination,
        });

        if (!this.options.mute) {
            console.info('Fetching NW.js binary...', {
                platform: downloader.options.platform,
                arch: downloader.options.arch,
                version: downloader.options.version,
                flavor: downloader.options.flavor,
            });
        }

        const runtimeDir = await downloader.fetchAndExtract();
        if (!this.options.mute) console.info('Building targets...');

        const started = Date.now();
        if (!this.options.mute) console.info(`Building directory target starts...`);

        const sourceDir = await this.buildDirTarget(platform, arch, runtimeDir, pkg, config);
        if (!this.options.mute) console.info(`Building directory target ends within ${this.getTimeDiff(started)}s.`);

        /*******************************************
         // Program Files 폴더에서 nwJS App을 런처로 사용하고자 할 경우
         // 권한 문제가 발생한다.

         // 설치된 $INSTDIR 폴더는 런처 app 으로 사용하고
         // nwJS 실행파일 리소스를 권한이 필요없는 폴더로 복사하여 실행 한다.
         // 하나의 nwJS 리소스로 런처 및 app으로 구동 시킬수 없다.

         // Original nwJS App 파일 목록
         console.info(`\n* Dir: ${ targetDir }`);

         if(config.childApp.dest) {
            config.nwFiles = await globby(['*'], {
            cwd: targetDir,
            follow: true,
            mark: true,
            ignore: config.childApp.excludes,
         });
            console.info(`* Copy Sub App: ${config.nwFiles.length} files - ${ config.childApp.dest }\n`);
         }

         //*******************************************/

        let sourceArchive: string | undefined;
        for (const target of config.targets) {
            const started = Date.now();

            if (!this.options.mute) console.info(`Building ${target} archive target starts...`);
            switch (target) {
                case 'zip':
                case '7z':
                    await this.buildArchiveTarget(target, sourceDir);
                    break;
                case 'nsis':
                    await this.buildNsisTarget(platform, arch, sourceDir, pkg, config);
                    break;
                case 'nsis7z':
                    sourceArchive = await this.buildNsis7zTarget(platform, arch, sourceDir, pkg, config);
                    break;
                default:
                    throw new Error('ERROR_UNKNOWN_TARGET');
            }
            if (!this.options.mute) console.info(`Building ${target} archive target ends within ${this.getTimeDiff(started)}s.`);
        }

        if (sourceArchive && !this.options.preserveArchive) {
            console.log('# 7z 파일 삭제 (--preserveArchive): ', sourceArchive);
            await fs.remove(sourceArchive);
        }
        if (!this.options.preserveSource) {
            console.log('# 소스 폴더 삭제 (--preserveSource): ', sourceDir);
            await fs.remove(sourceDir);
        }
    }

}
