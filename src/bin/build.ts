#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import createDebug from 'debug';
import { Builder_onlyLauncher } from '../lib/Builder_onlyLauncher.js';
import { Builder } from '../lib/index.js';

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
    .option('preserveSource', {
        type: 'boolean',
        describe: '압축 소스 폴더 보존',
        default: Builder.DEFAULT_OPTIONS.preserveSource,
    })
    .option('preserveArchive', {
        type: 'boolean',
        describe: '압축 파일 보존',
        default: Builder.DEFAULT_OPTIONS.preserveArchive,
    })
    .option('preserveScript', {
        type: 'boolean',
        describe: 'NSIS 스크립트 파일 보존',
        default: Builder.DEFAULT_OPTIONS.preserveScript,
    })
    .help().parseSync();

(async () => {

    debug('in commandline', 'argv', argv);


    const opts = {
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
        forceCaches: argv.forceCaches,
        preserveSource: argv.preserveSource,
        preserveArchive: argv.preserveArchive,
        preserveScript: argv.preserveScript,
    };

    const dir = argv._.shift()?.toString() ?? '';
    const configFile = path.resolve(dir, opts.chromeApp ? 'manifest.json' : 'package.json');
    const pkg: any = await fs.readJson(configFile);
    
    const BuilderStrategy = pkg.build.onlyLauncher ? Builder_onlyLauncher : Builder;
    const builder = new BuilderStrategy(opts, dir);
    await builder.build(pkg);

    process.exitCode = 0;
})()
    .catch((err) => {

        console.error(err);
        process.exitCode = -1;

    });
