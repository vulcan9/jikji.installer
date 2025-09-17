import path from 'path';
import got from 'got';
import progress from 'got';
import ProgressBar from 'progress';
import fs from 'fs-extra';
import createDebug from 'debug';

import { Event } from './Event';
import { extractGeneric } from '../util';

const debug = createDebug('build:downloader');

const DIR_CACHES = path.resolve(path.dirname(module.filename), '..', '..', '..', 'caches');
fs.ensureDirSync(DIR_CACHES);

export interface IRequestProgress {
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
}

export abstract class DownloaderBase {

    public onProgress: Event<IRequestProgress> = new Event('progress');

    public static readonly DEFAULT_DESTINATION: string = (DIR_CACHES || '');

    protected destination: string = (DownloaderBase.DEFAULT_DESTINATION || '');

    public abstract fetch(): Promise<string>;

    protected abstract handleVersion(version: string): Promise<string>;

    public async fetchAndExtract() {

        const archive = await this.fetch();
        const dest = `${archive}-extracted`;

        await extractGeneric(archive, dest);

        return dest;

    }

    protected getVersions(): Promise<any> {
        return new Promise((resolve, reject) => {
            got('https://nwjs.io/versions.json', (err: any, _res: any, body: string) => {

                if (err) {
                    return reject(err);
                }

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

    protected getRemoteSize(url: string): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await got.head(url, {
                    followRedirect: true, // request의 followAllRedirects 대응
                });
                const len = parseInt(res.headers['content-length'] || '0', 10);
                resolve(len);
            } catch (err) {
                reject(err);
            }
        });
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

    protected async download(url: string, filename: string, pathStr: string, showProgress: boolean) {

        let bar: ProgressBar | null = null;

        const onProgress = (state: IRequestProgress) => {

            if (!state.size.total) {
                return;
            }

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

        if (showProgress) {
            this.onProgress.subscribe(onProgress);
        }

        debug('in download', 'start downloading', filename);

        await new Promise((resolve, reject) => {
            progress(got(url, {
                encoding: null,
            }, (err: any, res: { statusCode: number; }, data: string | NodeJS.ArrayBufferView) => {

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

}
