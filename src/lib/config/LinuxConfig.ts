export class LinuxConfig {

    constructor(options: any = {}) {

        Object.keys(options).map((key) => {
            if (key in this && options[key] !== undefined) {
                switch (key) {
                    default:
                        (<any>this)[key] = options[key];
                        break;
                }
            }
        });

    }

}
