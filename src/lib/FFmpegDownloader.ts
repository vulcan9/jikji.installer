import path from 'path';
import createDebug from 'debug';
import { DownloaderBase } from './common/index.js';
import { mergeOptions } from './util/index.js';

const debug = createDebug('build:ffmpegDownloader');

export interface IFFmpegDownloaderOptions {
    platform?: string;
    arch?: string;
    version?: string;
    mirror?: string;
    useCaches?: boolean;
    showProgress?: boolean;
    forceCaches?: boolean;
    destination?: string;
}

export class FFmpegDownloader extends DownloaderBase {

    public static DEFAULT_OPTIONS: IFFmpegDownloaderOptions = {
        platform: process.platform,
        arch: process.arch,
        version: '0.14.7',
        mirror: 'https://github.com/iteufel/nwjs-ffmpeg-prebuilt/releases/download/',
        useCaches: true,
        showProgress: true,
        forceCaches: false,
        destination: DownloaderBase.DEFAULT_DESTINATION,
    };

    public options: IFFmpegDownloaderOptions;

    constructor(options: IFFmpegDownloaderOptions) {
        super();
        this.options = mergeOptions(FFmpegDownloader.DEFAULT_OPTIONS, options);
        if (this.options.destination !== this.destination) {
            this.setDestination(this.options.destination!);
        }
        debug('in constructor', 'options', options);
    }

    public async fetch() {
        const {mirror, version, platform, arch, showProgress} = this.options;

        const partVersion = await this.handleVersion(version!);
        const partPlatform = this.handlePlatform(platform!);
        const partArch = this.handleArch(arch!);

        let url = `${mirror}/${partVersion}/${partVersion}-${partPlatform}-${partArch}.zip`;
        url = this.normalizeUrl(url);
        const filename = `ffmpeg-${path.basename(url)}`;
        const pathStr = path.resolve(this.destination, filename);

        debug('in fetch', 'url', url);
        debug('in fetch', 'filename', filename);
        debug('in fetch', 'path', pathStr);
        debug('in fetch', 'forceCaches', this.options.forceCaches);

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
            case 'lts':
            case 'stable':
            case 'latest':
                throw new Error('ERROR_VERSION_UNSUPPORTED');
            default:
                return version[0] === 'v' ? version.slice(1) : version;
        }
    }

}
