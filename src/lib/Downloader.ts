import path from 'path';
import createDebug from 'debug';
import { DownloaderBase } from './common/index.js';
import { mergeOptions } from './util/index.js';

const debug = createDebug('build:downloader');

export interface IDownloaderOptions {
    platform?: string;
    arch?: string;
    version?: string;
    flavor?: string;
    mirror?: string;
    useCaches?: boolean;
    showProgress?: boolean;
    forceCaches?: boolean;
    destination?: string;
}

export class Downloader extends DownloaderBase {

    public static DEFAULT_OPTIONS: IDownloaderOptions = {
        platform: process.platform,
        arch: process.arch,
        version: '0.14.7',
        flavor: 'normal',
        mirror: 'https://dl.nwjs.io/',
        useCaches: true,
        showProgress: true,
        forceCaches: false,
        destination: DownloaderBase.DEFAULT_DESTINATION,
    };

    public options: IDownloaderOptions;

    constructor(options: IDownloaderOptions) {
        super();

        this.options = mergeOptions(Downloader.DEFAULT_OPTIONS, options);

        if (this.options.destination !== this.destination) {
            this.setDestination(this.options.destination as string);
        }

        if (process.env.NWJS_MIRROR) {
            this.options.mirror = process.env.NWJS_MIRROR;
        }

        debug('in constructor', 'options', this.options);

    }

    public async fetch() {

        const {mirror, platform, arch, version, flavor, showProgress} = this.options;

        const partVersion = await this.handleVersion(version!);
        const partFlavor = flavor === 'normal' ? '' : '-' + flavor;
        const partPlatform = this.handlePlatform(platform!);
        const partArch = this.handleArch(arch!);
        const partExtension = this.extensionByPlatform(platform!);

        let url = `${mirror}/${partVersion}/nwjs${partFlavor}-${partVersion}-${partPlatform}-${partArch}.${partExtension}`;
        url = this.normalizeUrl(url);
        const filename = path.basename(url);
        const pathStr = path.resolve(this.destination, filename);

        debug('in fetch', 'url', url);
        debug('in fetch', 'filename', filename);
        debug('in fetch', 'path', pathStr);

        if (this.options.forceCaches && await this.isFileExists(pathStr)) return pathStr;

        try {
            if (await this.isFileExists(pathStr) && await this.isFileSynced(url, pathStr)) {
                return pathStr;
            }
        } catch (err: any) {

            debug('in fetch', 'err', err);

            if (err.code === 'ENOTFOUND' && this.options.useCaches) {
                console.info('DNS lookup fails, use local caches at this time.');
                return pathStr;
            } else if (err.code === 'EAI_AGAIN' && this.options.useCaches) {
                console.info('DNS lookup timeout, use local caches at this time.');
                return pathStr;
            } else {
                throw err;
            }

        }

        await this.download(url, filename, pathStr, showProgress!);
        return pathStr;
    }

    protected async handleVersion(version: string) {
        switch (version) {
            case 'latest':
            case 'stable':
            case 'lts':
                const versions = await this.getVersions();
                //debug('in handleVersion', 'versions', versions);
                return versions[version];
            default:
                return version[0] === 'v' ? version : 'v' + version;
        }
    }

    protected extensionByPlatform(platform: string) {
        switch (platform) {
            case 'win32':
            case 'win':
                return 'zip';
            case 'darwin':
            case 'osx':
            case 'mac':
                return 'zip';
            case 'linux':
                return 'tar.gz';
            default:
                throw new Error('ERROR_UNKNOWN_PLATFORM');
        }
    }

}
