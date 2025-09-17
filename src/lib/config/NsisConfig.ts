export class NsisConfig {

    public theme: string = '';
    public license: string = '';
    public web: string = '';

    public languages: string[] = ['English'];
    public installDirectory: string = '$LOCALAPPDATA\\\${PRODUCT_NAME}';

    public diffUpdaters: boolean = false;
    public hashCalculation: boolean = true;

    // true 이면 생성한 NSIS 스크립트 파일 삭제하지 않음
    public scriptFile: boolean = false;

    constructor(options: any = {}) {

        Object.keys(this).map((key) => {
            if (options[key] !== undefined) {
                switch (key) {
                    default:
                        (<any>this)[key] = options[key];
                        break;
                }
            }
        });

    }

}
