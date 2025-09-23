import createDebug from 'debug';
import { DownloaderBase } from './common/index.js';
import { mergeOptions } from './util/index.js';
import path from 'path';

const debug = createDebug('build:signtoolDownloader');

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// 최신 Windows 11 SDK 링크
const WIN_11_SDK_URL = "https://go.microsoft.com/fwlink/p/?linkid=2120843";
const WIN_11_SDK_FILE_NAME = 'win11-sdk-setup.exe';

/*
Window 11 SDK 설치 확인
  - `C:\Program Files (x86)\Windows Kits\10\bin` 존재 여부 확인
  - 하위 폴더 목록 중 ^\d+\.\d+\.\d+\.\d+$ 패턴을 모두 읽어 최신 버전 선택

미설치 상태라면
  - OS 버전 확인 (os.release(), os.version() 사용)
  - Windows 10/11 공통 SDK 최신 설치 파일 다운로드 후 `/quiet /norestart` 설치

signtool.exe 경로 반환
  - 최신 버전 폴더 + x64\signtool.exe 연결
*/

interface ICodeSignToolDownloaderOptions {
    useCaches?: boolean;
    showProgress?: boolean;
    forceCaches?: boolean;
    destination?: string;
}

export class CodeSignToolDownloader extends DownloaderBase {

    public static DEFAULT_OPTIONS: ICodeSignToolDownloaderOptions = {
        useCaches: true,
        showProgress: true,
        forceCaches: false,
        // default: 'caches' 폴더
        destination: DownloaderBase.DEFAULT_DESTINATION
    };

    public options: ICodeSignToolDownloaderOptions;

    constructor(options: ICodeSignToolDownloaderOptions) {
        super();
        this.options = mergeOptions(CodeSignToolDownloader.DEFAULT_OPTIONS, options);
        if (this.options.destination !== this.destination) {
            this.setDestination(this.options.destination!);
        }
        debug('in constructor', 'options', options);
    }

    public async fetchAndExtract() {
        return await this.fetch();
    }

    // 파일 다운로드 체크 (없으면 다운로드됨)
    public async fetch() {
        const {showProgress} = this.options;

        const url = this.normalizeUrl(WIN_11_SDK_URL);
        const filename = WIN_11_SDK_FILE_NAME;
        const pathStr = path.resolve(this.destination, filename);

        debug('in fetch', 'url', url);
        debug('in fetch', 'forceCaches', this.options.forceCaches);

        if (this.options.forceCaches && await this.isFileExists(pathStr)) return pathStr;

        try {
            if (await this.isFileExists(pathStr) && await this.isFileSynced(url, pathStr)) return pathStr;
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

        console.error('(코드 사인 Windows 11 SDK 다운로드) ', pathStr);
        await this.download(url, filename, pathStr!, showProgress!);
        return pathStr;
    }

}
