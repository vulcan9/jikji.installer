export class NsisConfig {

    public theme: string = '';
    public license: string = '';
    public web: string = '';

    public languages: string[] = ['English'];
    public installDirectory: string = '$LOCALAPPDATA\\\${PRODUCT_NAME}';

    public diffUpdaters: boolean = false;
    public hashCalculation: boolean = true;

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
