#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import createDebug from 'debug';
import { Builder } from '../lib';

const debug = createDebug('build:commandline:build');

const argv = yargs(hideBin(process.argv))
    .option('win', {
        type: 'boolean',
        describe: 'Build for Windows platform',
        default: Builder.DEFAULT_OPTIONS.win,
        alias: 'w',
    })
    .option('mac', {
        type: 'boolean',
        describe: 'Build for macOS platform',
        default: Builder.DEFAULT_OPTIONS.mac,
        alias: 'm',
    })
    .option('linux', {
        type: 'boolean',
        describe: 'Build for Linux platform',
        default: Builder.DEFAULT_OPTIONS.linux,
        alias: 'l',
    })
    .option('x86', {
        type: 'boolean',
        describe: 'Build for x86 arch',
        default: Builder.DEFAULT_OPTIONS.x86,
    })
    .option('x64', {
        type: 'boolean',
        describe: 'Build for x64 arch',
        default: Builder.DEFAULT_OPTIONS.x64,
    })
    .option('tasks', {
        type: 'string',
        describe: 'List of <PLATFORM>-<ARCH> to build, separated by comma.',
        default: '',
    })
    .option('chrome-app', {
        type: 'boolean',
        describe: 'Build from Chrome App',
        default: Builder.DEFAULT_OPTIONS.chromeApp,
    })
    .option('mirror', {
        describe: 'Modify NW.js mirror',
        default: Builder.DEFAULT_OPTIONS.mirror,
    })
    .option('concurrent', {
        type: 'boolean',
        describe: 'Build concurrently',
        default: Builder.DEFAULT_OPTIONS.concurrent,
    })
    .option('mute', {
        type: 'boolean',
        default: Builder.DEFAULT_OPTIONS.mute
    })
    .option('forceCaches', {
        type: 'boolean',
        default: Builder.DEFAULT_OPTIONS.forceCaches
    })
    .help().parseSync();

(async () => {

    debug('in commandline', 'argv', argv);

    const builder = new Builder({
        win: argv.win,
        mac: argv.mac,
        linux: argv.linux,
        x86: argv.x86,
        x64: argv.x64,
        tasks: argv.tasks.split(','),
        chromeApp: argv['chrome-app'],
        mirror: argv.mirror,
        concurrent: argv.concurrent,
        mute: argv.mute,
        forceCaches: argv.forceCaches
    }, argv._.shift()?.toString() ?? '');

    await builder.build();

    process.exitCode = 0;

})()
    .catch((err) => {

        console.error(err);
        process.exitCode = -1;

    });
