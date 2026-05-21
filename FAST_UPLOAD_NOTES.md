# v2.3.0 Fast Photo Upload

사진 업로드 속도 개선 패치입니다.

## 변경 전
- base64 사진을 2,400자 단위 JSONP chunk로 쪼개 전송
- 50KB 사진도 10회 이상 Apps Script를 호출해 1분 이상 걸릴 수 있음

## 변경 후
- 사진 전체를 hidden iframe POST로 1회 전송
- 결과만 JSONP polling으로 확인
- postMessage 의존 제거
- 실패 시에만 chunk fallback 사용

## 적용
1. Apps Script code.gs 전체 교체
2. runSetupOnce 실행
3. 웹 앱 새 버전 배포
4. GitHub 파일 업로드
5. /index.html?force=230-final 로 확인

정상 버전: 앱 2.3.0 / 서버 2.3.0
