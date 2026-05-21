# Interior App v2.2.2 긴급 수정

## 핵심
- 앱 버전과 서버 버전을 반드시 v2.2.2로 맞추세요.
- 서버 진단에서 앱 버전이 2.1.2로 보이면 GitHub index.html 또는 PWA 캐시가 아직 구버전입니다.
- `code.gs`는 v2.1.2의 안정 코드 기반으로 재생성했고, v2.2.2에서 섞인 구문 오류 가능성을 제거했습니다.

## 배포
1. Apps Script `code.gs` 전체 삭제 후 v2.2.2 코드 전체 붙여넣기
2. 저장
3. `runSetupOnce` 실행 및 권한 승인
4. 배포 관리 -> 기존 웹 앱 수정 -> 새 버전 배포
5. GitHub 루트에 `index.html`, `manifest.json`, `sw.js`, `clear-cache.html`, `api-check.html`, `icon-192.png`, `icon-512.png` 업로드
6. `https://mathetesj.github.io/interior-app/clear-cache.html` 실행
7. `https://mathetesj.github.io/interior-app/?v=2.2.2` 접속

## 확인
설정 -> 서버 진단에서 앱 버전/서버 버전이 모두 2.2.2이어야 합니다.
