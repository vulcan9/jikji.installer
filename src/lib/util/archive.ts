import { path7za } from '7zip-bin';
import fs from 'fs-extra';
import { basename, dirname, join, normalize, resolve } from 'path';

import createDebug from 'debug';
import { spawnAsync, tmpFile } from './index.js';

const debug = createDebug('build:archive');

export interface IExtractOptions {
    overwrite: boolean;
}

async function extract(archive: string, dest: string = dirname(archive), options: IExtractOptions = {
    overwrite: false,
}) {

    debug('in extract', 'archive', archive);
    debug('in extract', 'dest', dest);

    const {code, signal} = await spawnAsync(path7za, [
        'x',
        '-y',
        `-ao${options.overwrite ? 'a' : 's'}`,
        `-o${resolve(dest)}`,
        resolve(archive)
    ]);

    if (code !== 0) {
        throw new Error(`ERROR_EXTRACTING path = ${archive}`);
    }
    return dest;
}

async function extractTarGz(
    archive: string,
    dest: string = dirname(archive),
    options: IExtractOptions = {overwrite: false}
) {

    const tar = join(dest, basename(archive.slice(0, -3)));

    await extract(archive, dest, {
        overwrite: true,
    });
    await extract(tar, dest);

    await fs.remove(tar);

    return dest;

}

export async function extractGeneric(archive: string, dest: string = dirname(archive), options: IExtractOptions = {
    overwrite: false,
}) {

    if (archive.endsWith('.zip')) {
        await extract(archive, dest, options);
    } else if (archive.endsWith('tar.gz')) {
        await extractTarGz(archive, dest, options);
    } else {
        throw new Error('ERROR_UNKNOWN_EXTENSION');
    }

    return dest;

}

export async function compress(dir: string, files: string[], type: string, archive: string) {

    debug('in compress', 'dir', dir);
    debug('in compress', 'files', files);
    debug('in compress', 'type', type);
    debug('in compress', 'archive', archive);

    const {path: listfiles} = await tmpFile({
        discardDescriptor: true,
    });

    debug('in compress', 'listfiles', listfiles);

    await fs.writeFile(listfiles, files.map(file => normalize(file)).join('\r\n'));

    const {code, signal} = await spawnAsync(path7za, [
        'a',
        `-t${type}`,
        resolve(archive),
        `@${resolve(listfiles)}`
    ], {
        cwd: dir,
    });

    return code;

}

export async function folderZip(dir: string, folder: string, archive: string) {

    debug('in compress', 'dir', dir);
    debug('in compress', 'folder', folder);
    debug('in compress', 'archive', archive);

    const { code, signal } = await spawnAsync(path7za, [
        'a',
        archive,
        join(folder, '*')
    ], {
        cwd: dir,
    });

    return code;
}
