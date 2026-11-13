// 동선 카드의 규칙·주최 안내 사실·약도·네 언어 문장. 숫자는 다른 자료 파일(shows·trains·nights·facts)에서 읽어 문장에 끼운다.
// 주최 안내 사실의 열람일은 seen. 역·행선지 이름은 trains.js 의 공식 표기(names)에서 온다 — 여기에 외국어 역 이름을 적지 않는다.
// 문장 속 자리표: {S:역이름} = 그 언어의 역 이름, {HRS} = 집계 시간대, {MIN} = 「공연 밤」 기준 배수.
window.RC_GUIDE = {
  seen: "2026-11-10",
  rules: {
    arrivalBandMin: 1.2,       // 도착 몰림 띠: 같은 날 KSPO DOME 저녁 공연의 시작 시 묶음(facts.alightByStart)에서 하차 배수가 이 값 이상인 시간대만 그린다
    arrivalMinDays: 10,        // 그 시작 시의 공연 날이 이 날 수보다 적으면 띠를 그리지 않고 한 줄로 알린다
    arrivalStation: "2556",    // 띠에 쓰는 역: 5호선 올림픽공원(역사코드)
    busyFrom: 1.5,             // 이 배수 이상이면 「붐비는 역」 문장을 쓴다
    parkEntryUntil: "22:00",   // 주최 공원 이용 안내: 22시 이후 공원 안쪽 출입 금지
    aroundInsideMax: 400,      // 공원을 돌아가는 길로 인정하는 공원 안 구간 상한(m, walk.js aroundParkM). KSPO DOME 315 · 올림픽홀 296 은 인정, 우리금융아트홀 736 은 도는 길 없음
    leaveBuffer: 5,            // 늦어도 나설 시각 = 마지막 열차 − 걷는 시간 − 이 여유(분)
    endLate: 180,              // 끝나는 때가 가정인 회차의 늦은 끝(시작 뒤 분). 승차가 몰리는 칸이 시작 3시간 뒤라서(지시서 6절)
    roomyFrom: 60,             // 끝나는 때에서 나설 시각까지 이 분보다 많이 남으면 「여유 있어요」
    sameWalk: 2,               // 두 칸의 걷는 시간 차이가 이 분 이하이면 「걷는 시간은 비슷해요」
    dayGap: 120,               // 같은 날 KSPO DOME 저녁 공연의 끝보다 이 분 넘게 일찍 끝나는 회차는 덜 붐볐던 역 칸을 접는다
    eveningFrom: "16:00",      // 「KSPO DOME 저녁 공연」= 이 시각 이후 시작 회차
    boardOffset: 3,            // 주말 숫자 문장: 시작 몇 시간 뒤 한 시간 칸(facts.boardByStart.offsets 의 값)
    alarmBefore: 10,           // 달력 파일 알림: 「늦어도 나설 시각」의 이 분 전
    usualBand: 0.1             // 평소와 이만큼 안쪽이면 숫자 대신 「평소 수준」이라고 쓴다
  },
  links: {
    list: "https://www.ksponco.or.kr/olympicpark/menu.es?mid=a20301010100",
    park: "https://www.ksponco.or.kr/olympicpark/menu.es?mid=a20109000000",
    hours: "https://www.ksponco.or.kr/olympicpark/menu.es?mid=a20101000000",
    screen: "https://www.ksponco.or.kr/online/main/parking.do",
    mapKo: "https://map.naver.com/p/search/",
    mapOther: "https://www.google.com/maps/search/?api=1&query="
  },
  photo: { src: "img/kspo_dome_commons.jpg", crop: { x: 0, y: 100, w: 1280, h: 600 }, cols: 104, lo: 0.3, hi: 0.995, gamma: 1.1, hotFrom: 0.72,   // lo·hi = 어두운 쪽·밝은 쪽을 자르는 자리(백분위)
    credit: "Moonhayun · CC BY-SA 4.0 · Wikimedia Commons", page: "https://commons.wikimedia.org/wiki/File:%EC%98%AC%EB%A6%BC%ED%94%BD%EC%B2%B4%EC%A1%B0.jpg" },
  venues: {
    "KSPO DOME": { slug: "dome", code: "DOME", en: "KSPO DOME", page: "https://www.ksponco.or.kr/olympicpark/menu.es?mid=a20301030800", d3: "https://www.ksponco.or.kr/menu.es?mid=a10405050100" },
    "올림픽홀": { slug: "hall", code: "HALL", en: "Olympic Hall", page: "https://www.ksponco.or.kr/olympicpark/menu.es?mid=a20301031000", d3: null },
    "우리금융아트홀": { slug: "woori", code: "WOORI", en: "Woori Art Hall", page: "https://www.ksponco.or.kr/olympicpark/menu.es?mid=a20301031100", d3: "https://www.ksponco.or.kr/menu.es?mid=a10405050500" }
  },
  // 출구(역사코드별). venue = 주최 공연장 안내 쪽, park = 주최 공원 「오시는 길」 쪽, map = 주최 안내에 없어 지도 경로 계산으로 고른 가장 가까운 출구(카드에 출처를 따로 표시).
  // 4135 한성백제·4137 둔촌오륜은 지금 카드가 타는 역으로 가리키지 않는다(자료만 둔다).
  exits: {
    "2556": [{ no: "3", src: "venue" }, { no: "3·4", src: "park" }],
    "4136": [{ no: "3", src: "venue" }, { no: "3·4", src: "park" }],
    "2814": [{ no: "1", src: "park" }],
    "4135": [{ no: "2", src: "park" }],
    "2557": [{ no: "1", src: "map" }],
    "4137": [{ no: "2", src: "map" }]
  },
  // 주최 개방 파일 「자주 묻는 질문정보」(공공데이터포털 15089962)의 대중교통 문항(일련번호 18989)에 적힌 출구.
  // 원문: 「지하철 : 5호선 9호선 올림픽공원역 3번출구 8호선 몽촌토성역1번출구」. 운영 점검표가 위 exits 와 맞댄다(카드에는 그리지 않는다).
  faqExits: { id: "15089962", seq: "18989", by: { "2556": "3", "4136": "3", "2814": "1" } },
  // 행선지. toward = 그쪽으로 가는 방향을 시각표의 정차 순서에서 찾는 기준 역. to = 「어디까지」 고르는 역(마지막이 기본값).
  dests: [
    { id: "jamsil", line: "2", via: ["잠실"], board: { st: "2814", toward: "잠실" }, to: ["잠실", "건대입구", "삼성", "강남"],
      nightCol: 2, parkWalk: true,
      hop: { name: "잠실", at: "2815" },   // 8호선에서 내리는 역(열차별 도착 시각이 있는 역사코드)
      xfer: { st: "0216" },                  // 그 역에서 갈아타는 2호선(to 가 hop 이 아닐 때)
      alt: { board: { st: "4136", toward: "석촌" }, hop: { name: "석촌", at: "4133" }, mid: { st: "2816", toward: "잠실" } },
      // 두 칸(지시서 1절): host = 주최가 안내하는 역, less = 공연 밤에 덜 붐볐던 역. viaAlt = 위 alt 길(9호선 → 석촌 → 8호선)
      cols: { host: { st: "4136", toward: "석촌", viaAlt: true }, less: { st: "2814", toward: "잠실" } } },
    { id: "city5", line: "5", via: ["광화문", "여의도", "방화"], board: { st: "2557", toward: "방화" }, near: { st: "2556", toward: "방화" },
      to: ["강동", "군자", "왕십리", "동대문역사문화공원", "광화문", "공덕", "여의도", "김포공항", "방화"], nightCol: 3,
      cols: { host: { st: "2556", toward: "방화" }, less: { st: "2557", toward: "방화" } } },
    { id: "macheon5", line: "5", via: ["마천"], board: { st: "2556", toward: "마천" }, to: ["방이", "오금", "마천"], nightCol: 1,
      cols: { host: { st: "2556", toward: "마천" } } },
    { id: "gangnam9", line: "9", via: ["신논현", "김포공항"], board: { st: "4136", toward: "개화" }, behind: "한성백제",
      to: ["석촌", "종합운동장", "신논현", "고속터미널", "여의도", "김포공항", "개화"],
      // 둔촌오륜역은 trains.js 에 역이 실리면 그린다. 행사 없는 금요일 승차가 적어(가운데 값 50명) 배수와 함께 사람 수를 적는다(count)
      cols: { host: { st: "4136", toward: "개화" }, less: { st: "4137", toward: "개화", count: true } } }
  ],
  // 약도(검은 면). 방향과 순서만 맞춘 그림이고 거리는 맞지 않는다. 좌표는 1000×1000 판 위의 자리.
  map: {
    venue: { x: 748, y: 418 },
    nodes: {
      "올림픽공원": { x: 700, y: 470, lp: "r" }, "방이": { x: 752, y: 548, lp: "r" }, "오금": { x: 800, y: 616, lp: "r" }, "마천": { x: 852, y: 690, lp: "r" },
      "몽촌토성": { x: 636, y: 418, lp: "t", tag: "gate" }, "잠실": { x: 578, y: 478, lp: "l", tag: "tower" }, "석촌": { x: 578, y: 566, lp: "b" },
      "종합운동장": { x: 486, y: 566, lp: "tl", tag: "stadium" }, "삼성": { x: 424, y: 650, lp: "b", tag: "coex" }, "강남": { x: 344, y: 650, lp: "b" },
      "신논현": { x: 380, y: 566, lp: "b" }, "고속터미널": { x: 276, y: 566, lp: "bl" }, "여의도": { x: 186, y: 458, lp: "b" },
      "김포공항": { x: 128, y: 352, lp: "l", tag: "air" }, "개화": { x: 60, y: 272, lp: "t" }, "방화": { x: 100, y: 302, lp: "r" },
      "강동": { x: 700, y: 348, lp: "r" }, "군자": { x: 600, y: 256, lp: "t" }, "왕십리": { x: 500, y: 256, lp: "t" },
      "동대문역사문화공원": { x: 400, y: 256, lp: "b", tag: "ddp" }, "광화문": { x: 300, y: 256, lp: "t", tag: "palace" }, "공덕": { x: 236, y: 334, lp: "l" },
      "건대입구": { x: 520, y: 346, lp: "l" }
    },
    lines: {
      "5": ["마천", "오금", "방이", "올림픽공원", "강동", "군자", "왕십리", "동대문역사문화공원", "광화문", "공덕", "여의도", "김포공항", "방화"],
      "9": ["올림픽공원", "석촌", "종합운동장", "신논현", "고속터미널", "여의도", "김포공항", "개화"],
      "8": ["몽촌토성", "잠실", "석촌"],
      "2": ["건대입구", "잠실", "종합운동장", "삼성", "강남"]
    },
    lineOf: { "2556": "5", "2557": "5", "2814": "8", "4136": "9", "0216": "2", "2816": "8" },
    snap: 90,   // 약도 빈 곳을 눌렀을 때 가까운 역으로 붙는 거리(판 위 단위)
    tickerSpeed: 55,   // 맨 아래 흐르는 줄의 빠르기(초당 화소)
    river: "M 1010,262 C 880,280 770,296 696,304 S 580,396 470,400 S 300,396 228,386 S 120,272 -10,186",
    tags: {
      gate: { ko: "세계평화의 문", en: "World Peace Gate", zh: "世界和平之门", ja: "世界平和の門", art: [" ____ ", "/_||_\\"] },
      tower: { ko: "롯데월드타워", en: "Lotte World Tower", zh: "乐天世界塔", ja: "ロッテワールドタワー", art: [" /\\", " ||", "/||\\"] },
      stadium: { ko: "잠실야구장", en: "Jamsil Baseball Stadium", zh: "蚕室棒球场", ja: "蚕室野球場", art: ["(==)"] },
      coex: { ko: "코엑스", en: "COEX", zh: "COEX", ja: "COEX", art: ["[::]"] },
      air: { same: true, ko: "김포공항", en: "Gimpo Airport", zh: "金浦机场", ja: "金浦空港", art: ["--+--", "  |"] },
      ddp: { ko: "DDP", en: "DDP", zh: "DDP", ja: "DDP", art: ["(~~)"] },
      palace: { ko: "경복궁", en: "Gyeongbokgung Palace", zh: "景福宫", ja: "景福宮", art: ["/^^^\\", "|_|_|"] }
    },
    riverName: { ko: "한강", en: "HAN RIVER", zh: "汉江", ja: "漢江" }
  },
  // 정차 순서 그림: 각 줄은 한 역에서 한 방향으로 본 정차 순서의 일부
  orders: [
    { st: "2556", toward: "방화", from: "방이", to: "강동", mark: "방이" },
    { st: "4136", toward: "개화", from: "둔촌오륜", to: "석촌", mark: null },
    { st: "2814", toward: "잠실", from: "몽촌토성", to: "석촌", mark: "몽촌토성" }
  ],
  locale: { ko: "ko-KR", en: "en-US", zh: "zh-CN", ja: "ja-JP" },
  langName: { ko: "한국어", en: "EN", zh: "中文", ja: "日本語" },
  t: {
    ko: {
      title: "동선 카드 — 공연 끝나고 집에 가는 길", brand: "동선 카드", tag: "공연 끝나고 집에 가는 길 · 올림픽공원",
      sec: ["공연", "어디로", "타는 곳", "마지막 열차", "이 역을 선택한 이유", "자료"],
      ask: "공연 끝.<br>어디로 가세요?", askHint: "약도에서 가는 곳을 누르면 타는 역을 바로 골라 드려요.", toAsk: "어디까지 가세요?",
      hrs: function (a, b) { return a + "~" + b + "시"; },
      station: function (n) { return n + "역"; }, bound: function (n) { return n + "행"; }, line: function (n) { return n + "호선"; },
      toward: function (n) { return n + " 방면"; }, exit: function (no) { return no + "번 출구"; },
      exitSrc: { venue: "주최 공연장 안내", park: "주최 「오시는 길」", map: "지도 경로 계산 기준 가장 가까운 출구" }, exitMapTag: "지도 기준",
      noticeTag: "주최 공지 기준", noticeWhy: "주최 공연 목록에는 아직 없고, 올림픽수영장의 주차혼잡안내 공지에 적힌 회차예요.", parking: "차로 왔다면 — 주최 실시간 주차 화면 보기",
      hostPage: "주최 공연장 안내", d3: "공연장 3D로 보기", map: "지도에서 보기", startAt: function (t) { return t + " 시작"; },
      tStart: "시작", tEnd: "끝", tEndEst: "끝(예상)", tLast: "마지막 열차", tIn: "오는 길 붐빔", est: "예상",
      arrFork: function (x) { return "올 때 " + x.line + "은 " + x.N("마천") + "행만 " + x.St("올림픽공원") + "에 서요. 하남검단산·상일동행을 탔다면 " + x.St("강동") + "에서 " + x.N("마천") + "행으로 갈아타요."; },
      more: { end: "끝나는 시각은 어떻게 알아요?", arrive: "올 때는 언제 붐벼요?", why: "왜 이 역이에요?", conn: "갈아타는 시간도 넣었나요?", how: "숫자는 이렇게 셌어요", src: "자료 출처 보기" },
      dur: {
        rental: function (m) { return "공연 길이는 " + m + "분이에요. 주최 대관정보에 적힌 값이에요."; },
        screen: function (m, d) { return "공연 길이는 " + m + "분이에요. 주최 주차 안내 화면에 적힌 값이에요(" + d + " 확인)."; },
        assumed: function (m, n) { return "끝나는 시각은 예상이에요. 주최 대관정보에 공연 길이가 적힌 " + n + "건의 가운데 값 " + m + "분으로 잡았어요."; },
        org: function (m) { return "공연 길이는 " + m + "분이에요. 기획사가 알려 준 끝나는 시각이에요."; }
      },
      // b = { hour: 시작 시, days: 그 시작 시 공연 날 수, parts: [{ before: 몇 시간 전, hour: 시계 시, ratio }] } — 숫자는 모두 facts.alightByStart 에서
      arrive: function (b) { return "KSPO DOME 공연이 " + b.hour + "시대에 시작한 날 " + b.days + "일을 보면, {S:올림픽공원}에 내린 사람이 " + b.parts.map(function (p) { return "시작 " + p.before + "시간 전 " + p.hour + "시대에 평소의 " + p.ratio + "배"; }).join(", ") + "였어요. 평소는 같은 요일 모든 날의 그 시간 가운데 값이에요. 팬 행사처럼 따로 모이는 일정은 기획사 공지를 먼저 보세요."; },
      arrFew: "오는 길 붐빔은 KSPO DOME 저녁 공연 날의 기록으로 그려요. 이 회차는 견줄 기록이 적어 그리지 않았어요.",
      arrFlat: "이 공연이 시작하기 전 시간대에는 평소보다 크게 붐빈 기록이 없어 오는 길 붐빔을 그리지 않았어요.",
      why: {
        jamsil: function (x) { return "{S:올림픽공원}을 지나지 않는 " + x.line + " 역이에요. " + x.St("잠실") + "까지 " + x.n + "정거장이에요."; },
        jamsilAlt: function (x) { return x.line9 + "으로 " + x.St("석촌") + "까지 " + x.n + "정거장 가서 " + x.line8 + "으로 갈아타요. " + x.St("잠실") + "까지 " + x.k + "정거장이에요."; },
        city5: function (x) { return x.St("올림픽공원") + "보다 " + x.n + "정거장 빨리 서는 역이에요. 열차가 " + x.St("올림픽공원") + "에 닿기 전에 타요."; },
        macheon5: function (x) { return "주최가 안내하는 역이에요. " + x.N("마천") + " 방면 열차는 여기서 타요."; },
        gangnam9: function (x) { return "9호선은 여기서 타요. 다음 역인 " + x.St("한성백제") + "까지 걸어가도 같은 열차를 한 정거장 뒤에서 타게 돼요."; }
      },
      note: {
        night: function (x) { return "{S:올림픽공원} 승차가 평소의 2배 이상이던 밤 " + x.hits + "일 평균으로 이 역은 평소와 거의 같았어요(평소의 " + x.m + "배)."; },
        nightBusy: function (x) { return "{S:올림픽공원} 승차가 평소의 2배 이상이던 밤 " + x.hits + "일 평균으로 이 역은 평소의 " + x.m + "배가 탔어요. 많이 붐비는 역이에요."; },
        near: function (x) { return "공연장 안내에 적힌 역은 " + x.St("올림픽공원") + "이에요. 같은 열차가 " + x.d + "분 뒤 그 역에 서요(" + x.t + ")."; },
        line9: function (x) { return x.date + " 22시대에 9호선을 탄 사람은 " + x.St("올림픽공원") + " " + x.a + "명, " + x.St("한성백제") + " " + x.b + "명이었어요."; },
        foot: "※ {HRS}에 탄 사람 수를 같은 요일 평소와 견준 값"
      },
      cond: "주최 안내: 「22시 이후에는 공원 안쪽으로의 출입을 금합니다」. 이 역은 공원을 지나서 가요.",
      condAssumed: function (end) { return "끝나는 시각(" + end + ")은 예상이에요. 22시가 가까우면 {S:올림픽공원}에서 타세요."; },
      condHot: function (x) { return "이 공연은 " + x.end + "에 끝나요" + (x.assumed ? "(예상)" : "") + ". 22시 뒤엔 공원 안쪽으로 못 들어가서(주최 안내) " + x.St("몽촌토성") + " 대신 이 길을 보여 드려요."; },
      bigLabel: function (to) { return to + "까지 가는 마지막 열차"; },
      from: function (term, st) { return st + "에서 타는 " + term; },
      next: "다음 날", nextNote: "+1은 자정을 넘긴 다음 날 새벽이에요.",
      daytype: { DAY: "평일 시각표", SAT: "토요일 시각표", END: "일요일·공휴일 시각표" },
      basis: function (d) { return "시각표 기준일 " + d; },
      ladderHead: "행선지별 마지막 열차", cut: function (to) { return "여기부터는 " + to + "까지 안 가요"; }, tap: "숫자를 눌러 보세요",
      connect: function (x) { return "→ " + x.st + "에서 " + x.time + " " + x.term + " 열차로 갈아타요 (" + x.toward + ")"; },
      minSec: function (st, m, s) { return st + " " + m + "분 " + s + "초"; },
      connNote: function (parts) { return "네, 서울교통공사가 공개한 환승 시간(" + parts.join(", ") + ")을 넣어서 골랐어요. 사람이 많으면 더 걸려요."; },
      copy: "카드 복사", ics: "달력에 넣기 (.ics)", copied: "복사했어요", others: function (n) { return "다른 공연 " + n; },
      opsLink: "운영 점검표", orgHead: "기획사가 알려 준 것", orgLabel: { booth: "외국인 확인 부스", goods: "굿즈 대기 구역", exitWay: "퇴장 방식", shuttle: "셔틀" },
      ro: { end: "공연 끝", endEst: "공연 끝(예상)", last: "마지막 열차", pick: "가는 곳을 눌러 보세요" },
      mapNote: "약도예요 — 방향과 순서만 맞췄어요", here: "지금 여기", walk: "걸어서", boardHere: "여기서 타요",
      noTrain: function (to) { return "오늘 시각표엔 " + to + "까지 가는 열차가 없어요"; },
      themeDark: "어둡게 보기", themeLight: "밝게 보기", peek: function (to, board) { return to + "까지 · " + board + "에서 타요"; },
      toAscii: "글자로 보기", toPhoto: "사진으로 보기", photoCrop: "사진 일부를 잘라 썼어요", photoAscii: "사진을 글자로 다시 그렸어요", usualWord: "평소", cmpUsual: "평소 수준",
      cmpTimes: function (v) { return "평소의 " + v + "배"; }, cmpNote: "그 밤 {HRS}에 탄 사람을 같은 요일의 모든 날 평균과 견준 값이에요.",
      cmpHead: function (n) { return "승차가 몰린 밤 " + n + "일 전체로 보면"; }, cmpDiff: "위 문장과는 견준 날과 시간대가 달라 숫자가 다르게 나와요.",
      alt: function (x) { return "다른 길: " + x.line + " " + x.st + " · " + x.time; },
      // 두 칸(주최가 안내하는 역 · 공연 밤에 덜 붐볐던 역). 숫자는 모두 app.js 가 자료에서 넣는다.
      col: {
        hostHead: "주최가 안내하는 역", lessHead: "공연 밤에 덜 붐볐던 역", on: "지금 보는 길", pick: "이 역으로 보기",
        walk: function (min, m) { return "걸어서 " + min + "분 · " + m + "m"; },
        more: function (n) { return n + "분 더 걸어요"; }, same: "걷는 시간은 비슷해요",
        ratioFri: function (r, n, h) { return "공연 밤 승차: 행사 없는 금요일의 " + r + "배" + (n ? " · " + h + "시간 동안 " + n + "명" : ""); },
        ratioEnd: function (r, off) { return "공연 밤 승차: 평소의 " + r + "배(시작 " + off + "시간 뒤 한 시간)"; },
        leaveLabel: "늦어도 나설 시각",
        leaveFor: function (to) { return to + "까지 가려면 늦어도 공연장을 나설 시각"; },
        formula: function (w, b) { return "마지막 열차 − 걷는 " + w + "분 − 여유 " + b + "분"; },
        lastLine: function (time, from) { return "마지막 열차 " + time + " · " + from; },
        roomy: function (m, end, est) { return "여유 있어요 — " + end + (est ? "에 끝나도 " : "에 끝난 뒤 ") + m + "분 남아요"; },
        tight: function (m, end, est) { return end + (est ? "에 끝나면 " : "에 끝난 뒤 ") + m + "분 안에 나서야 해요"; },
        over: function (end, est) { return end + (est ? "에 끝나면" : "에 끝나서") + " 마지막 열차에 늦어요. 끝나기 전에 나서야 해요"; },
        endAt: function (t) { return "끝나는 때 " + t; },
        endRange: function (h0, h1, a, b) { return "끝나는 때 예상 — 시작 " + h0 + "~" + h1 + "시간 뒤(" + a + "~" + b + ")"; },
        dayFold: "이 시간에는 큰 공연의 귀갓길과 겹치지 않아요. 주최가 안내하는 역만 보여 드려요.",
        parkShut: function (x) { return x.until.slice(0, 2) + "시 이후에는 공원 안쪽 길이 닫혀요. 돌아가면 걸어서 " + x.min + "분이에요. 그래서 " + x.st + " 칸은 접었어요."; },
        parkShutNoWay: function (x) { return x.until.slice(0, 2) + "시 이후에는 공원 안쪽 길이 닫혀요. 이 공연장에서는 공원 안쪽을 지나지 않고 가는 길이 없어 " + x.st + " 칸은 접었어요."; },
        parkIf: function (x) { return "공원을 돌아가는 길로 셈했어요. " + x.until.slice(0, 2) + "시 전에 공원을 벗어날 수 있으면 공원 안쪽 길로 걸어서 " + x.short + "분이에요."; },
        whyHost: "주최가 안내하는 역이에요. 공연장에서 가까워요.",
        factFri: function (x) { return (x.kind === "dome" ? "KSPO DOME 저녁 공연이 있던" : "다른 공연장에만 저녁 공연이 있던") + " 금요일 밤 " + x.days + "일, " + x.parts.map(function (q, i) { return q.st + "에는 " + (i ? "" : "행사 없는 금요일의 ") + q.r + "배" + (q.n ? "(" + q.h + "시간 동안 " + q.n + "명)" : "") + "가 탔"; }).join("고 ") + "어요."; },
        factEnd: function (x) { return "KSPO DOME 저녁 공연이 있던 " + (x.grp === "sat" ? "토요일" : "일요일") + " " + x.days + "일, 시작 " + x.off + "시간 뒤 한 시간에 " + x.parts.map(function (q, i) { return q.st + "은 " + (i ? "" : "평소의 ") + q.r + "배"; }).join(", ") + "가 탔어요. 주말은 공연 없는 날이 거의 없어 평소(공연 있는 날 포함)와 견준 값이에요."; },
        card: function (time, f) { return "늦어도 나설 시각: " + time + " (" + f + ")"; }
      },
      nights: function (n) { return n + "일"; },
      stat1: function (days) { return "{S:올림픽공원}(5호선)이 평소보다 {MIN}배 넘게 붐빈 밤 — 2년 " + days + "일 가운데"; },
      statN: function (st) { return "그 밤의 " + st + " · 평균"; },
      times: function (v) { return v + "배"; },
      how: function (x) { return "{HRS}에 탄 사람 수를 같은 요일 평소와 견줬어요. 위 숫자는 그 " + x.hits + "일의 평균이에요. 가운데 값으로 보면 " + x.med.map(function (m) { return m.st + " " + m.v + "배"; }).join(", ") + "예요. " + (x.lower === x.hits ? x.hits + "일 모두" : x.hits + "일 가운데 " + x.lower + "일은") + " 근처 두 역이 {S:올림픽공원}보다 평소 대비 덜 늘었어요."; },
      capMatrix: function (x) { return "한 칸이 하루예요(" + x.from + " ~ " + x.to + ", 위에서 아래로 월~일). 주황 칸이 그 " + x.hits + "일이에요."; },
      capSpikes: function (x) { return "그 " + x.hits + "일을 날짜순으로 세웠어요. 막대가 {S:올림픽공원}, 점이 옆 역이에요."; },
      usual: "평소 = 1", tableToggle: "표로 보기", th: ["날짜", "{S:올림픽공원} 승차"],
      orderTitle: "열차가 서는 순서", orderHere: "공연장 안내에 적힌 역", orderBoard: "이 카드가 권하는 역",
      photoCap: "공연 날 KSPO DOME 안",
      src: function (x) { return [
        "공연 회차: 주최 올림픽공원 공연정보(" + x.seen + " 확인) · 공연 길이: 대관정보(공공데이터포털 15015212), 주최 주차 안내 화면",
        "역별 승차: 서울교통공사 역별 일별 시간대별 승하차인원 2024·2025(서울 열린데이터광장 OA-12921), 9호선 2·3단계(OA-22441)",
        "열차 시각·정차 순서: 서울교통공사 서울 도시철도 열차운행시각표(15098251, 기준일 " + x.basis + ") · 갈아타는 시간: 환승역거리 소요시간 정보(15044419)",
        "역 이름 표기: 서울교통공사 역명다국어표기(15044232)",
        "출구·공원 이용 시간: 주최 공연장 안내·「오시는 길」·공원 이용 안내(" + x.seen + " 확인)",
        "열차 시각은 바뀔 수 있어요. 타기 전에 역 안내를 확인하세요."
      ]; },
      cal: { sum: function (x) { return "마지막 열차 " + x.time + " " + x.term + " · " + x.st; }, alarm: function (x) { return "늦어도 " + x.leave + "에 나서세요 · " + x.st + " " + x.time + " " + x.term; } },
      card: function (x) { return ["[동선 카드] " + x.title, x.date + " · " + x.venue + " · " + x.start, "가는 곳: " + x.dest + " → " + x.to, "타는 곳: " + x.line + " " + x.st, "마지막 열차(" + x.daytype + "): " + x.time + " " + x.term, x.url]; }
    },
    en: {
      title: "Route Card — your way home after the show", brand: "Route Card", tag: "Your way home after the show · Olympic Park",
      sec: ["Show", "Where to", "Board at", "Last train", "Why this station", "Sources"],
      ask: "Show's over.<br>Where to?", askHint: "Or tap the map — we'll pick the station for you.", toAsk: "How far are you going?",
      hrs: function (a, b) { return a + ":00–" + b + ":00"; },
      station: function (n) { return n + " Station"; }, bound: function (n) { return "to " + n; }, line: function (n) { return "Line " + n; },
      toward: function (n) { return "toward " + n; }, exit: function (no) { return "Exit " + no; },
      exitSrc: { venue: "host venue guide", park: "host “Getting here” page", map: "nearest exit by map route calculation" }, exitMapTag: "by map",
      noticeTag: "From a host notice", noticeWhy: "Not on the host's show list yet — this date comes from the Olympic Swimming Pool's parking congestion notice.", parking: "Came by car? See the host's live parking screen",
      hostPage: "Host venue guide", d3: "See the venue in 3D", map: "Open in map", startAt: function (t) { return "starts " + t; },
      tStart: "Start", tEnd: "End", tEndEst: "End (est.)", tLast: "Last train", tIn: "Busy on the way in", est: "est.",
      arrFork: function (x) { return "Coming by " + x.line + ": only trains bound for " + x.N("마천") + " stop at " + x.St("올림픽공원") + ". If you are on a Hanam Geomdansan or Sangil-dong train, change at " + x.St("강동") + " to a " + x.N("마천") + " train."; },
      more: { end: "How do you know when it ends?", arrive: "When does arrival get busy?", why: "Why this station?", conn: "Is transfer time included?", how: "How we counted", src: "See the sources" },
      dur: {
        rental: function (m) { return "The show runs " + m + " min — as listed in the host's rental data."; },
        screen: function (m, d) { return "The show runs " + m + " min — as listed on the host's parking guide screen (checked " + d + ")."; },
        assumed: function (m, n) { return "The end time is an estimate: " + m + " min, the middle value of " + n + " shows with a listed running time in the host's rental data."; },
        org: function (m) { return "The show runs " + m + " min — the end time comes from the promoter."; }
      },
      arrive: function (b) { return "On " + b.days + " days when a KSPO DOME show started in the " + b.hour + ":00 hour, people getting off at {S:올림픽공원} were " + b.parts.map(function (p) { return p.ratio + "× the usual " + p.before + " h before the start (the " + p.hour + ":00 hour)"; }).join(", ") + ". \"Usual\" is the median for that hour on all days of the same weekday. For fan events and other separate gatherings, check the promoter's notice first."; },
      arrFew: "The busy-on-the-way-in band comes from records of KSPO DOME evening-show days. There are too few to compare for this show, so it isn't drawn.",
      arrFlat: "Records show no clear rush in the hours before this show starts, so the busy-on-the-way-in band isn't drawn.",
      why: {
        jamsil: function (x) { return "A " + x.line + " station, on a line that doesn't run through {S:올림픽공원}. " + x.St("잠실") + " is " + x.n + (x.n > 1 ? " stops" : " stop") + " away."; },
        jamsilAlt: function (x) { return "Ride " + x.line9 + " " + x.n + (x.n > 1 ? " stops" : " stop") + " to " + x.St("석촌") + ", then change to " + x.line8 + ". " + x.St("잠실") + " is " + x.k + (x.k > 1 ? " stops" : " stop") + " from there."; },
        city5: function (x) { return "Trains stop here " + x.n + (x.n > 1 ? " stops" : " stop") + " before " + x.St("올림픽공원") + ", so you board before the train reaches " + x.St("올림픽공원") + "."; },
        macheon5: function (x) { return "This is the station the host points to. Trains toward " + x.N("마천") + " leave from here."; },
        gangnam9: function (x) { return "Line 9 boards here. If you walk to " + x.St("한성백제") + ", the next stop, you get on the same train one stop later."; }
      },
      note: {
        night: function (x) { return "Averaged over the " + x.hits + " nights when {S:올림픽공원} carried at least twice its usual riders, this station stayed close to a normal night (" + x.m + "× its usual riders)."; },
        nightBusy: function (x) { return "Averaged over the " + x.hits + " nights when {S:올림픽공원} carried at least twice its usual riders, this station carried " + x.m + "× its usual riders. It gets very busy."; },
        near: function (x) { return "The station in the venue guide is " + x.St("올림픽공원") + ". The same train stops there " + x.d + " min later (" + x.t + ")."; },
        line9: function (x) { return "On " + x.date + ", in the 22:00 hour, Line 9 boardings were " + x.a + " at " + x.St("올림픽공원") + " and " + x.b + " at " + x.St("한성백제") + "."; },
        foot: "※ Riders boarding {HRS}, compared with the usual for that weekday"
      },
      cond: "Host notice: no entry to the inner park after 22:00. The way to this station crosses the park.",
      condAssumed: function (end) { return "The end time (" + end + ") is an estimate. If it runs close to 22:00, board at {S:올림픽공원} instead."; },
      condHot: function (x) { return "This show ends at " + x.end + (x.assumed ? " (est.)" : "") + ". The inner park is closed to entry after 22:00 (host notice), so this route replaces " + x.St("몽촌토성") + "."; },
      bigLabel: function (to) { return "Last train that reaches " + to; },
      from: function (term, st) { return term + " · board at " + st; },
      next: "next day", nextNote: "+1 means after midnight, the next day.",
      daytype: { DAY: "Weekday timetable", SAT: "Saturday timetable", END: "Sunday & holiday timetable" },
      basis: function (d) { return "Timetable as of " + d; },
      ladderHead: "Last train by terminal", cut: function (to) { return "From here on, trains don't reach " + to; }, tap: "Tap the number",
      connect: function (x) { return "→ change at " + x.st + " to the " + x.time + " train " + x.term + " (" + x.toward + ")"; },
      minSec: function (st, m, s) { return st + " " + m + " min " + s + " s"; },
      connNote: function (parts) { return "Yes — we used Seoul Metro's published transfer times (" + parts.join(", ") + "). It takes longer when the station is busy."; },
      copy: "Copy card", ics: "Add to calendar (.ics)", copied: "Copied", others: function (n) { return "Other shows · " + n; },
      opsLink: "Operator checklist", orgHead: "From the promoter", orgLabel: { booth: "ID check booth for overseas visitors", goods: "Merchandise queue", exitWay: "Exit procedure", shuttle: "Shuttle" },
      ro: { end: "Show ends", endEst: "Show ends (est.)", last: "Last train", pick: "Tap where you're going" },
      mapNote: "A sketch map — directions and order only", here: "You are here", walk: "on foot", boardHere: "Board here",
      noTrain: function (to) { return "No train reaches " + to + " in tonight's timetable"; },
      themeDark: "Dark mode", themeLight: "Light mode", peek: function (to, board) { return "to " + to + " · board at " + board; },
      toAscii: "View as text art", toPhoto: "View photo", photoCrop: "cropped from the original photo", photoAscii: "the photo redrawn in letters", usualWord: "usual", cmpUsual: "about usual",
      cmpTimes: function (v) { return v + "× the usual"; }, cmpNote: "Riders boarding {HRS} on those nights, compared with the average of every same weekday.",
      cmpHead: function (n) { return "Across all " + n + " nights when boardings spiked"; }, cmpDiff: "The sentence above compares different days and hours, so the figures differ.",
      alt: function (x) { return "Another way: " + x.line + " " + x.st + " · " + x.time; },
      col: {
        hostHead: "Station the organizer recommends", lessHead: "Less busy on show nights", on: "Showing this route", pick: "Show this station",
        walk: function (min, m) { return min + " min walk · " + m + " m"; },
        more: function (n) { return n + " min more walking"; }, same: "About the same walk",
        ratioFri: function (r, n, h) { return "Show-night boardings: " + r + "× a Friday with no event" + (n ? " · " + n + " people in " + h + " h" : ""); },
        ratioEnd: function (r, off) { return "Show-night boardings: " + r + "× usual (the hour from " + off + " h after the start)"; },
        leaveLabel: "Leave the venue by",
        leaveFor: function (to) { return "To reach " + to + ", leave the venue by"; },
        formula: function (w, b) { return "last train − " + w + " min walk − " + b + " min spare"; },
        lastLine: function (time, from) { return "Last train " + time + " · " + from; },
        roomy: function (m, end, est) { return "Plenty of time — " + m + " min to spare " + (est ? "even if it ends at " : "after it ends at ") + end; },
        tight: function (m, end, est) { return (est ? "If it ends at " + end + ", leave within " + m + " min" : "Leave within " + m + " min of the " + end + " end"); },
        over: function (end, est) { return (est ? "If it ends at " + end + ", you" : "It ends at " + end + " — you") + " would miss the last train. Leave before the end"; },
        endAt: function (t) { return "Ends " + t; },
        endRange: function (h0, h1, a, b) { return "Estimated end — " + h0 + "–" + h1 + " h after the start (" + a + "–" + b + ")"; },
        dayFold: "At this hour you won't meet the crowd heading home from the big arena show, so only the organizer's station is shown.",
        parkShut: function (x) { return "After " + x.until + " the paths inside the park close. Going around is a " + x.min + "-min walk, so the " + x.st + " option is folded."; },
        parkShutNoWay: function (x) { return "After " + x.until + " the paths inside the park close. From this venue there is no way that avoids the inner park, so the " + x.st + " option is folded."; },
        parkIf: function (x) { return "Counted on the way around the park. If you can be out of the park before " + x.until + ", the path through the park is a " + x.short + "-min walk."; },
        whyHost: "This is the station the organizer recommends, close to the venue.",
        factFri: function (x) { return "On " + x.days + " Friday nights with " + (x.kind === "dome" ? "an evening show at KSPO DOME" : "evening shows only at other venues") + ", " + x.parts.map(function (q, i) { return (i ? q.st + " " + q.r + "×" : "boardings at " + q.st + " were " + q.r + "× those of a Friday with no event") + (q.n ? " (" + q.n + " people in " + q.h + " h)" : ""); }).join(", and at ") + "."; },
        factEnd: function (x) { return "On " + x.days + " " + (x.grp === "sat" ? "Saturdays" : "Sundays") + " with an evening show at KSPO DOME, in the hour starting " + x.off + " h after the show began, " + x.parts.map(function (q, i) { return i ? q.st + " " + q.r + "×" : "boardings at " + q.st + " were " + q.r + "× usual"; }).join(", and at ") + ". Weekends almost always have some event, so “usual” here includes event days."; },
        card: function (time, f) { return "Leave the venue by: " + time + " (" + f + ")"; }
      },
      nights: function (n) { return n + " nights"; },
      stat1: function (days) { return "nights when {S:올림픽공원} (Line 5) carried over {MIN}× its usual riders — out of " + days + " days in two years"; },
      statN: function (st) { return st + " on those nights · average"; },
      times: function (v) { return v + "×"; },
      how: function (x) { return "We compared riders boarding {HRS} with the usual for the same weekday. The figures above are averages across those " + x.hits + " nights. By the middle value: " + x.med.map(function (m) { return m.st + " " + m.v + "×"; }).join(", ") + ". On " + (x.lower === x.hits ? "all " + x.hits : x.lower + " of the " + x.hits) + " nights, both nearby stations rose less against their usual than {S:올림픽공원}."; },
      capMatrix: function (x) { return "One cell is one day (" + x.from + " – " + x.to + ", Monday to Sunday from top). Orange cells are those " + x.hits + " nights."; },
      capSpikes: function (x) { return "Those " + x.hits + " nights in date order. Bars are {S:올림픽공원}; dots are the next stations."; },
      usual: "usual = 1", tableToggle: "View as table", th: ["Date", "{S:올림픽공원} boardings"],
      orderTitle: "The order trains stop in", orderHere: "station in the venue guide", orderBoard: "station this card suggests",
      photoCap: "Inside KSPO DOME on a show day",
      src: function (x) { return [
        "Shows: host Olympic Park performance list (checked " + x.seen + ") · Running time: host rental data (data.go.kr 15015212), host parking guide screen",
        "Boardings by station: Seoul Metro daily hourly ridership 2024–2025 (Seoul Open Data OA-12921), Line 9 phase 2·3 (OA-22441)",
        "Train times and stopping order: Seoul Metro timetable (data.go.kr 15098251, as of " + x.basis + ") · Transfer time: Seoul Metro transfer distance and time (15044419)",
        "Station names: Seoul Metro multilingual station names (data.go.kr 15044232)",
        "Exits and park hours: host venue guide, “Getting here” and park-use pages (checked " + x.seen + ")",
        "Train times can change. Check the notices at the station before you board."
      ]; },
      cal: { sum: function (x) { return "Last train " + x.time + " " + x.term + " · " + x.st; }, alarm: function (x) { return "Leave by " + x.leave + " · " + x.st + " " + x.time + " " + x.term; } },
      card: function (x) { return ["[Route Card] " + x.title, x.date + " · " + x.venue + " · " + x.start, "Going to: " + x.dest + " → " + x.to, "Board at: " + x.line + " " + x.st, "Last train (" + x.daytype + "): " + x.time + " " + x.term, x.url]; }
    },
    zh: {
      title: "动线卡 — 演出结束后的回家路", brand: "动线卡", tag: "演出结束后的回家路 · 奥林匹克公园",
      sec: ["演出", "去哪儿", "乘车站", "末班车", "为什么选这一站", "数据来源"],
      ask: "散场了。<br>去哪儿?", askHint: "也可以直接点示意图,我们马上帮您选好乘车站。", toAsk: "坐到哪一站?",
      hrs: function (a, b) { return a + "~" + b + "点"; },
      station: function (n) { return n + "站"; }, bound: function (n) { return "开往" + n; }, line: function (n) { return n + "号线"; },
      toward: function (n) { return n + "方向"; }, exit: function (no) { return no + "号出口"; },
      exitSrc: { venue: "主办方场馆指南", park: "主办方“交通指南”页面", map: "按地图路线计算的最近出口" }, exitMapTag: "地图推算",
      noticeTag: "依据主办方公告", noticeWhy: "主办方演出列表中暂未收录，此场次来自奥林匹克游泳馆的停车拥堵提示公告。", parking: "开车来的话 — 查看主办方实时停车画面",
      hostPage: "主办方场馆指南", d3: "3D看场馆", map: "在地图中查看", startAt: function (t) { return t + " 开演"; },
      tStart: "开演", tEnd: "结束", tEndEst: "结束(预计)", tLast: "末班车", tIn: "来时人多", est: "预计",
      arrFork: function (x) { return "乘" + x.line + "前来时,只有开往" + x.N("마천") + "的列车停靠" + x.St("올림픽공원") + "。如果乘上了开往河南黔丹山或上一洞的列车,请在" + x.St("강동") + "换乘开往" + x.N("마천") + "的列车。"; },
      more: { end: "怎么知道几点结束?", arrive: "来的时候几点人多?", why: "为什么是这一站?", conn: "算上换乘时间了吗?", how: "数字是这样算的", src: "查看数据来源" },
      dur: {
        rental: function (m) { return "演出时长" + m + "分钟,来自主办方的场地租用数据。"; },
        screen: function (m, d) { return "演出时长" + m + "分钟,来自主办方停车指南页面(" + d + "确认)。"; },
        assumed: function (m, n) { return "结束时间是预计值:主办方场地租用数据中写明时长的" + n + "场演出的中间值" + m + "分钟。"; },
        org: function (m) { return "演出时长" + m + "分钟,结束时间由主办公司提供。"; }
      },
      arrive: function (b) { return "看KSPO DOME演出在" + b.hour + "点时段开演的" + b.days + "天,在{S:올림픽공원}下车的人:" + b.parts.map(function (p) { return "开演前" + p.before + "小时(" + p.hour + "点时段)是平日的" + p.ratio + "倍"; }).join(",") + "。平日指同一星期几所有日子该时段的中位数。粉丝活动等另行集合的日程,请先看主办公司的公告。"; },
      arrFew: "来时人多的时段依据KSPO DOME晚间演出日的记录绘制。这一场可比较的记录太少,所以没有画。",
      arrFlat: "记录显示这场演出开始前的时段没有明显人多,所以没有画来时人多的时段。",
      why: {
        jamsil: function (x) { return "这是" + x.line + "的车站,这条线不经过{S:올림픽공원}。到" + x.St("잠실") + "只有" + x.n + "站。"; },
        jamsilAlt: function (x) { return "乘" + x.line9 + "坐" + x.n + "站到" + x.St("석촌") + ",再换乘" + x.line8 + "。到" + x.St("잠실") + "只有" + x.k + "站。"; },
        city5: function (x) { return "列车比" + x.St("올림픽공원") + "早" + x.n + "站停靠这里,您在列车到达" + x.St("올림픽공원") + "之前上车。"; },
        macheon5: function (x) { return "这是主办方指引的车站。" + x.N("마천") + "方向的列车在这里乘车。"; },
        gangnam9: function (x) { return "9号线在这里乘车。即使走到下一站" + x.St("한성백제") + ",乘的也是同一班列车,只是晚一站上车。"; }
      },
      note: {
        night: function (x) { return "在{S:올림픽공원}乘车人数达到平日2倍以上的" + x.hits + "个夜晚,平均来看这一站和平时差不多(平日的" + x.m + "倍)。"; },
        nightBusy: function (x) { return "在{S:올림픽공원}乘车人数达到平日2倍以上的" + x.hits + "个夜晚,平均来看这一站的乘车人数是平日的" + x.m + "倍,非常拥挤。"; },
        near: function (x) { return "场馆指南标注的车站是" + x.St("올림픽공원") + "。同一班列车" + x.d + "分钟后到该站(" + x.t + ")。"; },
        line9: function (x) { return x.date + " 22点时段乘9号线的人数:" + x.St("올림픽공원") + x.a + "人," + x.St("한성백제") + x.b + "人。"; },
        foot: "※ {HRS}的乘车人数与同一星期几平日相比的数值"
      },
      cond: "主办方公告:“22点以后禁止进入公园内侧”。去这一站要穿过公园。",
      condAssumed: function (end) { return "结束时间(" + end + ")是预计值。若接近22点,请改在{S:올림픽공원}乘车。"; },
      condHot: function (x) { return "本场" + x.end + "结束" + (x.assumed ? "(预计)" : "") + "。22点以后不能进入公园内侧(主办方公告),所以用这条路线代替" + x.St("몽촌토성") + "。"; },
      bigLabel: function (to) { return "能到" + to + "的末班车"; },
      from: function (term, st) { return term + " · 在" + st + "乘车"; },
      next: "次日", nextNote: "+1 表示过了午夜的次日凌晨。",
      daytype: { DAY: "工作日时刻表", SAT: "周六时刻表", END: "周日及节假日时刻表" },
      basis: function (d) { return "时刻表基准日 " + d; },
      ladderHead: "各终点站的末班车", cut: function (to) { return "从这里开始的列车不到" + to; }, tap: "点一下数字",
      connect: function (x) { return "→ 在" + x.st + "换乘 " + x.time + " " + x.term + "的列车(" + x.toward + ")"; },
      minSec: function (st, m, s) { return st + m + "分" + s + "秒"; },
      connNote: function (parts) { return "算上了。采用首尔交通公社公布的换乘时间(" + parts.join("、") + ")来挑选列车。人多时需要更久。"; },
      copy: "复制卡片", ics: "加入日历 (.ics)", copied: "已复制", others: function (n) { return "其他场次 · " + n; },
      opsLink: "运营检查表", orgHead: "主办公司提供的信息", orgLabel: { booth: "海外观众身份确认处", goods: "周边排队区", exitWay: "退场方式", shuttle: "接驳车" },
      ro: { end: "演出结束", endEst: "演出结束(预计)", last: "末班车", pick: "点一下要去的地方" },
      mapNote: "示意图 — 只保证方向和顺序", here: "您在这里", walk: "步行", boardHere: "在这里上车",
      noTrain: function (to) { return "今晚的时刻表里没有到" + to + "的列车"; },
      themeDark: "深色模式", themeLight: "浅色模式", peek: function (to, board) { return "到" + to + " · 在" + board + "上车"; },
      toAscii: "看文字画", toPhoto: "看照片", photoCrop: "照片经过裁剪", photoAscii: "用文字重新画的照片", usualWord: "平日", cmpUsual: "与平日相当",
      cmpTimes: function (v) { return "平日的" + v + "倍"; }, cmpNote: "这些夜晚{HRS}的乘车人数,与同一星期几所有日子的平均相比。",
      cmpHead: function (n) { return "从乘车人数激增的全部" + n + "个夜晚来看"; }, cmpDiff: "上面一句比较的日子和时段不同,所以数字不一样。",
      alt: function (x) { return "另一条路:" + x.line + " " + x.st + " · " + x.time; },
      col: {
        hostHead: "主办方推荐的车站", lessHead: "演出夜较不拥挤的车站", on: "当前显示的路线", pick: "查看此站",
        walk: function (min, m) { return "步行" + min + "分钟 · " + m + "米"; },
        more: function (n) { return "多走" + n + "分钟"; }, same: "步行时间差不多",
        ratioFri: function (r, n, h) { return "演出夜上车人数:无活动周五的" + r + "倍" + (n ? " · " + h + "小时内" + n + "人" : ""); },
        ratioEnd: function (r, off) { return "演出夜上车人数:平时的" + r + "倍(开始" + off + "小时后的一小时)"; },
        leaveLabel: "最晚离场时间",
        leaveFor: function (to) { return "前往" + to + "的最晚离场时间"; },
        formula: function (w, b) { return "末班车 − 步行" + w + "分钟 − 余量" + b + "分钟"; },
        lastLine: function (time, from) { return "末班车 " + time + " · " + from; },
        roomy: function (m, end, est) { return "时间充裕 — " + (est ? "即使" + end + "结束,也还有" : end + "结束后还有") + m + "分钟"; },
        tight: function (m, end, est) { return (est ? "若" + end + "结束," : end + "结束后") + "须在" + m + "分钟内离场"; },
        over: function (end, est) { return (est ? "若" + end + "结束则" : end + "结束,") + "赶不上末班车,须在演出结束前离场"; },
        endAt: function (t) { return "结束 " + t; },
        endRange: function (h0, h1, a, b) { return "预计结束 — 开始后" + h0 + "~" + h1 + "小时(" + a + "~" + b + ")"; },
        dayFold: "这个时间不会与大型演出的散场人流重叠,只显示主办方推荐的车站。",
        parkShut: function (x) { return x.until + "以后公园内道路关闭。绕行需步行" + x.min + "分钟,因此收起" + x.st + "一栏。"; },
        parkShutNoWay: function (x) { return x.until + "以后公园内道路关闭。从这个场馆出发没有不经过公园内侧的路线,因此收起" + x.st + "一栏。"; },
        parkIf: function (x) { return "按绕行公园的路线计算。如能在" + x.until + "前走出公园,穿过公园只需步行" + x.short + "分钟。"; },
        whyHost: "这是主办方推荐的车站,离场馆很近。",
        factFri: function (x) { return "在" + (x.kind === "dome" ? "KSPO DOME有晚间演出" : "只有其他场馆有晚间演出") + "的" + x.days + "个周五夜晚," + x.parts.map(function (q, i) { return q.st + (i ? "为" : "的上车人数是无活动周五的") + q.r + "倍" + (q.n ? "(" + q.h + "小时内" + q.n + "人)" : ""); }).join(",") + "。"; },
        factEnd: function (x) { return "在KSPO DOME有晚间演出的" + x.days + "个" + (x.grp === "sat" ? "周六" : "周日") + ",演出开始" + x.off + "小时后的一小时内," + x.parts.map(function (q, i) { return q.st + (i ? "为" : "的上车人数是平时的") + q.r + "倍"; }).join(",") + "。周末几乎天天有活动,这里的“平时”包括有演出的日子。"; },
        card: function (time, f) { return "最晚离场时间:" + time + "(" + f + ")"; }
      },
      nights: function (n) { return n + "晚"; },
      stat1: function (days) { return "{S:올림픽공원}(5号线)乘车人数超过平日{MIN}倍的夜晚 — 两年" + days + "天之中"; },
      statN: function (st) { return "这些夜晚的" + st + " · 平均"; },
      times: function (v) { return v + "倍"; },
      how: function (x) { return "把{HRS}的乘车人数与同一星期几的平日相比。上面的数字是这" + x.hits + "晚的平均值。按中间值看:" + x.med.map(function (m) { return m.st + m.v + "倍"; }).join("、") + "。" + (x.lower === x.hits ? "这" + x.hits + "晚全部" : x.hits + "晚中有" + x.lower + "晚") + ",附近两站相对平日的增幅都小于{S:올림픽공원}。"; },
      capMatrix: function (x) { return "一格是一天(" + x.from + " ~ " + x.to + ",从上到下为周一至周日)。橙色格是那" + x.hits + "天。"; },
      capSpikes: function (x) { return "把那" + x.hits + "天按日期排列。柱子是{S:올림픽공원},圆点是邻近车站。"; },
      usual: "平日 = 1", tableToggle: "查看表格", th: ["日期", "{S:올림픽공원}乘车人数"],
      orderTitle: "列车停靠顺序", orderHere: "场馆指南标注的车站", orderBoard: "本卡片推荐的车站",
      photoCap: "演出日的 KSPO DOME 场内",
      src: function (x) { return [
        "演出场次:主办方奥林匹克公园演出信息(" + x.seen + "确认) · 演出时长:场地租用数据(公共数据门户 15015212)、主办方停车指南页面",
        "各站乘车人数:首尔交通公社各站每日分时段乘降人数 2024·2025(首尔开放数据广场 OA-12921)、9号线2·3期(OA-22441)",
        "列车时刻与停靠顺序:首尔交通公社列车运行时刻表(15098251,基准日 " + x.basis + ") · 换乘时间:换乘站距离及所需时间(15044419)",
        "站名:首尔交通公社站名多语言标注(15044232)",
        "出口与公园开放时间:主办方场馆指南、“交通指南”、公园使用须知(" + x.seen + "确认)",
        "列车时刻可能变更。乘车前请确认车站公告。"
      ]; },
      cal: { sum: function (x) { return "末班车 " + x.time + " " + x.term + " · " + x.st; }, alarm: function (x) { return "最晚 " + x.leave + " 离场 · " + x.st + " " + x.time + " " + x.term; } },
      card: function (x) { return ["[动线卡] " + x.title, x.date + " · " + x.venue + " · " + x.start, "去往:" + x.dest + " → " + x.to, "乘车站:" + x.line + " " + x.st, "末班车(" + x.daytype + "):" + x.time + " " + x.term, x.url]; }
    },
    ja: {
      title: "動線カード — 公演のあとの帰り道", brand: "動線カード", tag: "公演のあとの帰り道 · オリンピック公園",
      sec: ["公演", "どちらへ", "乗る駅", "終電", "この駅を選んだ理由", "データ出典"],
      ask: "終演。<br>どちらまで?", askHint: "略図で行き先をタップすると、乗る駅をすぐ選びます。", toAsk: "どの駅まで行きますか?",
      hrs: function (a, b) { return a + "〜" + b + "時"; },
      station: function (n) { return n + "駅"; }, bound: function (n) { return n + "行き"; }, line: function (n) { return n + "号線"; },
      toward: function (n) { return n + "方面"; }, exit: function (no) { return no + "番出口"; },
      exitSrc: { venue: "主催者の会場案内", park: "主催者の「アクセス」ページ", map: "地図の経路計算による最寄り出口" }, exitMapTag: "地図より",
      noticeTag: "主催者の告知による", noticeWhy: "主催者の公演一覧にはまだなく、オリンピック水泳場の駐車場混雑案内の告知に載っている回です。", parking: "車で来た方は — 主催者のリアルタイム駐車状況を見る",
      hostPage: "主催者の会場案内", d3: "会場を3Dで見る", map: "地図で見る", startAt: function (t) { return t + " 開演"; },
      tStart: "開演", tEnd: "終演", tEndEst: "終演(予想)", tLast: "終電", tIn: "行きの混雑", est: "予想",
      arrFork: function (x) { return x.line + "で来るときは、" + x.N("마천") + "行きだけが" + x.St("올림픽공원") + "に停まります。ハナムコムダンサン行き・サンイルドン行きに乗った場合は、" + x.St("강동") + "で" + x.N("마천") + "行きに乗り換えてください。"; },
      more: { end: "終演時刻はどうやって分かる?", arrive: "行きは何時ごろ混む?", why: "なぜこの駅?", conn: "乗り換え時間も入っている?", how: "数字の数え方", src: "データ出典を見る" },
      dur: {
        rental: function (m) { return "公演時間は" + m + "分です。主催者の貸館データに書かれた値です。"; },
        screen: function (m, d) { return "公演時間は" + m + "分です。主催者の駐車案内画面に書かれた値です(" + d + "確認)。"; },
        assumed: function (m, n) { return "終演時刻は予想です。主催者の貸館データに公演時間が書かれた" + n + "件の真ん中の値、" + m + "分で見ています。"; },
        org: function (m) { return "公演時間は" + m + "分です。主催会社から聞いた終演時刻です。"; }
      },
      arrive: function (b) { return "KSPO DOMEの公演が" + b.hour + "時台に始まった" + b.days + "日を見ると、{S:올림픽공원}で降りる人は " + b.parts.map(function (p) { return "開演" + p.before + "時間前の" + p.hour + "時台がふだんの" + p.ratio + "倍"; }).join("、") + " でした。ふだんは同じ曜日の全日のその時間の中央値です。ファンイベントなど別に集まる予定は、主催会社のお知らせを先に確認してください。"; },
      arrFew: "行きの混雑はKSPO DOMEの夜公演日の記録から描いています。この回は比べられる記録が少ないため、描いていません。",
      arrFlat: "この公演の開演前の時間帯には目立って混んだ記録がないため、行きの混雑は描いていません。",
      why: {
        jamsil: function (x) { return "{S:올림픽공원}を通らない" + x.line + "の駅です。" + x.St("잠실") + "まで" + x.n + "駅です。"; },
        jamsilAlt: function (x) { return x.line9 + "で" + x.n + "駅の" + x.St("석촌") + "まで行き、" + x.line8 + "に乗り換えます。" + x.St("잠실") + "まで" + x.k + "駅です。"; },
        city5: function (x) { return x.St("올림픽공원") + "より" + x.n + "駅手前に停まる駅です。列車が" + x.St("올림픽공원") + "に着く前に乗れます。"; },
        macheon5: function (x) { return "主催者が案内している駅です。" + x.N("마천") + "方面の列車はここから乗ります。"; },
        gangnam9: function (x) { return "9号線はここから乗ります。次の" + x.St("한성백제") + "まで歩いても、同じ列車に1駅あとから乗ることになります。"; }
      },
      note: {
        night: function (x) { return "{S:올림픽공원}の乗車がふだんの2倍以上だった夜" + x.hits + "日の平均で、この駅はほぼふだん通りでした(ふだんの" + x.m + "倍)。"; },
        nightBusy: function (x) { return "{S:올림픽공원}の乗車がふだんの2倍以上だった夜" + x.hits + "日の平均で、この駅の乗車はふだんの" + x.m + "倍でした。とても混む駅です。"; },
        near: function (x) { return "会場案内に書かれている駅は" + x.St("올림픽공원") + "です。同じ列車が" + x.d + "分後にその駅に停まります(" + x.t + ")。"; },
        line9: function (x) { return x.date + " 22時台に9号線に乗った人は、" + x.St("올림픽공원") + " " + x.a + "人、" + x.St("한성백제") + " " + x.b + "人でした。"; },
        foot: "※ {HRS}の乗車人数を同じ曜日のふだんと比べた値"
      },
      cond: "主催者案内:「22時以降は公園内側への立ち入りを禁じます」。この駅へは公園を通って行きます。",
      condAssumed: function (end) { return "終演時刻(" + end + ")は予想です。22時に近い場合は{S:올림픽공원}から乗ってください。"; },
      condHot: function (x) { return "この公演は" + x.end + "に終わります" + (x.assumed ? "(予想)" : "") + "。22時以降は公園内側に入れないため(主催者案内)、" + x.St("몽촌토성") + "の代わりにこの道を案内します。"; },
      bigLabel: function (to) { return to + "まで行く終電"; },
      from: function (term, st) { return st + "から乗る" + term; },
      next: "翌日", nextNote: "+1 は0時を過ぎた翌日未明です。",
      daytype: { DAY: "平日ダイヤ", SAT: "土曜ダイヤ", END: "日曜・祝日ダイヤ" },
      basis: function (d) { return "時刻表基準日 " + d; },
      ladderHead: "行き先別の終電", cut: function (to) { return "ここから先の列車は" + to + "まで行きません"; }, tap: "数字をタップ",
      connect: function (x) { return "→ " + x.st + "で " + x.time + " " + x.term + "(" + x.toward + ")に乗り換え"; },
      minSec: function (st, m, s) { return st + " " + m + "分" + s + "秒"; },
      connNote: function (parts) { return "はい。ソウル交通公社が公開している乗り換え時間(" + parts.join("、") + ")を入れて選んでいます。混んでいるともっとかかります。"; },
      copy: "カードをコピー", ics: "カレンダーに追加 (.ics)", copied: "コピーしました", others: function (n) { return "ほかの回 · " + n; },
      opsLink: "運営チェック表", orgHead: "主催会社からの情報", orgLabel: { booth: "海外来場者の本人確認ブース", goods: "グッズ待機エリア", exitWay: "退場方法", shuttle: "シャトル" },
      ro: { end: "終演", endEst: "終演(予想)", last: "終電", pick: "行き先をタップ" },
      mapNote: "略図です — 方向と順番だけ合わせています", here: "現在地", walk: "徒歩", boardHere: "ここから乗ります",
      noTrain: function (to) { return "今夜の時刻表に" + to + "まで行く列車がありません"; },
      themeDark: "ダークモード", themeLight: "ライトモード", peek: function (to, board) { return to + "まで · " + board + "から乗車"; },
      toAscii: "文字アートで見る", toPhoto: "写真で見る", photoCrop: "写真の一部を切り取っています", photoAscii: "写真を文字で描き直しました", usualWord: "ふだん", cmpUsual: "ふだん並み",
      cmpTimes: function (v) { return "ふだんの" + v + "倍"; }, cmpNote: "これらの夜の{HRS}の乗車人数を、同じ曜日の全日の平均と比べた値です。",
      cmpHead: function (n) { return "乗車が集中した" + n + "夜すべてで見ると"; }, cmpDiff: "上の文とは比べる日と時間帯が違うため、数字が異なります。",
      alt: function (x) { return "別の行き方:" + x.line + " " + x.st + " · " + x.time; },
      col: {
        hostHead: "主催者が案内する駅", lessHead: "公演の夜に混雑が少なかった駅", on: "表示中のルート", pick: "この駅で見る",
        walk: function (min, m) { return "徒歩" + min + "分 · " + m + "m"; },
        more: function (n) { return n + "分多く歩きます"; }, same: "歩く時間はほぼ同じです",
        ratioFri: function (r, n, h) { return "公演の夜の乗車:行事のない金曜の" + r + "倍" + (n ? " · " + h + "時間で" + n + "人" : ""); },
        ratioEnd: function (r, off) { return "公演の夜の乗車:ふだんの" + r + "倍(開始" + off + "時間後の1時間)"; },
        leaveLabel: "遅くとも会場を出る時刻",
        leaveFor: function (to) { return to + "まで行くなら、遅くとも会場を出る時刻"; },
        formula: function (w, b) { return "終電 − 徒歩" + w + "分 − 余裕" + b + "分"; },
        lastLine: function (time, from) { return "終電 " + time + " · " + from; },
        roomy: function (m, end, est) { return "余裕があります — " + end + (est ? "に終わっても" : "の終演後、") + m + "分あります"; },
        tight: function (m, end, est) { return end + (est ? "に終わる場合、" : "の終演後、") + m + "分以内に出発してください"; },
        over: function (end, est) { return end + (est ? "に終わると" : "の終演では") + "終電に間に合いません。終演前に出発してください"; },
        endAt: function (t) { return "終演 " + t; },
        endRange: function (h0, h1, a, b) { return "終演の予想 — 開始" + h0 + "~" + h1 + "時間後(" + a + "~" + b + ")"; },
        dayFold: "この時間は大きな公演の帰り道と重なりません。主催者が案内する駅だけを表示します。",
        parkShut: function (x) { return x.until + "以降は公園内の道が閉まります。迂回すると徒歩" + x.min + "分なので、" + x.st + "の欄は閉じました。"; },
        parkShutNoWay: function (x) { return x.until + "以降は公園内の道が閉まります。この会場からは公園の内側を通らない道がないため、" + x.st + "の欄は閉じました。"; },
        parkIf: function (x) { return "公園を迂回する道で計算しています。" + x.until + "までに公園を出られる場合は、公園内の道で徒歩" + x.short + "分です。"; },
        whyHost: "主催者が案内する駅で、会場から近い駅です。",
        factFri: function (x) { return (x.kind === "dome" ? "KSPO DOMEで夜の公演があった" : "ほかの会場だけで夜の公演があった") + "金曜の夜" + x.days + "日、" + x.parts.map(function (q, i) { return q.st + (i ? "は" : "の乗車は行事のない金曜の") + q.r + "倍" + (q.n ? "(" + q.h + "時間で" + q.n + "人)" : ""); }).join("、") + "でした。"; },
        factEnd: function (x) { return "KSPO DOMEで夜の公演があった" + (x.grp === "sat" ? "土曜" : "日曜") + x.days + "日、開始" + x.off + "時間後の1時間に、" + x.parts.map(function (q, i) { return q.st + (i ? "は" : "の乗車はふだんの") + q.r + "倍"; }).join("、") + "でした。週末は公演のない日がほとんどないため、ふだん(公演のある日を含む)と比べた値です。"; },
        card: function (time, f) { return "遅くとも会場を出る時刻:" + time + "(" + f + ")"; }
      },
      nights: function (n) { return n + "夜"; },
      stat1: function (days) { return "{S:올림픽공원}(5号線)がふだんの{MIN}倍を超えて混んだ夜 — 2年" + days + "日のうち"; },
      statN: function (st) { return "その夜の" + st + " · 平均"; },
      times: function (v) { return v + "倍"; },
      how: function (x) { return "{HRS}の乗車人数を、同じ曜日のふだんと比べました。上の数字はその" + x.hits + "日の平均です。真ん中の値で見ると、" + x.med.map(function (m) { return m.st + " " + m.v + "倍"; }).join("、") + "です。" + (x.lower === x.hits ? x.hits + "日すべてで" : x.hits + "日のうち" + x.lower + "日で") + "、近くの2駅は{S:올림픽공원}よりふだん比の増え方が小さくなりました。"; },
      capMatrix: function (x) { return "1マスが1日です(" + x.from + " 〜 " + x.to + "、上から月〜日)。オレンジのマスがその" + x.hits + "日です。"; },
      capSpikes: function (x) { return "その" + x.hits + "日を日付順に並べました。棒が{S:올림픽공원}、点が隣の駅です。"; },
      usual: "ふだん = 1", tableToggle: "表で見る", th: ["日付", "{S:올림픽공원}の乗車"],
      orderTitle: "列車が停まる順番", orderHere: "会場案内の駅", orderBoard: "このカードがすすめる駅",
      photoCap: "公演日の KSPO DOME の中",
      src: function (x) { return [
        "公演の回:主催者のオリンピック公園公演情報(" + x.seen + "確認) · 公演時間:貸館データ(公共データポータル 15015212)、主催者の駐車案内画面",
        "駅別の乗車:ソウル交通公社 駅別・日別・時間帯別乗降人員 2024·2025(ソウル開かれたデータ広場 OA-12921)、9号線2·3期(OA-22441)",
        "列車時刻と停車順:ソウル交通公社 列車運行時刻表(15098251、基準日 " + x.basis + ") · 乗り換え時間:乗換駅距離・所要時間情報(15044419)",
        "駅名表記:ソウル交通公社 駅名多言語表記(15044232)",
        "出口と公園の利用時間:主催者の会場案内・「アクセス」・公園利用案内(" + x.seen + "確認)",
        "列車時刻は変わることがあります。乗る前に駅の案内を確認してください。"
      ]; },
      cal: { sum: function (x) { return "終電 " + x.time + " " + x.term + " · " + x.st; }, alarm: function (x) { return "遅くとも " + x.leave + " に出発 · " + x.st + " " + x.time + " " + x.term; } },
      card: function (x) { return ["[動線カード] " + x.title, x.date + " · " + x.venue + " · " + x.start, "行き先:" + x.dest + " → " + x.to, "乗る駅:" + x.line + " " + x.st, "終電(" + x.daytype + "):" + x.time + " " + x.term, x.url]; }
    }
  }
};
