### setup 파일 생성 샘플 프로젝트

nwjs-builder-phoenix-demo 폴더를 만들고 그안에 project 폴더 내용을 복사한다.  

(다음 두개의 폴더가 준비됨)
- nwjs-builder-phoenix
- nwjs-builder-phoenix-demo

nwjs-builder-phoenix-demo 프로젝트의 dependencies가 nwjs-builder-phoenix 폴더로 지정되었는지 확인한다.

각각의 프로젝트를 build 한다.
- nwjs-builder-phoenix : npm run build
- nwjs-builder-phoenix-demo : npm run build

nwjs-builder-phoenix-demo > dist 폴더에 setup 파일을 확인한다.
- testApp4-0.1.5 (win x86).exe

### 업데이트 exe

`package json` : build.nsis.diffUpdaters : true로 설정

`versions.nsis.json` 파일을 유지한 상태에서 build 하면 update.exe 파일이 생성됨

버전 내역별로 모두 생성됨 (`versions.nsis.json`에 기록된 버전 내역이 5개면 5개의 업데이트 파일이 생성됨) 
- testApp4-0.1.5 (win x86)-(update from 0.1.0).exe
- ...
- testApp4-0.1.5 (win x86)-(update from 0.1.4).exe

### package json 설정 내용

https://github.com/evshiron/nwjs-builder-phoenix/blob/master/docs/Options.md
```
    "build": {
        "nwVersion": "0.32.4",
        "nwFlavor": "normal",
        "output": "./dist/",

        // setup 파일 이름 형식
        "outputPattern": "${NAME}-${VERSION} (${PLATFORM} ${ARCH})",

        // true : 런타임에 Temp>nw144_16279 폴더에 리소스 압축 해지하여 사용
        // false: 설치 폴더에 리소스 파일들 이미 압축 풀려져 있음
        "packed": false,

        // true: iteufel/nwjs-ffmpeg-prebuilt 에서 ffmpeg.dll 자동 다운로드하여 적용시켜줌 
        "ffmpegIntegration": true,
__
        // nsis(복사되는 세부 파일 목록 보여줌), nsis7z(빠름)
        "targets": ["nsis7z"],

        // 포함시킬 파일 목록. Defaults to [ '**/*' ]
        "files": [
            "index.html",
            "assets/**/*"
        ],
        "excludes": [],

        // 패키징 할때 package json 파일에서 다음 항목들을 누락 시킴
        "strippedProperties": [
            "scripts",
            "devDependencies",
            "build"
        ],
        "win": {
            //---------------------
            // exe 파일 속성창 > 자세히 탭에서 표시됨
            //---------------------

            // 프로그램 그룹 이름으로도 사용:  ~Program Files (x86)/tovsoft/
            // 생략하면 다음 순서대로 값 결정됨 : companyName || productName
            "companyName": "tovsoft",
            // 프로그램 이름 폴더로도 사용:  ~Program Files (x86)/tovsoft/Test App/
            // 제어판에 프로그램 이름으로 표시됨
            // 생략하면 다음 순서대로 값 결정됨 : productName || name
            "productName": "Test App",
            // 제어판에 프로그램 버전으로 표시됨
            // 생략하면 다음 순서대로 값 결정됨 : productVersion || version
            "productVersion": "1.0.5",
             // 생략하면 다음 순서대로 값 결정됨 : fileVersion || nwVersion || productVersion
            "fileVersion": "0.32.4",
             // 생략하면 다음 순서대로 값 결정됨 : fileDescription || description
            "fileDescription": "epub 저작 도구",
            "copyright": "copyright (c) 2020 tovsoft",

            //---------------------

            // 제어판에 게시자로 표시됨
            "publisher": "(주) 토브소프트",

            // 실행 파일 이름, 아이콘
            "exeName": "testApp3",
            "icon": "./assets/exeIcon.ico",

            // 시작 메뉴의 프로그램 그룹 이름
            "programGroupName": "토브소프트"
        },
        "nsis": {
            // setup 파일 아이콘
            "icon": "./assets/install.ico",
            // uninstall 파일 아이콘
            "unIcon": "./assets/uninstall.ico",
            "license": "./assets/LICENSE.txt",
            "web": "https://tovsoft.co.kr/",

            // update.exe 파일이 생성
            "diffUpdaters": true
        }
    },
```
