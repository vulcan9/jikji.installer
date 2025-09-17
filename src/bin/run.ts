#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import createDebug from 'debug';
import { Runner } from '../lib';

const debug = createDebug('build:commandline:run');

const argv = yargs(hideBin(process.argv))
    .option('x86', {
        type: 'boolean',
        describe: 'Build for x86 arch',
        default: Runner.DEFAULT_OPTIONS.x86,
    })
    .option('x64', {
        type: 'boolean',
        describe: 'Build for x64 arch',
        default: Runner.DEFAULT_OPTIONS.x64,
    })
    .option('chrome-app', {
        type: 'boolean',
        describe: 'Build from Chrome App',
        default: Runner.DEFAULT_OPTIONS.chromeApp,
    })
    .option('mirror', {
        describe: 'Modify NW.js mirror',
        default: Runner.DEFAULT_OPTIONS.mirror,
    })
    .option('detached', {
        describe: 'Detach after launching',
        type: 'boolean',
        default: Runner.DEFAULT_OPTIONS.detached,
    })
    .help().parseSync();

(async () => {

    debug('in commandline', 'argv', argv);

    const runner = new Runner({
        x86: argv.x86,
        x64: argv.x64,
        chromeApp: argv['chrome-app'],
        mirror: argv.mirror,
        detached: argv.detached,
        mute: false,
    }, argv._ as string[]);

    process.exitCode = await runner.run();

})()
    .catch((err) => {

        console.error(err);
        process.exitCode = -1;

    });
