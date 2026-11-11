import React, { useEffect, useRef, useState } from 'react';
import DataTable from './TechnologyTable.jsx';
import './notification-technology.css';

function NotificationComparison({ active }) {
  const frame = useRef(null);
  const observer = useRef(null);
  const [height, setHeight] = useState(720);
  useEffect(() => () => observer.current?.disconnect(), []);
  useEffect(() => {
    if (!active) frame.current?.contentDocument?.dispatchEvent(new Event('notification:deactivate'));
  }, [active]);
  const resize = () => {
    observer.current?.disconnect();
    const body = frame.current?.contentDocument?.body;
    if (!body) return;
    // Share only decoded fonts; don't register every unused Korean font subset.
    document.fonts.forEach(font => {
      if (font.status === 'loaded') frame.current.contentDocument.fonts.add(font);
    });
    const update = () => {
      const nextHeight = Math.ceil(body.getBoundingClientRect().height);
      // A hidden tab reports zero. Keep the last height for a stable return.
      if (nextHeight > 0) setHeight(previous => previous === nextHeight ? previous : nextHeight);
    };
    observer.current = new ResizeObserver(update);
    observer.current.observe(body);
    update();
  };
  return <iframe ref={frame} className="notification-demo" src="/technology/notification-compare.html"
    title="서버 종료와 재시작 전후 알림 예약을 보관하고 이어 처리하는 과정" style={{ height }} onLoad={resize} />;
}

export default function NotificationTechnologyContent({ active }) {
  return <article className="technology-story notification-story" aria-labelledby="notification-engineering-title">
    <div className="technology-story-top">
      <span className="technology-tag">BACKEND · 알림 발송 개선</span>
      <h3 id="notification-engineering-title">서버 안에만 있던 예약을<br />다시 켜져도 읽을 수 있게.</h3>
    </div>
    <p className="technology-intro">컬렉션을 받을 수 있게 된 사용자에게는 일정 시간이 지난 뒤 알림을 보냅니다.<br />그사이 서버가 종료되면 메모리에만 있던 예약은 사라져 복구할 수 없었습니다.<br />예약 시각과 처리 상태를 <strong>RDB 아웃박스</strong>에 기록해 서버가 다시 켜져도 이어 처리하도록 바꿨습니다.</p>

    <DataTable caption="예약과 발송에서 바꾼 세 가지" headings={['개선', '이전에는', '이렇게 바꿨어요']} rows={[
      ['01 예약 보관', '서버 메모리에 저장해 재시작하면 기존 예정 시각을 잃음', 'RDB 아웃박스에 예정 시각과 상태를 기록해 재시작 후에도 이어 처리'],
      ['02 실패 후 재시도', '발송이 실패하면 로그만 남기고 종료', '실패 유형을 구분하고 일시적인 오류는 다시 시도'],
      ['03 발송 작업 선점', '두 인스턴스가 같은 대상을 각각 발송할 수 있음', 'DB에서 처리할 예약을 선점해 동시에 같은 작업을 가져가지 않도록 변경'],
    ]} />

    <div className="technology-demo-heading"><span className="technology-step">서버가 꺼졌다 다시 켜지면</span><h4>서버가 꺼져도<br className="technology-mobile-break" /> 기다린 시간까지 잃지 않도록.</h4></div>
    <div className="notification-takeaways">
      <section><span className="technology-step">개선 전</span><h5>사라진 예약은 복구할 수 없었어요.</h5><p>알림을 보낼 대상과 대기 시작 시각을 서버 메모리에만 보관했습니다.<br />서버가 종료되면 이 기록도 사라져 기존 예약과 예정 시각을 복구할 수 없었습니다.<br />재시작 후에는 대상을 다시 찾아 새 예약을 만들고 대기 시간을 처음부터 다시 세었습니다.</p></section>
      <section><span className="technology-step">개선 후</span><h5>RDB에 남긴 예약으로 이어서 보내요.</h5><p>보낼 알림의 예정 시각과 처리 상태를 RDB 아웃박스에 먼저 기록합니다.<br />서버가 종료되어도 기록이 남아 재시작 후 발송할 예약을 조회하고 선점할 수 있습니다.<br />대기 시간을 처음부터 다시 세지 않고 남아 있는 예약을 이어 처리합니다.</p></section>
    </div>
    <p className="technology-intro notification-demo-prompt">서버를 재시작해 기존 예약이 사라지는 경우와 그대로 남는 경우를 비교해 보세요.</p>
    <NotificationComparison active={active} />

    <section className="notification-flow" aria-labelledby="notification-flow-title">
      <span className="technology-step">개선 후의 처리 흐름</span>
      <h4 id="notification-flow-title">기록하고 가져오고 결과를 남겨요.</h4>
      <ol>
        <li><span>01</span><h5>예약 기록</h5><p>RDB 아웃박스에<br />예정 시각과 상태 저장</p></li>
        <li><span>02</span><h5>발송할 예약 선점</h5><p>시각이 된 예약을<br />발송기가 가져오기</p></li>
        <li><span>03</span><h5>FCM 발송 요청</h5><p>DB 트랜잭션 밖에서<br />알림 발송 요청</p></li>
        <li><span>04</span><h5>처리 결과 기록</h5><p>성공은 완료로<br />일시적 실패는 재시도로</p></li>
      </ol>
      <p className="technology-footnote">서버가 재시작되어도 예약과 처리 상태가 RDB에 남아 발송기가 이어서 확인할 수 있습니다.</p>
    </section>

    <section className="notification-result" aria-label="재시작 실험의 기존 예약 유지 결과">
      <div><span className="technology-step">재시작 후에도 유지된 기존 예약</span><p>200건씩 4회 저장된 예약을 이어 처리했어요.</p></div>
      <div className="notification-result-values"><span>개선 전<strong>0<small> / 800건</small></strong></span><b aria-hidden="true">→</b><span>개선 후<strong><mark>800</mark><small> / 800건</small></strong></span></div>
    </section>
    <p className="technology-footnote">알림의 최종 수신율이 아니라 기존 예약이 유지됐는지를 비교한 결과입니다.<br />이 실험에서 개선 전도 대상을 다시 탐색하고 기다린 뒤 모든 대상에 발송을 시도했습니다.</p>

    <details className="technology-details">
      <summary><span className="technology-details-label">예약을 이어 처리하는 방법과 확인한 조건</span><span className="technology-details-toggle" aria-hidden="true">＋</span></summary>
      <div className="technology-details-body">
        <h4>발송할 일을 먼저 기록해요.</h4>
        <p><code>collection_claimable_outbox</code>에 예정 시각과 처리 상태를 보관합니다.<br />발송기는 처리할 예약을 선점하고 발송 결과를 기록합니다.<br />일시적인 실패는 다시 시도할 수 있도록 남깁니다.</p>
        <p>두 인스턴스가 함께 동작하는 동안에는 <code>SKIP LOCKED</code>로 처리할 행을 선점합니다.<br />발송은 DB 트랜잭션 밖에서 진행하고 선점 토큰이 일치할 때 결과를 반영합니다.<br />시연에서 RDB의 종이 서버로 이동하는 모습은 조회와 처리를 뜻하며 DB 기록을 삭제한다는 뜻은 아닙니다.</p>
        <h4>어떤 조건에서 확인했나요?</h4>
        <p>로컬 Docker와 PostgreSQL에서 단일 컨테이너를 재시작했습니다.<br />방식별로 200건씩 4회 실행했고 발송 대기를 1시간에서 5분으로 줄였습니다.<br />위 애니메이션은 재시작 전후의 차이를 설명하는 시연이며 실제 실험 영상은 아닙니다.</p>
        <p className="technology-footnote">발송 결과는 테스트용 FCM 서버의 요청 접수 기록을 기준으로 확인했습니다.<br />실제 FCM 전달이나 기기 수신은 측정하지 않았습니다.<br />응답 유실 후 재시도에서는 중복 요청이 발생할 수 있어 정확히 한 번 전달을 보장하지는 않습니다.</p>
      </div>
    </details>
  </article>;
}
