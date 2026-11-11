import React from 'react';
import DataTable from './TechnologyTable.jsx';
import PressInputComparison from './PressInputComparison.jsx';

function RequestChart({ title, before, after, reduction }) {
  return <section className="press-request-chart" aria-label={title}>
    <h5>{title}</h5>
    <p className="performance-chart-hint">낮을수록 좋아요 · 요청 횟수</p>
    <div role="img" aria-label={`${title}: 개선 전 ${before}회 개선 후 ${after}회 ${reduction}% 감소`}>
      {[['개선 전', before], ['개선 후', after]].map(([label, value], index) => <div className="press-request-row" key={label}>
        <div><span>{label}</span><strong>{value}회</strong></div>
        <div className="press-request-track"><span className={index ? 'is-after' : ''} style={{ width: `${value / before * 100}%` }} /></div>
      </div>)}
    </div>
    <p className="press-request-reduction"><strong>{reduction}%</strong> 감소</p>
  </section>;
}

export default function PressTechnologyContent() {
  return <article className="technology-story press-technology-story" aria-labelledby="press-engineering-title">
    <div className="technology-story-top">
      <span className="technology-tag">ANDROID · 프레스 반응 개선</span>
      <h3 id="press-engineering-title">서버를 기다리던 입력에서,<br />먼저 반응하는 화면으로</h3>
    </div>
    <p className="technology-intro">프레스는 누르는 즉시 숫자와 버튼이 반응해야 합니다.<br />서버 응답이나 효과음 처리를 기다리면 짧은 지연도 연타 흐름을 끊습니다.<br />화면은 먼저 갱신하고 서버 확인과 소리 처리는 별도로 진행하도록 개선했습니다.</p>

    <DataTable caption="기다림을 나눈 세 가지 개선" headings={['개선', '이전에는', '이렇게 바꿨어요']} rows={[
      ['01 입력 즉시 반영', '서버 응답 후 숫자와 버튼 반응을 갱신', '낙관적 UI로 먼저 표시하고 서버 확정값과 미확정 입력을 함께 정산'],
      ['02 전송과 조회 분리', '집계 조회가 끝날 때까지 다음 묶음 전송도 대기', '입력 전송과 집계 조회를 분리하고 조회를 1초 간격으로 병합'],
      ['03 효과음 처리 분리', 'iOS 입력 콜백에서 오디오 작업을 처리', '효과음을 미리 준비하고 전용 큐와 플레이어 8개로 재생'],
    ]} />

    <section className="technology-demo-heading" aria-labelledby="press-input-title">
      <span className="technology-step">01 · 입력 반응</span>
      <h4 id="press-input-title">누르면 바로, 확인은 따로.</h4>
      <p>낙관적 UI로 입력을 수용하는 즉시 횟수와 버튼 반응을 갱신합니다.<br />서버 전송은 별도로 진행하고 응답이 도착하면 확정값과 아직 확인되지 않은 입력을 함께 정산합니다.</p>
      <PressInputComparison />
      <DataTable caption="Android 실기기에서 확인한 입력 반응" headings={['측정 항목', 'p95']} rows={[
        ['숫자 첫 그리기', '32~42 ms'],
        ['버튼 눌림 첫 그리기', '약 24~25 ms'],
      ]} numeric />
      <p className="technology-footnote">Android 실기기에서 관측한 입력 반응입니다.<br />서버 응답시간과는 다른 지표이며 개선 전 수치가 없는 항목은 전후 비교로 표시하지 않았습니다.</p>
    </section>

    <section className="technology-demo-heading" aria-labelledby="press-network-title">
      <span className="technology-step">02 · 전송과 집계 조회</span>
      <h4 id="press-network-title">전송은 이어가고, 조회는 모아서.</h4>
      <p>입력 묶음 전송과 집계 조회를 분리했습니다.<br />집계 결과를 기다리는 동안에도 다음 입력 묶음을 보낼 수 있고 겹치는 집계 조회는 1초 간격으로 모아서 처리합니다.<br />늦게 도착한 과거 응답은 화면에 적용하지 않습니다.</p>
      <div className="performance-charts press-request-charts">
        <RequestChart title="집계 조회" before={72} after={57} reduction="20.8" />
        <RequestChart title="전체 HTTP 요청" before={182} after={165} reduction="9.3" />
      </div>
      <details className="technology-numbers">
        <summary><span className="technology-details-label">요청 횟수를 표로 보기</span><span className="technology-details-toggle" aria-hidden="true">＋</span></summary>
        <DataTable caption="600회 연속 입력에서의 요청 횟수 비교" headings={['측정 항목', '개선 전', '개선 후', '감소율']} rows={[
          ['집계 조회', '72회', '57회', '20.8%'],
          ['전체 HTTP 요청', '182회', '165회', '9.3%'],
        ]} numeric />
      </details>
      <p className="technology-footnote">Android 실기기에서 개선 전후 각각 600회 연속 입력을 비교했습니다.<br />전체 HTTP 요청에는 집계 조회가 포함됩니다.<br />두 그래프의 눈금은 각 항목의 개선 전 값을 기준으로 합니다.</p>
    </section>

    <section className="technology-demo-heading" aria-labelledby="press-audio-title">
      <span className="technology-step">03 · iOS 효과음 처리</span>
      <h4 id="press-audio-title">효과음을 처리하는 동안에도, 화면은 바로.</h4>
      <p>iOS에서는 입력 콜백이 효과음 작업까지 처리하면서 버튼 반응이 늦어지고 연타 중 재생이 끊기는 문제가 있었습니다.<br />효과음을 미리 준비하고 재생 요청을 전용 큐로 전달했습니다. 플레이어 8개를 재사용해 화면 반응과 오디오 처리를 분리했습니다.</p>
      <div className="press-audio-paths">
        <div>
          <span className="press-audio-version">개선 전</span>
          <h5>소리 작업 뒤에야,<br />화면이 반응해요.</h5>
          <div className="press-audio-sequence" aria-label="탭 입력 후 오디오 준비와 재생 작업을 거쳐 화면이 반응하는 순서">
            <div className="press-audio-node">탭 입력</div>
            <span className="press-audio-arrow" aria-hidden="true">→</span>
            <div className="press-audio-node is-work"><strong>오디오</strong><small>준비·재생 작업</small></div>
            <span className="press-audio-arrow" aria-hidden="true">→</span>
            <div className="press-audio-node is-waiting"><strong>화면 반응</strong><small>앞 작업 뒤에</small></div>
          </div>
          <p className="press-audio-takeaway">입력 콜백 안에 오디오 작업까지.</p>
        </div>
        <div className="is-after">
          <span className="press-audio-version">개선 후</span>
          <h5>화면은 바로,<br />소리는 별도 경로로.</h5>
          <div className="press-audio-parallel" aria-label="탭 입력 후 화면에 즉시 반영하고 오디오 재생 요청은 별도 전용 큐에 전달">
            <div className="press-audio-node">탭 입력</div>
            <div className="press-audio-branches">
              <div><span className="press-audio-connector" aria-hidden="true" /><div className="press-audio-node is-screen"><strong>화면 즉시 반영</strong><small>횟수 +1 · 버튼 반응</small></div></div>
              <div><span className="press-audio-connector" aria-hidden="true" /><div className="press-audio-node is-async"><strong>비동기 · 오디오 전용 큐</strong><small>준비된 플레이어로 재생</small></div></div>
            </div>
          </div>
          <p className="press-audio-takeaway">화면은 오디오 처리가 끝나기를 기다리지 않아요.<br />효과음은 미리 준비 · 플레이어 8개 재사용</p>
        </div>
      </div>
      <div className="press-audio-metrics">
        <div><p>오디오 호출의 입력 콜백 점유 · p95</p><strong><span>43.42</span><i aria-label="에서">→</i>0.026 <small>ms</small></strong></div>
        <div><p>재생 중 플레이어 강제 중단 호출</p><strong><span>576</span><i aria-label="에서">→</i>0 <small>회</small></strong></div>
      </div>
      <DataTable caption="iPhone 네이티브 오디오 경로 비교" headings={['측정 항목', '개선 전', '개선 후']} rows={[
        ['입력 콜백 점유 시간 p95', '43.42 ms', '0.026 ms'],
        ['재생 중 플레이어 강제 중단 호출', '576회', '0회'],
        ['재생 요청 성공', '600 / 600회', '600 / 600회'],
      ]} numeric />
      <p className="technology-footnote">iPhone 17 Pro의 네이티브 오디오 경로를 비교했습니다.<br />콜백 시간은 초당 10회 입력 재생·중단은 개선 전후 각각 600회 기준입니다.<br />0.026ms는 소리가 들릴 때까지의 지연이 아니라 입력 콜백이 오디오 호출에 사용한 시간입니다.</p>
    </section>
  </article>;
}
