import path from 'path';
import got from 'got';
import ProgressBar from 'progress';
import fs from 'fs-extra';
import createDebug from 'debug';

import { Event } from './Event.js';
import { extractGeneric } from '../util/index.js';
import { fileURLToPath } from 'node:url';

const debug = createDebug('build:downloader');

const __filename = fileURLToPath(import.meta.url);
const DIR_CACHES = path.resolve(path.dirname(__filename), '..', '..', '..', 'caches');
fs.ensureDirSync(DIR_CACHES);

interface IRequestProgress {
    /*
    percent: number;
    speed: number;
    size: {
        total: number,
        transferred: number,
    };
    time: {
        elapsed: number,
        remaining: number,
    };
    */
    percent: number;
    transferred: number;
    total: number;
    speed: number;
}

export abstract class DownloaderBase {

    public onProgress: Event<IRequestProgress> = new Event('progress');

    public static readonly DEFAULT_DESTINATION: string = (DIR_CACHES || '');

    protected destination: string = (DownloaderBase.DEFAULT_DESTINATION || '');

    public abstract fetch(): Promise<string>;

    public async fetchAndExtract() {
        const archive = await this.fetch();
        const dest = `${archive}-extracted`;

        await extractGeneric(archive, dest);
        return dest;
    }

    protected getVersions(): Promise<any> {
        return new Promise((resolve, reject) => {
            got('https://nwjs.io/versions.json', (err: any, _res: any, body: string) => {
                if (err) return reject(err);
                const json = JSON.parse(body);
                resolve(json);
            });
        });
    }

    protected setDestination(destination: string) {
        this.destination = destination;
    }

    protected handlePlatform(platform: string) {
        switch (platform) {
            case 'win32':
            case 'win':
                return 'win';
            case 'darwin':
            case 'osx':
            case 'mac':
                return 'osx';
            case 'linux':
                return 'linux';
            default:
                throw new Error('ERROR_UNKNOWN_PLATFORM');
        }
    }

    protected handleArch(arch: string) {
        switch (arch) {
            case 'x86':
            case 'ia32':
                return 'ia32';
            case 'x64':
                return 'x64';
            default:
                throw new Error('ERROR_UNKNOWN_PLATFORM');
        }
    }

    protected async getLocalSize(path: string): Promise<number> {
        const stat = await fs.lstat(path);
        return stat.size;
    }

    protected async getRemoteSize(url: string): Promise<number> {
        try {
            const res = await got(url, {
                method: 'HEAD',
                followRedirect: true
            });
            const length = res.headers['content-length'];
            return length ? parseInt(length, 10) : 0;
        } catch (err) {
            throw err;
        }
    }

    protected async isFileExists(pathStr: string): Promise<boolean> {
        return await fs.pathExists(pathStr);
    }

    protected async isFileSynced(url: string, pathStr: string) {
        const localSize = await this.getLocalSize(pathStr);
        const remoteSize = await this.getRemoteSize(url);

        debug('in isFileSynced', 'localSize', localSize);
        debug('in isFileSynced', 'remoteSize', remoteSize);

        return localSize === remoteSize;
    }

    protected normalizeUrl(url: string): string {
        return url.replace(/([^:]\/)\/+/g, '$1');
    }

    protected async download(url: string, filename: string, pathStr: string, showProgress: boolean) {
        let bar: ProgressBar | null = null;
        url = this.normalizeUrl(url);

        const onProgress = (percent: number, transferred: number, total: number, speed: number) => {
            if (!total) return;
            if (!bar) {
                bar = new ProgressBar('[:bar] :speedKB/s :etas', {
                    width: 50,
                    total,
                });
                console.info('');
            }

            bar.update(percent, {
                speed: (speed / 1000).toFixed(2),
            });
        };

        if (showProgress) {
            debug('in download', 'progress subscription added', filename);
        }

        debug('in download', 'start downloading', filename);

        await new Promise<void>((resolve, reject) => {
            const writeStream = fs.createWriteStream(pathStr);

            let downloaded = 0;
            let total = 0;
            let startTime = Date.now();

            console.info('[download]: ', url);
            const stream = got.stream(url, {followRedirect: true});

            stream.on('response', (res: any) => {
                const len = res.headers['content-length'];
                total = len ? parseInt(len, 10) : 0;
            });

            stream.on('data', (chunk: Buffer) => {
                downloaded += chunk.length;
                const elapsed = (Date.now() - startTime) / 1000; // seconds
                const speed = elapsed > 0 ? downloaded / elapsed : 0;
                if (showProgress && total > 0) {
                    const percent = downloaded / total;
                    onProgress(percent, downloaded, total, speed);
                    this.onProgress.trigger({
                        percent, transferred: downloaded, total, speed
                    });
                }
            });

            stream.on('error', reject);
            writeStream.on('error', reject);
            writeStream.on('finish', () => resolve());
            stream.pipe(writeStream);
        });

        debug('in fetch', 'end downloading', filename);

        if (showProgress) {
            if (bar) {
                console.info('');
                (bar as ProgressBar).terminate();
            }
        }

        return pathStr;
    }

    /*
    protected async __download(url: string, filename: string, pathStr: string, showProgress: boolean) {

        let bar: ProgressBar | null = null;

        const onProgress = (state: IRequestProgress) => {

            if (!state.size.total) return;
            if (!bar) {
                bar = new ProgressBar('[:bar] :speedKB/s :etas', {
                    width: 50,
                    total: state.size.total,
                });
                console.info('');
            }

            bar.update(state.size.transferred / state.size.total, {
                speed: (state.speed / 1000).toFixed(2),
            });
        };

        if (showProgress) this.onProgress.subscribe(onProgress);
        debug('in download', 'start downloading', filename);

        await new Promise((resolve, reject) => {
            progress(got(
                url, {encoding: null},
                (err: any, res: { statusCode: number; }, data: string | NodeJS.ArrayBufferView) => {

                    if (err) return reject(err);
                    if (res.statusCode !== 200) {
                        const e = new Error(`ERROR_STATUS_CODE statusCode = ${res.statusCode}`);
                        return reject(e);
                    }
                    fs.writeFile(pathStr, data, (err: any) => err ? reject(err) : resolve());
                }))
                .on('progress', (state: IRequestProgress) => {
                    this.onProgress.trigger(state);
                });
        });

        debug('in fetch', 'end downloading', filename);

        if (showProgress) {
            this.onProgress.unsubscribe(onProgress);
            if (bar) {
                console.info('');
                (bar as ProgressBar)?.terminate();
            }
        }

        return pathStr;

    }
    */

}
