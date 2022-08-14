# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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