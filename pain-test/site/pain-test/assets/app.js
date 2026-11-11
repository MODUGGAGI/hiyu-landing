
/* =========================================================
   히유 · 고통 지수 테스트 — 시즌판 (시험 / 회사 / 연애 / 취업)
   시즌별 칭호 20종 (감정 5 × 점수 구간 4) = 총 80종
   ========================================================= */
const IMG = {"bubble": "/pain-test/assets/bubble-main.svg", "dapdap": "/pain-test/assets/emotion-frustrated.svg", "jjajeung": "/pain-test/assets/emotion-irritated.svg", "jichim": "/pain-test/assets/emotion-exhausted.svg", "jwajeol": "/pain-test/assets/emotion-discouraged.svg", "bunno": "/pain-test/assets/emotion-angry.svg"};
const APP_LINK = 'https://pheeeew-invite.pages.dev/';
const SHARE_BASE = typeof location !== 'undefined' && ['localhost','127.0.0.1','[::1]'].includes(location.hostname)
  ? `${location.origin}/pain-test` : 'https://pheeeew.com/pain-test';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const buzz = p => { try{ navigator.vibrate && navigator.vibrate(p); }catch(_){} };
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- 감정 (실제 히유 캐릭터) ---------- */
const EMO = {
  dapdap:  { name:'답답', color:'#F3B6A3' },
  jjajeung:{ name:'짜증', color:'#E696A8' },
  jichim:  { name:'지침', color:'#B0A4CD' },
  jwajeol: { name:'좌절', color:'#89AEC5' },
  bunno:   { name:'분노', color:'#EA9E91' }
};
const EKEYS = Object.keys(EMO);
const av = (k, cls='') => `<span class="bub ${cls}"><img class="ch" src="${IMG[k]}" alt="${EMO[k].name} 캐릭터"><img class="bb" src="${IMG.bubble}" alt=""></span>`;
const solo = (k, cls='solo') => `<img class="${cls}" src="${IMG[k]}" alt="${EMO[k].name} 캐릭터">`;

/* ---------- 날짜 ---------- */
const koreaWeekday = () => '일월화수목금토'[new Date(Date.now() + 9 * 3600000).getUTCDay()];
function millisecondsToKoreaMidnight(now = Date.now()) {
  return 86400000 - ((now + 9 * 3600000) % 86400000);
}
let dateTimer;
function refreshDateLabels(){
  const tabLabel = stage.querySelector('[data-k="suneung"] small');
  if (tabLabel) tabLabel.textContent = SEASONS.suneung.sub;
  // Update text only: keep answers, nickname, focus and running animations intact.
  const intro = stage.querySelector('.intro');
  if (intro && !(friend && friend.t === season)) {
    const eyebrow = intro.querySelector('.eyebrow');
    if (eyebrow) eyebrow.innerHTML = `<i></i>${S().eyebrow}`;
    const heading = intro.querySelector('h1');
    if (heading) heading.innerHTML = S().h1;
  }
  if (stage.querySelector('.quiz') && season === 'suneung' && qi === 1) {
    const question = QS()[qi].q;
    stage.querySelector('.qtext').textContent = question;
    stage.querySelector('#opts').setAttribute('aria-label', question);
  }
  clearTimeout(dateTimer);
  dateTimer = setTimeout(refreshDateLabels, millisecondsToKoreaMidnight());
}

/* ---------- 시즌 ---------- */
// Entertainment score rubric: 2 = genuinely comfortable; 6–10 = manageable friction;
// 12–16 = clear distress; 18–20 = severe frustration/exhaustion.
// Score the situation and response together, never the answer position. Each question caps at 20.
const LAST_Q = (who) => ({ q:`지금 ${who} 상태, 딱 한 단어로 하면?`, tag:'지금 이 순간', last:true,
  a:[ {t:'할 만함', em:'😌', s:2, quip:'…진짜? 한 번 더 생각해봐'},
      {t:'답답', em:'😮‍💨', s:12, e:'dapdap', quip:'고구마 감지됨'},
      {t:'짜증', em:'😤', s:14, e:'jjajeung', quip:'짜증 레이더 풀가동'},
      {t:'방전', em:'🪫', s:18, e:'jichim', quip:'배터리 잔량 경고'},
      {t:'억울', em:'🥲', s:16, e:'jwajeol', quip:'억울함 수치 측정 불가'},
      {t:'빡침', em:'🔥', s:20, e:'bunno', quip:'화산 폭발 직전'} ]});

const SEASONS = {
  suneung: {
    label:'시험판', icon:'📝', sub:'학생', bg:'#DCEBFA', who:'학생',
    eyebrow:'<span>시험은 <b>객관식</b>, 멘탈은 <b>주관식</b></span>',
    h1:'시험 때문에,<br>제일 힘든 <span class="u">학생</span><br><span class="r">누구야?</span>',
    lede:'대학생·고등학생·N수생·학원 동기 다 덤벼.<br><b>5문항 40초</b>, 지면 인정하고 간식 사기.',
    brag:'공부 때문에 나보다 힘든 사람 나와 😤',
    fallback:'jichim',
    qs:[
      { q:'시험 점수를 확인한 순간, 나는?', tag:'시험 점수 확인',
        a:[ {t:'공부한 보람 있네!', em:'📈', s:2, quip:'오늘만큼은 나 자신 좀 칭찬해도 됨'},
            {t:'점수 보고 조용히 화면 끔', em:'📱', s:14, e:'dapdap', quip:'화면은 껐는데 점수는 계속 떠오름'},
            {t:'딱 한 문제만 더 맞혔어도…', em:'🥲', s:16, e:'jwajeol', quip:'그 문제랑 머릿속에서 재시험 보는 중'},
            {t:'공부한 시간 어디로 갔지?', em:'😵', s:20, e:'jwajeol', quip:'분명 열심히 했는데 결과만 기억을 못 함'},
            {t:'엥? 내 점수가 이럴리가 없는데??', em:'😳', s:18, e:'jwajeol', quip:'이름부터 다시 확인함. 안타깝게도 내 거 맞음'} ]},
      { q:'오늘 세운 공부 계획, 지금 상태는?', tag:'공부 계획과 현실',
        a:[ {t:'계획한 만큼 해내는 중', em:'✅', s:2, quip:'계획표와 현실이 드디어 화해함'},
            {t:'계획만 세우다 하루 끝남', em:'🖍️', s:14, e:'jwajeol', quip:'계획 세우기 과목 있었으면 만점'},
            {t:'같은 줄 세 번 읽다가 졸음', em:'😴', s:16, e:'jichim', quip:'눈은 출석했는데 뇌가 결석함'},
            {t:'할 건 쌓였는데 배터리 0%', em:'🪫', s:20, e:'jichim', quip:'공부할 나를 먼저 충전해야 함'},
            {t:'그냥 릴스·쇼츠 보는 중…ㅋ', em:'📱', s:20, e:'jichim', quip:'공부는 멈췄는데 엄지만 야근 중'} ]},
      { q:'분명 공부했는데 문제가 안 풀린다.', tag:'안 풀리는 문제',
        a:[ {t:'표시해 두고 다음 문제로', em:'👌', s:8, quip:'일단 넘어가는 것도 실력이다'},
            {t:'아는 내용인데 왜 못 풀지?', em:'😬', s:16, e:'dapdap', quip:'분명 아는 사이인데 문제가 모른 척함'},
            {t:'해설 첫 줄부터 "이게 왜?"', em:'🙄', s:18, e:'jjajeung', quip:'해설을 해설해 줄 해설이 필요함'},
            {t:'"쉽게 알 수 있다"에서 책 덮음', em:'📕', s:20, e:'jjajeung', quip:'쉽다는 말, 지금 취소해 주세요'},
            {t:'아!!! 이거 분명히 봤는데!!!!', em:'😫', s:20, e:'jjajeung', quip:'본 기억은 있는데 답의 기억이 없음'} ]},
      { q:'누가 "공부 잘돼?"라고 물으면?', tag:'"공부 잘돼?" 한마디',
        a:[ {t:'응, 오늘 분량 거의 끝!', em:'👍', s:2, quip:'이 질문을 기다렸다는 듯 대답 가능'},
            {t:'일단 책은 펴 놨어…', em:'🤥', s:12, e:'dapdap', quip:'펼친 페이지 수는 진도에 안 쳐주나요'},
            {t:'그 질문 잠깐만 금지', em:'🙉', s:16, e:'jjajeung', quip:'안부는 밥 먹었냐는 말로 부탁해'},
            {t:'나도 나한테 묻고 싶다!!', em:'💢', s:20, e:'bunno', quip:'내가 제일 궁금하니까 잠시만요'},
            {t:'그건 왜 물어보는건데??', em:'🤨', s:16, e:'jjajeung', quip:'안부 한마디에 경계 모드 켜짐'} ]},
      LAST_Q('내')
    ],
    titles:{
      dapdap:[ ['<em>일단 책은 펴 둔</em> 사람','공부 시작 전 준비운동만 40분째.'],
               ['분명 봤는데 <em>답만 초면</em>인 사람','문제랑은 구면인데 정답이 자꾸 모른 척함.'],
               ['<em>해설의 해설</em>이 필요한 사람','쉽게 알 수 있다는데 나만 어렵게 사는 중.'],
               ['머릿속 <em>로딩 중 99%</em>인 사람','다 아는 것 같은데 마지막 1%가 답임.'] ],
      jjajeung:[ ['<em>아직은 웃으면서</em> 책 펴는 사람','웃고 있을 때 한 문제라도 더 풀자.'],
                 ['<em>형광펜 뚜껑</em>만 세게 닫는 사람','문제한테 화났는데 문구류가 대신 혼남.'],
                 ['<em>"공부 잘돼?"</em> 금지령 발령자','나도 궁금하니까 일단 묻지 말아 줘.'],
                 ['<em>옆자리 볼펜 딸깍</em>에 예민한 사람','딸깍 한 번에 집중력 전부 증발.'] ],
      jichim:[ ['<em>5분만 쉰다</em>는 사람','아직은 알람 한 번에 돌아올 수 있음.'],
               ['<em>커피 수혈</em>로 움직이는 사람','공부는 내가 하는데 출석은 카페인이 함.'],
               ['책상에 <em>이마 자국</em> 새긴 사람','진도보다 이마 자국이 더 선명하게 남음.'],
               ['<em>눈은 출석, 뇌는 결석</em>한 사람','같은 줄 다섯 번 읽음. 다섯 번 다 처음 봄.'] ],
      jwajeol:[ ['<em>다음엔 진짜 한다</em>는 사람','이번 시험의 교훈: 다음 시험의 나를 믿자.'],
                ['<em>플래너만</em> 전교 1등인 사람','계획은 만점인데 실행이 자꾸 결석함.'],
                ['점수 보고 <em>이름부터 확인</em>한 사람','이 점수가 내 거라고? 이름은 맞네...'],
                ['<em>공부한 시간 실종 신고</em>한 사람','분명 넣었는데요. 성적표에서 못 찾겠어요.'] ],
      bunno:[ ['<em>참을 인</em> 연습 중인 사람','아직은 심호흡 한 번으로 다음 문제 가능.'],
              ['<em>지우개만</em> 박박 문지르는 사람','답을 지우는 건지 화를 지우는 건지.'],
              ['속으로 <em>시험지 30장</em> 찢은 사람','겉으론 조용한데 머릿속은 이미 종이 축제.'],
              ['<em>"아 이거 봤는데!!!"</em> 장인','본 기억은 확실한데 답만 끝까지 안 나옴.'] ]
    }
  },
  company: {
    label:'회사판', icon:'💼', sub:'직장인', bg:'#FFF1C2', who:'직장인',
    get eyebrow(){ return `오늘 <b>${koreaWeekday()}요일</b> · 직장인 시즌판`; },
    get h1(){ return `${koreaWeekday()}요일,<br>제일 힘든 <span class="u">직장인</span><br><span class="r">누구야?</span>`; },
    lede:'팀 단톡에 던지면 다 해봄.<br><b>5문항 40초</b>, 지면 퇴근 커피 쏘기.',
    brag:'우리 팀에서 나보다 힘든 사람 나와 😤',
    fallback:'jichim',
    qs:[
      { q:'월요일 아침 출근길, 지하철에서 나는?', tag:'월요일 출근길',
        a:[ {t:'노래 들으며 기분 좋게', em:'🎧', s:2, quip:'월요일을 이기는 자, 실존했다'},
            {t:'눈 감고 영혼 탈출', em:'👻', s:14, e:'jichim', quip:'몸만 출근, 영혼은 이불 속'},
            {t:'회사 역에서 내리기 싫음', em:'🚇', s:16, e:'dapdap', quip:'한 정거장만 더… 한 정거장만…'},
            {t:'퇴사 브이로그 보는 중', em:'📱', s:20, e:'bunno', quip:'출근길에 퇴사 시뮬레이션'},
            {t:'아 집 가고 싶다....', em:'🫠', s:14, e:'jichim', quip:'아직 출근도 안 했는데 퇴근하고 싶음'} ]},
      { q:'팀장님이 "잠깐 얘기 좀 할까?"', tag:'"잠깐 얘기 좀"',
        a:[ {t:'네! 바로 갑니다', em:'🙋', s:6, quip:'긍정 회로 풀가동'},
            {t:'뭐 잘못했나 머리 굴림', em:'🧠', s:14, e:'dapdap', quip:'최근 3일치 업무 복기 중'},
            {t:'심장이 쿵 내려앉음', em:'💔', s:18, e:'jwajeol', quip:'심박수 측정 불가'},
            {t:'근데 퇴근 10분 전임', em:'⏰', s:20, e:'bunno', quip:'왜… 하필… 지금…'},
            {t:'또 이러네???', em:'😑', s:20, e:'bunno', quip:'잠깐이라더니 잠깐인 적이 없음'} ]},
      { q:'메신저에 "확인 부탁드립니다" 3개 연속.', tag:'"확인 부탁드립니다"',
        a:[ {t:'하나씩 처리하면 되지', em:'✅', s:6, quip:'일잘러 인증'},
            {t:'"넵!" (속으로 한숨)', em:'😮‍💨', s:12, e:'dapdap', quip:'넵 안에 한숨 세 개 들어 있음'},
            {t:'일단 못 본 척 5분', em:'🙈', s:16, e:'jjajeung', quip:'읽음 표시 공포증'},
            {t:'알림 꺼버리고 싶다', em:'🔕', s:20, e:'jjajeung', quip:'메신저 알림음 = 공포 효과음'},
            {t:'진짜 미치겠다 그냥', em:'🤯', s:20, e:'jjajeung', quip:'확인은 했는데 제 상태도 확인 좀요'} ]},
      { q:'마지막으로 연차 쓴 날은?', tag:'마지막 연차',
        a:[ {t:'이번 달에 씀', em:'🏖️', s:2, quip:'부럽다. 진심으로.'},
            {t:'지난 분기쯤…?', em:'🤔', s:16, e:'jichim', quip:'기억을 더듬는 중… 로딩 중…'},
            {t:'연차 쓰고도 노트북 켬', em:'💻', s:18, e:'jwajeol', quip:'몸은 휴가, 손은 출근'},
            {t:'연차가 뭐예요?', em:'🪦', s:20, e:'jichim', quip:'연차, 전설 속의 존재'} ]},
      LAST_Q('직장인')
    ],
    titles:{
      dapdap:[ ['<em>"넵"</em> 한 번에 숨 고르는 사람','아직 "넵"에 영혼이 반은 들어 있음.'],
               ['<em>결론 없는 회의</em> 2시간째인 사람','회의록에 적을 게 고구마밖에 없음.'],
               ['<em>최종_진짜최종_v7</em> 보유자','파일명이 내 인생 같음. 끝이 안 남.'],
               ['가슴에 <em>결재 서류 300장</em> 쌓인 사람','사이다 말고 퇴근이 필요함.'] ],
      jjajeung:[ ['<em>넵넵</em>은 아직 웃으며 치는 사람','이모티콘 붙일 여유도 있음. 부럽다.'],
                 ['<em>"확인 부탁드립니다"</em> 알레르기','알림만 떠도 눈썹이 먼저 반응함.'],
                 ['<em>퇴근 10분 전</em> 업무 요청 피해자','시계 보고, 메신저 보고, 다시 시계 봄.'],
                 ['<em>회의 초대</em> 보면 두드러기 나는 사람','캘린더가 테트리스. 숨 쉴 틈이 없음.'] ],
      jichim:[ ['<em>점심시간</em>에 부활하는 사람','12시에 살아나서 1시에 다시 죽음.'],
               ['<em>아아 벤티</em>로 연명하는 사람','커피가 혈액 역할 하는 중.'],
               ['<em>금요일만</em> 기다리는 좀비','월화수목은 기억이 없음.'],
               ['사원증 단 <em>인간 방전 배터리</em>','출근은 몸만 함. 영혼은 집에 두고 옴.'] ],
      jwajeol:[ ['<em>내년엔</em> 이직한다는 사람','그 내년이 벌써 3년째. 그래도 희망은 있음.'],
                ['<em>채용공고</em> 몰래 보는 사람','회사 와이파이로 보면 안 된다는 건 앎.'],
                ['<em>연봉 협상</em>에서 영혼 털린 사람','"이번엔 어렵겠어요" 3년 연속 수상.'],
                ['<em>퇴사 브이로그</em>로 대리만족하는 사람','남의 퇴사 보며 내 퇴사 시뮬레이션 100회.'] ],
      bunno:[ ['<em>속으로</em> 한 번 참은 사람','아직은 마음속 경고 1회.'],
              ['<em>엔터 키</em>를 세게 치는 사람','키보드 소리에 감정이 실려 있음.'],
              ['속으로 <em>사표 30장</em> 쓴 사람','겉으론 "넵!" 속으론 이미 퇴사 3회차.'],
              ['<em>사표 양식</em> 즐겨찾기한 사람','클릭 한 번이면 끝. 손가락이 떨림.'] ]
    }
  },
  love: {
    label:'연애판', icon:'💘', sub:'썸·연애·솔로', bg:'#F6D2E6', who:'연애러',
    eyebrow:'썸·연애·솔로 <b>전부 됨</b> · 연애 시즌판',
    h1:'읽씹 당해본 사람,<br>제일 힘든 <span class="u">연애러</span><br><span class="r">누구야?</span>',
    lede:'썸이든 연애든 솔로든 다 됨.<br><b>5문항 40초</b>, 지면 인정하고 위로해주기.',
    brag:'나보다 연애 힘든 사람 나와 😤',
    fallback:'jwajeol',
    qs:[
      { q:'답장이 오는데 5시간씩 걸린다...', tag:'5시간마다 오는 답장',
        a:[ {t:'근데 인스타는 하던데…?', em:'👀', s:18, e:'bunno', quip:'답장은 대기 중인데 스토리는 실시간'},
            {t:'그래... 내가 싫은 거겠지....', em:'🥲', s:20, e:'jwajeol', quip:'답장은 안 왔는데 혼자 결말까지 봄'},
            {t:'그래도 답장 오면 신나서 바로 답장함... ㅠ', em:'🥹', s:16, e:'jwajeol', quip:'5시간 기다리고 5초 만에 답장함'},
            {t:"5시간 기다렸는데 'ㅋㅋ' 이게 끝이야??", em:'😑', s:18, e:'jjajeung', quip:'두 글자 받으려고 반나절 대기함'},
            {t:'아... 기다린 내가 바보지...', em:'🫠', s:20, e:'jwajeol', quip:'이래 놓고 알림 울리면 또 바로 봄'} ]},
      { q:'답장 하나 보내는 데 걸리는 시간은?', tag:'답장 한 통',
        a:[ {t:'생각나면 바로 보냄', em:'⚡', s:2, quip:'솔직함이 무기'},
            {t:'ㅋ 개수 고민 5분', em:'🤔', s:8, e:'dapdap', quip:'ㅋㅋ vs ㅋㅋㅋ 인생 최대 난제'},
            {t:'썼다 지웠다 30분', em:'✍️', s:16, e:'dapdap', quip:'임시저장만 7개'},
            {t:'고민하다 해 뜸', em:'🌅', s:20, e:'jichim', quip:'밤새 쓴 답장: "ㅇㅇ"'},
            {t:'일부러 밀당하다가 타이밍 맞춰 보냄', em:'⏱️', s:8, e:'dapdap', quip:'안 기다리는 척하려고 시계만 보는 중'} ]},
      { q:'애인이 매일 쓰는 물건, 알고 보니 전 애인이 준 선물이란다.', tag:'전 애인이 준 선물',
        a:[ {t:'Tlqkf 미쳤어???', em:'😤', s:20, e:'bunno', quip:'방금까지 평범한 물건이었는데 갑자기 사건 됨'},
            {t:'그거 쓸 때마다 계속 전 애인 생각했겠네??', em:'🤨', s:18, e:'jjajeung', quip:'물건 하나 보고 머릿속 질문 백 개 생김'},
            {t:'나 만날 때도 그거 쓰고 있었던 거네...?', em:'🥲', s:18, e:'jwajeol', quip:'지난 데이트 장면이 자동 재생됨'},
            {t:'그냥 헤어지자 ㅎㅎ', em:'🙂', s:20, e:'bunno', quip:'웃고 있지만 지금 작별 인사하는 중'},
            {t:'애써 괜찮은 척...', em:'🙂', s:16, e:'dapdap', quip:'입은 괜찮다는데 표정이 협조를 안 함'} ]},
      { q:'남사친/여사친이랑 여행 간다는 애인, 내 반응은??', tag:'남사친·여사친과 여행',
        a:[ {t:'잘 다녀와~ 재밌게 놀아~', em:'👋', s:2, quip:'나는 나대로 주말 계획 세우는 중'},
            {t:'그냥 둘이 사귀든가 알아서 하세요~', em:'😑', s:20, e:'bunno', quip:'여행 일정 전에 관계 정리부터 듣고 싶음'},
            {t:'야 ㅋㅋ 헤어지자 ㅋㅋ', em:'😤', s:20, e:'bunno', quip:'여행 출발 전에 우리부터 끝내는 중'},
            {t:'그럼 나도 같이 가자^^', em:'🙃', s:14, e:'jjajeung', quip:'웃는 얼굴로 여행 인원 한 명 추가'},
            {t:'여행...? 밥도 아니고 여행...??', em:'😳', s:18, e:'dapdap', quip:'한 끼인 줄 알았는데 숙박 일정까지 나옴'} ]},
      LAST_Q('연애')
    ],
    titles:{
      dapdap:[ ['<em>답장 기다리는 중</em>인 사람','아직 여유 있음. 폰은 세 번만 확인함.'],
               ['<em>숫자 1</em>에 갇힌 사람','1이 사라지는 순간만 기다리는 중.'],
               ['답장 <em>30분째 수정</em> 중인 사람','ㅋ 몇 개 붙일지가 인생 최대 고민.'],
               ['가슴에 <em>읽씹 고구마</em> 300개','읽고 답 안 한 시간만큼 속이 막힘.'] ],
      jjajeung:[ ['<em>"피곤해서"</em>는 한 번 봐주는 사람','한 번은 괜찮아. 한 번은.'],
                 ['<em>"ㅇㅇ"</em> 답장에 눈썹 꿈틀하는 사람','두 글자에 담긴 무성의를 다 읽어냄.'],
                 ['<em>알고리즘</em>한테 커플 사진 금지 요청한 사람','피드가 남의 연애로 도배됨. 왜 나만.'],
                 ['<em>"오늘 좀 피곤해서"</em> 3회 누적자','삼진 아웃 직전. 심판은 나.'] ],
      jichim:[ ['<em>연애 세포</em> 동면 중','깨우면 일어날 수도. 아마도.'],
               ['<em>밀당</em>하다 지친 사람','밀고 당기다 팔이 먼저 빠짐.'],
               ['<em>새벽 3시 통화</em> 후유증 보유자','사랑은 남았는데 체력이 없음.'],
               ['<em>연애 배터리 1%</em> 절전 모드','설렘 기능 일시 정지. 충전기 찾는 중.'] ],
      jwajeol:[ ['<em>다음엔 잘 될</em> 거라는 사람','긍정 회로 아직 작동 중.'],
                ['<em>썸만 세 번째</em> 타는 사람','썸 전문가. 연애는 아직 입문 전.'],
                ['커플 사진 <em>광속 스크롤러</em>','엄지가 반사신경으로 움직임.'],
                ['보낸 카톡 <em>다시 읽으며 반성</em>하는 사람','내가 뭘 잘못했지… 1시간째 복기 중.'] ],
      bunno:[ ['<em>서운함</em> 1스택 쌓인 사람','아직 말은 안 함. 메모는 함.'],
              ['<em>"아니 괜찮아"</em>가 안 괜찮은 사람','괜찮다는 말의 온도가 0도.'],
              ['<em>"인스타는 하던데?"</em> 목격자','답장은 없는데 스토리는 올라옴. 증거 확보.'],
              ['<em>서운함 만렙</em> 찍은 사람','스택이 터지기 직전. 주변 대피 바람.'] ]
    }
  }
};
SEASONS.job = {
  label:'취업판', icon:'📄', sub:'취준생', bg:'#E3EEDB', who:'취준생',
  eyebrow:'취업은 <b>신입</b>, 한숨은 <b>경력직</b>',
  h1:'취업 준비하다가,<br>제일 힘든 <span class="u">취준생</span><br><span class="r">누구야?</span>',
  lede:'첫 취업·재도전·취준 동기 다 덤벼.<br><b>5문항 40초</b>, 지면 인정하고 커피 사기.',
  brag:'취업은 아직인데 한숨은 경력직 😮‍💨 나보다 취준 힘든 사람 나와.',
  cardBrag:['취업은 아직인데 한숨은 경력직','나보다 취준 힘든 사람 나와.'],
  fallback:'dapdap',
  qs:[
    {q:'오, 괜찮은 채용공고 발견. 자격요건을 보니?', tag:'채용공고의 자격요건',
      a:[{t:'일단 넣어보자. 뭐 어떻게든 되겠지', em:'😌', s:6, quip:'지원 버튼 누를 용기, 일단 합격'},
         {t:'이거 신입 뽑는 거 맞아...?', em:'🧐', s:14, e:'dapdap', quip:'신입 공고에서 경력자의 향기가 남'},
         {t:'우대사항에 나만 없네....', em:'🥲', s:16, e:'jwajeol', quip:'스크롤 내릴수록 내가 작아지는 중'},
         {t:'경력이 있어야 취업하고 취업해야 경력이 생기고???', em:'😤', s:20, e:'bunno', quip:'첫 경력은 어디서 시작하라는 건데요???'},
         {t:'일단 저장함... 지원은 미래의 내가 하겠지', em:'🫠', s:10, e:'jichim', quip:'저장한 공고는 많은데 제출한 나는 없음'}]},
    {q:'자소서에 “본인의 강점을 작성해주세요.”', tag:'자소서 속 내 강점',
      a:[{t:'정리해둔 거 있어서 금방 씀', em:'✍️', s:2, quip:'과거의 내가 미래의 나를 살림'},
         {t:'나... 뭐 잘하지....?', em:'🤔', s:16, e:'jwajeol', quip:'분명 있었는데 질문받으니까 기억이 안 남'},
         {t:'일단 제 이름은 확실하게 썼어요', em:'🫥', s:14, e:'dapdap', quip:'이름 세 글자까지는 막힘없이 작성 완료'},
         {t:'그냥 릴스·쇼츠 보는 중...ㅋ', em:'📱', s:20, e:'jichim', quip:'자소서는 0자인데 댓글은 끝까지 읽음'},
         {t:'아니 저도 저를 이렇게까지는 모르는데요....', em:'🫠', s:20, e:'dapdap', quip:'입사하려다가 자아 찾기부터 시작함'}]},
    {q:'지원한 회사에서 결과 메일이 왔다.', tag:'결과 메일',
      a:[{t:'확인하고 다음 할 일 함', em:'😌', s:8, quip:'메일 한 통에 내 하루를 맡기지 않는 편'},
         {t:'아 잠깐만... 아직 마음의 준비가...', em:'😨', s:16, e:'dapdap', quip:'클릭 한 번에 심호흡 세 번'},
         {t:'미리보기로 합격 글자부터 찾아봄', em:'👀', s:12, e:'dapdap', quip:'메일 열기 전부터 눈으로 검색 중'},
         {t:'‘뛰어난 역량에도 불구하고’... 아 네....', em:'🥲', s:20, e:'jwajeol', quip:'앞에서는 칭찬했는데 뒤에서 문이 닫힘'},
         {t:'내 역량이 뛰어나면 뽑아주면 안 돼요???', em:'😤', s:20, e:'bunno', quip:'칭찬은 받았는데 출근할 곳이 없음'}]},
    {q:'누가 “요즘 취업 준비는 잘돼?”라고 물으면?', tag:'“취업 잘돼?” 한마디',
      a:[{t:'그냥 요즘 하는 거 얘기함', em:'🙂', s:2, quip:'근황 토크 가능한 멘탈, 아직 여유 있음'},
         {t:'아... 뭐... 하고 있지....', em:'😐', s:12, e:'jichim', quip:'말줄임표에 이번 주 피로가 다 들어 있음'},
         {t:'취업하면 제가 먼저 말할게요....', em:'🙃', s:16, e:'jjajeung', quip:'합격하면 동네방네 알릴 예정이니 잠시만요'},
         {t:'그건 왜 물어보는건데??', em:'😑', s:16, e:'jjajeung', quip:'안부인 건 아는데 지금은 대답하기 싫음'},
         {t:'저도 궁금해요... 저 언제 취업해요...?', em:'🫠', s:20, e:'jwajeol', quip:'저도 결과를 기다리는 사람입니다만'}]},
    {q:'지금 내 취준 상태, 딱 한마디로 하면?', tag:'지금 이 순간', last:true,
      a:[{t:'아직은 할 만함', em:'😌', s:2, quip:'긍정 회로 아직 정상 작동 중'},
         {t:'뭘 더 해야 되는데....', em:'😮‍💨', s:16, e:'dapdap', quip:'준비 목록은 늘어나는데 끝이 안 보임'},
         {t:'아 그냥 다 거슬려', em:'😤', s:18, e:'jjajeung', quip:'오늘은 알림음도 눈치껏 조용히 해줘'},
         {t:'오늘은 진짜 아무것도 못 하겠음', em:'🪫', s:20, e:'jichim', quip:'열정 말고 충전기부터 주세요'},
         {t:'나만 제자리인 것 같아...', em:'🥲', s:18, e:'jwajeol', quip:'남의 합격 소식에 내 속도만 느려 보이는 날'},
         {t:'뽑을 거야 말 거야!!!!', em:'🔥', s:20, e:'bunno', quip:'한숨 경력직, 오늘은 화산으로 승진'}]}
  ],
  titles:{
    dapdap:[['<em>채용공고 일단 저장한</em> 사람','지원은 내일의 나에게 인수인계함.'],
            ['<em>우대사항에서 길 잃은</em> 사람','분명 신입 공고였는데 읽을수록 내가 사라짐.'],
            ['<em>자소서 커서랑 눈싸움 중인</em> 사람','깜빡이는 건 커서뿐. 내 머리는 멈춰 있음.'],
            ['<em>신입과 경력 사이에 갇힌</em> 사람','경력을 쌓으려면 경력이 필요하다고 함. 여기서부터 막힘.']],
    jjajeung:[['<em>채용 알림에 눈썹 움직인</em> 사람','일단 열어는 봄. 표정까지 약속한 건 아님.'],
              ['<em>같은 이력 열 번째 입력한</em> 사람','이력서 첨부했는데 또 쓰래. 왜 첨부했지?'],
              ['<em>자소서 500자랑 싸우는</em> 사람','501자라 한 글자 지웠더니 문장이 이상해짐.'],
              ['<em>“취업 잘돼?” 수신 거부한</em> 사람','잘됐으면 제가 먼저 말했겠죠....']],
    jichim:[['<em>지원 한 번 하고 간식 찾는</em> 사람','제출 완료. 일단 당부터 충전해야 함.'],
            ['<em>자소서보다 하품이 긴</em> 사람','지원동기는 세 줄인데 하품은 다섯 번째.'],
            ['<em>채용 사이트 출석만 한</em> 사람','오늘도 로그인은 함. 오늘의 힘은 여기까지.'],
            ['<em>열정 대신 충전기 필요한</em> 사람','열정적으로 지원한 결과, 배터리가 먼저 떨어짐.']],
    jwajeol:[['<em>“이번엔 되겠지” 적립 중인</em> 사람','공고 하나 열 때마다 기대도 하나씩 생김.'],
             ['<em>메일 미리보기로 결말 본</em> 사람','‘안타깝게도’ 다섯 글자에서 스크롤이 멈춤.'],
             ['<em>친구 합격에 웃고 혼자 한숨 쉰</em> 사람','축하하는 마음도 진심. 부러운 마음도 진심.'],
             ['<em>자소서 쓰다 내 장점 까먹은</em> 사람','분명 있었는데 설명하려니까 하나도 생각 안 남.']],
    bunno:[['<em>불합격 메일 조용히 닫은</em> 사람','손은 조용했음. 머릿속까지 조용하진 않았음.'],
           ['<em>“귀사의 무궁한 발전”까지만 읽은</em> 사람','회사 발전 말고 제 출근 소식도 좀 부탁드립니다.'],
           ['<em>“뛰어난 역량”이면 뽑으라는</em> 사람','좋은 말은 충분히 들었고요. 출근은 언제 하나요?'],
           ['<em>신입 공고의 경력 요구에 항의 중인</em> 사람','첫 경력은 대체 어디서 시작하라는 건데요???']]
  }
};
const SKEYS = Object.keys(SEASONS);

/* ---------- 티어 ---------- */
const TIERS = [
  {min:95, name:'고통 챌린저', icon:'👑', bg:'#FFE164'},
  {min:80, name:'고통 마스터', icon:'💎', bg:'#F6D2E6'},
  {min:60, name:'고통 다이아', icon:'💠', bg:'#DCEBFA'},
  {min:35, name:'고통 골드',   icon:'🥇', bg:'#FFF1C2'},
  {min:0,  name:'고통 브론즈', icon:'🥉', bg:'#F3E3D6'}
];
const tierOf = s => TIERS.find(t => s >= t.min);
const bandOf = s => s >= 80 ? 3 : s >= 60 ? 2 : s >= 35 ? 1 : 0;


/* ---------- 상태 ---------- */
const stage = document.getElementById('stage');
let season = 'suneung', answers = [], qi = 0, friend = null, pops = 0;
let answerOrders = [];
const seen = {};   // 이번 방문에서 모은 칭호 (시즌별)
const S = () => SEASONS[season];
const QS = () => S().qs;


function startQuiz(){
  answers = []; qi = 0;
  answerOrders = QS().map(q => {
    const order = q.a.map((_,i) => i);
    for (let i = order.length-1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  });
  renderQuestion();
}

function setSeason(k){
  season = k;
  document.documentElement.style.setProperty('--season', SEASONS[k].bg);
}
function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(()=>el.classList.remove('on'), 2200);
}
const liveScore = () => answers.reduce((m,ai,i)=> ai==null ? m : m + QS()[i].a[ai].s, 0);
function rewindQuestion(){
  if (qi === 0) return;
  qi--;
  answers = answers.slice(0, qi);
}
function compute(){
  let total=0, tally={}, best={s:-1,tag:''};
  answers.forEach((ai,i)=>{
    const o = QS()[i].a[ai]; total += o.s;
    if (o.s > best.s) best = {s:o.s, tag:QS()[i].tag};
    if (o.e) tally[o.e] = (tally[o.e]||0) + (QS()[i].last ? 3 : 2);
  });
  const s = total;
  let top = null;
  for (const k of EKEYS) if (tally[k] && (!top || tally[k] > tally[top])) top = k;
  return { s, e: top || S().fallback, pain: best.s > 2 ? best.tag : '딱히 없음 (부럽다)' };
}

/* ---------- 배틀 공유 데이터 ---------- */
const shareName = value => Array.from(String(value || '').trim()).slice(0,8).join('');
function battleCopy(res, opponent, nick){
  const mine = shareName(nick) || '도전자', theirs = shareName(opponent.n) || '친구';
  const tie = res.s === opponent.s;
  return {
    tie, mine, theirs,
    headline: tie ? '동점… 둘 다 고통왕 🤝' : `이번 판 고통왕: ${res.s > opponent.s ? mine : theirs} 👑`,
    caption: tie ? '서로 위로해. 그게 맞아.' : res.s > opponent.s
      ? '축하해… 근데 이게 축하할 일인가?' : '졌다. 인정하고 가서 위로 한 번 해주자.'
  };
}
function resultShareUrl(res, nick, opponent = null){
  const n = shareName(nick);
  if (!opponent) return `${SHARE_BASE}/r/${season}/${res.e}/${res.s}?v=${season === 'job' ? 1 : season === 'suneung' ? 4 : 3}${n ? `&n=${encodeURIComponent(n)}` : ''}`;
  const params = new URLSearchParams({battle:'1',t:season,e:res.e,s:String(res.s),n:n || '도전자',
    oe:opponent.e,os:String(opponent.s),on:shareName(opponent.n) || '친구'});
  if (QS().some(q=>q.tag===res.pain)) params.set('p',res.pain);
  return `${SHARE_BASE}/?${params}`;
}
function parseSharedBattle(params){
  if (params.get('battle') !== '1') return null;
  const t=params.get('t'), e=params.get('e'), oe=params.get('oe');
  const score = key => /^\d{2,3}$/.test(params.get(key) || '') ? Number(params.get(key)) : NaN;
  const s=score('s'), os=score('os');
  if (!SKEYS.includes(t) || !EKEYS.includes(e) || !EKEYS.includes(oe) ||
      !Number.isInteger(s) || s<10 || s>100 || !Number.isInteger(os) || os<10 || os>100) return null;
  const pain = SEASONS[t].qs.some(q=>q.tag===params.get('p')) ? params.get('p') : '공유된 배틀 결과';
  return {t, res:{e,s,pain}, nick:shareName(params.get('n')) || '도전자', opponent:{t,e:oe,s:os,n:shareName(params.get('on')) || '친구'}};
}

/* ---------- 실제 선지 선택률 ---------- */
let pollController = null, advanceTimer = null;
const POLL_HOLD_MS = 2000;
const pollMemory = new Map();
const pollHash = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), b => b.toString(16).padStart(2,'0')).join('').slice(0,24);
async function loadChoiceRates(item, choice, edition, opts){
  const controller = new AbortController(); pollController = controller;
  let timedOut = false;
  const timeout = setTimeout(()=>{ timedOut = true; controller.abort(); }, 3500);
  const status = document.getElementById('poll-status');
  try {
    const texts = item.a.map(a=>a.t);
    const question = await pollHash(JSON.stringify([edition,item.q,[...texts].sort()]));
    const ids = await Promise.all(texts.map(pollHash));
    const test = new URLSearchParams(location.search).get('stats_test') === '1';
    const key = `hiyu-poll:${test?'test':'live'}:${question}`;
    let token = pollMemory.get(key);
    try { token = localStorage.getItem(key) || token; } catch {}
    if (!token) token = crypto.randomUUID();
    pollMemory.set(key,token);
    try { localStorage.setItem(key,token); } catch {}
    const response = await fetch('/pain-test/api/vote', {
      method:'POST', headers:{'Content-Type':'application/json'}, signal:controller.signal,
      body:JSON.stringify({question,answer:ids[choice],token,revision:Date.now(),test})
    });
    if (!response.ok) throw new Error('poll unavailable');
    const data = await response.json();
    if (data.question !== question || !Number.isSafeInteger(data.total) || data.total < 1 || !Array.isArray(data.answers) || data.answers.length !== ids.length ||
        ids.some(id=>data.answers.filter(a=>a.id===id && Number.isInteger(a.percent) && a.percent>=0 && a.percent<=100).length!==1) ||
        data.answers.reduce((n,a)=>n+a.percent,0)!==100) throw new Error('invalid poll');
    if (!opts.isConnected || controller.signal.aborted) return;
    opts.classList.add('poll-ready');
    opts.querySelectorAll('.opt').forEach(button=>{
      const result = data.answers.find(a=>a.id===ids[+button.dataset.i]);
      button.classList.remove('dim');
      button.querySelector('.opt-rate').textContent = result.percent + '%';
      button.querySelector('.opt-rate').hidden = false;
      requestAnimationFrame(()=>requestAnimationFrame(()=>button.style.setProperty('--vote-percent', result.percent + '%')));
    });
    status.textContent = `${test?'검증용 · ':''}${data.total.toLocaleString()}개 응답 · 내 선택 포함${data.total<10?' · 아직 응답이 적어요':''}`;
  } catch {
    if (opts.isConnected && pollController===controller) status.textContent = '선택률을 불러오지 못했어요. 점수는 반영됐고 잠시 후 다음으로 넘어가요.';
  } finally {
    clearTimeout(timeout);
    if (opts.isConnected && pollController===controller && (!controller.signal.aborted || timedOut)) {
      advanceTimer = setTimeout(()=>{
        if (!opts.isConnected || pollController!==controller) return;
        if (qi < QS().length-1) transitionQuestion(1); else renderAnalyzing();
      }, POLL_HOLD_MS);
    }
  }
}

/* ---------- 이펙트 ---------- */
function floater(x, y, text, calm){
  if (RM) return;
  const f = document.createElement('div');
  f.className = 'floater' + (calm ? ' calm' : '');
  f.textContent = text; f.style.left = x+'px'; f.style.top = y+'px';
  document.body.appendChild(f); setTimeout(()=>f.remove(), 900);
}
function confetti(main){
  if (RM) return;
  const fl = document.createElement('div'); fl.className = 'flash';
  document.body.appendChild(fl); setTimeout(()=>fl.remove(), 500);
  const cols = [EMO[main].color,'#FFE164','#89AEC5','#E696A8','#B0A4CD','#F3B6A3'];
  const cx = innerWidth/2, cy = innerHeight*0.32;
  for (let i=0;i<44;i++){
    let p;
    if (i % 4 === 0){ p = document.createElement('img'); p.className = 'cf img'; p.src = IMG[i % 8 === 0 ? main : EKEYS[i % 5]]; p.alt = ''; }
    else { p = document.createElement('div'); p.className = 'cf dot'; const sz = 9 + Math.random()*12; p.style.width = p.style.height = sz+'px'; p.style.background = cols[i % cols.length]; }
    document.body.appendChild(p);
    const ang = Math.random()*Math.PI*2, dist = 140 + Math.random()*260;
    const dx = Math.cos(ang)*dist, dy = Math.sin(ang)*dist - 120;
    p.animate([
      {transform:`translate(${cx}px,${cy}px) scale(.4) rotate(0deg)`, opacity:1},
      {transform:`translate(${cx+dx}px,${cy+dy}px) scale(1) rotate(${Math.random()*360}deg)`, opacity:1, offset:.55},
      {transform:`translate(${cx+dx*1.1}px,${cy+dy+340}px) scale(.9) rotate(${Math.random()*720}deg)`, opacity:0}
    ], {duration:1500+Math.random()*700, easing:'cubic-bezier(.2,.7,.3,1)', fill:'forwards'});
    setTimeout(()=>p.remove(), 2400);
  }
}

/* ---------- 인트로 ---------- */
function tabsHTML(){
  return `<div class="tabs" role="group" aria-label="시즌 선택" style="--tab-index:${SKEYS.indexOf(season)};--tab-column:${SKEYS.indexOf(season)%2};--tab-row:${Math.floor(SKEYS.indexOf(season)/2)}">
    <span class="tab-indicator" aria-hidden="true"></span>
    ${SKEYS.map(k=>`<button class="tab" aria-pressed="${k===season}" data-k="${k}">${SEASONS[k].icon} ${SEASONS[k].label}<small>${SEASONS[k].sub}</small></button>`).join('')}
  </div>`;
}
function renderIntro(transition = null){
  clearTimeout(advanceTimer);
  pollController?.abort();
  const spots = [
    {k:'bunno',   x:'37%', y:'0%',  sz:'124px', d:'5.2s', dl:'-.4s'},
    {k:'jjajeung',x:'3%',  y:'17%', sz:'102px', d:'6s',   dl:'-1.2s'},
    {k:'dapdap',  x:'70%', y:'19%', sz:'104px', d:'5.6s', dl:'-2.2s'},
    {k:'jwajeol', x:'13%', y:'55%', sz:'98px',  d:'6.4s', dl:'-.9s'},
    {k:'jichim',  x:'57%', y:'53%', sz:'110px', d:'5.8s', dl:'-1.8s'}
  ];
  const sz = S();
  const fk = friend && EMO[friend.e] && friend.t === season ? friend : null;
  const content = fk ? `
      <div class="challenge">
        <span class="av">${av(fk.e)}</span>
        <span class="k">⚔️ ${sz.label} 도전장 도착</span>
        <span class="t">${esc(fk.n || '친구')}님이 <b>${fk.s}점</b>으로<br>"나보다 덜 힘들면 인정해라"래</span>
      </div>
      <h1>이길 수<br><span class="u">있겠어?</span></h1>
      <p class="lede">5문항 40초. 점수 높은 사람이 <b>이번&nbsp;판&nbsp;고통왕</b>. 지면 인정하고 위로해주기.</p>
      <button class="btn hiyu-start" id="start"><span>도전 받기 ⚔️</span></button>
    ` : `
      <span class="eyebrow"><i></i>${sz.eyebrow}</span>
      <h1>${sz.h1}</h1>
      <p class="lede">${sz.lede}</p>
      <button class="btn hiyu-start" id="start"><span>${sz.icon} ${sz.label} 고통 지수 까보기</span></button>
    `;
  const existingIntro = transition && stage.querySelector('.intro');
  if (existingIntro) {
    // Keep the bubble nodes connected so their animations and tap state continue.
    existingIntro.querySelectorAll(':scope > :not(.tabs):not(.popzone)').forEach(el=>el.remove());
    existingIntro.insertAdjacentHTML('beforeend',content);
    const tabs = existingIntro.querySelector('.tabs'), index = SKEYS.indexOf(season);
    tabs.style.setProperty('--tab-index',index);
    tabs.style.setProperty('--tab-column',index % 2);
    tabs.style.setProperty('--tab-row',Math.floor(index / 2));
    tabs.querySelectorAll('.tab').forEach(tab=>tab.setAttribute('aria-pressed',tab.dataset.k===season));
  } else {
    stage.innerHTML = `
  <section class="intro">
    ${tabsHTML()}
    <div class="popzone" id="popzone">
      ${spots.map((p,i)=>`<button class="pb" data-k="${p.k}" aria-label="${EMO[p.k].name} 버블 터뜨리기" style="--x:${p.x};--y:${p.y};--sz:${p.sz};--d:${p.d};--dl:${p.dl}">${av(p.k)}</button>`).join('')}
      <span class="taphint" id="taphint">👆 지금 내 기분인 캐릭터를 눌러봐</span>
      <span class="popcount hidden" id="popcount">터뜨린 한숨 <b id="popn">0</b></span>
    </div>
    ${content}
  </section>`;
  }


  if (transition && !RM) {
    const indicator = stage.querySelector('.tab-indicator');
    const rect = indicator.getBoundingClientRect();
    const dx = transition.left - rect.left, dy = transition.top - rect.top;
    indicator.animate([{translate:`${dx}px ${dy}px`}, {translate:'0 0'}],
      {duration:320, easing:'cubic-bezier(.22,1,.36,1)'});
    stage.querySelectorAll('.intro > :not(.tabs):not(.popzone)').forEach(el => {
      el.animate([{opacity:0, translate:`${transition.direction * 14}px 0`}, {opacity:1, translate:'0 0'}],
        {duration:280, easing:'cubic-bezier(.22,1,.36,1)'});
    });
  }
  if (transition) stage.querySelector(`.tab[data-k="${season}"]`).focus({preventScroll:true});

  document.getElementById('start').onclick = startQuiz;
  stage.querySelectorAll('.tab').forEach(t => t.onclick = () => {
    if (t.dataset.k === season) return;
    const transition = {
      left:stage.querySelector('.tab-indicator').getBoundingClientRect().left,
      top:stage.querySelector('.tab-indicator').getBoundingClientRect().top,
      direction:Math.sign(SKEYS.indexOf(t.dataset.k) - SKEYS.indexOf(season))
    };
    setSeason(t.dataset.k); buzz(10); renderIntro(transition);
  });
  if (existingIntro) return;
  const zone = document.getElementById('popzone');
  const sighsBySeason = { suneung:['히유~','하…','공부하기 싫다','아 이거 봤는데…','에휴'], company:['히유~','퇴근각','하…','넵…','에휴'], love:['히유~','읽씹…','하…','ㅠㅠ','에휴'], job:['히유~','취업 언제…','하…','자소서…','에휴'] };
  zone.querySelectorAll('.pb').forEach(b=>{
    b.onclick = () => {
      const sighs = sighsBySeason[season];
      const r = b.getBoundingClientRect(), zr = zone.getBoundingClientRect();
      b.classList.add('popped'); buzz(18); pops++;
      document.getElementById('taphint').classList.add('hidden');
      document.getElementById('popcount').classList.remove('hidden');
      document.getElementById('popn').textContent = pops;
      const s = document.createElement('span');
      s.className = 'sigh'; s.textContent = sighs[pops % sighs.length];
      s.style.left = (r.left - zr.left + r.width/2) + 'px';
      s.style.top = (r.top - zr.top + r.height/3) + 'px';
      zone.appendChild(s); setTimeout(()=>s.remove(), 950);
      setTimeout(()=>b.classList.remove('popped'), 1400);
      if (pops === 10) toast('한숨 10번 달성 😮‍💨 이제 테스트로 붙어보자');
    };
  });
}

/* ---------- 문항 ---------- */
async function transitionQuestion(direction){
  const body = stage.querySelector('.question-body');
  if (!body || body.inert) return;
  clearTimeout(advanceTimer);
  pollController?.abort();
  body.inert = true;
  if (!RM) {
    await body.animate([
      { opacity:1, transform:'translateX(0)' },
      { opacity:0, transform:`translateX(${-20*direction}px)` }
    ], { duration:130, easing:'ease-in', fill:'forwards' }).finished;
  }
  // 홈으로 이동한 뒤에는 이전 문항의 전환을 실행하지 않는다.
  if (!body.isConnected) return;
  if (direction < 0) rewindQuestion(); else qi++;
  renderQuestion(direction);
}
function renderQuestion(direction = 0){
  clearTimeout(advanceTimer);
  pollController?.abort();
  scrollTo(0,0);
  const item = QS()[qi], ls = liveScore();
  const previousGauge = stage.querySelector('.quiz .gauge');
  const quizMarkup = `
  <section class="quiz">
    <div class="gauge">
      <div class="row"><span class="lab"><span class="mini">${solo(answers.length && QS()[qi-1] && QS()[qi-1].a[answers[qi-1]].e || 'dapdap')}</span>${S().icon} ${S().label} 고통 게이지 <span>${qi+1} / ${QS().length}</span></span><span class="val" id="gv">${ls}</span></div>
      <div class="track"><div class="fill" id="gf" style="width:${ls}%"></div></div>
    </div>
    <div class="question-body">
    <div class="question-nav">
      ${qi>0 ? '<button type="button" class="back" id="back" aria-label="이전 문제"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 5-7 7 7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' : ''}
      <div class="qnum">Q${qi+1}${item.last ? ' · 마지막 문제' : ''}</div>
    </div>
    <h2 class="qtext">${item.q}</h2>
    <div class="opts" id="opts" role="group" aria-label="${esc(item.q)}">
      ${answerOrders[qi].map(i=>{ const o = item.a[i]; return `<button class="opt${answers[qi]===i?' sel':''}" aria-pressed="${answers[qi]===i}" data-i="${i}"><span class="em" aria-hidden="true">${o.em}</span><span class="opt-text">${o.t}</span><span class="opt-rate" hidden></span></button>`; }).join('')}
    </div>
    <div class="poll-status" id="poll-status" role="status" aria-live="polite"></div>
    <div class="quip" id="quip" aria-live="polite"></div>
    </div>
  </section>`;

  if (previousGauge) {
    const next = document.createElement('template');
    next.innerHTML = quizMarkup;
    const nextGauge = next.content.querySelector('.gauge');
    previousGauge.querySelector('.lab').lastElementChild.textContent = `${qi+1} / ${QS().length}`;
    const mini = previousGauge.querySelector('.mini');
    const nextMini = nextGauge.querySelector('.mini').innerHTML;
    if (mini.innerHTML !== nextMini) mini.innerHTML = nextMini;
    previousGauge.querySelector('#gv').textContent = ls;
    previousGauge.querySelector('#gv').classList.remove('bump');
    previousGauge.querySelector('#gf').style.width = ls + '%';
    stage.querySelector('.question-body').replaceWith(next.content.querySelector('.question-body'));
  } else stage.innerHTML = quizMarkup;
  if (direction && !RM) {
    stage.querySelector('.question-body').animate([
      { opacity:0, transform:`translateX(${20*direction}px)` },
      { opacity:1, transform:'translateX(0)' }
    ], { duration:180, easing:'cubic-bezier(.2,.7,.3,1)' });
  }

  const opts = document.getElementById('opts');
  opts.querySelectorAll('.opt').forEach(el=>{
    el.onclick = () => {
      if (opts.classList.contains('locked')) return;
      const i = +el.dataset.i, o = item.a[i];
      opts.querySelectorAll('button').forEach(b => b.disabled = true);
      const previous = document.getElementById('back'); if (previous) previous.disabled = true;
      answers[qi] = i; answers.length = qi + 1;
      opts.classList.add('locked');
      opts.querySelectorAll('.opt').forEach(x=>{ x.classList.toggle('sel', x===el); x.classList.toggle('dim', x!==el); x.setAttribute('aria-pressed', x===el); });
      const r = el.getBoundingClientRect();
      floater(r.right - 46, r.top + 4, `+${o.s}${o.s <= 2 ? ' 😌' : ''}`, o.s <= 2);
      buzz(o.s >= 18 ? [25,30,25] : 15);
      if (o.s >= 18 && !RM) el.classList.add('shake');
      const now = liveScore(), gv = document.getElementById('gv');
      document.getElementById('gf').style.width = now + '%';
      gv.textContent = now; gv.classList.remove('bump'); void gv.offsetWidth; gv.classList.add('bump');
      const q = document.getElementById('quip');
      q.innerHTML = (o.e ? `<img src="${IMG[o.e]}" alt="">` : '') + `<span>${o.quip}</span>`;
      q.classList.add('on');
      document.getElementById('poll-status').textContent = '다른 사람들은 뭘 골랐을까? 선택률 불러오는 중…';
      if (previous) previous.disabled = false;
      loadChoiceRates(item,i,season,opts);
    };
  });
  const back = document.getElementById('back');
  if (back) back.onclick = () => transitionQuestion(-1);
}

/* ---------- 분석 ---------- */
function renderAnalyzing(){
  const res = compute();
  const lines = { suneung:['한숨 압력 측정 중…','오답노트 두께 재는 중…','고통 티어 판정 중…','곧 터짐 💥'],
                  company:['한숨 압력 측정 중…','남은 연차 세는 중…','고통 티어 판정 중…','곧 터짐 💥'],
                  love:['한숨 압력 측정 중…','읽씹 시간 계산 중…','고통 티어 판정 중…','곧 터짐 💥'],
                  job:['한숨 압력 측정 중…','자소서 속 영혼 찾는 중…','고통 티어 판정 중…','곧 터짐 💥'] }[season];
  stage.innerHTML = `
  <section class="analyzing">
    <span class="av">${av(res.e)}
      <span class="burst-ring" aria-hidden="true"></span>
      <span class="burst-ring echo" aria-hidden="true"></span>
      ${Array.from({length:8}, (_,i) => {
        const start = i*Math.PI/4, end = start+Math.PI/4, mid = (start+end)/2;
        const edge = angle => `${50+Math.cos(angle)*80}% ${50+Math.sin(angle)*80}%`;
        return `<img class="burst-fragment" src="${IMG.bubble}" alt="" style="clip-path:polygon(50% 50%,${edge(start)},${edge(end)});--dx:${Math.cos(mid)*85}px;--dy:${Math.sin(mid)*85}px;--turn:${i%2 ? 18 : -18}deg">`;
      }).join('')}
      ${Array.from({length:18}, (_,i) => {
        const angle = i * Math.PI / 9, radius = i % 2 ? 154 : 136;
        return `<i class="burst-drop" aria-hidden="true" style="--dx:${Math.cos(angle)*radius}px;--dy:${Math.sin(angle)*radius}px;--turn:${i*20}deg"></i>`;
      }).join('')}
    </span>
    <p id="al">${lines[0]}</p>
    <small>터지기 직전입니다. 물러나세요.</small>
  </section>`;
  let i = 0;
  const t = setInterval(()=>{ i++; if (lines[i]) document.getElementById('al').textContent = lines[i]; }, 380);
  setTimeout(()=>{
    clearInterval(t);
    if (RM) { renderResult(res); return; }
    stage.querySelector('.analyzing').classList.add('bursting');
    document.getElementById('al').textContent = '파앙! 참았던 감정이 터졌다';
    stage.querySelector('.analyzing small').textContent = '이제 내 고통 지수 확인하기';
    buzz([20,30,45]);
    setTimeout(()=>renderResult(res), 850);
  }, RM ? 300 : 1500);
}

/* ---------- 결과 ---------- */
function renderResult(res, {shared = false, nick = ''} = {}){
  scrollTo(0,0);
  const sz = S(), e = EMO[res.e], tier = tierOf(res.s), b = bandOf(res.s);
  const [tHTML, roastTxt] = sz.titles[res.e][b];
  const titlePlain = tHTML.replace(/<\/?em>/g,'');
  const vs = friend && EMO[friend.e] && friend.t === season ? friend : null;
  const iWin = vs ? res.s >= vs.s : false;
  const fname = vs ? esc(vs.n || '친구') : '';
  const myName = shared ? (shareName(nick) || '도전자') : '나';
  const battle = vs ? battleCopy(res,vs,myName) : null;
  const tie = battle?.tie;
  seen[season] = seen[season] || new Set();
  const key = res.e + b; if (!shared) seen[season].add(key);
  const order = []; EKEYS.forEach(k => [0,1,2,3].forEach(n => order.push(k+n)));
  const others = SKEYS.filter(k => k !== season);

  stage.innerHTML = `
  <section class="result" style="--tint:${e.color}55">
    <span class="seasonline">${sz.icon} ${sz.label} 결과</span>
    <div class="card" id="card">
      <div class="tierrow reveal" id="r1">
        <span class="tier" style="--tierbg:${tier.bg}">${tier.icon} ${tier.name}</span>
        <span class="toppct">재미로 보는 감정 테스트</span>
      </div>
      ${vs ? `
        <div class="vs">
          <div class="side ${iWin?'win':'lose'}">${iWin?'<span class="crown">👑</span>':''}<span class="av">${av(res.e)}</span><div class="nm">${esc(myName)}</div><div class="sc" id="sn">0</div></div>
          <div class="vsmark">VS</div>
          <div class="side ${iWin&&!tie?'lose':'win'}">${iWin&&!tie?'':'<span class="crown">👑</span>'}<span class="av">${av(vs.e)}</span><div class="nm">${fname}</div><div class="sc">${vs.s}</div></div>
        </div>
        <h2 class="verdict reveal" id="r2">${esc(battle.headline)}</h2>
        <p class="roast reveal" id="r3">${esc(battle.caption)}</p>
      ` : `
        <div class="hero2${res.s >= 100 ? ' three-digits' : ''}"><span class="av">${av(res.e)}</span><span class="scorebig" id="sn">0</span></div>
        <div class="scorelab">고통 지수 / 100</div>
      `}
      <h2 class="title reveal" id="r4">${tHTML}</h2>
      <p class="roast reveal" id="r5">${roastTxt}</p>
      <div class="facts reveal" id="r6">
        <div class="fact"><div class="k">대표 감정</div><div class="v"><span class="swatch" style="background:${e.color}"></span>${e.name}</div></div>
        <div class="fact"><div class="k">제일 큰 고통 포인트</div><div class="v">${res.pain}</div></div>
      </div>
      <div class="collect reveal" id="r7"${shared ? ' hidden' : ''}>
        <span class="k">${sz.label} 칭호 도감 <b>${seen[season].size}</b> / 20</span>
        <span class="dots" aria-hidden="true">${order.map(k=>`<i class="${k===key?'now':seen[season].has(k)?'on':''}"></i>`).join('')}</span>
      </div>
    </div>

    <div class="nick"><label for="nk">도전장에 쓸 이름</label><input id="nk" maxlength="8" placeholder="${season==='company'?'예: 야근요정':season==='love'?'예: 읽씹피해자':season==='job'?'예: 한숨경력직':'예: 벼락치기왕'}" autocomplete="off"></div>
    <div class="actions">
      <button class="btn yellow" id="share">${shared ? '나도 도전하기 ⚔️' : vs ? (iWin ? '이겼다고 자랑하기 😎' : '복수 도전장 보내기 🔥') : '친구한테 도전장 던지기 ⚔️'}</button>
      <div class="row2">
        <button class="btn ghost story-share" id="sharestory" disabled>
          <span class="share-icons" aria-hidden="true">
            <img src="/pain-test/assets/social/x.svg" alt="" width="18" height="18">
            <img src="/pain-test/assets/social/threads.svg" alt="" width="18" height="18">
            <img src="/pain-test/assets/social/instagram.svg" alt="" width="18" height="18">
            <img src="/pain-test/assets/social/kakaotalk.svg" alt="" width="18" height="18">
          </span>
          <span class="story-label">카드 준비 중…</span>
        </button>
        <button class="btn ghost" id="saveimg">이미지 저장</button>
      </div>
      <div class="story-link-tools">
        <button class="story-link-copy" id="copy-test-link" type="button">테스트 링크 복사 ↗</button>
        <p class="share-guide" id="share-guide">인스타 스토리는 링크를 복사한 뒤 ‘링크’ 스티커에 붙여 넣어 줘.</p>
      </div>
      <button class="btn ghost" id="home">다른 시험도 봐볼까?</button>
      <button class="btn hiyu-start" id="play"><span class="download-content"><span class="store-icons" aria-hidden="true"><img src="/pain-test/assets/stores/apple.svg" alt="" width="22" height="24"><img src="/pain-test/assets/stores/google-play.svg" alt="" width="22" height="24"></span><span>앱 다운로드하러 가기</span></span></button>
    </div>
  </section>`;

  const sn = document.getElementById('sn');
  const land = () => {
    sn.textContent = res.s; sn.classList.add('land');
    document.getElementById('card').classList.add('shake');
    confetti(res.e); buzz([30,40,70]);
    ['r1','r2','r3','r4','r5','r6','r7'].forEach((id,i)=>{ const el = document.getElementById(id); if (el) setTimeout(()=>el.classList.add('in'), 120 + i*140); });
  };
  if (RM || shared) land();
  else {
    const t0 = performance.now();
    const roll = setInterval(()=>{
      const p = (performance.now()-t0)/1100;
      sn.textContent = p < .7 ? Math.floor(10 + Math.random()*90) : Math.round(res.s + (Math.random()-.5)*12*(1-p));
      if (p >= 1){ clearInterval(roll); land(); }
    }, 55);
  }

  const nk = document.getElementById('nk');
  if (shared) { nk.value = nick; nk.closest('.nick').hidden = true; }
  const url = () => resultShareUrl(res,nk.value,vs);
  const shareButton = document.getElementById('share');
  shareButton.onclick = async () => {
    if (shared) { friend = {t:season,e:res.e,s:res.s,n:shareName(nick) || '도전자'}; renderIntro(); return; }
    if (navigator.share){ try{ await navigator.share({url:url()}); return; }catch(error){ if(error.name === 'AbortError') return; } }
    copyText(url(), '링크 복사 완료');
  };
  const storyButton = document.getElementById('sharestory');
  const storyLabel = storyButton.querySelector('.story-label');
  const saveButton = document.getElementById('saveimg');
  const testLink = () => vs ? url() : `${SHARE_BASE}/?t=${season}`;
  const linkLabel = vs ? '배틀 링크' : '테스트 링크';
  document.getElementById('copy-test-link').textContent = `${linkLabel} 복사 ↗`;
  const copyTestLink = () => copyText(testLink(), `${linkLabel} 복사 완료! 스토리의 링크 스티커에 붙여 넣어 줘`);
  document.getElementById('copy-test-link').onclick = copyTestLink;
  let cardFile, cardVersion = 0, storySharing = false;
  const autoCopyTestLink = async () => {
    const guide = document.getElementById('share-guide');
    try {
      await navigator.clipboard.writeText(testLink());
      guide.textContent = `${linkLabel} 복사 완료! 인스타 스토리의 ‘링크’ 스티커에 붙여 넣어 줘.`;
      toast(`${linkLabel} 복사 완료! 링크 스티커에 붙여 넣어 줘`);
    } catch (_) {
      guide.textContent = `자동 복사가 차단됐어요. ‘${linkLabel} 복사’를 누른 뒤 스토리의 링크 스티커에 붙여 넣어 줘.`;
      toast(`자동 복사가 차단됐어요. ${linkLabel} 복사 버튼을 눌러 줘`);
    }
  };
  const prepareCard = async () => {
    const version = ++cardVersion;
    cardFile = null;
    storyButton.disabled = saveButton.disabled = true;
    if (vs && !shared) shareButton.disabled = true;
    storyLabel.textContent = '카드 준비 중…';
    try {
      const blob = await saveCard(res, tier, titlePlain, shareName(nk.value), vs);
      if (version !== cardVersion) return;
      cardFile = new File([blob], `hiyu-${season}-${vs ? 'battle-' : ''}${res.s}.png`, {type:'image/png'});
      const canShare = !!navigator.canShare?.({files:[cardFile]});
      storyLabel.textContent = '스토리 공유 ↗';
      document.getElementById('share-guide').textContent = canShare
        ? '스토리 공유를 누르면 이미지 1장을 공유하고 테스트 링크를 자동 복사해요. 인스타 스토리의 ‘링크’ 스티커에 붙여 넣어 줘.'
        : '스토리 공유를 누르면 테스트 링크를 자동 복사하고 이미지 저장 화면을 열어요. 인스타 스토리에 사진을 올린 뒤 ‘링크’ 스티커에 붙여 넣어 줘.';
      if (vs) document.getElementById('share-guide').textContent = '두 사람의 점수와 승패가 담긴 배틀 이미지 1장을 공유하고 배틀 링크를 복사해요. 링크를 열면 같은 결과를 볼 수 있어요.';
      storyButton.disabled = saveButton.disabled = false;
      shareButton.disabled = false;
    } catch (_) {
      if (version !== cardVersion) return;
      storyLabel.textContent = '카드 다시 준비하기';
      storyButton.disabled = false;
      shareButton.disabled = false;
    }
  };
  const canShareCard = () => {
    try { return !!(cardFile && navigator.share && navigator.canShare?.({files:[cardFile]})); }
    catch (_) { return false; }
  };
  const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const showCardPreview = () => {
    const existing = document.getElementById('card-preview');
    if (existing) return;
    const touchDevice = isAppleMobile || navigator.maxTouchPoints > 0;
    const objectURL = URL.createObjectURL(cardFile);
    const dialog = document.createElement('dialog');
    dialog.id = 'card-preview'; dialog.className = 'card-preview';
    dialog.setAttribute('aria-labelledby', 'card-preview-title');
    dialog.innerHTML = `<div class="preview-top"><h2 id="card-preview-title">사진에 저장하기</h2><button type="button" class="preview-close" aria-label="이미지 미리보기 닫기">✕</button></div>
      <p>${touchDevice ? '이미지를 길게 눌러 <b>사진에 저장</b>을 선택해 줘.' : '이미지를 마우스 오른쪽 버튼으로 눌러 <b>이미지를 다른 이름으로 저장</b>해 줘.'}<br>저장한 이미지를 스토리나 대화방에 올리면 돼.</p>
      <img alt="${vs ? '두 사람의 점수와 승패가 담긴 배틀 카드' : '내 점수와 칭호가 담긴 스토리 카드'}" />
      <p class="preview-help">${touchDevice ? '저장 메뉴가 안 보이면 기본 브라우저에서 이 페이지를 열어 줘.' : '창을 닫고 이미지 저장 버튼을 눌러도 다운로드할 수 있어.'}</p>
      <button type="button" class="story-link-copy preview-copy-link">${linkLabel} 복사 ↗</button>
      <p class="preview-help">인스타 스토리의 ‘링크’ 스티커에 붙여 넣으면 친구가 눌러서 테스트할 수 있어.</p>`;
    dialog.querySelector('img').src = objectURL;
    dialog.querySelector('.preview-copy-link').onclick = copyTestLink;
    document.body.append(dialog);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.addEventListener('close', () => {
      document.body.style.overflow = previousOverflow;
      URL.revokeObjectURL(objectURL); dialog.remove(); saveButton.focus();
    }, {once:true});
    dialog.querySelector('button').onclick = () => dialog.close();
    dialog.showModal();
  };
  const downloadCard = () => {
    if (!cardFile) return;
    if (isAppleMobile || navigator.maxTouchPoints > 0) { showCardPreview(); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(cardFile); a.download = cardFile.name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 60000);
    toast('다운로드한 이미지를 인스타 스토리에서 선택해 줘 📸');
  };
  storyButton.onclick = async () => {
    if (storySharing) return;
    if (!cardFile) { await prepareCard(); return; }
    storySharing = true;
    storyButton.disabled = true;
    try {
      // Start clipboard access before share consumes activation; do not await it here.
      void autoCopyTestLink();
      if (!canShareCard()) { showCardPreview(); return; }
      // Send exactly one image. Keep the URL in the clipboard, not as a second share item.
      await navigator.share({files:[cardFile]});
    } catch (error) {
      if (error.name !== 'AbortError') {
        showCardPreview();
        toast('공유창을 열 수 없어요. 이미지를 길게 눌러 저장해 줘');
      }
    } finally {
      storySharing = false;
      storyButton.disabled = !cardFile;
    }
  };
  if (vs && !shared) shareButton.onclick = () => storyButton.onclick();
  saveButton.onclick = () => {
    if (!cardFile) return;
    if (isAppleMobile && canShareCard()) {
      showCardPreview();
      document.querySelector('#card-preview p').innerHTML = '공유창에서 <b>이미지 저장</b>을 선택해 줘.<br>메뉴가 없으면 공유창을 닫고 아래 이미지를 길게 눌러 줘.';
      navigator.share({files:[cardFile]}).catch(error => {
        if (error.name !== 'AbortError') toast('아래 이미지를 길게 눌러 저장해 줘');
      });
      return;
    }
    downloadCard();
  };
  nk.addEventListener('input', prepareCard);
  prepareCard();
  document.getElementById('play').onclick = () => window.open(APP_LINK, '_blank', 'noopener');
  document.getElementById('home').onclick = () => { window.location.assign(SHARE_BASE + '/'); };
}

async function copyText(t, msg){
  try{ await navigator.clipboard.writeText(t); toast(msg); }
  catch(_){
    const ta = document.createElement('textarea'); ta.value = t; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try{ if (!document.execCommand('copy')) throw new Error('copy'); toast(msg); }catch(e){ toast('복사 실패. 주소창 링크를 복사해 줘'); }
    ta.remove();
  }
}

/* ---------- 스토리용 카드 (1080×1920) ---------- */
const loadImg = src => new Promise((ok,no)=>{ const i = new Image(); i.onload = ()=>ok(i); i.onerror = no; i.src = src; });
async function saveBattleCard(res, tier, titlePlain, nick, opponent){
  const copy = battleCopy(res,opponent,nick), sz = S();
  const c = document.createElement('canvas'); c.width=1080; c.height=1920;
  const x = c.getContext('2d'), P='"Black Han Sans","Pretendard Variable",sans-serif';
  const B='"Pretendard Variable",Pretendard,"Apple SD Gothic Neo",sans-serif';
  const texts = [copy.mine,copy.theirs,copy.headline,copy.caption,titlePlain,'고통 배틀 결과','나도 고통왕에 도전하기'].join(' ');
  try { await Promise.all([document.fonts.load(`80px ${P}`,texts),document.fonts.load(`800 40px ${B}`,texts)]); await document.fonts.ready; } catch {}
  const [mine,theirs,bubble] = await Promise.all([loadImg(IMG[res.e]),loadImg(IMG[opponent.e]),loadImg(IMG.bubble)]);
  const box=(left,top,width,height,radius,color)=>{
    x.beginPath();x.roundRect(left,top,width,height,radius);x.fillStyle=color;x.fill();
  };
  const text=(value,cx,cy,max,size,font=P,color='#242526',weight=400)=>{
    while (size>20) { x.font=`${weight} ${size}px ${font}`; if(x.measureText(value).width<=max) break; size-=2; }
    x.fillStyle=color;x.fillText(value,cx,cy,max);
  };
  x.fillStyle='#FFFDF7';x.fillRect(0,0,1080,1920);
  const tint=x.createLinearGradient(0,0,1080,1300);
  tint.addColorStop(0,EMO[res.e].color+'55');tint.addColorStop(1,'#FFFDF700');
  x.fillStyle=tint;x.fillRect(0,0,1080,1920);x.textAlign='center';
  text('히유 · 고통 지수 테스트',540,100,920,32,B,'#5C625C',800);
  box(380,150,320,76,38,sz.bg);
  text(`${sz.icon} ${sz.label}`,540,203,280,40,B,'#242526',800);
  text('고통 배틀 결과',540,345,940,88);
  text('더 힘든 사람이 이기는 이상한 대결',540,407,920,36,B,'#5C625C',800);
  box(60,470,960,700,48,'#242526');box(60,458,960,700,48,'#FFFFFF');
  const side=(cx,face,score,name,winner)=>{
    if(winner){
      x.beginPath();x.arc(cx,751,164,0,Math.PI*2);x.fillStyle='#FFF0A4';x.fill();
      text('👑',cx,568,140,72,B);
    }
    x.drawImage(bubble,cx-155,596,310,310);
    const scale=205/Math.max(face.naturalWidth,face.naturalHeight);
    x.drawImage(face,cx-face.naturalWidth*scale/2,751-face.naturalHeight*scale/2,face.naturalWidth*scale,face.naturalHeight*scale);
    text(name,cx,970,340,44,B,'#242526',800);
    text(String(score),cx,1123,340,180,P,winner?'#242526':'#8A908A');
  };
  side(290,mine,res.s,copy.mine,res.s>=opponent.s);
  side(790,theirs,opponent.s,copy.theirs,opponent.s>=res.s);
  text('VS',540,797,130,76,P,'#FF5A4E');
  text(copy.headline,540,1280,950,66);
  text(copy.caption,540,1355,930,34,B,'#5C625C',700);
  text(`${copy.mine}의 칭호`,540,1460,920,32,B,'#8A908A',800);
  box(70,1508,940,58,0,'#FFE164');
  text(titlePlain,540,1550,910,55);
  box(80,1650,920,145,34,'#242526');
  text('나도 고통왕에 도전하기 ↗',540,1714,840,46,P,'#FFE164');
  text('pheeeew.com/pain-test',540,1766,840,34,B,'#FFFFFF',800);
  text('재미로 보는 감정 테스트 · 히유',540,1860,920,30,B,'#8A908A',700);
  return new Promise((resolve,reject)=>c.toBlob(blob=>blob?resolve(blob):reject(new Error('Battle card encoding failed')),'image/png'));
}
async function saveCard(res, tier, titlePlain, nick, opponent = null){
  if (opponent) return saveBattleCard(res,tier,titlePlain,nick,opponent);
  const sz = S(), e = EMO[res.e], W = 1080, H = 1920;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  // Load the actual Korean glyphs before measuring canvas text (fonts are subsetted).
  const cardText = [titlePlain, nick, tier.name, ...(sz.cardBrag || [sz.brag])].join(' ');
  try{ await document.fonts.load('80px "Black Han Sans"', cardText); await document.fonts.ready; }catch(_){}
  const P = '"Black Han Sans","Pretendard Variable",sans-serif';
  const B = '"Pretendard Variable",Pretendard,"Apple SD Gothic Neo",sans-serif';
  const rr = (X,Y,w,h,r) => { x.beginPath(); x.roundRect ? x.roundRect(X,Y,w,h,r) : x.rect(X,Y,w,h); };
  const fit = (t, max, size, w, f) => { let s = size; do { x.font = `${w} ${s}px ${f}`; s -= 2; } while (x.measureText(t).width > max && s > 20); };
  let ch, bb;
  try{ [ch, bb] = await Promise.all([loadImg(IMG[res.e]), loadImg(IMG.bubble)]); }catch(_){ throw new Error('Card images unavailable'); }

  x.fillStyle = '#FFFDF7'; x.fillRect(0,0,W,H);
  const g = x.createRadialGradient(W/2, 560, 60, W/2, 560, 1100);
  g.addColorStop(0, e.color + '77'); g.addColorStop(1, 'rgba(255,253,247,0)');
  x.fillStyle = g; x.fillRect(0,0,W,H);
  x.textAlign = 'center';

  // season pill
  x.font = `800 40px ${B}`;
  const sl = `${sz.icon} ${sz.label}`, sw = x.measureText(sl).width + 70;
  rr(W/2-sw/2, 120, sw, 76, 38); x.fillStyle = sz.bg; x.fill(); x.lineWidth = 5; x.strokeStyle = '#242526'; x.stroke();
  x.fillStyle = '#242526'; x.fillText(sl, W/2, 172);

  x.font = `400 66px ${P}`;
  x.fillText(nick ? `${nick}의 고통 지수` : '나의 고통 지수', W/2, 300);

  x.font = `400 50px ${P}`;
  const tl = `${tier.icon} ${tier.name}`, tw = x.measureText(tl).width + 80;
  rr(W/2-tw/2, 340, tw, 92, 26); x.fillStyle = tier.bg; x.fill(); x.lineWidth = 6; x.strokeStyle = '#242526'; x.stroke();
  x.fillStyle = '#242526'; x.fillText(tl, W/2, 405);

  // bubble + real character
  const cs = 470, cx = W/2 - cs/2, cy = 470;
  x.drawImage(bb, cx, cy, cs, cs);
  const chScale = cs*0.66 / Math.max(ch.naturalWidth, ch.naturalHeight);
  const chWidth = ch.naturalWidth*chScale, chHeight = ch.naturalHeight*chScale;
  x.drawImage(ch, cx + (cs-chWidth)/2, cy + (cs-chHeight)/2, chWidth, chHeight);

  x.fillStyle = '#242526'; x.font = `400 300px ${P}`;
  x.fillText(String(res.s), W/2, 1230);
  x.fillStyle = '#8A908A'; x.font = `800 42px ${B}`;
  x.fillText('/ 100  ·  재미로 보는 감정 테스트', W/2, 1300);

  fit(titlePlain, 960, 82, 400, P);
  const ttw = x.measureText(titlePlain).width;
  x.fillStyle = '#FFE164'; x.fillRect(W/2-ttw/2-10, 1400, ttw+20, 38);
  x.fillStyle = '#242526'; x.fillText(titlePlain, W/2, 1430);

  rr(80, 1540, W-160, 200, 40); x.fillStyle = '#242526'; x.fill();
  const bragLines = sz.cardBrag || [sz.brag];
  x.save();
  x.direction = 'ltr';
  x.textAlign = 'left';
  bragLines.forEach((line,i) => {
    fit(line, W-240, bragLines.length > 1 ? 44 : 56, 400, P);
    const width = Math.min(x.measureText(line).width, W-240);
    x.fillStyle = '#FFE164';
    x.fillText(line, (W-width)/2, bragLines.length > 1 ? 1604+i*54 : 1630, W-240);
  });
  x.restore();
  x.fillStyle = '#fff'; x.font = `800 38px ${B}`;
  x.fillText('pheeeew.com/pain-test 에서 붙어보기', W/2, bragLines.length > 1 ? 1720 : 1696);

  x.fillStyle = '#8A908A'; x.font = `800 34px ${B}`;
  x.fillText('히유 · 스트레스 지도', W/2, 1840);

  return new Promise((resolve, reject) => c.toBlob(blob => {
    if (blob) resolve(blob); else reject(new Error('Card encoding failed'));
  }, 'image/png'));
}

/* ---------- 부팅 ---------- */
(function boot(){
  const h = new URLSearchParams(location.search || location.hash.replace(/^#/,''));
  const path = location.pathname.match(/^\/pain-test\/r\/(suneung|company|love|job)\/(dapdap|jjajeung|jichim|jwajeol|bunno)\/(\d+)\/?$/);
  const t = path ? path[1] : h.get('t'), e = path ? path[2] : h.get('e'), s = Number(path ? path[3] : h.get('s')), n = (h.get('n')||'').slice(0,8);
  setSeason(SKEYS.includes(t) ? t : 'suneung');
  if (SKEYS.includes(t) && EKEYS.includes(e) && Number.isInteger(s) && s >= 10 && s <= 100) friend = { t, e, s, n };
  const snapshot = parseSharedBattle(h);
  if (snapshot) {
    setSeason(snapshot.t); friend = snapshot.opponent;
    renderResult(snapshot.res, {shared:true,nick:snapshot.nick});
  } else renderIntro();
  refreshDateLabels();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDateLabels(); });
  window.addEventListener('focus', refreshDateLabels);
  window.addEventListener('pageshow', refreshDateLabels);
})();
