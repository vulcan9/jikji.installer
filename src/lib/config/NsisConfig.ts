
export class NsisConfig {

    public theme: string = undefined;
    public license: string = undefined;
    public web: string = undefined;

    public languages: string[] = [ 'English' ];
    public installDirectory: string = '$LOCALAPPDATA\\\${PRODUCT_NAME}';

    public diffUpdaters: boolean = false;
    public hashCalculation: boolean = true;

    constructor(options: any = {}) {

        Object.keys(this).map((key) => {
            if(options[key] !== undefined) {
                switch(key) {
                default:
                    (<any>this)[key] = options[key];
                    break;
                }
            }
        });

    }

}
