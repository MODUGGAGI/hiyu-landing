# 유입 출처 집계

2026-10-19 Cloudflare Zaraz의 기존 Custom HTML 도구 `히유 테스트 통계`(HMBk), 액션 `테스트 시작·완료·공유 집계`(CQOw)에 적용. 원본은 `zaraz-participation.html`.

## 게시할 링크

| 플랫폼 | 링크 |
|---|---|
| X | https://pheeeew.com/pain-test/?utm_source=x&utm_medium=social |
| Threads | https://pheeeew.com/pain-test/?utm_source=threads&utm_medium=social |
| Instagram | https://pheeeew.com/pain-test/?utm_source=instagram&utm_medium=social |
| Kakao | https://pheeeew.com/pain-test/?utm_source=kakao&utm_medium=social |

## 확인 위치

Cloudflare → Web tag management → pheeeew.com → Monitoring → Usage.
출처만 보려면 정규식 필터 `^유입_`, 기존 통계와 함께 보려면 `^(시험|회사|연애|취업|랜딩|유입)_`.

- `유입_Kakao_테스트방문횟수`: 페이지 로드 횟수. 새로고침도 포함하며 고유 방문자 수가 아님.
- `유입_Kakao_시험_시작횟수`: 시험판 시작 버튼 클릭.
- `유입_Kakao_시험_완료횟수`: 시작한 시험의 결과 도달. 공유 결과를 열기만 하면 완료로 세지 않음.
- 네 플랫폼 및 네 판(시험/회사/연애/취업)에 동일하게 적용.
- 기존 이벤트와 일별 브라우저 추정 인원 집계는 유지.

## 출처 기준과 한계

명시적 utm_source → 외부 referrer → 같은 탭의 30분 이내 출처 → 직접또는알수없음 순서. 카카오 별칭 kakaotalk도 허용. 임의의 값은 기타로 분류한다. 세션 저장소에는 출처, 판별 방식, 마지막 활동 시각만 저장한다. 원문 referrer, 사용자 이름, URL, 사용자 ID를 이벤트 속성으로 보내지 않는다.

태그가 붙은 링크가 다른 곳에 재공유되면 원래 태그로 집계된다. 실제 앱을 확정하는 방식이 아니라 배포한 링크 출처를 측정한다. 태그 없이 들어온 과거 방문은 소급 복원하지 않는다. 앱이 referrer를 주지 않으면 출처를 알 수 없으므로 플랫폼별 링크 사용이 권장된다. 새 탭으로 이동하는 랜딩 CTA까지 세션 출처가 유지된다고 보장하지 않는다.

Advanced monitoring reports와 기존 개인정보 보호 설정은 변경하지 않았다. Worker 재배포 없이 기존 Zaraz 액션만 업데이트했다.

## 검증 / 복구

`node --test analytics/attribution.test.cjs`: 네 플랫폼 × 네 판의 시작/완료, 중복 방지, 출처 우선순위, 호스트 경계, 세션 만료, 저장소 차단, 검증 격리를 확인한다.

실제 페이지에서 `&stats_test=1`을 추가하면 이벤트가 `검증_`로 분리된다. 운영 필터에는 포함되지 않는다. 브라우저에서 X/Threads/Instagram 방문·시작, Threads 완료 전송을 확인했다. 카카오도 게시된 코드와 정확히 일치하는지 다시 읽어 확인했고, 실제 페이지의 방문·시작·완료 전송을 확인했다. Usage 표에서 네 플랫폼의 검증 방문 이벤트 및 Threads 완료 이벤트 수신을 확인했다.

백업: `output/source-attribution-2026-10-19/before.html`. 복구 시 기존 액션에 백업 HTML을 입력해 저장한다. 전체 설정 백업 JSON에는 비공개 설정이 있으므로 공개하지 않는다.
