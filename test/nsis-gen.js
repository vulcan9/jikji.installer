
import { test } from 'ava';

import { remove, writeFile } from 'fs-extra';

import { NsisComposer, NsisDiffer, nsisBuild } from '../dist/lib/nsis-gen';
import { tmpName } from '../dist/lib/util';

const options = {

    // Basic.
    appId: 'Project',
    companyName: 'evshiron',
    description: 'description',
    version: '0.1.0.0',
    copyright: 'copyright',

    // Compression.
    compression: 'lzma',
    solid: true,

    languages: [ 'English' ],
    // FIXME: TradChinese is missing and SimpChinese becomes the default language, what happens?
    //languages: [ 'English', 'SimpChinese', 'TradChinese' ],

};

test('build', async (t) => {

    const output = await tmpName({
        postfix: '.exe',
    });

    const data = await (new NsisComposer(Object.assign({}, options, {
        output,
    })))
    .make();

    const script = await tmpName({
        postfix: '.nsi',
    });

    await writeFile(script, data);
    await nsisBuild('./src/', script);

    await remove(output);
    await remove(script);

});

test('diff', async (t) => {

    const output = await tmpName({
        postfix: '.exe',
    });

    const data = await (new NsisDiffer('./src/', './dist/', Object.assign({}, options, {
        output,
    })))
    .make();

    const script = await tmpName({
        postfix: '.nsi',
    });

    await writeFile(script, data);
    await nsisBuild('./dist/', script);

    await remove(output);
    await remove(script);

});
