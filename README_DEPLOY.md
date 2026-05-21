# 우리집 인테리어 v2.1.2 - 사진 업로드 복구 패치

## 핵심 변경

- 사진 업로드를 한 번의 거대한 base64 POST로 보내지 않고, 45,000자 단위 chunk로 나누어 전송합니다.
- Apps Script는 CacheService에 조각을 임시 저장한 뒤 finishPhotoUpload 단계에서 Drive에 파일을 만들고 Sheet items 행을 추가합니다.
- Drive 이미지 표시 URL을 `drive.google.com/thumbnail?id=...&sz=w1600` 중심으로 바꿔 모바일 카드에서 보이는 확률을 높였습니다.
- link/memo/reaction/comment/saveSpace 흐름은 기존 iframe POST 방식을 유지합니다.

## 배포 순서

1. Google Apps Script에서 `code.gs` 전체를 이 폴더의 `code.gs`로 교체합니다.
2. 저장 후 `runSetupOnce`를 한 번 실행해 권한을 승인합니다.
3. 배포 관리에서 기존 웹 앱을 수정하고 `새 버전`으로 배포합니다. 접근 권한은 `Anyone`으로 둡니다.
4. GitHub Pages repo 루트에 `index.html`, `manifest.json`, `sw.js`, `clear-cache.html`, `api-check.html`, `icon-192.png`, `icon-512.png`를 업로드합니다.
5. `https://mathetesj.github.io/interior-app/clear-cache.html`을 한 번 연 뒤 `?v=2.1.2`로 앱을 엽니다.

## 테스트 순서

1. 메모 저장 테스트
2. 작은 사진 1장 저장 테스트
3. 큰 사진 1장 저장 테스트
4. 보드에서 이미지 미리보기 확인
5. Drive 폴더 `인테리어앱_이미지`에 파일 생성 여부 확인
