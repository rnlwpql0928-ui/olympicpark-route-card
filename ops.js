/* 동선 카드 — 운영 점검표.
 * 회차 표와 점검 항목은 data/*.js 에서 계산한다. 기획사 다섯 칸은 이 브라우저(localStorage)에 저장하고, 「카드에 반영할 파일 받기」로 data/overrides.js 를 만들어 게시하면 모든 카드가 읽는다.
 */
(function () {
  "use strict";
  var G = window.RC_GUIDE, SH = window.RC_SHOWS, TR = window.RC_TRAINS, WK = window.RC_WALK || { pairs: {} }, OV = window.RC_OVERRIDES || {};
  var DOW = ["월", "화", "수", "목", "금", "토", "일"], LANGS = ["ko", "en", "zh", "ja"], FIELDS = ["end", "booth", "goods", "exitWay", "shuttle"];
  var DAYTYPE = { DAY: "평일", SAT: "토요일", END: "일요일·공휴일" };
  var SRC = { rental: "주최 대관정보", screen: "주최 주차 안내 화면", assumed: "가정(중앙값)", org: "기획사 입력" };
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function toMin(hm) { var p = hm.split(":"); return (+p[0]) * 60 + (+p[1]); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function clock(m) { return pad(Math.floor(m / 60) % 24) + ":" + pad(m % 60); }
  function hasCard(s) { return !!(G.venues[s.venue] && s.date && s.start); }   // 카드 판정(app.js 와 같음): 공연장·날짜·시작 시각
  function listed(s) { return !!s.card; }                                     // 주최 공연정보 목록에 있는 회차
  function showId(s) { return s.date.slice(5, 7) + s.date.slice(8, 10) + "-" + (G.venues[s.venue] ? G.venues[s.venue].slug : "x") + "-" + s.start.replace(":", ""); }
  function label(s) { return s.date.slice(5, 7) + "." + s.date.slice(8, 10) + " " + DOW[s.dow] + " " + s.start; }
  function key(s) { return "rc_org_" + showId(s); }
  function localOf(id) { try { var o = JSON.parse(localStorage.getItem("rc_org_" + id) || "null"); return o && typeof o === "object" ? o : null; } catch (e) { return null; } }
  function orgOf(s) { var id = showId(s), o = localOf(id); if (o) return o; var f = OV[id]; return f && typeof f === "object" ? f : {}; }   // 카드와 같은 순서: 이 브라우저 → 게시 파일 → 빈 값
  function eff(s) {
    var o = orgOf(s), c = {}, k; for (k in s) c[k] = s[k]; c.org = o;
    if (/^\d{1,2}:\d{2}$/.test(o.end || "")) { var m = toMin(o.end) - toMin(s.start); if (m <= 0) m += 1440; if (m <= 480) { c.dur = m; c.durSrc = "org"; } }
    return c;
  }
  function dayType(s) { return /^(DAY|SAT|END)$/.test(s.daytype || "") ? s.daytype : s.dow === 5 ? "SAT" : s.dow === 6 ? "END" : "DAY"; }   // 카드(app.js)와 같은 판정
  function endMin(s) { return toMin(s.start) + s.dur; }
  // 22시 조건(카드 app.js colInfo 와 같은 판정): 공원 안쪽을 지나는 「덜 붐볐던 역」 길마다 — 가장 일찍 끝나도 22시를 넘으면 칸 접음(fold), 늦게 끝날 때만 넘으면(길이 가정) 돌아가는 길로 셈(cond)
  function parkStates(s) {
    var lim = toMin(G.rules.parkEntryUntil), v = WK.pairs[G.venues[s.venue].slug] || {}, out = [];
    G.dests.forEach(function (d) {
      var c = d.cols && d.cols.less, w = c && v[c.st]; if (!w || w.aroundMin == null) return;
      var nm = TR.stations[c.st] ? TR.stations[c.st].name + "역" : c.st;
      var canAround = w.aroundParkM != null && w.aroundParkM <= G.rules.aroundInsideMax;   // 카드와 같은 기준: 공원 안 구간이 짧을 때만 돌아가는 길 인정
      if (endMin(s) + w.min > lim) out.push({ st: nm, kind: "fold" });
      else if (s.durSrc === "assumed" && toMin(s.start) + G.rules.endLate + w.min > lim) out.push({ st: nm, kind: canAround ? "cond" : "fold" });
    });
    return out;
  }
  function parkText(s) { return parkStates(s).map(function (p) { return p.st + (p.kind === "fold" ? " 칸 접음" : " 돌아가는 길로 셈"); }).join(" · "); }
  function td(tr, text, cls) { var c = el("td", cls, text); tr.appendChild(c); return c; }

  function renderShows() {
    var tb = $("o-shows"); tb.textContent = "";
    var head = el("tr"); ["회차", "공연장", "공연", "공연 길이 · 출처", "끝나는 때", "시각표", "22시 조건", "영문 공식 제목", "3D 안내", "카드"].forEach(function (h) { head.appendChild(el("th", null, h)); });
    var thead = el("thead"); thead.appendChild(head); tb.appendChild(thead);
    var body = el("tbody"); tb.appendChild(body);
    SH.shows.forEach(function (raw) {
      var tr = el("tr"), s = eff(raw); body.appendChild(tr);
      td(tr, label(s)); td(tr, s.venue); td(tr, s.title + (listed(s) ? "" : " · 주최 공지 기준"), "t");
      if (!hasCard(s)) { var c = td(tr, "공연장·날짜·시작 시각 중 빠진 값 있음. 카드 미생성", "na"); c.colSpan = 7; return; }
      td(tr, s.dur + "분 · " + SRC[s.durSrc], s.durSrc === "assumed" ? "warn" : null);
      td(tr, clock(endMin(s)) + (s.durSrc === "assumed" ? " (가정)" : ""));
      td(tr, DAYTYPE[dayType(s)]);
      var pk = parkText(s); td(tr, pk || "—", pk ? "warn" : null);
      td(tr, s.enTitle || "파일에 없음 · 칸 숨김", s.enTitle ? null : "dim");
      var v = G.venues[s.venue], d3 = td(tr, v.d3 ? "" : "없음", v.d3 ? null : "dim");
      if (v.d3) { var a3 = el("a", "lnk", "있음 ↗"); a3.href = v.d3; a3.target = "_blank"; a3.rel = "noopener"; d3.appendChild(a3); }
      var cc = td(tr, "");
      LANGS.forEach(function (l) { var a = el("a", "lnk", l.toUpperCase()); a.href = "index.html#/" + l + "/" + showId(s); cc.appendChild(a); cc.appendChild(document.createTextNode(" ")); });
    });
    $("o-note").textContent = "가정 = 주최 대관정보에 공연 길이가 적힌 행사 " + SH.assume.n + "건(전체 " + SH.assume.events + "건)의 중앙값 " + SH.assume.dur + "분. 영문 공연정보 파일(" + SH.enFile.id + ") " + SH.enFile.rows + "행, 마지막 공연일 " + SH.enFile.last;
  }

  // 게시 파일: 이 브라우저에 저장된 모든 회차의 다섯 칸을 data/overrides.js 꼴로 묶는다
  function overridesText(now) {
    var out = {}, ids = [], i, k;
    for (i = 0; i < localStorage.length; i++) { k = localStorage.key(i); if (/^rc_org_/.test(k || "")) ids.push(k.slice(7)); }
    ids.sort().forEach(function (id) {
      var o = localOf(id), c = {}, any = false; if (!o) return;
      FIELDS.forEach(function (f) { if (typeof o[f] === "string" && o[f].trim()) { c[f] = o[f].trim(); any = true; } });
      if (any) out[id] = c;
    });
    var kst = new Date((now || new Date()).getTime() + 9 * 3600000).toISOString().slice(0, 16).replace("T", " ");
    return "// 기획사 다섯 칸 게시 파일: 운영 점검표의 「카드에 반영할 파일 받기」로 받은 파일을 이 자리에 바꿔 넣으면 모든 관람객 카드에 반영된다(회차 주소 → { end, booth, goods, exitWay, shuttle }).\n" +
      "// 만든 시각 " + kst + " (한국 시각) · 회차 " + Object.keys(out).length + "\n" +
      "window.RC_OVERRIDES = " + JSON.stringify(out, null, 2) + ";\n";
  }
  function exportFile() {
    var text; try { text = overridesText(); } catch (e) { $("f-msg").textContent = "파일 생성 불가(이 브라우저의 저장소 사용이 막혀 있음)"; return; }
    var blob = new Blob([text], { type: "text/javascript;charset=utf-8" }), a = el("a");
    a.href = URL.createObjectURL(blob); a.download = "overrides.js"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    $("f-msg").textContent = "overrides.js 받음 · 회차 " + (text.match(/회차 (\d+)/) || [0, 0])[1];
  }

  function cardShows() { return SH.shows.filter(hasCard); }
  function current() { var id = $("f-show").value, L = cardShows(); for (var i = 0; i < L.length; i++) if (showId(L[i]) === id) return L[i]; return L[0]; }
  function fillForm() {
    var s = current(), o = orgOf(s);
    FIELDS.forEach(function (f) { $("f-" + f).value = o[f] || ""; });
    $("f-open").href = "index.html#/ko/" + showId(s);
  }
  function renderForm() {
    var sel = $("f-show"); sel.textContent = "";
    cardShows().forEach(function (s) { var o = el("option", null, label(s) + " · " + s.venue + " · " + s.title + (listed(s) ? "" : " · 주최 공지 기준")); o.value = showId(s); sel.appendChild(o); });
    sel.onchange = function () { $("f-msg").textContent = ""; fillForm(); };
    $("o-form").onsubmit = function (ev) {
      ev.preventDefault();
      var s = current(), o = {}, any = false;
      FIELDS.forEach(function (f) { var v = $("f-" + f).value.trim(); if (v) { o[f] = v; any = true; } });
      try { if (any) localStorage.setItem(key(s), JSON.stringify(o)); else localStorage.removeItem(key(s)); $("f-msg").textContent = label(s) + " 저장 완료. 이 브라우저 카드에 반영 — 파일로 받아 게시하면 전체 반영"; }
      catch (e) { $("f-msg").textContent = "저장 불가(이 브라우저의 저장소 사용이 막혀 있음)"; }
      renderShows(); renderCheck();
    };
    $("f-clear").onclick = function () {
      var s = current(); try { localStorage.removeItem(key(s)); } catch (e) { /* 저장소가 막혀 있으면 지울 것도 없다 */ }
      $("f-msg").textContent = label(s) + " 입력 삭제"; fillForm(); renderShows(); renderCheck();
    };
    $("f-export").onclick = exportFile;
    fillForm();
  }

  function renderCheck() {
    var ul = $("o-check"); ul.textContent = "";
    var L = cardShows().map(eff), n = L.length;
    function item(state, title, detail) { var li = el("li", state); li.appendChild(el("b", null, title)); li.appendChild(el("span", null, detail)); ul.appendChild(li); }
    var assumed = L.filter(function (s) { return s.durSrc === "assumed"; });
    item(assumed.length ? "warn" : "ok", "끝나는 때가 가정인 회차 " + assumed.length + " / " + n, assumed.length ? assumed.map(label).join(" · ") + " — 카드에 빗금과 「가정」 표시. 기획사가 끝나는 때를 알려 주면 해제" : "전 회차 공연 길이의 출처가 주최 자료 또는 기획사 입력");
    var hit = L.filter(function (s) { return parkStates(s).length; });
    item(hit.length ? "warn" : "ok", "22시 조건 해당 회차 " + hit.length + " / " + n, hit.length ? hit.map(function (s) { return label(s) + " " + parkText(s); }).join(" · ") + " — 주최 공원 이용 안내(22시 이후 공원 안쪽 출입 금지) 기준. 끝나는 때 입력 시 재판정" : "22시 이후 공원 안쪽 길을 지나게 되는 회차 없음");
    var en = L.filter(function (s) { return s.enTitle; });
    item(en.length === n ? "ok" : "warn", "영문 공식 제목이 파일에 있는 회차 " + en.length + " / " + n, "영문 공연정보(" + SH.enFile.id + ")의 마지막 공연일 " + SH.enFile.last + ". 없는 회차는 칸을 숨기고 주최 목록 제목 사용");
    var venues = Object.keys(G.venues), with3 = venues.filter(function (v) { return G.venues[v].d3; }), no3 = venues.filter(function (v) { return !G.venues[v].d3; });
    item(no3.length ? "warn" : "ok", "3D 안내가 있는 공연장 " + with3.length + " / " + venues.length, "있음: " + with3.join(", ") + (no3.length ? " · 없음: " + no3.join(", ") + " — 카드에 링크 미표시" : ""));
    var boards = {}; G.dests.forEach(function (d) { boards[d.board.st] = 1; if (d.near) boards[d.near.st] = 1; if (d.alt) boards[d.alt.board.st] = 1; ["host", "less"].forEach(function (k) { if (d.cols && d.cols[k]) boards[d.cols[k].st] = 1; }); });   // 카드 두 칸에 나오는 역까지
    var noExit = [], twoExit = [];
    Object.keys(boards).forEach(function (c) {
      var st = TR.stations[c], nm = st.line + "호선 " + st.name + "역", all = G.exits[c] || [], host = all.filter(function (x) { return x.src !== "map"; }), bymap = all.filter(function (x) { return x.src === "map"; });
      if (!host.length) noExit.push(nm + (bymap.length ? "(지도 기준 " + bymap.map(function (x) { return x.no + "번"; }).join(" / ") + ")" : "(출구 칸 없음)"));
      else if (host.length > 1) twoExit.push(nm + "(" + host.map(function (x) { return x.no + "번"; }).join(" / ") + ")");
    });
    item(noExit.length ? "warn" : "ok", "주최 안내에 출구가 적히지 않은 역 " + noExit.length, noExit.length ? noExit.join(", ") + " — 지도 경로 계산 기준 가장 가까운 출구를 「지도 기준」으로 주최 출처와 구분해 표시" : "카드가 가리키는 모든 역에 주최가 적은 출구 있음");
    item(twoExit.length ? "warn" : "ok", "주최 표기가 두 가지인 출구 " + twoExit.length, twoExit.length ? twoExit.join(", ") + " — 공연장 안내와 「오시는 길」 표기가 달라 둘 다 출처와 함께 표시" : "표기 일치");
    var fq = G.faqExits, fqDiff = [];
    Object.keys(fq.by).forEach(function (c) {
      var st = TR.stations[c], nm = st.line + "호선 " + st.name + "역";
      (G.exits[c] || []).forEach(function (x) { if (x.no !== fq.by[c]) fqDiff.push(nm + " — " + G.t.ko.exitSrc[x.src] + " " + x.no + "번, 개방 파일 " + fq.by[c] + "번"); });
    });
    item(fqDiff.length ? "warn" : "ok", "개방 파일의 출구 표기와 다른 주최 안내 " + fqDiff.length, "자주 묻는 질문정보(" + fq.id + ") 대중교통 문항과 대조. " + (fqDiff.length ? fqDiff.join(" · ") : "모두 일치"));
    var off = SH.shows.filter(function (s) { return !listed(s); });
    item(off.length ? "warn" : "ok", "주최 공연정보 목록에 없는 공연 날 " + off.length, off.length ? off.map(function (s) { return label(s) + " " + s.venue; }).join(" · ") + " — 다른 공지에만 있는 날. 카드는 「주최 공지 기준」 꼬리표로 생성, 공연정보 목록에 올라오면 꼬리표 해제" : "모든 회차가 주최 공연정보 목록에 있음");
    item("warn", "걷는 시간 출처", "지도 보행 경로 계산값" + (WK.speed ? "(분속 " + WK.speed + "m)" : "") + ". 주최 안내에 역 출구~공연장 걷는 시간 없음. 주최 실측값 확보 시 교체");
    item("ok", "열차 시각표 기준일 " + TR.basis, "공식 시각표 파일이 바뀌면 마지막 열차 표 재생성. 그 밖에 손댈 것 없음");
    var src = $("o-src"); src.textContent = "";
    G.t.ko.src({ seen: G.seen, basis: TR.basis }).slice(0, 5).forEach(function (line) { src.appendChild(el("li", null, line.replace(/\{S:([^}]+)\}/g, "$1역"))); });
  }

  renderShows(); renderForm(); renderCheck();
  window.RC_OPS = { overridesText: overridesText };
})();
