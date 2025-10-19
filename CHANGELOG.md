# Change Log

All notable changes to this project will be documented in this file.
See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.





### 1.18.13

* (onlyLauncher: true일때) 파일 자동으로 추가
    - vender/jikji.editor.launcher.exe
    - vender/jikji.editor.launcher.ini

### 1.18.12

* USB 토큰 기반 코드 사인 샘플 추가
* codesign 옵션 설정 추가
* ini 파일 자동 설정

### 1.18.11

* Child Uninstall App 종료 보강 (onlyLauncher: true일때)
    - child uninstall 프로세스가 완료되지 않은 상태이면
    - app(nwJS) 폴더의 파일 일부가 삭제되지 않음

### 1.18.3

* Code Sign 적용 기능 추가
    - 실제 EV 인증서를 사용하기로 해서 적용하지는 않음
    - 설치파일을 원격 PC에서 USB 토큰으로 코드 사인하기로 함

```
문제
- 패키징 과정에서 `rcedit`을 이용하여 nw.exe 파일의 아이콘을 바꾸는 과정이 있음
- nw.exe의 코드 사인이 유지되지 않는것 같음
```

### 1.18.4

onlyLauncher 패키징 모드 추가함

### 1.18.2

* `dependencies` 패키지 버전 업데이트
* VC++ Redistributable 설치 과정 추가
    - package json에서 설정 (`"install_visualCpp": true`)
* 빌드 실행 코드 수정 (`npm run sample`)
* `vender` 폴더로 번들 파일 이동

### 1.18.0

* ES 모듈 형식으로 변환 (NodeNext)
* tslint --> eslint 전환
* 옵션 추가 (preserveSource, preserveArchive, preserveScript)

### 1.17.6

* 인스톨 과정에서 호출되는 uninstall.exe에 매개변수 전달
    - 인스톨 과정에서 child app uninstall 과정 호출하지 않음
    - 단독 uninstall.exe 실행시에만 child app uninstall 과정 호출함

### 1.17.5

* 프로그램 그룹 폴더 빈 폴더 일때만 폴더 삭제되도록 수정
* child App 복사(install) 로직 수정

### 1.16.2

* childApp moves 설정 추가함
* resource 설정을 배열로 바꿈

### 1.16.1

* Uninstall 과정에서 호출된 uninstall child app의 chromium 폴더를 제거
* NSIS 스크립트 파일 놓도록 옵션 처리

### 1.16.0

* (버그 수정) 실행중인 프로그램 종료.
    - FindProcDLL, KillProcDLL 동작하지 않음
    - NsProcess 사용함

* Uninstall 과정에서 App의 uninstall 기능을 호출하여 특정 로직을 실행할 수있도록 로직 추가

## 1.15.15

* --forceCaches 옵션 추가