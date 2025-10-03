# onlyLauncher 설정

`onlyLauncher` 설정을 하면 이전과는 다른 구조로 패키징됨

### 이전 (`demo/project`)

Program Files 폴더에 런처 설치
- nwJS App이 설치됨 (처음 버전별 런쳐 App이 동작함)
- 설치된 nwJS 리소스를 복사하여 child App을 구성함

### onlyLauncher: true (`demo/jikji`)

Program Files 폴더에 런처 설치
- `jikji.editor.launcher.exe`, `jikji.editor.launcher.ini` 설치됨
- 인스톨러에서 바로 child App을 구성함 (nwJS 리소스)
- child App에서 버전별로 App을다시 런칭할 수도 있음

# 설정 내용

```json
{   
    // productVersion이 없으면 대신 사용됨
    "version": "0.1.0",
    // 설치파일 이름에 사용됨 (예: launcher.sample-0.1.0 (win x86).exe)
    "name": "launcher.sample",
    "description": "인스톨러 설정",
    
    "--": "-----------------------",

    "build": {
        // child App을 호출하는 launcher만 Program Files 폴더에 설치
        "onlyLauncher": true,
        // VC++ Redistributable 설치 체크 과정을 추가할지 여부
        "install_visualCpp": false,
        // (true) iteufel/nwjs-ffmpeg-prebuilt 에서 ffmpeg.dll 자동 다운로드하여 적용시켜줌 
        "ffmpegIntegration": true,

        "기본 설정": "-----------------------",

        "nwVersion": "0.77.0",
        // 개발자 app으로 설정하려면 "sdk"로 설정
        "nwFlavor": "normal",
        // 리소스를 nw.exe파일에 포함시킬지 여부
        // true : 런타임에 Temp>nw144_16279 폴더에 리소스 압축 해지하여 사용
        // false: 설치 폴더에 리소스 파일들 이미 압축 풀려져 있음
        "packed": false,

        "output": "./dist",
        // setup 파일 이름 형식
        "outputPattern": "${NAME}-${VERSION} (${PLATFORM} ${ARCH})",

        "빌드 설정": "-----------------------",

        // nsis(복사되는 세부 파일 목록 보여줌), nsis7z(빠름)
        "targets": [ "nsis7z" ],

        // 윈도우 exe 파일 설정
        // exe 파일 (속성창 > 자세히) 탭에 표시됨
        "win": {
            // 바로가기 아이콘(링크) 등의 이름으로 사용됨
            // jikji.editor.launcher.exe 파일의 이름이 변경됨
            "exeName": "LauncherApp",
            "icon": "launcher/assets/favicon.ico",

            // 프로그램 그룹 이름으로도 사용:  ~Program Files (x86)/tovsoft/
            // 생략하면 다음 순서대로 값 결정됨 : companyName || productName
            "companyName": "tovsoft",
            // 프로그램 이름 폴더로도 사용:  ~Program Files (x86)/tovsoft/Test App/
            // 제어판에 프로그램 이름으로 표시됨
            // 생략하면 다음 순서대로 값 결정됨 : productName || name
            "productName": "Launcher App",
            // 시작 메뉴의 프로그램 그룹 이름
            "programGroupName": "토브소프트",

            // 제어판에 프로그램 버전으로 표시됨
            // 생략하면 다음 순서대로 값 결정됨 : productVersion || version
            "productVersion": "0.1.0",
            // 생략하면 다음 순서대로 값 결정됨 : fileVersion || nwVersion || productVersion
            "fileVersion": "0.77.0",
            // 생략하면 다음 순서대로 값 결정됨 : fileDescription || description
            "fileDescription": "epub 저작 도구",

            "copyright": "tovsoft (c) 2020",
            // 제어판에 게시자로 표시됨
            "publisher": "(주) 토브소프트"
        },

        // 빌드 설정
        "nsis": {
            // 인스톨러 에셋 폴더 위치
            "theme": "theme",
            "license": "LICENSE.txt",
            // 인스톨러 UI에 표시되는 문자열
            "web": "https://tovsoft.co.kr/",
            // (사용안함)
            "diffUpdaters": false,
            // "languages": "",
            // "installDirectory": "",
        },
        
        "리소스 설정": "-----------------------",

        // 포함시킬 파일 목록. Defaults to [ '**/*' ]
        "files": [ "**/*" ],
        // 패키징 제외 항목
        "excludes": [ "node_modules" ],
        // (생략 가능) 패키징 폴더중 일부를 다른곳에 extract 할때. 패키징 폴더에는 제외됨
        "resource": [
            {
                "src": "한글 폴더",
                "dest": "$LOCALAPPDATA/jikji.new.launcher.setup/firstrun/한글 폴더"
            },
            {
                "src": "launcher",
                "dest": "$LOCALAPPDATA/jikji.new.launcher.setup/launcher"
            }
        ],
        
        // uninstall 할때 삭제할 폴더를 추가로 지정할때 (firstrunFolder)
        "uninstall": "$LOCALAPPDATA/jikji.new.launcher.setup/firstrun",

        // (생략 가능) launcher-app 구조로 설치하고자 할때 (재귀 적용됨)
        "childApp": {
            // nw.exe rename 할때 사용할 이름(.exe 생략한 이름 부분).
            // jikji.editor.launcher.ini 파일에도 file 값에 같은값을 적용해 주어야 함
            "nwName": "NwApp",

            // launcher 폴더의 pckageJson.name
            "name": "jikji.new.launcher",
            // childApp이 설치될 위치
            "dest": "$LOCALAPPDATA/jikji.new.launcher.setup/app",

            // (생략 가능) 패키징 폴더에는 있지만 child에는 복사하지 않을 목록
            "excludes": [
                "theme",
                "association",
                "LICENSE.txt",
                "onlyLauncher 설정 설명.md"
                // 다음 파일들은 자동으로 추가됨
                // "package.json", "uninstall.exe"
                // "런쳐.exe", "런쳐.ini"
            ],

            // (생략 가능) childApp으로 복사 후 패키징 폴더에서 삭제할 목록
            "moves": [],
            
            // uninstall 폴더의 package.json 파일 name
            // - uninstallApp이 지정되면 uninstall 폴더의 앱이 호출된다
            // - install.exe에서 호출되는 uninstall 과정에서는 호출 안됨
            // - 프로그램 제거 또는 uninstall.exe 단독 실행시에만 호출됨
            "uninstallApp": "$LOCALAPPDATA/jikji.new.launcher.uninstall",
            // 설치 후 uninstall 폴더가 위치한 폴더 경로를 지정.
            // (uninstall app 실행 폴더, packagee.json 위치)
            "uninstallAppFolder": "$LOCALAPPDATA/jikji.new.launcher.setup/launcher/uninstall"
        },

        // 패키징 할때 package json 파일에서 다음 항목들을 누락 시킴
        // (사용안함) onlyLauncher 모드에서는 사용안함
        "strippedProperties": [
            "scripts",
            "dependencies",
            "devDependencies",
            "build"
        ],
        
        "file association 등록 설정": "-----------------------",

        "associate": [
            // .jik 파일 연결
            {
                "description": "JIK-JI Editor Project File",
                "ext": "jik",
                "fileClass": "Jik-ji.project",
                "icon": "assets/jik.ico"
            }
        ],
    }
}
```

# Child App의 설정 파일

```json
{
    "scripts": {},
    "dependencies": {},
    "author": "vulcan9",
    "license": "MIT",

    "-----------------------": "-----------------------",
    
    "version": "0.1.0",
    "name": "jikji.new.launcher",
    "domain": "jikji.new.launcher",
    "description": "epub 저작 도구",
    
    "------------------------": "-----------------------",
    
    "main": "index.html",
    "inject_js_start": "launcher.js",
    "window": {
        "icon": "assets/favicon.png",
        "frame": false,
        "show": true,
        "transparent": false,
        "fullscreen": false,
        "width": 400,
        "height": 200
    },
    // nwJS(8039 이슈) 기본 아이콘으로 표시되는 현상, (./)는 생략해야함
    "icons": {
        "256": "assets/favicon.png"
    }
}
```
### 작업 표시줄 아이콘 안바뀜 현상

`package.json` 파일에 다음 추가
```json
{
    // ico 파일 안됨
    "window": { "icon": "assets/favicon.png" },
    "icons": { "256": "assets/favicon.png" }
}
```
- `~\User Data\Default\Web Applications\` 폴더에 아이콘이 바뀌어야 함
- (참고) `nwJS(8039 이슈)` 기본 아이콘으로 표시되는 현상

### 점프리스트 아이콘이 기본 아이콘으로 나타남 현상
- 작업 표시줄 오른클릭 메뉴 리스트의 아이콘
- `%LOCALAPPDATA%\Microsoft\Windows\Explorer` 아래 `iconcache_*.db` 삭제
- 작업 관리자에서 Explorer 재시작