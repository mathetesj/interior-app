우리집 인테리어 A-build 배포 메모
포함 파일
`index.html`: GitHub Pages에 올릴 메인 앱
`manifest.json`: PWA 설정
`sw.js`: Service Worker 캐시 전략
`icon-192.png`, `icon-512.png`: PWA 아이콘
`code.gs`: Google Apps Script 백엔드
배포 순서
Google Apps Script 편집기에서 기존 `code.gs` 전체를 이 파일의 `code.gs` 내용으로 교체합니다.
Apps Script 편집기에서 `runSetupOnce` 함수를 한 번 실행합니다.
Spreadsheet/Drive 권한 승인용입니다.
기존 시트의 헤더를 새 구조에 맞게 보정하고, 비어 있으면 기본 공간을 생성합니다.
Apps Script에서 기존 웹 앱 배포를 업데이트합니다.
가능하면 기존 deployment를 수정해서 URL을 유지하세요.
새 URL이 생기면 `index.html` 상단 스크립트의 `API` 값을 새 `/exec` URL로 교체하세요.
GitHub 저장소에 `index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`를 업로드합니다.
GitHub Pages에서 앱을 열고, 브라우저 새로고침을 1~2회 합니다.
예전 Service Worker가 남아 있으면 브라우저에서 사이트 데이터 삭제 후 다시 열어주세요.
PIN 변경
PIN을 바꾸려면 세 곳을 같이 바꿔야 합니다.
`index.html`의 `PIN`
`index.html`의 `APP_PIN`
`code.gs`의 `CONFIG.APP_PIN`
기존 데이터 호환
기존 `spaces`, `items`, `reactions`, `comments` 시트를 유지하는 방향입니다.
새로운 브리프용 컬럼은 `code.gs`가 헤더를 보정하면서 뒤쪽에 추가합니다.
주요 변경점
피드 로딩을 `getItems + getReactions` 2회 호출에서 `getFeed` 1회 호출로 통합
POST를 `application/json`에서 `text/plain`으로 변경해 Apps Script preflight 문제를 줄임
모든 API 응답을 `ok: true/false` 기준으로 처리
반응 저장에 `LockService` 적용
중복 반응 row를 최신값 기준으로 정리/집계
URL 검증, HTML escape, API 에러 처리 강화
보드, 합의, 업자용 브리프, PDF/인쇄, 텍스트 복사 UX 추가
Service Worker를 cache-first에서 문서 network-first 중심으로 변경

v2.0.1 긴급 패치
이번 패치는 GitHub Pages에서 Apps Script를 직접 fetch할 때 생기는 CORS 차단을 우회합니다.
읽기 API는 JSONP 방식으로 변경했습니다.
저장/수정/반응/사진 업로드 API는 hidden iframe + postMessage 방식으로 변경했습니다.
Apps Script `doPost`는 iframe 응답을 위해 `HtmlService`와 `XFrameOptionsMode.ALLOWALL`을 사용합니다.
Service Worker는 더 이상 `script.google.com` 같은 외부 요청을 가로채지 않습니다.
`mobile-web-app-capable` 메타 태그를 추가했습니다.
`icon-192.png`, `icon-512.png`를 실제 파일로 포함했습니다.
반드시 새 `code.gs`로 교체한 뒤 Apps Script 배포를 업데이트해야 합니다. GitHub에는 ZIP 안의 모든 파일을 repo 루트에 올려주세요.
