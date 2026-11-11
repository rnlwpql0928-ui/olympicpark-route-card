/* 동선 카드 — 운영 점검표.
 * 큰 숫자·날짜 네모·회차 띠·접어 둔 표·점검표는 모두 model() 한 번의 계산을 같이 쓴다(구역마다 숫자가 달라지지 않게).
 * 기획사 다섯 칸은 이 브라우저(localStorage)에 저장하고, 「카드에 반영할 파일 받기」로 data/overrides.js 를 만들어 게시하면 모든 카드가 읽는다.
 */
(function () {
  "use strict";
  var G = window.RC_GUIDE, SH = window.RC_SHOWS, TR = window.RC_TRAINS, WK = window.RC_WALK || { pairs: {} }, OV = window.RC_OVERRIDES || {};
  var DOW = ["월", "화", "수", "목", "금", "토", "일"], LANGS = ["ko", "en", "zh", "ja"], FIELDS = ["end", "booth", "goods", "exitWay", "shuttle"];
  var FNAME = { end: "끝나는 때", booth: "부스", goods: "굿즈", exitWay: "퇴장", shuttle: "셔틀" };
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
  function day(s) { return s.date ? s.date.slice(5, 7) + "." + s.date.slice(8, 10) + " " + (DOW[s.dow] || "") : "날짜 없음"; }
  function label(s) { return day(s) + " " + (s.start || "시각 없음"); }
  function key(s) { return "rc_org_" + showId(s); }
  function localOf(id) { try { var o = JSON.parse(localStorage.getItem("rc_org_" + id) || "null"); return o && typeof o === "object" ? o : null; } catch (e) { return null; } }
  function orgOf(s) { var id = showId(s), o = localOf(id); if (o) return o; var f = OV[id]; return f && typeof f === "object" ? f : {}; }   // 카드와 같은 순서: 이 브라우저 → 게시 파일 → 빈 값
  function eff(s) {
    var c = {}, k; for (k in s) c[k] = s[k]; c.org = {};
    if (!hasCard(s)) return c;                                                 // 날짜·시각이 빠진 줄은 회차 주소를 만들 수 없다(입력값도 없음)
    var o = orgOf(s); c.org = o;
    if (/^\d{1,2}:\d{2}$/.test(o.end || "")) { var m = toMin(o.end) - toMin(s.start); if (m <= 0) m += 1440; if (m <= 480) { c.dur = m; c.durSrc = "org"; } }
    return c;
  }
  function dayType(s) { return /^(DAY|SAT|END)$/.test(s.daytype || "") ? s.daytype : s.dow === 5 ? "SAT" : s.dow === 6 ? "END" : "DAY"; }   // 카드(app.js)와 같은 판정
  function endMin(s) { return toMin(s.start) + s.dur; }
  // 공원 안쪽을 지나는 「덜 붐볐던 역」 길(22시 조건이 걸리는 길). 판정과 그림이 같은 목록을 쓴다.
  function parkPaths(s) {
    var v = WK.pairs[G.venues[s.venue].slug] || {}, out = [];
    G.dests.forEach(function (d) {
      var c = d.cols && d.cols.less, w = c && v[c.st]; if (!w || w.aroundMin == null) return;
      out.push({ w: w, st: TR.stations[c.st] ? TR.stations[c.st].name + "역" : c.st });
    });
    return out;
  }
  // 22시 조건(카드 app.js colInfo 와 같은 판정): 가장 일찍 끝나도 22시를 넘으면 칸 접음(fold), 늦게 끝날 때만 넘으면(길이 가정) 돌아가는 길로 셈(cond)
  function parkStates(s) {
    var lim = toMin(G.rules.parkEntryUntil), out = [];
    parkPaths(s).forEach(function (p) {
      var w = p.w, canAround = w.aroundParkM != null && w.aroundParkM <= G.rules.aroundInsideMax;   // 카드와 같은 기준: 공원 안 구간이 짧을 때만 돌아가는 길 인정
      if (endMin(s) + w.min > lim) out.push({ st: p.st, kind: "fold" });
      else if (s.durSrc === "assumed" && toMin(s.start) + G.rules.endLate + w.min > lim) out.push({ st: p.st, kind: canAround ? "cond" : "fold" });
    });
    return out;
  }
  function parkText(s) { return parkStates(s).map(function (p) { return p.st + (p.kind === "fold" ? " 칸 접음" : " 돌아가는 길로 셈"); }).join(" · "); }
  function td(tr, text, cls) { var c = el("td", cls, text); tr.appendChild(c); return c; }

  // 회차마다 한 번 계산: 끝(end) · 늦게 끝나는 경우(late, 길이 가정일 때만 더 늦음) · 22시 조건(park) · 공원 안쪽 길 가운데 가장 긴 걷는 시간(walk)
  function model() {
    return SH.shows.map(function (raw) {
      var s = eff(raw), m = { s: s, has: hasCard(s) };
      if (!m.has) return m;
      m.id = showId(s); m.assumed = s.durSrc === "assumed"; m.end = endMin(s);
      m.late = m.assumed ? Math.max(m.end, toMin(s.start) + G.rules.endLate) : m.end;
      m.park = parkStates(s); m.walk = null;
      parkPaths(s).forEach(function (p) { if (!m.walk || p.w.min > m.walk.min) m.walk = { min: p.w.min, st: p.st }; });
      return m;
    });
  }
  function cards(M) { return M.filter(function (m) { return m.has; }); }

  // 큰 숫자 셋
  function renderNums(M) {
    var box = $("o-nums"), C = cards(M); box.textContent = "";
    var a = C.filter(function (m) { return m.assumed; }).length, p = C.filter(function (m) { return m.park.length; }).length;
    [[C.length, "회차", false], [a, "끝나는 때 가정", a > 0], [p, "22시 조건", p > 0]].forEach(function (x) {
      var d = el("div", "ov-num" + (x[2] ? " hot" : "")); d.appendChild(el("b", null, String(x[0]))); d.appendChild(el("span", null, x[1])); box.appendChild(d);
    });
  }

  // 날짜별 네모: 네모 하나 = 회차 하나
  function sqClass(m) { return "ov-sq" + (m.assumed ? " as" : "") + (m.park.length ? " p22" : ""); }
  function renderStrip(M) {
    var box = $("o-strip"), C = cards(M), by = {}, days = [], prev = null; box.textContent = "";
    C.forEach(function (m) { var d = m.s.date; if (!by[d]) { by[d] = []; days.push(d); } by[d].push(m); });
    days.sort();
    days.forEach(function (d) {
      var col = el("div", "ov-day" + (prev && Date.parse(d) - Date.parse(prev) > 86400000 ? " gap" : "")), st = el("div", "ov-stack");
      by[d].slice().sort(function (a, b) { return toMin(a.s.start) - toMin(b.s.start); }).forEach(function (m) {
        var q = el("i", sqClass(m)); q.title = label(m.s) + " · " + m.s.venue + (m.assumed ? " · 끝나는 때 가정" : "") + (m.park.length ? " · 22시 조건" : ""); st.appendChild(q);
      });
      col.appendChild(st); col.appendChild(el("b", null, String(+d.slice(8, 10)))); col.appendChild(el("span", null, DOW[by[d][0].s.dow] || ""));
      box.appendChild(col); prev = d;
    });
    box.setAttribute("aria-label", "날짜별 회차 네모. 회차 " + C.length + ", 끝나는 때 가정 " + C.filter(function (m) { return m.assumed; }).length + ", 22시 조건 " + C.filter(function (m) { return m.park.length; }).length);
    $("o-cap").textContent = days.length ? days[0].slice(0, 4) + "." + days[0].slice(5, 7) + " · 네모 하나 = 회차 하나" : "";
  }

  // 01 회차 띠: 공연별로 묶고, 시각 축 하나에 회차마다 한 줄. 걷는 선이 22시 선을 넘는 줄 = 22시 조건(parkStates 와 같은 식).
  function renderLegend() {
    var box = $("o-lgd"); box.textContent = "";
    function it(cls, text) { var s = el("span"); s.appendChild(el("i", "ov-m " + cls)); s.appendChild(document.createTextNode(text)); box.appendChild(s); }
    it("ok", "끝나는 때 자료 있음");
    it("as", "가정 " + SH.assume.dur + "분(대관정보 중앙값)");
    it("ext", "늦으면 " + G.rules.endLate + "분");
    it("walk", "공원 안쪽 길로 역까지 걷는 시간");
    it("lim", G.rules.parkEntryUntil + " 공원 안쪽 출입 금지 · 걷는 선이 넘으면 22시 조건");
    it("five", "다섯 칸 = " + FIELDS.map(function (f) { return FNAME[f]; }).join("·") + " · 누르면 입력");
  }
  function pick(id) {
    $("f-show").value = id; $("f-msg").textContent = ""; fillForm();
    var f = $("o-form"); if (f.scrollIntoView) f.scrollIntoView({ block: "center" });
  }
  function renderTimeline(M) {
    var box = $("o-tl"), C = cards(M), lim = toMin(G.rules.parkEntryUntil); box.textContent = "";
    if (C.length) {
      var lo = Math.floor(Math.min.apply(null, C.map(function (m) { return toMin(m.s.start); })) / 120) * 120;
      var hi = Math.max(1440, Math.ceil(Math.max.apply(null, C.map(function (m) { return m.late + (m.walk ? m.walk.min : 0); })) / 120) * 120);
      var pc = function (t) { return Math.max(0, Math.min(100, (t - lo) / (hi - lo) * 100)); };
      box.style.setProperty("--n", String((hi - lo) / 120));

      var ax = el("div", "ov-g ov-ax"), axs = el("div", "ov-rows"), axr = el("div", "ov-r"), axt = el("div", "ov-trk"), t;
      ax.setAttribute("aria-hidden", "true"); ax.appendChild(el("div", "ov-gh")); axr.appendChild(el("span", "ov-when"));
      for (t = lo; t <= hi; t += 120) {
        if (t === lim) continue;
        var tk = el("span", "ov-tick" + (t === lo ? " a" : t === hi ? " z" : ""), String(t / 60)); tk.style.left = pc(t) + "%"; axt.appendChild(tk);
      }
      var tl = el("span", "ov-tick lim", G.rules.parkEntryUntil); tl.style.left = pc(lim) + "%"; axt.appendChild(tl);
      axr.appendChild(axt); axr.appendChild(el("span", "ov-fiveh", "다섯 칸")); axr.appendChild(el("span", "ov-lnkh")); axs.appendChild(axr); ax.appendChild(axs); box.appendChild(ax);

      var by = {}, order = [];
      C.forEach(function (m) { var k = m.s.title + "\u0001" + m.s.venue; if (!by[k]) { by[k] = []; order.push(k); } by[k].push(m); });
      order.forEach(function (k) {
        var L = by[k], g = el("div", "ov-g"), gh = el("div", "ov-gh"), rows = el("div", "ov-rows");
        gh.appendChild(el("b", null, L[0].s.title)); gh.appendChild(el("span", null, L[0].s.venue + " · " + L.length + "회"));
        g.appendChild(gh); g.appendChild(rows); box.appendChild(g);
        L.forEach(function (m) {
          var s = m.s, st = toMin(s.start), r = el("div", "ov-r" + (m.assumed ? " as" : "") + (m.park.length ? " p22" : "")), w = el("span", "ov-when"), trk = el("div", "ov-trk");
          r.id = "r-" + m.id;
          w.appendChild(el("b", null, day(s))); w.appendChild(document.createTextNode(" " + s.start + " ~ "));
          w.appendChild(m.assumed ? el("em", null, "가정") : document.createTextNode(clock(m.end)));
          if (!listed(s)) w.appendChild(el("i", "ov-tag", "주최 공지 기준"));
          if (m.park.length) w.appendChild(el("i", "ov-tag hot", "22시 · " + parkText(s)));
          r.appendChild(w);

          function seg(cls, a, b) { var i = el("i", cls); i.style.left = pc(a) + "%"; i.style.width = Math.max(0, pc(b) - pc(a)) + "%"; trk.appendChild(i); }
          seg("ov-bar" + (m.assumed ? " as" : ""), st, m.end);
          if (m.late > m.end) seg("ov-ext", m.end, m.late);
          if (m.walk) seg("ov-walk" + (m.late + m.walk.min > lim ? " x" : ""), m.late, m.late + m.walk.min);
          var ln = el("i", "ov-lim"); ln.style.left = pc(lim) + "%"; trk.appendChild(ln);
          var tip = s.start + " 시작 · " + (m.assumed ? "끝 " + clock(m.end) + "~" + clock(m.late) + " 가정" : "끝 " + clock(m.end) + " · " + SRC[s.durSrc]) + (m.walk ? " · " + m.walk.st + "까지 " + m.walk.min + "분" : "");
          trk.title = tip; trk.setAttribute("role", "img"); trk.setAttribute("aria-label", tip); trk.setAttribute("data-viz", "");
          r.appendChild(trk);

          var five = el("button", "ov-five"), filled = 0; five.type = "button";
          FIELDS.forEach(function (f, i) {
            var on = i === 0 ? !m.assumed : !!(typeof s.org[f] === "string" && s.org[f].trim());
            if (on) filled++;
            five.appendChild(el("i", i === 0 && m.assumed ? "need" : on ? "on" : ""));
          });
          five.setAttribute("aria-label", label(s) + " 다섯 칸 입력 열기 · 값 있음 " + filled + "칸" + (m.assumed ? " · 끝나는 때 가정" : ""));
          five.onclick = function () { pick(m.id); };
          r.appendChild(five);
          var a = el("a", "lnk", "카드 →"); a.href = "index.html#/ko/" + m.id; r.appendChild(a);
          rows.appendChild(r);
        });
      });
    }
    var off = M.filter(function (m) { return !m.has; });
    if (off.length) {
      var g2 = el("div", "ov-g"), gh2 = el("div", "ov-gh"), rows2 = el("div", "ov-rows");
      gh2.appendChild(el("b", null, "카드 미생성")); gh2.appendChild(el("span", null, off.length + "줄")); g2.appendChild(gh2); g2.appendChild(rows2); box.appendChild(g2);
      off.forEach(function (m) { var r = el("div", "ov-r na"); r.appendChild(el("span", "ov-when", label(m.s) + " · " + (m.s.venue || "공연장 없음"))); r.appendChild(el("span", "ov-na", "공연장·날짜·시작 시각 중 빠진 값 있음")); rows2.appendChild(r); });
    }
  }

  // 접어 둔 표: 고치기 전 판의 열 그대로
  function renderShows(M) {
    var tb = $("o-shows"); tb.textContent = "";
    var head = el("tr"); ["회차", "공연장", "공연", "공연 길이 · 출처", "끝나는 때", "시각표", "22시 조건", "영문 공식 제목", "3D 안내", "카드"].forEach(function (h) { head.appendChild(el("th", null, h)); });
    var thead = el("thead"); thead.appendChild(head); tb.appendChild(thead);
    var body = el("tbody"); tb.appendChild(body);
    M.forEach(function (m) {
      var tr = el("tr"), s = m.s; body.appendChild(tr);
      td(tr, label(s)); td(tr, s.venue || "—"); td(tr, (s.title || "—") + (listed(s) ? "" : " · 주최 공지 기준"), "t");
      if (!m.has) { var c = td(tr, "공연장·날짜·시작 시각 중 빠진 값 있음. 카드 미생성", "na"); c.colSpan = 7; return; }
      td(tr, s.dur + "분 · " + SRC[s.durSrc], m.assumed ? "warn" : null);
      td(tr, clock(m.end) + (m.assumed ? " (가정)" : ""));
      td(tr, DAYTYPE[dayType(s)]);
      var pk = parkText(s); td(tr, pk || "—", pk ? "warn" : null);
      td(tr, s.enTitle || "파일에 없음 · 칸 숨김", s.enTitle ? null : "dim");
      var v = G.venues[s.venue], d3 = td(tr, v.d3 ? "" : "없음", v.d3 ? null : "dim");
      if (v.d3) { var a3 = el("a", "lnk", "있음 ↗"); a3.href = v.d3; a3.target = "_blank"; a3.rel = "noopener"; d3.appendChild(a3); }
      var cc = td(tr, "");
      LANGS.forEach(function (l) { var a = el("a", "lnk", l.toUpperCase()); a.href = "index.html#/" + l + "/" + m.id; cc.appendChild(a); cc.appendChild(document.createTextNode(" ")); });
    });
    $("o-shows-n").textContent = "회차 표로 보기 · " + M.length + "행";
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
    var s = current(); if (!s) return;
    var o = orgOf(s);
    FIELDS.forEach(function (f) { $("f-" + f).value = o[f] || ""; });
    $("f-open").href = "index.html#/ko/" + showId(s);
  }
  function renderForm() {
    var sel = $("f-show"); sel.textContent = "";
    cardShows().forEach(function (s) { var o = el("option", null, label(s) + " · " + s.venue + " · " + s.title + (listed(s) ? "" : " · 주최 공지 기준")); o.value = showId(s); sel.appendChild(o); });
    sel.onchange = function () { $("f-msg").textContent = ""; fillForm(); };
    $("o-form").onsubmit = function (ev) {
      ev.preventDefault();
      var s = current(), o = {}, any = false; if (!s) return;
      FIELDS.forEach(function (f) { var v = $("f-" + f).value.trim(); if (v) { o[f] = v; any = true; } });
      try { if (any) localStorage.setItem(key(s), JSON.stringify(o)); else localStorage.removeItem(key(s)); $("f-msg").textContent = label(s) + " 저장 완료. 이 브라우저 카드에 반영 — 파일로 받아 게시하면 전체 반영"; }
      catch (e) { $("f-msg").textContent = "저장 불가(이 브라우저의 저장소 사용이 막혀 있음)"; }
      renderAll();
    };
    $("f-clear").onclick = function () {
      var s = current(); if (!s) return;
      try { localStorage.removeItem(key(s)); } catch (e) { /* 저장소가 막혀 있으면 지울 것도 없다 */ }
      $("f-msg").textContent = label(s) + " 입력 삭제"; fillForm(); renderAll();
    };
    $("f-export").onclick = exportFile;
    fillForm();
  }

  // 카드 두 칸에 나오는 역까지 포함한 역 목록(출구 점검의 대상)
  function boardStations() {
    var boards = {}; G.dests.forEach(function (d) { boards[d.board.st] = 1; if (d.near) boards[d.near.st] = 1; if (d.alt) boards[d.alt.board.st] = 1; ["host", "less"].forEach(function (k) { if (d.cols && d.cols[k]) boards[d.cols[k].st] = 1; }); });
    return Object.keys(boards);
  }
  function stName(c) { var st = TR.stations[c]; return st ? st.line + "호선 " + st.name + "역" : c; }

  // 점검 항목 열 가지. big·title·marks 는 숫자 칸(처음 보이는 것), longTitle·long 은 접어 둔 글(고치기 전 판의 문장 그대로).
  function checks(M) {
    var C = cards(M), n = C.length, out = [];
    function add(o) { out.push(o); }
    var assumed = C.filter(function (m) { return m.assumed; });
    add({ state: assumed.length ? "warn" : "ok", hot: assumed.length > 0, big: [assumed.length, n], title: "끝나는 때 가정", marks: C.map(function (m) { return m.assumed; }), note: assumed.length ? "끝나는 때 입력 시 해제" : "",
      longTitle: "끝나는 때가 가정인 회차 " + assumed.length + " / " + n, long: assumed.length ? assumed.map(function (m) { return label(m.s); }).join(" · ") + " — 카드에 빗금과 「가정」 표시. 기획사가 끝나는 때를 알려 주면 해제" : "전 회차 공연 길이의 출처가 주최 자료 또는 기획사 입력" });
    var hit = C.filter(function (m) { return m.park.length; });
    add({ state: hit.length ? "warn" : "ok", hot: hit.length > 0, big: [hit.length, n], title: "22시 조건", marks: C.map(function (m) { return m.park.length > 0; }), note: hit.length ? "끝나는 때 입력 시 재판정" : "",
      longTitle: "22시 조건 해당 회차 " + hit.length + " / " + n, long: hit.length ? hit.map(function (m) { return label(m.s) + " " + parkText(m.s); }).join(" · ") + " — 주최 공원 이용 안내(22시 이후 공원 안쪽 출입 금지) 기준. 끝나는 때 입력 시 재판정" : "22시 이후 공원 안쪽 길을 지나게 되는 회차 없음" });
    var en = C.filter(function (m) { return m.s.enTitle; });
    add({ state: en.length === n ? "ok" : "warn", big: [en.length, n], title: "영문 공식 제목 있음", marks: C.map(function (m) { return !!m.s.enTitle; }),
      longTitle: "영문 공식 제목이 파일에 있는 회차 " + en.length + " / " + n, long: "영문 공연정보(" + SH.enFile.id + ")의 마지막 공연일 " + SH.enFile.last + ". 없는 회차는 칸을 숨기고 주최 목록 제목 사용" });
    var venues = Object.keys(G.venues), with3 = venues.filter(function (v) { return G.venues[v].d3; }), no3 = venues.filter(function (v) { return !G.venues[v].d3; });
    add({ state: no3.length ? "warn" : "ok", big: [with3.length, venues.length], title: "3D 안내 있는 공연장", marks: venues.map(function (v) { return !!G.venues[v].d3; }),
      longTitle: "3D 안내가 있는 공연장 " + with3.length + " / " + venues.length, long: "있음: " + with3.join(", ") + (no3.length ? " · 없음: " + no3.join(", ") + " — 카드에 링크 미표시" : "") });
    var B = boardStations(), noExit = [], twoExit = [], noM = [], twoM = [];
    B.forEach(function (c) {
      var nm = stName(c), all = G.exits[c] || [], host = all.filter(function (x) { return x.src !== "map"; }), bymap = all.filter(function (x) { return x.src === "map"; });
      noM.push(!host.length); twoM.push(host.length > 1);
      if (!host.length) noExit.push(nm + (bymap.length ? "(지도 기준 " + bymap.map(function (x) { return x.no + "번"; }).join(" / ") + ")" : "(출구 칸 없음)"));
      else if (host.length > 1) twoExit.push(nm + "(" + host.map(function (x) { return x.no + "번"; }).join(" / ") + ")");
    });
    add({ state: noExit.length ? "warn" : "ok", big: [noExit.length, B.length], title: "주최 안내에 출구 없는 역", marks: noM,
      longTitle: "주최 안내에 출구가 적히지 않은 역 " + noExit.length, long: noExit.length ? noExit.join(", ") + " — 지도 경로 계산 기준 가장 가까운 출구를 「지도 기준」으로 주최 출처와 구분해 표시" : "카드가 가리키는 모든 역에 주최가 적은 출구 있음" });
    add({ state: twoExit.length ? "warn" : "ok", big: [twoExit.length, B.length], title: "주최 표기 두 가지인 역", marks: twoM,
      longTitle: "주최 표기가 두 가지인 출구 " + twoExit.length, long: twoExit.length ? twoExit.join(", ") + " — 공연장 안내와 「오시는 길」 표기가 달라 둘 다 출처와 함께 표시" : "표기 일치" });
    var fq = G.faqExits, fqDiff = [], fqM = [];
    Object.keys(fq.by).forEach(function (c) {
      (G.exits[c] || []).forEach(function (x) { var d = x.no !== fq.by[c]; fqM.push(d); if (d) fqDiff.push(stName(c) + " — " + G.t.ko.exitSrc[x.src] + " " + x.no + "번, 개방 파일 " + fq.by[c] + "번"); });
    });
    add({ state: fqDiff.length ? "warn" : "ok", big: [fqDiff.length, fqM.length], title: "개방 파일과 다른 주최 출구 표기", marks: fqM,
      longTitle: "개방 파일의 출구 표기와 다른 주최 안내 " + fqDiff.length, long: "자주 묻는 질문정보(" + fq.id + ") 대중교통 문항과 대조. " + (fqDiff.length ? fqDiff.join(" · ") : "모두 일치") });
    var off = M.filter(function (m) { return !listed(m.s); });
    add({ state: off.length ? "warn" : "ok", big: [off.length, M.length], title: "주최 공연정보 목록에 없는 공연 날", marks: M.map(function (m) { return !listed(m.s); }),
      longTitle: "주최 공연정보 목록에 없는 공연 날 " + off.length, long: off.length ? off.map(function (m) { return label(m.s) + " " + (m.s.venue || ""); }).join(" · ") + " — 다른 공지에만 있는 날. 카드는 「주최 공지 기준」 꼬리표로 생성, 공연정보 목록에 올라오면 꼬리표 해제" : "모든 회차가 주최 공연정보 목록에 있음" });
    add({ state: "warn", word: WK.speed ? "분속 " + WK.speed + "m" : "지도 계산", title: "걷는 시간 = 지도 계산값",
      longTitle: "걷는 시간 출처", long: "지도 보행 경로 계산값" + (WK.speed ? "(분속 " + WK.speed + "m)" : "") + ". 주최 안내에 역 출구~공연장 걷는 시간 없음. 주최 실측값 확보 시 교체" });
    add({ state: "ok", word: TR.basis, title: "열차 시각표 기준일",
      longTitle: "열차 시각표 기준일 " + TR.basis, long: "공식 시각표 파일이 바뀌면 마지막 열차 표 재생성. 그 밖에 손댈 것 없음" });
    return out;
  }
  function renderCheck(M) {
    var ul = $("o-check"), full = $("o-check-full"), K = checks(M); ul.textContent = ""; full.textContent = "";
    K.forEach(function (c) {
      var li = el("li", c.state + (c.hot ? " hot" : "")), b = el("b", c.word ? "w" : null);
      if (c.word) b.textContent = c.word; else { b.appendChild(document.createTextNode(String(c.big[0]))); b.appendChild(el("small", null, "/" + c.big[1])); }
      li.appendChild(b); li.appendChild(el("span", null, c.title));
      if (c.marks) { var mt = el("span", "ov-mt"); mt.setAttribute("aria-hidden", "true"); c.marks.forEach(function (on) { mt.appendChild(el("i", on ? "on" : "")); }); li.appendChild(mt); }
      if (c.note) li.appendChild(el("em", null, c.note));
      ul.appendChild(li);
      var fl = el("li", c.state); fl.appendChild(el("b", null, c.longTitle)); fl.appendChild(el("span", null, c.long)); full.appendChild(fl);
    });
    $("o-check-n").textContent = "점검 항목 글로 보기 · " + K.length + "줄";
  }

  // 역 출구 표기: 역마다 출처 넷을 나란히. 빈 칸 = 그 출처에 표기 없음, 뒤집힌 칸 = 같은 역인데 앞 칸과 표기가 다름.
  function renderExits() {
    var box = $("o-exits"), fq = G.faqExits, list = boardStations(); box.textContent = "";
    Object.keys(fq.by).forEach(function (c) { if (list.indexOf(c) < 0) list.push(c); });
    var cols = [["venue", "주최 공연장 안내"], ["park", "주최 「오시는 길」"], ["map", "지도 기준"], ["faq", "개방 파일"]];
    box.appendChild(el("span", "h"));
    cols.forEach(function (c) { box.appendChild(el("span", "h", c[1])); });
    list.forEach(function (c) {
      var st = TR.stations[c], nm = el("span", "st"), base = null;
      nm.appendChild(el("small", null, st ? st.line + "호선" : "")); nm.appendChild(document.createTextNode(st ? st.name : c)); box.appendChild(nm);
      cols.forEach(function (col) {
        var v = col[0] === "faq" ? (fq.by[c] || "") : (G.exits[c] || []).filter(function (x) { return x.src === col[0]; }).map(function (x) { return x.no; }).join(" / ");
        var cls = "c"; if (!v) cls += " none"; else if (base == null) base = v; else if (v !== base) cls += " alt";
        var cell = el("span", cls, v || ""); cell.setAttribute("aria-label", stName(c) + " " + col[1] + " " + (v ? v + "번" : "표기 없음")); box.appendChild(cell);
      });
    });
  }

  function renderSrc() {
    var src = $("o-src"); src.textContent = "";
    G.t.ko.src({ seen: G.seen, basis: TR.basis }).slice(0, 5).forEach(function (line) { src.appendChild(el("li", null, line.replace(/\{S:([^}]+)\}/g, "$1역"))); });
  }

  function renderAll() { var M = model(); renderNums(M); renderStrip(M); renderTimeline(M); renderShows(M); renderCheck(M); }
  renderForm(); renderLegend(); renderAll(); renderExits(); renderSrc();
  window.RC_OPS = { overridesText: overridesText, model: model };
})();
