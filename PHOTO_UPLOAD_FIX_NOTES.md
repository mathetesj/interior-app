# v2.2.4 사진 업로드 긴급 패치

## 핵심 변경

- 사진 압축을 긴 변 760px / JPEG 0.52로 낮춰 Apps Script 전송량을 크게 줄였습니다.
- 사진 chunk 크기를 30,000자에서 18,000자로 낮췄습니다.
- POST 응답 대기 시간을 45초에서 120초로 늘렸습니다.
- iframe postMessage target_origin을 `*`로 바꿔 GitHub Pages origin 불일치 가능성을 제거했습니다.
- Apps Script `runSetupOnce()`가 이제 DriveApp을 실제로 호출합니다. 이 과정에서 Drive 권한 승인 여부가 명확히 확인됩니다.
- `driveDiagnose` 액션을 추가했습니다. 앱 설정 화면에서 `Drive 업로드 권한 진단` 버튼으로 폴더 생성/테스트 파일 생성/삭제를 확인할 수 있습니다.

## 반드시 해야 할 일

1. Apps Script의 code.gs 전체를 v2.2.4 code.gs로 교체합니다.
2. 저장합니다.
3. 함수 목록에서 `runSetupOnce`를 실행하고 권한을 승인합니다.
4. 배포 관리에서 기존 웹 앱을 새 버전으로 배포합니다.
5. GitHub에 index.html, manifest.json, sw.js, clear-cache.html, api-check.html, icon 파일을 올립니다.
6. `/clear-cache.html`을 열고 캐시를 지운 뒤 `/?v=2.2.4`으로 접속합니다.

## 진단 순서

1. 설정 > 서버 진단
2. 설정 > Drive 업로드 권한 진단
3. 사진 1장 업로드

Drive 진단이 성공하면 Drive 경로/권한 문제는 아닙니다. 사진이 여전히 실패하면 code.gs가 새 버전으로 배포되지 않았거나, 브라우저가 예전 index.html을 캐시하고 있을 가능성이 큽니다.
