export class WinConfig {

    public productName: string = '';
    public companyName: string = '';
    public fileDescription: string = '';
    public productVersion: string = '';
    public fileVersion: string = '';
    public copyright: string = '';
    public versionStrings: {
        ProductName?: undefined,
        CompanyName?: undefined,
        FileDescription?: undefined,
        LegalCopyright?: undefined,
    } = {};
    public icon: string = '';

    public publisher: string = '';
    public exeName: string = '';
    public programGroupName: string = '';

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
