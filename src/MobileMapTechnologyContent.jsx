import React from 'react';
import DataTable from './TechnologyTable.jsx';
import MapDisplayComparison from './MapDisplayComparison.jsx';
import './mobile-map-technology.css';

function TimingChart({ title, before, after }) {
  return <section className="mobile-map-timing" aria-label={title}>
    <h5>{title}</h5>
    <p className="performance-chart-hint">낮을수록 좋아요 · 중앙값</p>
    <div role="img" aria-label={`${title}: 페이지별 반영 ${before}ms 300ms 배치 ${after}ms`}>
      {[['페이지별 반영', before], ['300ms 배치', after]].map(([label, value], index) => <div className="mobile-map-bar" key={label}>
        <div><span>{label}</span><strong>{value.toLocaleString('en-US')} ms</strong></div>
        <div className="mobile-map-track"><span className={index ? 'is-after' : ''} style={{ width: `${value / before * 100}%` }} /></div>
      </div>)}
    </div>
  </section>;
}

export default function MobileMapTechnologyContent() {
  return <article className="technology-story mobile-map-story" aria-labelledby="mobile-map-engineering-title">
    <div className="technology-story-top">
      <span className="technology-tag">ANDROID · 지도 표시 개선</span>
      <h3 id="mobile-map-engineering-title">페이지마다 다시 그리던 지도에서,<br />첫 핀은 바로 다음 갱신은 묶어서</h3>
    </div>
    <p className="technology-intro">핀을 200개씩 받을 때마다 지금까지 모인 핀 전체를 지도에 다시 전달했습니다.<br />응답은 도착했는데 연속된 갱신을 처리하느라 표시가 늦어질 수 있었습니다.<br />첫 유효 핀은 바로 보여주고 후속 페이지의 화면 반영은 300ms 단위로 묶었습니다.</p>
    <DataTable caption="지도에 반복해서 전달하던 일을 줄였습니다" headings={['개선', '이전에는', '이렇게 바꿨어요']} rows={[
      ['01 지도 갱신 묶기', '페이지마다 누적 핀 전체를 지도에 다시 전달', '첫 핀은 즉시 반영하고 후속 갱신은 300ms 간격으로 병합'],
      ['02 이미지 전달 개선', '배열 생성과 픽셀 변환 언어 경계 호출 반복', 'Android 비트맵 직접 전달 · iOS 일괄 복사와 UIImage 재사용'],
      ['03 정지 화면 부하 감소', '접힌 버블도 매 프레임 위치와 회전을 변경', '상시 애니메이션을 제거하고 펼치기·접기와 클릭 반응은 유지'],
      ['04 조회·표시 재사용', '같은 응답과 렌더 입력도 다시 처리', '조건별 지역 응답 UI 모델·좌표·이미지를 재사용'],
    ]} />

    <details className="technology-details">
      <summary><span className="technology-details-label">응답 뒤에도 어디에서 기다렸을까요?</span><span className="technology-details-toggle" aria-hidden="true">＋</span></summary>
      <div className="technology-details-body">
        <h4>서버 응답과 실제 표시는 달랐어요.</h4>
        <p>전국 핀 3,926개를 200개씩 받아 표시하던 시점에 마지막 응답과 실제 핀 표시 프레임을 나눠 기록했습니다.</p>
        <DataTable caption="초기 병목 관측 · 구간별 중앙값" headings={['관측 구간', '시간']} rows={[
          ['첫 요청 → 마지막 응답', '1,865 ms'], ['마지막 응답 → 전체 핀 표시', '1,325 ms'],
        ]} numeric />
        <p>같은 데이터에 고정 응답 지연을 넣은 원인 분리 실험에서 페이지마다 누적 전달한 방식은 마지막 응답 후 전체 표시까지 1,296ms가 걸렸습니다. 마지막에 한 번 전달하면 637ms로 줄었지만 첫 핀도 마지막에 나타났습니다.<br />그래서 첫 핀은 즉시 보여주고 후속 갱신을 묶는 방식을 선택했습니다.</p>
        <p className="technology-footnote">2026-10-12 · Galaxy S23 FE / Android 15 · 원인 분리 실험 조건별 20회.<br />아래 고정 핀 1,600개 실험과는 별도 조건입니다. 각 구간의 값은 회차별 중앙값이며 단순 합산한 전체 시간이 아닙니다.</p>
      </div>
    </details>

    <section className="technology-demo-heading" aria-labelledby="mobile-map-batch-title">
      <span className="technology-step">01 · Android 지도 갱신</span>
      <h4 id="mobile-map-batch-title">첫 감정은 더 일찍,<br className="technology-mobile-break" /> 지도 갱신은 더 적게.</h4>
      <div className="mobile-map-batch-explanation">
        <div>
          <span>개선 전</span>
          <h5>표시되기 전에 다음 갱신이</h5>
          <p>감정을 200개씩 받을 때마다 누적된 전체 데이터를 지도에 전달했습니다.<br />데이터 전달과 실제 화면 표시는 동시에 끝나지 않습니다.<br />화면에 표시되는 동안 다음 갱신이 연이어 들어오면서 첫 핀이 보이는 시점이 늦어졌습니다.</p>
        </div>
        <div>
          <span>개선 후</span>
          <h5>첫 전달은 바로 후속 갱신은 묶어서</h5>
          <p>첫 유효 감정은 기존처럼 바로 전달합니다.<br />이후에는 페이지마다 다시 전달하는 대신 최신 누적 결과를 300ms 간격으로 묶어 전달했습니다.<br />반복 갱신 부담을 줄여 첫 핀이 더 일찍 보이도록 했습니다.</p>
        </div>
      </div>
      <p>아래에서 데이터 전달과 화면 표시가 끝나는 시점을 비교해 보세요.</p>
      <MapDisplayComparison />
      <div className="technology-highlights"><div><strong>78.3<span>%</span></strong><p>첫 핀 표시 시간 감소 · 중앙값</p></div><div><strong>8 → 3<span>회</span></strong><p>지도 source 갱신 · 중앙값</p></div></div>
      <div className="performance-charts mobile-map-timings">
        <TimingChart title="첫 요청 → 첫 핀 표시" before={1135} after={246} />
        <TimingChart title="마지막 응답 → 전체 핀 표시" before={507} after={383} />
        <TimingChart title="첫 요청 → 전체 핀 표시" before={1186} after={1033} />
      </div>
      <p className="technology-footnote">2026-10-12 · Galaxy S23 FE / Android 15 · 줌 14 · 고정 핀 1,600개를 200개씩 8페이지 · 조건별 10회.<br />모델·Geometry·아이콘 캐시가 준비된 상태의 minification 없는 release 진단 APK이며 페이지 응답 중앙값은 약 75ms였습니다.<br />실제 표시 시점은 native 완료 프레임의 feature ID로 확인했습니다. 막대 길이는 각 지표 안에서 비교합니다.</p>
      <details className="technology-numbers">
        <summary><span className="technology-details-label">150·300·500ms를 비교한 수치 보기</span><span className="technology-details-toggle" aria-hidden="true">＋</span></summary>
        <DataTable caption="발행 간격별 실기기 측정 중앙값" headings={['반영 방식', '첫 핀', '전체 핀', 'source 갱신']} rows={[
          ['페이지별 즉시', '1,135 ms', '1,186 ms', '8회'], ['150ms', '239 ms', '1,053 ms', '5회'], ['300ms · 선택', '246 ms', '1,033 ms', '3회'], ['500ms', '249 ms', '1,105 ms', '3회'],
        ]} />
        <p className="technology-footnote">첫 핀·전체 핀은 첫 요청부터의 시간입니다. 300ms는 첫 표시 전체 표시 갱신 횟수를 함께 보고 선택한 초기 기본값입니다.<br />모든 조건에서 10/10회 완료했고 최종 1,600개 ID를 확인했습니다.</p>
      </details>
    </section>

    <section className="technology-demo-heading" aria-labelledby="mobile-map-image-title">
      <span className="technology-step">02 · 플랫폼별 이미지 전달</span>
      <h4 id="mobile-map-image-title">같은 그림도, 넘겨주는 방법부터.</h4>
      <p>공통 코드에서 만든 이미지가 네이티브 지도에 등록되기까지의 경로를 확인했습니다.<br />플랫폼마다 불필요하게 반복되던 변환을 줄였습니다.</p>
      <DataTable caption="플랫폼에 맞게 줄인 이미지 전달 비용" headings={['플랫폼', '이전 경로', '개선 경로']} rows={[
        ['Android', '래스터 이미지 → RGBA 배열 → 픽셀 변환 → 새 Bitmap', '작업 스레드에서 이미지 생성 → 기존 Bitmap 직접 전달'],
        ['iOS', 'Swift에서 RGBA 바이트마다 Kotlin 배열 읽기', 'Kotlin 배열 → NSData 일괄 복사 → UIImage 변환·재사용'],
      ]} />
      <p>Android 이미지 생성은 Dispatchers.Default로 옮기고 동시 작업을 2개로 제한했습니다. 투명 이미지 여부도 생성할 때 계산해 보관합니다.<br />iOS는 120×120 이미지 한 장에 발생하던 57,600회의 바이트별 경계 호출을 일괄 복사로 바꿨습니다.</p>
      <div className="mobile-map-image-result"><span>iOS 이미지 50개 전달·변환 · 중앙값</span><strong><span>120.433</span> → 0.907 <small>ms</small></strong></div>
      <p className="technology-footnote">120×120 이미지 50개 · iPhone 17 Pro 시뮬레이터 · 실제 Kotlin 배열 bridge · 유효 표본 10회.<br />이미지 전달·변환 구간의 결과이며 Android 첫 핀 표시 시간과는 다른 지표입니다.</p>
      <details className="technology-numbers">
        <summary><span className="technology-details-label">작업 스레드와 메모리 관리 근거 더 보기</span><span className="technology-details-toggle" aria-hidden="true">＋</span></summary>
        <p>Android의 작업 스레드 이동 선행 실험에서는 첫 핀 중앙값이 119→72ms였지만 전체 핀 완료는 412→448ms였습니다. 첫 반응성과 전체 완료 시간을 구분해 판단했습니다.</p>
        <p className="technology-footnote">약 140개 핀·고유 이미지 14개 · 동일 R8 최적화 benchmark 빌드 · 조건별 20회. 위 1,600개 핀 실험과는 별도 조건입니다.</p>
        <p>iOS는 배열을 고정한 동안 복사하고 NSData가 자신의 메모리를 소유하도록 했습니다. UIImage 캐시는 8MiB·128개 기준으로 제한하고 메모리 경고·renderer 해제 시 비웁니다. iOS 그림 그리기는 메인 스레드에 유지했습니다.</p>
      </details>
    </section>

    <section className="technology-demo-heading" aria-labelledby="mobile-map-idle-title">
      <span className="technology-step">03 · 정지 화면 부하</span>
      <h4 id="mobile-map-idle-title">지도는 가만히 있는데,<br className="technology-mobile-break" /> 버블은 계속 움직이고 있었어요.</h4>
      <p>접힌 감정 버블이 매 프레임 위치와 회전을 바꾸면서 사용자가 아무것도 하지 않아도 UI 프레임이 계속 만들어지고 있었습니다.<br />상시 floating 루프를 제거하고 펼치기·접기와 클릭 반응은 유지했습니다.</p>
      <DataTable caption="정지 시도 지도 표본의 부하 비교" headings={['측정 항목', '변경 전', '변경 후']} rows={[
        ['앱 CPU', '97.24%', '0.94%'], ['기기 GPU busy', '15.87%', '0.00%'],
      ]} numeric />
      <p className="technology-footnote">2026-10-13 · Galaxy S23 FE / Android 15 · profileable/non-debuggable 빌드.<br />줌 7·10·14에서 전후 각 2회 회당 60초로 총 12회 측정했으며 같은 줌의 데이터 fingerprint와 표시 수준을 확인했습니다.<br />CPU는 1코어 지속 사용을 100%로 본 앱 지표이고 GPU busy는 기기 전체 지표입니다. 위 수치는 정지 시도 지도 표본입니다.</p>
      <p>새 프레임 제출이 멈췄다는 것은 화면이 멈췄다는 뜻이 아닙니다.<br />정지 상태에서 같은 화면을 계속 새로 만들 필요가 없어졌다는 의미이며 GPU 0%도 이 정지 화면 표본에서 관측한 값입니다.</p>
    </section>

    <section className="technology-demo-heading" aria-labelledby="mobile-map-reuse-title">
      <span className="technology-step">04 · 조회부터 표시까지 재사용</span>
      <h4 id="mobile-map-reuse-title">이미 한 일은, 다시 하지 않도록.</h4>
      <DataTable caption="이동하고 돌아와도 재사용하는 것들" headings={['대상', '재사용 방식']} rows={[
        ['시도·시군구 전국 요약', '조회 조건별 180초 캐시 · 같은 조건의 진행 중 요청 공유 · 세대 기반 무효화'],
        ['주변 핀', '화면 각 방향으로 25% 여백을 더해 조회 · 기존 핀 유지·병합 · 전체 완료 후 누락 핀 정리'],
        ['표시 전환', '새 이미지가 준비될 때까지 기존 표시 유지 · 데이터·이미지·표시 레벨을 함께 교체'],
        ['UI 모델·좌표', '변하지 않은 핀 모델과 좌표 재사용 · 전체 렌더 입력과 이미지가 같으면 source 갱신 생략'],
      ]} />
      <details className="technology-details">
        <summary><span className="technology-details-label">캐시와 실제 표시를 확인한 기준 더 보기</span><span className="technology-details-toggle" aria-hidden="true">＋</span></summary>
        <div className="technology-details-body">
          <p>핀 UI 모델 캐시는 ID별 원본과 변환 결과 작성 시각의 Instant 파싱 결과를 보관하며 최대 4,096개로 제한합니다. 주변 핀은 화면 안의 핀을 유지하면서 1,000개를 넘으면 먼 주변 핀부터 정리합니다.</p>
          <p>Android는 ID·좌표·이미지 키·회전으로 렌더 입력을 비교하고 변경 없는 Point Geometry를 재사용합니다. 포커스·누름 효과는 동적 레이어 속성으로 분리하며 source가 바뀔 때는 새 FeatureCollection을 전달합니다.</p>
          <p>전국 요약 응답을 반환하는 서버에 맞춰 bbox를 전국 캐시 키에서 제외했습니다. 전국 데이터를 보관하는 일과 화면에 표시할 지역을 고르는 일을 분리했으며 API 좌표 전달·검증은 유지합니다.</p>
          <p>API 응답 완료 source 전달 완료 실제 렌더 프레임을 각각 기록하고 render revision과 feature ID로 연결했습니다. 카메라 idle 이후의 추가 700ms 대기도 제거했습니다.</p>
        </div>
      </details>
    </section>
  </article>;
}
