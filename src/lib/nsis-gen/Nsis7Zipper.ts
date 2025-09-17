import path from 'path';

import { INsisComposerOptions, NsisComposer } from './NsisComposer';

export class Nsis7Zipper extends NsisComposer {

    constructor(protected path: string, options: INsisComposerOptions) {
        super((options.solid = false, options));
    }

    protected async makeInstallerFiles(): Promise<string> {
        return `SetOutPath "$INSTDIR"
SetCompress off
File "${path.win32.normalize(path.resolve(this.path))}"
Nsis7z::ExtractWithDetails "$OUTDIR\\${path.basename(this.path)}" "$(INSTALLING) %s..."
Delete "$OUTDIR\\${path.basename(this.path)}"`;
    }

}
