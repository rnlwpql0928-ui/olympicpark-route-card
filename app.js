/* 동선 카드 — 화면 동작.
 * 숫자는 모두 data/*.js 에서 읽어 계산한다(여기에 시각·배수·날 수를 적지 않는다).
 * 열차 방향은 시각표의 방향 이름(UP·DOWN·IN·OUT)을 믿지 않고, 그 역을 지나는 열차의 정차 순서에서 찾는다.
 * 주소: #/언어/회차/행선지/어디까지  (예: #/ko/1114-dome-1800/city5/방화)
 */
(function () {
  "use strict";
  var G = window.RC_GUIDE, TR = window.RC_TRAINS, SH = window.RC_SHOWS, NI = window.RC_NIGHTS, FA = window.RC_FACTS, WK = window.RC_WALK;
  var LANGS = ["ko", "en", "zh", "ja"], LI = { en: 0, zh: 1, ja: 2 };
  var SVGNS = "http://www.w3.org/2000/svg", XLINK = "http://www.w3.org/1999/xlink";
  // 카드를 만드는 회차: 공연장이 G.venues 에 있고 날짜·시작 시각이 있는 회차 전부. 주최 공연 목록에 없는 회차(card: false)는 꼬리표 「주최 공지 기준」을 단다.
  var SHOWS = SH.shows.filter(function (s) { return G.venues[s.venue] && s.date && s.start; });
  var OV = window.RC_OVERRIDES || {};   // 운영 점검표에서 받아 게시한 기획사 다섯 칸(data/overrides.js). 파일이 없어도 카드는 그린다.
  var S = { lang: "ko", show: SHOWS[0], dest: null, to: null, col: "host" };
  var PLAN = null, PLANS = [];   // PLAN = 고른 칸의 계획, PLANS = 그려지는 칸들의 계획(주최 안내 역이 먼저)
  var REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var $ = function (id) { return document.getElementById(id); };

  // ---------- 글자·이름 ----------
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function T() { return G.t[S.lang]; }
  function N(ko) { if (S.lang === "ko") return ko; var n = TR.names[ko]; return n ? n[LI[S.lang]] : ko; }
  function St(ko) { return T().station(N(ko)); }
  function fill(s) {
    return String(s).replace(/\{S:([^}]+)\}/g, function (_, k) { return St(k); })
      .replace(/\{HRS\}/g, T().hrs(NI.rule.h0, NI.rule.h1)).replace(/\{MIN\}/g, NI.rule.min);
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function svg(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function link(href, text) { var a = el("a", "lnk", text + " ↗"); a.href = href; a.target = "_blank"; a.rel = "noopener"; return a; }
  function num(n) { return new Intl.NumberFormat(G.locale[S.lang]).format(n); }

  // ---------- 시각 ----------
  function toMin(hm) { var p = hm.split(":"); return (+p[0]) * 60 + (+p[1]); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function clock(m) { return pad(Math.floor(m / 60) % 24) + ":" + pad(m % 60); }
  function isNext(m) { return m >= 1440; }
  function clockMark(m) { return clock(m) + (isNext(m) ? " +1" : ""); }

  // ---------- 회차 ----------
  function showId(s) { return s.date.slice(5, 7) + s.date.slice(8, 10) + "-" + G.venues[s.venue].slug + "-" + s.start.replace(":", ""); }
  // 기획사 다섯 칸을 읽는 순서: 이 브라우저에 저장한 값(운영자 미리보기) → 게시한 overrides.js → 빈 값
  function orgOf(s) {
    var id = showId(s);
    try { var o = JSON.parse(localStorage.getItem("rc_org_" + id) || "null"); if (o && typeof o === "object") return o; } catch (e) { /* 저장소가 막혀 있으면 게시 파일 값을 쓴다 */ }
    var f = OV[id]; return f && typeof f === "object" ? f : {};
  }
  function eff(s) {
    var o = orgOf(s), c = {}, k; for (k in s) c[k] = s[k]; c.org = o;
    if (/^\d{1,2}:\d{2}$/.test(o.end || "")) { var m = toMin(o.end) - toMin(s.start); if (m <= 0) m += 1440; if (m <= 480) { c.dur = m; c.durSrc = "org"; } }
    return c;
  }
  // 시각표 종류: 회차 자료에 공휴일 표로 판정한 daytype 이 있으면 그것을, 없으면 요일로(ops.js 와 같은 판정)
  function dayType(s) { return /^(DAY|SAT|END)$/.test(s.daytype || "") ? s.daytype : s.dow === 5 ? "SAT" : s.dow === 6 ? "END" : "DAY"; }
  function endMin(s) { return toMin(s.start) + s.dur; }
  function dateObj(iso) { var p = iso.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function fmtDate(iso, opt) { var o = { timeZone: "UTC" }; for (var k in opt) o[k] = opt[k]; return new Intl.DateTimeFormat(G.locale[S.lang], o).format(dateObj(iso)); }
  function venueName(s) { var v = G.venues[s.venue]; return S.lang === "ko" || v.en === s.venue ? s.venue : v.en + " (" + s.venue + ")"; }

  // ---------- 열차 ----------
  function stn(code) { return TR.stations[code]; }
  function dirToward(code, target) {
    var s = stn(code);
    for (var d in s.order) { var o = s.order[d], i = o.indexOf(s.name); if (i >= 0 && o.indexOf(target, i + 1) > i) return d; }
    return null;
  }
  function stopsTo(code, dir, name) { var s = stn(code), o = s.order[dir], i = o.indexOf(s.name); return i < 0 ? 0 : o.indexOf(name, i + 1) - i; }
  function reaches(code, dir, term, target) { var a = stopsTo(code, dir, target), b = stopsTo(code, dir, term); return a > 0 && b > 0 && a <= b; }
  function deps(code, dir, dt) { var d = stn(code).dirs[dir]; return (d && d[dt]) || []; }
  function lastTo(code, dir, dt, target) { var L = deps(code, dir, dt), best = null; for (var k = 0; k < L.length; k++) if (reaches(code, dir, L[k][1], target)) best = L[k]; return best; }
  function arrAt(viaCode, dt, train) { var a = TR.arrivals[viaCode]; return a && a[dt] ? a[dt][train] : null; }
  function lastBefore(code, dir, dt, target, viaCode, deadline) {
    if (deadline == null) return lastTo(code, dir, dt, target);
    var L = deps(code, dir, dt), best = null;
    for (var k = 0; k < L.length; k++) { var a = arrAt(viaCode, dt, L[k][2]); if (reaches(code, dir, L[k][1], target) && a && toMin(a) + 1 + Math.ceil(TR.transfer[viaCode].sec / 60) <= deadline) best = L[k]; }
    return best;
  }
  function ladder(code, dir, dt) {
    var m = {}; deps(code, dir, dt).forEach(function (x) { m[x[1]] = x[0]; });
    return Object.keys(m).map(function (k) { return [m[k], k]; }).sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
  }
  function serviceEnd(dt) {
    var mx = 0;
    Object.keys(TR.stations).forEach(function (c) { var D = stn(c).dirs; for (var d in D) { var L = D[d][dt] || []; if (L.length) mx = Math.max(mx, toMin(L[L.length - 1][0])); } });
    return mx;
  }

  // ---------- 공연 밤 통계 ----------
  function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }), n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; }
  var MED = [0, 1, 2, 3].map(function (c) { return c ? median(NI.hits.map(function (h) { return h[c]; })) : null; });
  function mean(a) { var s = 0; a.forEach(function (v) { s += v; }); return s / a.length; }
  var AVG = [0, 1, 2, 3].map(function (c) { return c ? mean(NI.hits.map(function (h) { return h[c]; })) : null; });
  var LOWER = NI.hits.filter(function (h) { return h[2] < h[1] && h[3] < h[1]; }).length;   // 근처 두 역이 모두 올림픽공원역보다 평소 대비 덜 늘어난 밤 수
  var NIGHT_ST = [null, "올림픽공원", "몽촌토성", "방이"], NIGHT_LINE = [null, "5", "8", "5"];
  var NIGHT_CODE = [null, "2556", "2814", "2557"];   // nights.js 열 → 역 코드(5호선 올림픽공원 · 몽촌토성 · 방이)

  // ---------- 계획(행선지 → 타는 곳·마지막 열차) ----------
  function destById(id) { for (var i = 0; i < G.dests.length; i++) if (G.dests[i].id === id) return G.dests[i]; return null; }
  // 갈아타는 길은 뒤에서부터 푼다: 마지막에 타는 열차의 출발보다, 앞 열차가 갈아타는 역에 닿는 시각이 일러야 한다.
  // 갈아타는 시간은 공식 환승 소요시간(분으로 올림)에 1분(시각표를 분으로 자른 몫)을 더해 넣는다.
  // ---------- 두 칸: 주최가 안내하는 역(host) · 공연 밤에 덜 붐볐던 역(less) ----------
  // 같은 날짜의 KSPO DOME 저녁 공연(G.rules.eveningFrom 이후 시작). 밤의 종류와 낮 공연 판정이 이 회차를 기준으로 한다.
  function sameDayDome(s) {
    for (var i = 0; i < SHOWS.length; i++) { var o = SHOWS[i]; if (o.date === s.date && G.venues[o.venue].slug === "dome" && toMin(o.start) >= toMin(G.rules.eveningFrom)) return eff(o); }
    return null;
  }
  function nightKind(s) { return sameDayDome(s) ? "dome" : "other"; }
  // 낮 공연: 같은 날 KSPO DOME 저녁 공연의 끝보다 G.rules.dayGap 분 넘게 일찍 끝나는 회차(덜 붐볐던 역 칸·배수·숫자 문장을 싣지 않는다)
  function dayShow(s) { var dome = sameDayDome(s); return !!dome && showId(dome) !== showId(s) && endMin(s) < endMin(dome) - G.rules.dayGap; }
  function walkOf(s, code) { var v = WK.pairs[G.venues[s.venue].slug]; return (v && v[code]) || null; }
  function lateEnd(s) { return s.durSrc === "assumed" ? toMin(s.start) + G.rules.endLate : endMin(s); }   // 여유를 셀 때 쓰는 끝(가정이면 늦은 쪽)
  // 칸 하나의 조건: 역이 자료에 없으면 null. less 칸은 낮 공연이면 접고(day), 공원 안쪽 길(aroundMin 이 있는 역)은 22시 조건을 본다.
  function colInfo(s, d, which) {
    var c = d.cols && d.cols[which]; if (!c || !TR.stations[c.st]) return null;
    var w = walkOf(s, c.st); if (!w) return null;
    var info = { which: which, spec: c, w: w, walk: w.min, m: w.m, fold: null, parkIf: false };   // walk·m = 이 칸이 쓰는 길 하나(걷는 시간·거리·나설 시각이 모두 이 값)
    if (which === "less") {
      var lim = toMin(G.rules.parkEntryUntil);
      if (dayShow(s)) info.fold = "day";
      else if (w.aroundMin != null) {
        // 가장 일찍 끝나도(끝 + 공원 안쪽 길) 22시를 넘으면 접는다. 늦게 끝날 때만 넘으면(가정 회차) 공원을 돌아가는 길로 셈하고 안쪽 길은 조건 줄로 둔다.
        // 돌아가는 길은 공원 안 구간(aroundParkM)이 G.rules.aroundInsideMax 이하일 때만 인정한다(공연장에서 공원 가장자리까지만 공원 안). 더 길면 도는 길이 없는 공연장으로 보고 접는다.
        var canAround = w.aroundParkM != null && w.aroundParkM <= G.rules.aroundInsideMax;
        if (endMin(s) + w.min > lim) { info.fold = "park"; info.noWay = !canAround; }
        else if (s.durSrc === "assumed" && toMin(s.start) + G.rules.endLate + w.min > lim) {
          if (canAround) { info.parkIf = true; info.walk = w.aroundMin; info.m = w.aroundM; } else { info.fold = "park"; info.noWay = true; }
        }
      }
    }
    return info;
  }
  function plan(s, d, toWanted, which) {
    var dt = dayType(s), host = colInfo(s, d, "host"), less = colInfo(s, d, "less");
    var ci = which === "less" && less && !less.fold ? less : host, c = ci.spec, hot = !!c.viaAlt;
    var code = c.st, dir = dirToward(code, c.toward);
    var tos = d.to, to = toWanted && tos.indexOf(toWanted) >= 0 ? toWanted : tos[tos.length - 1];
    var conn = [], last, leg = to;
    if (d.hop) {
      var l2 = null, deadline = null;
      if (to !== d.hop.name) { l2 = lastTo(d.xfer.st, dirToward(d.xfer.st, to), dt, to); deadline = l2 ? toMin(l2[0]) : -1; }
      if (!hot) { leg = d.hop.name; last = lastBefore(code, dir, dt, leg, d.hop.at, deadline); }
      else {
        var m = d.alt.mid, dm = dirToward(m.st, m.toward), l8 = lastBefore(m.st, dm, dt, m.toward, d.hop.at, deadline);
        leg = d.alt.hop.name; last = l8 ? lastBefore(code, dir, dt, leg, d.alt.hop.at, toMin(l8[0])) : null;
        if (l8) conn.push({ st: m.st, toward: m.toward, x: l8 });
      }
      if (l2) conn.push({ st: d.xfer.st, toward: to, x: l2 });
    } else last = lastTo(code, dir, dt, to);
    var leave = last ? toMin(last[0]) - ci.walk - G.rules.leaveBuffer : null;   // 늦어도 나설 시각 = 마지막 열차 − 걷는 시간 − 여유
    return { s: s, d: d, dt: dt, hot: hot, code: code, dir: dir, tos: tos, to: to, leg: leg, last: last, conn: conn, lad: ladder(code, dir, dt),
      col: ci.which, ci: ci, host: host, less: less, leave: leave };
  }
  // 그려지는 칸: 주최 안내 역 칸은 늘, 덜 붐볐던 역 칸은 접히지 않았고 마지막 열차가 있을 때만
  function colPlans(pl) {
    var out = [pl.col === "host" ? pl : plan(pl.s, pl.d, pl.to, "host")];
    if (pl.less && !pl.less.fold) { var lp = pl.col === "less" ? pl : plan(pl.s, pl.d, pl.to, "less"); if (lp.last) out.push(lp); }
    return out;
  }
  // 공연 밤 승차 배수: 평일은 금요일 엄격 비교(행사 없는 금요일 대비, 밤의 종류로 dome/other), 주말은 KSPO DOME 저녁 공연 날 시작 몇 시간 뒤 칸(같은 요일 모든 날 대비). 주말 other 밤은 자료 없음.
  function ratioFor(s, code, count) {
    var dt = dayType(s), kind = nightKind(s);
    if (dt === "DAY") { var set = FA.fri.sets[kind], r = set && set.st[code]; return r ? { base: "fri", kind: kind, days: set.days, r: r.ratio, n: count ? r.val : null, h: FA.fri.hours.h1 - FA.fri.hours.h0 } : null; }
    if (kind !== "dome") return null;
    var grp = dt === "SAT" ? "sat" : "sun", g = FA.boardByStart.groups[grp], k = FA.boardByStart.offsets.indexOf(G.rules.boardOffset), q = g && g.st[code];
    return q && k >= 0 ? { base: "end", grp: grp, days: g.days, r: q.ratio[k], off: G.rules.boardOffset } : null;
  }
  function fx1(v) { return v.toFixed(1); }
  function stLabel(code) { var st = stn(code); return (st.name === "올림픽공원" ? T().line(st.line) + " " : "") + St(st.name); }   // 올림픽공원역은 5·9호선이 같은 이름이라 노선을 붙인다
  function ratioText(s, p) {
    if (dayShow(s)) return "";   // 낮 공연: 저녁 공연 밤의 배수를 붙이지 않는다
    var r = ratioFor(s, p.code, p.ci.spec.count), t = T(); if (!r) return "";
    return r.base === "fri" ? t.col.ratioFri(fx1(r.r), r.n != null ? num(Math.round(r.n)) : null, r.h) : t.col.ratioEnd(fx1(r.r), r.off);
  }
  // 숫자 문장: 그려지는 칸의 역들만, 한 문장에 한 기준. 낮 공연(덜 붐볐던 역 칸을 접은 회차)에는 그리지 않는다.
  function factsLine(s, cols) {
    if (dayShow(s)) return "";
    var t = T(), f0 = null, parts = [];
    cols.forEach(function (p) { var r = ratioFor(s, p.code, p.ci.spec.count); if (r) { f0 = f0 || r; parts.push({ st: stLabel(p.code), r: fx1(r.r), n: r.n != null ? num(Math.round(r.n)) : null, h: r.h }); } });
    if (!parts.length) return "";
    return f0.base === "fri" ? t.col.factFri({ kind: f0.kind, days: f0.days, parts: parts }) : t.col.factEnd({ grp: f0.grp, days: f0.days, off: f0.off, parts: parts });
  }
  // 약도에서 가는 곳을 누르면: 그곳까지 가는 길들 가운데 갈아타기가 적은 길, 그다음 마지막 열차가 늦은 길을 먼저 권한다.
  function candidates(key) {
    return G.dests.filter(function (d) { return d.to.indexOf(key) >= 0; }).map(function (d) { return plan(S.show, d, key); }).filter(function (p) { return p.last; })
      .sort(function (a, b) { return a.conn.length - b.conn.length || toMin(b.last[0]) - toMin(a.last[0]); });
  }
  var REVEAL = false;
  function pickNode(key) {
    var c = candidates(key);
    if (c.length) { REVEAL = true; go({ dest: c[0].d.id, to: key, col: "host" }); return; }
    var n = NODE_EL[key]; if (n) { n.classList.remove("nope"); void n.getBoundingClientRect(); n.classList.add("nope"); }
    $("ro-sub").textContent = T().noTrain(St(key));
  }
  // 약도에서 골랐을 때 왼쪽 답이 화면 밖이면 그 자리로 데려간다.
  function reveal() {
    var r = $("answer").getBoundingClientRect();
    if (r.top < 56 || r.top > window.innerHeight * 0.55) window.scrollTo({ top: window.scrollY + r.top - 72, behavior: REDUCED ? "auto" : "smooth" });
  }

  // ---------- 주소 ----------
  // 고른 칸은 「어디까지」 뒤 한 마디(less)로 싣는다. 없으면 주최 안내 역 칸.
  function buildHash(st) {
    var dd = st.dest ? destById(st.dest) : null, less = !!dd && st.col === "less", to = st.to || (less ? dd.to[dd.to.length - 1] : null);
    return "#/" + st.lang + "/" + showId(st.show) + (st.dest ? "/" + st.dest + (to ? "/" + encodeURIComponent(to) : "") + (less ? "/less" : "") : "");
  }
  function defaultLang() {
    var c = (navigator.languages || [navigator.language || "ko"]);
    for (var i = 0; i < c.length; i++) { var k = String(c[i]).slice(0, 2).toLowerCase(); if (LANGS.indexOf(k) >= 0) return k; }
    return "en";
  }
  function defaultShow() {
    var d = new Date(), today = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    for (var i = 0; i < SHOWS.length; i++) if (SHOWS[i].date >= today) return SHOWS[i];
    return SHOWS[0];
  }
  function parse() {
    var raw = location.hash.replace(/^#\/?/, ""), h = raw ? raw.split("/") : [];
    var to = null; try { to = h[3] ? decodeURIComponent(h[3]) : null; } catch (e) { to = null; }
    var show = null; for (var i = 0; i < SHOWS.length; i++) if (showId(SHOWS[i]) === h[1]) show = SHOWS[i];
    S.lang = LANGS.indexOf(h[0]) >= 0 ? h[0] : defaultLang();
    S.show = eff(show || defaultShow());
    S.dest = destById(h[2]) ? h[2] : null;
    S.to = S.dest ? to : null;
    S.col = S.dest && h[4] === "less" ? "less" : "host";
  }
  function go(patch) {
    var next = { lang: S.lang, show: S.show, dest: S.dest, to: S.to, col: S.col }; for (var k in patch) next[k] = patch[k];
    var h = buildHash(next);
    if (location.hash === h) render(); else location.hash = h;
  }

  // ---------- 움직임: 넘어가는 숫자판·세어 올리기·물결 ----------
  function setFlap(btn, text, plus) {
    var changed = btn.dataset.v !== text + (plus ? "+" : "");
    btn.dataset.v = text + (plus ? "+" : ""); btn.textContent = "";
    text.split("").forEach(function (ch) { var sp = el("span", /\d/.test(ch) ? "fd" : "fs", ch); sp.dataset.f = ch; btn.appendChild(sp); });
    if (plus) btn.appendChild(el("sup", null, "+1"));
    if (changed) runFlap(btn);
  }
  function runFlap(btn) {
    if (REDUCED) return;
    Array.prototype.forEach.call(btn.querySelectorAll(".fd"), function (sp, i) {
      var n = 0, max = 7 + i * 3; clearInterval(sp._t); sp.classList.add("roll");
      sp._t = setInterval(function () { n++; if (n >= max) { clearInterval(sp._t); sp.textContent = sp.dataset.f; sp.classList.remove("roll"); } else sp.textContent = Math.floor(Math.random() * 10); }, 42);
    });
    btn.classList.remove("tapped"); void btn.offsetWidth; btn.classList.add("tapped");
  }
  function ripple() {
    var L = $("routeL"); if (!L || REDUCED || !PLAN) return;
    var k = stn(PLAN.code).name; if (!G.map.nodes[k]) return; var p = pt(k), c = svg("circle", { cx: p[0], cy: p[1], r: 10, class: "ripple" }); L.appendChild(c);
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 1300);
  }
  function tapFlap() { runFlap($("a-last")); runFlap($("ro-time")); ripple(); if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) { /* 진동을 못 쓰는 기기 */ } } }
  function countUp(node, target, digits, fmt) {
    if (REDUCED) { node.textContent = fmt(target.toFixed(digits)); return; }
    var t0 = null, dur = 900;
    function step(ts) { if (t0 == null) t0 = ts; var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3); node.textContent = fmt((target * e).toFixed(digits)); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var IO = "IntersectionObserver" in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); if (e.target._onIn) { e.target._onIn(); e.target._onIn = null; } IO.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" }) : null;
  function watch(node, onIn) { node.classList.add("rv"); node._onIn = onIn || null; if (IO) IO.observe(node); else { node.classList.add("in"); if (onIn) onIn(); } }

  // ---------- 그리기: 틀 ----------
  function renderFrame() {
    var t = T();
    document.documentElement.lang = S.lang === "zh" ? "zh-Hans" : S.lang;
    document.title = t.title;
    $("t-brand").textContent = t.brand; $("t-tag").textContent = t.tag;
    ["t-sec1", "t-sec2", "t-sec3", "t-sec4", "t-sec5", "t-src"].forEach(function (id, i) { $(id).textContent = t.sec[i]; });
    $("ask").innerHTML = t.ask; $("askhint").textContent = t.askHint;
    $("b-copy").textContent = t.copy; $("b-ics").textContent = t.ics;
    $("s-end").textContent = t.more.end; $("s-arrive").textContent = t.more.arrive; $("s-why").textContent = t.more.why;
    $("s-conn").textContent = t.more.conn; $("s-how").textContent = t.more.how; $("s-src").textContent = t.more.src;
    var cr = $("shotcredit"); cr.textContent = G.photo.credit + " ↗"; cr.href = G.photo.page; shotLabels();
    var tb = $("theme"); tb.dataset.dark = t.themeDark; tb.dataset.light = t.themeLight; if (window.KS_THEME) window.KS_THEME.paint();
    $("brand").href = buildHash({ lang: S.lang, show: S.show, dest: null, to: null });
    var nav = $("langs"); nav.textContent = "";
    LANGS.forEach(function (l) {
      var b = el("button", null, G.langName[l]); b.type = "button"; b.lang = l === "zh" ? "zh-Hans" : l;
      b.setAttribute("aria-pressed", String(l === S.lang)); b.onclick = function () { go({ lang: l }); }; nav.appendChild(b);
    });
    var u = $("srctext"); u.textContent = "";
    t.src({ seen: G.seen, basis: TR.basis }).forEach(function (line) { u.appendChild(el("li", null, line)); });
    var ops = el("li"), oa = el("a", "lnk", t.opsLink); oa.href = "ops.html"; ops.appendChild(oa); u.appendChild(ops);
  }

  // ---------- 그리기: 01 공연 ----------
  function renderShows() {
    var box = $("chips"), t = T(); box.textContent = "";
    function chip(s) { return s.date.slice(5, 7) + "." + s.date.slice(8, 10) + " " + fmtDate(s.date, { weekday: "short" }) + " " + s.start + " " + G.venues[s.venue].code; }
    SHOWS.forEach(function (s) {
      var b = el("button", null, chip(s)); b.type = "button"; b.title = s.title + (s.card ? "" : " · " + t.noticeTag);
      if (!s.card) b.appendChild(el("small", "ntag", t.noticeTag));
      b.setAttribute("aria-pressed", String(showId(s) === showId(S.show)));
      b.onclick = function () { $("pick").open = false; go({ show: s }); }; box.appendChild(b);
    });
    $("cur").textContent = chip(S.show) + (S.show.card ? "" : " · " + t.noticeTag); $("chg").textContent = t.others(SHOWS.length - 1);
    var s = S.show, v = G.venues[s.venue], p = $("showtitle"), en = S.lang !== "ko" && s.enTitle; p.textContent = "";
    // 외국어 카드: 영문 공식 제목이 자료에 있으면 먼저, 한글 제목은 그 아래 작게. 없으면 한글 제목만.
    var a = el("a", null, en ? s.enTitle : s.title); a.href = s.url; a.target = "_blank"; a.rel = "noopener"; if (en) a.lang = "en"; p.appendChild(a);
    if (en) { var ko = el("small", "ko", s.title); ko.lang = "ko"; p.appendChild(ko); }
    p.appendChild(el("small", null, fmtDate(s.date, { month: "long", day: "numeric", weekday: "short" }) + " · " + venueName(s) + " · " + t.startAt(s.start)));
    var nt = $("noticetag"); nt.hidden = !!s.card; $("noticetag-s").textContent = s.card ? "" : t.noticeTag; $("noticetag-p").textContent = s.card ? "" : t.noticeWhy;
    var L = $("showlinks"); L.textContent = "";
    L.appendChild(link(v.page, t.hostPage)); if (v.d3) L.appendChild(link(v.d3, t.d3));
    var car = link(G.links.screen, t.parking); car.className = "lnk car"; L.appendChild(car);   // 차로 온 관람객: 주최 실시간 주차 화면
    var on = $("orgnote"); on.textContent = "";
    var ol = ["booth", "goods", "exitWay", "shuttle"].filter(function (k) { return s.org && s.org[k]; });
    if (ol.length) { on.appendChild(el("b", null, t.orgHead)); ol.forEach(function (k) { on.appendChild(el("span", null, t.orgLabel[k] + ": " + s.org[k])); }); }
    $("tlnote").textContent = s.durSrc === "org" ? t.dur.org(s.dur) : s.durSrc === "rental" ? t.dur.rental(s.dur) : s.durSrc === "screen" ? t.dur.screen(s.dur, SH.screenSeen) : t.dur.assumed(s.dur, SH.assume.n);
  }
  function renderTimeline() {
    var s = S.show, t = T(), dt = dayType(s), st = toMin(s.start), en = endMin(s);
    var last = PLAN && PLAN.last ? toMin(PLAN.last[0]) : null;
    var t0 = st - 90, t1 = Math.max(en + 30, serviceEnd(dt)) + 10, box = $("tl"); box.textContent = "";
    function pct(m) { return ((m - t0) / (t1 - t0) * 100).toFixed(2) + "%"; }
    function seg(cls, a, b) { if (b <= a) return; var e = el("div", "seg " + cls); e.style.left = pct(a); e.style.width = ((b - a) / (t1 - t0) * 100).toFixed(2) + "%"; box.appendChild(e); }
    function tick(cls, m, label, text) { var e = el("div", "tick " + cls); e.style.left = pct(m); e.appendChild(el("i", null, label)); e.appendChild(document.createTextNode(text || clock(m))); box.appendChild(e); var p = el("div", "pin"); p.style.left = pct(m); box.appendChild(p); }
    // 오는 길 붐빔: 자료가 KSPO DOME 저녁 공연 날의 하차 기록이므로, 같은 날 KSPO DOME 저녁 공연의 시작 시(H)로 묶음을 고른다(그런 공연이 없는 날은 그리지 않는다). 칸 off = 시계 시각 (H+off):00~(H+off+1):00
    var AB = FA.alightByStart, dome = sameDayDome(s), H = dome ? Math.floor(toMin(dome.start) / 60) : null, bk = H == null ? null : AB.byHour[String(H)], drawn = false, inA = null;
    var use = bk && bk.days >= G.rules.arrivalMinDays && bk.st[G.rules.arrivalStation] ? bk.st[G.rules.arrivalStation].ratio : null;
    if (use) AB.offsets.forEach(function (off, k) {
      if (off >= 0 || !(use[k] >= G.rules.arrivalBandMin)) return;
      var a = Math.max((H + off) * 60, t0), b = Math.min((H + off + 1) * 60, st);
      if (b > a) { seg("in", a, b); if (inA == null || a < inA) inA = a; drawn = true; }
    });
    if (inA != null) { var lab = el("div", "tick in", t.tIn); lab.style.left = pct(inA); box.appendChild(lab); }
    box.classList.toggle("hasin", inA != null);
    seg("show" + (s.durSrc === "assumed" ? " assumed" : ""), st, en);
    if (last != null && last > en) seg("out", en, last);
    tick("", st, t.tStart);
    if (s.durSrc === "assumed") tick("mid", en, t.tEndEst, clock(en) + "~" + clock(lateEnd(s)));   // 가정 회차는 03 의 끝나는 때와 같은 폭으로 적는다
    else tick("mid", en, t.tEnd);
    if (last != null) tick("end", last, t.tLast);
    $("m-arrive").hidden = !drawn;
    var parts = use ? AB.offsets.map(function (off, k) { return { before: -off, hour: H + off, ratio: use[k].toFixed(1) }; }).filter(function (p) { return p.before > 0; }) : [];
    $("arrnote").textContent = drawn ? fill(t.arrive({ hour: H, days: bk.days, parts: parts })) : "";
    // 띠가 없으면 접는 설명 대신 바로 보이는 한 줄(기록이 적은 시작 시 / 붐빈 칸이 없는 시작 시)
    $("arrline").textContent = drawn ? "" : use ? t.arrFlat : t.arrFew;
    // 5호선 갈림: 강동역 하행은 마천·하남검단산·상일동행으로 갈리고 올림픽공원역에는 마천행만 선다(서울교통공사 열차운행시각표 2026-09-01 판)
    $("arrfork").textContent = t.arrFork({ N: N, St: St, line: t.line("5") });
  }

  // ---------- 그리기: 02 행선지 ----------
  function destLabel(d) { return T().line(d.line) + " · " + d.via.map(N).join(" · "); }
  function renderDests() {
    var box = $("dests"); box.textContent = "";
    G.dests.forEach(function (d) {
      var b = el("button"); b.type = "button"; b.setAttribute("aria-pressed", String(d.id === S.dest));
      var lb = el("span", "lb", d.line); lb.dataset.line = d.line; b.appendChild(lb);
      b.appendChild(el("span", null, destLabel(d))); b.appendChild(el("span", "arr", "→"));
      b.onclick = function () { go({ dest: d.id, to: null, col: "host" }); }; box.appendChild(b);
    });
  }

  // ---------- 그리기: 03·04 답 ----------
  function connLines(pl) {
    var t = T();
    return pl.conn.map(function (c) { var st = stn(c.st); return t.connect({ st: t.line(st.line) + " " + St(st.name), time: clockMark(toMin(c.x[0])), term: t.bound(N(c.x[1])), toward: t.toward(N(c.toward)) }); });
  }
  function exitInto(ex, code) {
    var t = T(), st = stn(code);
    (G.exits[code] || []).forEach(function (e) {   // 지도 경로 계산으로 고른 출구는 「(지도 기준)」과 점선으로 주최 출처와 구분한다
      var bymap = e.src === "map", sp = el("span", bymap ? "bymap" : null, t.exit(e.no) + (bymap ? " (" + t.exitMapTag + ")" : "") + " ");
      sp.appendChild(el("em", null, "— " + t.exitSrc[e.src])); ex.appendChild(sp);
    });
    var a = link((S.lang === "ko" ? G.links.mapKo : G.links.mapOther) + encodeURIComponent(st.name + "역 " + st.line + "호선"), t.map);
    a.addEventListener("click", function (ev) { ev.stopPropagation(); }); ex.appendChild(a);
  }
  // 칸 하나: 머리 · 역 · 출구 · 걷는 시간(덜 붐볐던 역 칸은 몇 분 더) · 승차 배수 · 늦어도 나설 시각(크게) · 여유 · 마지막 열차(작게)
  function colCard(p, pl, hostP) {
    var t = T(), s = p.s, ci = p.ci, st = stn(p.code), on = p.col === pl.col;
    var card = el("div", "col " + ci.which + (on ? " on" : ""));
    card.appendChild(el("p", "col-head", ci.which === "host" ? t.col.hostHead : t.col.lessHead));
    var sn = el("p", "col-st"), lb = el("span", "lb", st.line); lb.dataset.line = st.line; sn.appendChild(lb); sn.appendChild(el("span", null, St(st.name))); card.appendChild(sn);
    var ex = el("p", "exit col-exit"); ex.dataset.code = p.code; exitInto(ex, p.code); card.appendChild(ex);
    var wk = el("p", "col-walk", t.col.walk(ci.walk, num(ci.m)));   // 걷는 시간·거리·몇 분 더·나설 시각은 모두 이 칸이 쓰는 길(ci.walk) 하나에서 나온다
    if (ci.which === "less") { var dw = ci.walk - hostP.ci.walk; wk.appendChild(el("b", null, " · " + (dw <= G.rules.sameWalk ? t.col.same : t.col.more(dw)))); }
    card.appendChild(wk);
    var rt = ratioText(s, p); if (rt) card.appendChild(el("p", "col-ratio", rt));
    if (p.last) {
      var lv = el("div", "col-leave"), big = el("b", null, clock(p.leave)); if (isNext(p.leave)) big.appendChild(el("small", null, t.next));
      lv.appendChild(el("span", null, t.col.leaveLabel)); lv.appendChild(big); card.appendChild(lv);
      // 여유는 끝나는 때에서 센다(가정 회차는 늦은 끝). 어느 끝에서 셌는지 문장에 적는다.
      var endAt = lateEnd(s), room = p.leave - endAt, roomy = room > G.rules.roomyFrom, est = s.durSrc === "assumed";
      card.appendChild(el("p", "col-room" + (roomy ? "" : " tight"), roomy ? t.col.roomy(room, clock(endAt), est) : room > 0 ? t.col.tight(room, clock(endAt), est) : t.col.over(clock(endAt), est)));
      card.appendChild(el("p", "col-last", t.col.lastLine(clockMark(toMin(p.last[0])), t.from(t.bound(N(p.last[1])), St(st.name))) + " · " + t.col.formula(ci.walk, G.rules.leaveBuffer)));
    } else card.appendChild(el("p", "col-last", "—"));
    if (ci.parkIf) card.appendChild(el("p", "col-cond", t.col.parkIf({ short: ci.w.min, until: G.rules.parkEntryUntil })));
    var b = el("button", "col-pick", on ? t.col.on : t.col.pick); b.type = "button"; b.setAttribute("aria-pressed", String(on)); card.appendChild(b);
    card.onclick = function () { if (!PLAN || p.col !== PLAN.col) go({ col: p.col, to: pl.to }); };
    return card;
  }
  function renderClaim() {   // 05의 머리 문장 = 숫자 문장(행선지를 안 골랐으면 5호선 도심 방면 두 칸 기준)
    var pl = PLAN || plan(S.show, destById("city5") || G.dests[0], null, "host");
    var line = factsLine(pl.s, PLAN ? PLANS : colPlans(pl));
    $("claim").textContent = line; $("cmpdiff").textContent = line ? T().cmpDiff : "";   // 머리 문장과 아래 막대는 견준 날·시간대가 다르다는 것을 적는다(머리 문장이 없으면 생략)
  }
  var ANSKEY = null, LIVEKEY = null;
  function renderAnswer() {
    var box = $("answer"), pl = PLAN, t = T();
    if (!pl) { PLANS = []; box.hidden = true; ANSKEY = null; LIVEKEY = null; $("live").textContent = ""; return; }
    box.hidden = false;
    var key = pl.d.id + "|" + pl.col; if (key !== ANSKEY) { box.classList.remove("pop"); void box.offsetWidth; box.classList.add("pop"); ANSKEY = key; }
    var s = pl.s, d = pl.d, st = stn(pl.code), x = { N: N, St: St, hits: NI.hits.length };
    // 두 칸(주최가 안내하는 역 · 공연 밤에 덜 붐볐던 역)과 끝나는 때 · 접은 이유 · 숫자 문장
    PLANS = colPlans(pl);
    var cb = $("a-cols"); cb.textContent = ""; cb.classList.toggle("one", PLANS.length < 2);
    PLANS.forEach(function (p) { cb.appendChild(colCard(p, pl, PLANS[0])); });
    $("a-end").textContent = s.durSrc === "assumed" ? t.col.endRange(s.dur / 60, G.rules.endLate / 60, clock(endMin(s)), clock(lateEnd(s))) : t.col.endAt(clock(endMin(s)));
    var fo = pl.less && pl.less.fold, dshow = dayShow(s) && d.cols && d.cols.less;   // 마천 방면처럼 덜 붐볐던 역이 없는 행선지는 이유 줄도 없다
    $("a-fold").textContent = dshow ? t.col.dayFold : fo === "park" ? (pl.less.noWay ? t.col.parkShutNoWay : t.col.parkShut)({ min: pl.less.w.aroundMin, until: G.rules.parkEntryUntil, st: St(stn(pl.less.spec.st).name) }) : "";
    $("a-facts").textContent = factsLine(s, PLANS);
    // 한 줄 이유(고른 칸)
    var why;
    if (pl.hot) { var mid = d.alt.mid; why = t.why.jamsilAlt({ St: St, line9: t.line(st.line), line8: t.line(stn(mid.st).line), n: stopsTo(pl.code, pl.dir, d.alt.hop.name), k: stopsTo(mid.st, dirToward(mid.st, mid.toward), mid.toward) }); }
    else if (pl.col === "less" && d.hop) why = t.why.jamsil({ St: St, line: t.line(st.line), n: stopsTo(pl.code, pl.dir, pl.ci.spec.toward) });
    else if (pl.col === "less") why = t.why.city5({ St: St, n: stopsTo(pl.code, pl.dir, "올림픽공원") });
    else if (d.id === "city5") why = t.col.whyHost;
    else why = t.why[d.id](x);
    $("a-why").textContent = fill(why);
    // 접어 둔 근거(고른 칸의 역 기준)
    var notes = [], nb = $("a-note"), nc = NIGHT_CODE.indexOf(pl.code); nb.textContent = "";
    if (nc > 0) { var mv = AVG[nc]; notes.push((mv >= G.rules.busyFrom ? t.note.nightBusy : t.note.night)({ hits: NI.hits.length, m: mv.toFixed(2) })); }
    if (pl.col === "less" && d.near && pl.last) { var nd = dirToward(d.near.st, d.near.toward), nl = lastTo(d.near.st, nd, pl.dt, pl.to); if (nl && nl[1] === pl.last[1]) notes.push(t.note.near({ St: St, d: toMin(nl[0]) - toMin(pl.last[0]), t: clockMark(toMin(nl[0])) })); }
    if (d.behind && pl.col === "host") notes.push(t.note.line9({ St: St, date: fmtDate(FA.line9.date, { year: "numeric", month: "short", day: "numeric" }), a: num(FA.line9.board[stn(pl.code).name]), b: num(FA.line9.board[d.behind]) }));
    notes.forEach(function (n) { nb.appendChild(el("p", null, fill(n))); });
    if (nc > 0) nb.appendChild(el("p", "foot", fill(t.note.foot)));
    $("m-why").hidden = !notes.length;
    var c = $("a-cond");
    if (pl.ci.w.aroundMin != null) { c.hidden = false; c.className = "cond"; c.textContent = fill(t.cond); }   // 주최 안내 인용만. 길 조건은 칸 안의 조건 줄이 맡는다
    else { c.hidden = true; c.textContent = ""; }   // 숨길 때 글도 비운다(다른 언어의 옛 글이 남지 않게)
    // 어디까지
    var tos = $("a-tos"); tos.textContent = ""; $("a-toask").textContent = pl.tos.length > 1 ? t.toAsk : "";
    if (pl.tos.length > 1) pl.tos.forEach(function (name) {
      var b = el("button", null, N(name)); b.type = "button"; b.setAttribute("aria-pressed", String(name === pl.to));
      b.onclick = function () { go({ to: name }); }; tos.appendChild(b);
    });
    // 큰 숫자
    $("a-daytype").textContent = fmtDate(s.date, { month: "short", day: "numeric", weekday: "short" }) + " · " + t.daytype[pl.dt];
    $("a-basis").textContent = t.basis(TR.basis);
    var bl = $("a-biglabel"); bl.textContent = t.col.leaveFor(St(pl.to)); bl.appendChild(el("span", "taphint", "↻ " + t.tap));
    var big = $("a-last"), anyNext = false;
    if (pl.last) { var lm = toMin(pl.last[0]); setFlap(big, clock(pl.leave), isNext(pl.leave)); big.setAttribute("aria-label", t.col.leaveFor(St(pl.to)) + " " + clockMark(pl.leave)); $("a-lastdest").textContent = t.col.lastLine(clockMark(lm), t.from(t.bound(N(pl.last[1])), St(st.name))) + " · " + t.col.formula(pl.ci.walk, G.rules.leaveBuffer); }
    // 화면 읽기 프로그램에는 답이 바뀔 때 한 번만 읽어 준다(도는 숫자판은 읽지 않는다)
    var lk = S.lang + "|" + pl.d.id + "|" + pl.to + "|" + pl.col + "|" + (pl.last ? pl.last[0] : ""); if (lk !== LIVEKEY) { LIVEKEY = lk; $("live").textContent = pl.last ? t.line(st.line) + " " + St(st.name) + ". " + t.bigLabel(St(pl.to)) + " " + clockMark(toMin(pl.last[0])) + " " + t.bound(N(pl.last[1])) : ""; }
    else { big.dataset.v = ""; big.textContent = "—"; $("a-lastdest").textContent = ""; }
    // 행선지별 마지막 열차: 탈 수 있는 열차 → 자르는 줄 → 못 가는 열차
    var ul = $("a-lasts"), ok = [], no = []; ul.textContent = ""; $("a-bdhead").textContent = t.ladderHead;
    pl.lad.forEach(function (r) { var m = toMin(r[0]); (reaches(pl.code, pl.dir, r[1], pl.leg) && pl.last && m <= toMin(pl.last[0]) ? ok : no).push(r); });
    if (pl.last && !ok.some(function (r) { return r[0] === pl.last[0] && r[1] === pl.last[1]; })) { ok.push([pl.last[0], pl.last[1]]); ok.sort(function (a, b) { return toMin(a[0]) - toMin(b[0]); }); }   // 고른 열차는 늘 줄 위에 보인다
    function rowOf(r, cls) { var m = toMin(r[0]), li = el("li", cls), b = el("b", null, clock(m)); if (isNext(m)) { b.appendChild(el("sup", null, "+1")); anyNext = true; } li.appendChild(b); li.appendChild(document.createTextNode(t.bound(N(r[1])))); ul.appendChild(li); }
    ok.forEach(function (r) { rowOf(r, "ok"); });
    if (no.length) { ul.appendChild(el("li", "cut", t.cut(St(pl.to)))); no.forEach(function (r) { rowOf(r, "no"); }); }
    $("a-legend").textContent = anyNext ? t.nextNote : "";
    // 갈아타는 열차
    var cn = $("a-conn"); cn.textContent = "";
    connLines(pl).forEach(function (line) { cn.appendChild(el("li", null, line)); });
    $("m-conn").hidden = !pl.conn.length;
    $("a-transfer").textContent = pl.conn.length ? t.connNote(pl.conn.map(function (c2) { var tf = TR.transfer[c2.st === d.xfer.st ? d.hop.at : d.alt.hop.at]; return t.minSec(St(tf.name), Math.floor(tf.sec / 60), tf.sec % 60); })) : "";
  }

  // ---------- 그리기: 05 이유 ----------
  function renderWhy() {
    var t = T(), H = NI.hits, hitMap = {};
    H.forEach(function (h) { hitMap[h[0]] = h; });
    // 머리 문장(숫자 문장)은 회차·행선지마다 바뀌어 renderClaim 이 그린다
    // 한눈에 견주기: 세 역의 공연 밤 평균을 막대 셋으로. 평소와 비슷하면 숫자 대신 말로 적는다.
    var cmp = $("cmp"), top = Math.max(AVG[1], AVG[2], AVG[3]); cmp.textContent = ""; cmp.classList.remove("in");
    [1, 2, 3].forEach(function (c) {
      var usual = Math.abs(AVG[c] - 1) <= G.rules.usualBand, row = el("div", "cmprow" + (usual ? "" : " busy"));
      var nm = el("span", "cn"), lb = el("span", "lb", NIGHT_LINE[c]); lb.dataset.line = NIGHT_LINE[c]; nm.appendChild(lb); nm.appendChild(document.createTextNode(St(NIGHT_ST[c]))); row.appendChild(nm);
      var track = el("span", "ct"), bar = el("i"), one = el("u"); bar.style.setProperty("--w", (AVG[c] / top * 100).toFixed(1) + "%"); one.style.left = (1 / top * 100).toFixed(1) + "%"; one.dataset.l = t.usualWord;
      track.appendChild(bar); track.appendChild(one); row.appendChild(track);
      row.appendChild(el("span", "cv", usual ? t.cmpUsual : t.cmpTimes(AVG[c].toFixed(1))));
      cmp.appendChild(row);
    });
    cmp.appendChild(el("p", "fine", fill(t.cmpNote)));
    $("cmphead").textContent = t.cmpHead(H.length);
    watch(cmp);
    var st = $("stats"); st.textContent = "";
    function stat(target, digits, fmt, label) { var d = el("div"), b = el("b", null, fmt(target.toFixed(digits))); d.appendChild(b); d.appendChild(el("span", null, fill(label))); st.appendChild(d); watch(d, function () { countUp(b, target, digits, fmt); }); }
    stat(H.length, 0, function (v) { return t.nights(v); }, t.stat1(NI.days));
    [1, 2, 3].forEach(function (c) { stat(AVG[c], 2, function (v) { return t.times(v); }, t.statN(St(NIGHT_ST[c]) + " (" + t.line(NIGHT_LINE[c]) + ")")); });
    $("how").textContent = fill(t.how({ hits: H.length, lower: LOWER, med: [1, 2, 3].map(function (c) { return { st: St(NIGHT_ST[c]), v: MED[c].toFixed(2) }; }) }));
    var mx = $("matrix"); mx.textContent = "";
    var d0 = dateObj(NI.from), lead = (d0.getUTCDay() + 6) % 7;
    for (var k = 0; k < lead; k++) { var blank = el("i"); blank.style.visibility = "hidden"; mx.appendChild(blank); }
    for (var i = 0; i < NI.days; i++) {
      var iso = new Date(d0.getTime() + i * 86400000).toISOString().slice(0, 10), h = hitMap[iso], c = el("i", h ? "h" : null);
      if (h) c.title = fmtDate(iso, { year: "numeric", month: "short", day: "numeric", weekday: "short" }) + " · " + t.times(h[1].toFixed(2));
      mx.appendChild(c);
    }
    mx.setAttribute("aria-label", fill(t.stat1(NI.days)) + ": " + H.length);
    $("cap").textContent = t.capMatrix({ from: NI.from, to: NI.to, hits: H.length });
    $("cap2").textContent = fill(t.capSpikes({ hits: H.length }));
    renderSpikes(); renderOrders();
    var lg = $("legend"); lg.textContent = "";
    [["sbar", 1], ["dot", 2], ["ring", 3]].forEach(function (m) { var sp = el("span"); sp.appendChild(el("i", "mk " + m[0])); sp.appendChild(document.createTextNode(St(NIGHT_ST[m[1]]) + " (" + t.line(NIGHT_LINE[m[1]]) + ")")); lg.appendChild(sp); });
    $("tbl-sum").textContent = t.tableToggle;
    var tb = $("tbl"), head = [t.th[0], fill(t.th[1])].concat([1, 2, 3].map(function (c2) { return St(NIGHT_ST[c2]); }));
    tb.innerHTML = "<thead><tr>" + head.map(function (v) { return "<th>" + esc(v) + "</th>"; }).join("") + "</tr></thead><tbody>" + H.map(function (r) {
      return "<tr><td>" + esc(fmtDate(r[0], { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })) + "</td><td>" + esc(num(r[4])) + "</td><td>" + esc(t.times(r[1].toFixed(2))) + "</td><td>" + esc(t.times(r[2].toFixed(2))) + "</td><td>" + esc(t.times(r[3].toFixed(2))) + "</td></tr>";
    }).join("") + "</tbody>";
  }
  function renderSpikes() {
    var t = T(), H = NI.hits, g = $("spikes"), W = 940, Ht = 250, ml = 30, mr = 6, mt = 12, y0 = Ht - 8, n = H.length, bw = (W - ml - mr) / n;
    var top = Math.ceil(Math.max.apply(null, H.map(function (h) { return h[1]; })));
    function y(v) { return y0 - (y0 - mt) * v / top; }
    function cx(i) { return ml + i * bw + bw / 2; }
    g.textContent = "";
    [1, 2, 5, 10].filter(function (v) { return v <= top; }).forEach(function (v) {
      g.appendChild(svg("line", { x1: ml, x2: W - mr, y1: y(v), y2: y(v), class: v === 1 ? "g1" : "g" }));
      var tx = svg("text", { x: ml - 6, y: y(v) + 4, "text-anchor": "end" }); tx.textContent = v; g.appendChild(tx);
    });
    var u = svg("text", { x: W - mr, y: y(1) - 5, "text-anchor": "end" }); u.textContent = t.usual; g.appendChild(u);
    g.appendChild(svg("line", { x1: ml, x2: W - mr, y1: y0, y2: y0, class: "g" }));
    var hl = svg("rect", { x: 0, y: mt, width: bw, height: y0 - mt, class: "hl", visibility: "hidden" }); g.appendChild(hl);
    H.forEach(function (h, i) { g.appendChild(svg("rect", { x: cx(i) - 2.5, y: y(h[1]), width: 5, height: y0 - y(h[1]), rx: 2, class: "sb" })); });
    H.forEach(function (h, i) { g.appendChild(svg("circle", { cx: cx(i), cy: y(h[3]), r: 2.7, class: "ring" })); g.appendChild(svg("circle", { cx: cx(i), cy: y(h[2]), r: 2.7, class: "dot" })); });
    g.setAttribute("aria-label", $("cap2").textContent || "");
    var tip = $("tip"), over = svg("rect", { x: ml, y: 0, width: W - ml - mr, height: Ht, fill: "transparent" }); g.appendChild(over);
    over.addEventListener("mousemove", function (ev) {
      var r = g.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width * W, i = Math.max(0, Math.min(n - 1, Math.floor((px - ml) / bw))), h = H[i];
      hl.setAttribute("x", ml + i * bw); hl.setAttribute("visibility", "visible");
      tip.hidden = false; tip.textContent = "";
      tip.appendChild(el("b", null, fmtDate(h[0], { year: "numeric", month: "short", day: "numeric", weekday: "short" })));
      [1, 2, 3].forEach(function (c) { tip.appendChild(el("div", null, St(NIGHT_ST[c]) + " " + T().times(h[c].toFixed(2)) + (c === 1 ? " · " + num(h[4]) : ""))); });
      var left = cx(i) / W * r.width, half = tip.offsetWidth / 2; left = Math.max(half, Math.min(r.width - half, left));
      tip.style.left = left + "px"; tip.style.top = (y(Math.max(h[1], 2)) / Ht * r.height - 8) + "px";
    });
    over.addEventListener("mouseleave", function () { tip.hidden = true; hl.setAttribute("visibility", "hidden"); });
  }
  function renderOrders() {
    var t = T(), box = $("orders"); box.textContent = ""; $("ord-title").textContent = t.orderTitle;
    G.orders.forEach(function (r) {
      var s = stn(r.st), dir = dirToward(r.st, r.toward), o = s.order[dir], a = o.indexOf(r.from), b = o.indexOf(r.to, a), row = el("div", "ord");
      var lb = el("span", "lb", s.line); lb.dataset.line = s.line; row.appendChild(lb); row.appendChild(el("span", "dir", t.toward(N(r.toward))));
      o.slice(a, b + 1).forEach(function (name, i) {
        if (i) row.appendChild(el("span", "ar", "→"));
        row.appendChild(el("span", "nd" + (name === "올림픽공원" ? " here" : name === r.mark ? " board" : ""), N(name)));
      });
      box.appendChild(row);
    });
    var lg = $("ord-legend"); lg.textContent = "";
    [["here", t.orderHere], ["board", t.orderBoard]].forEach(function (m) { var sp = el("span"); sp.appendChild(el("i", "mk " + m[0])); sp.appendChild(document.createTextNode(m[1])); lg.appendChild(sp); });
  }

  // ---------- 그리기: 검은 면의 약도 ----------
  var MAPKEY = null, ROUTEKEY = null, NODE_EL = {};
  var FLOW = { "5": ["2557", "방화"], "9": ["4136", "개화"], "8": ["2814", "잠실"], "2": ["0216", "강남"] };   // 노선 글자 흐름: 그 역에서 그 방향으로 떠나는 열차 시각
  var BOARD_KEYS = ["올림픽공원", "방이", "몽촌토성"];
  var PICKABLE = Object.keys(G.map.nodes).filter(function (k) { return G.dests.some(function (d) { return d.to.indexOf(k) >= 0; }); });
  function pt(k) { var n = G.map.nodes[k]; return [n.x, n.y]; }
  function lineD(ln) {
    return "M" + G.map.lines[ln].map(function (k) { var p = pt(k); if (ln === "9" && k !== "올림픽공원" && G.map.lines["5"].indexOf(k) >= 0) p = [p[0] + 7, p[1] + 9]; return p[0] + "," + p[1]; }).join(" L");
  }
  function flowText(parent, pathId, unit, cls, speed, dy) {
    var tx = svg("text", { class: cls, dy: dy }), tp = svg("textPath", { href: "#" + pathId }); tp.setAttributeNS(XLINK, "xlink:href", "#" + pathId);
    tp.textContent = unit; tx.appendChild(tp); parent.appendChild(tx);
    var len = document.getElementById(pathId).getTotalLength(), ul = tp.getComputedTextLength() || 200, reps = Math.ceil(len / ul) + 2, s = "";
    for (var i = 0; i < reps; i++) s += unit; tp.textContent = s;
    if (REDUCED) tp.setAttribute("startOffset", "0");
    else tp.appendChild(svg("animate", { attributeName: "startOffset", from: (-ul).toFixed(1), to: "0", dur: (ul / speed).toFixed(1) + "s", repeatCount: "indefinite" }));
  }
  function buildMap() {
    var g = $("map"), M = G.map, t = T(), dt = dayType(S.show); g.textContent = ""; NODE_EL = {}; ROUTEKEY = null;
    var base = svg("g", { class: "base" }); g.appendChild(base);
    base.appendChild(svg("path", { id: "rv", d: M.river, class: "river" }));
    flowText(base, "rv", "~  ~  ~  " + M.riverName[S.lang] + "  ~  ~  ~  ~  ~  ", "rivertxt", 9, 5);
    Object.keys(M.lines).forEach(function (ln) {
      var id = "ln" + ln; base.appendChild(svg("path", { id: id, d: lineD(ln), class: "ln l" + ln }));
      var L = deps(FLOW[ln][0], dirToward(FLOW[ln][0], FLOW[ln][1]), dt);
      if (L.length) flowText(base, id, L.map(function (x) { return clock(toMin(x[0])) + " " + N(x[1]); }).join("  ·  ") + "  ·  ", "flow l" + ln, 16, -8);
    });
    BOARD_KEYS.forEach(function (k) { var p = pt(k), w = svg("line", { x1: M.venue.x, y1: M.venue.y, x2: p[0], y2: p[1], class: "walk" }); w.dataset.k = k; base.appendChild(w); });
    g.appendChild(svg("g", { id: "routeL" }));
    var nodes = svg("g", { class: "nodes" }); g.appendChild(nodes);
    Object.keys(M.nodes).forEach(function (k) {
      var n = M.nodes[k], tag = n.tag ? M.tags[n.tag] : null, isBoard = BOARD_KEYS.indexOf(k) >= 0, pickable = PICKABLE.indexOf(k) >= 0;
      var grp = svg("g", { class: "node" + (tag ? " major" : "") + (isBoard ? " board" : "") + (pickable ? " pick" : ""), transform: "translate(" + n.x + "," + n.y + ")" });
      if (pickable) {
        grp.setAttribute("tabindex", "0"); grp.setAttribute("role", "button"); grp.setAttribute("aria-label", St(k) + (tag ? " · " + tag[S.lang] : ""));
        grp.addEventListener("click", function (ev) { ev.stopPropagation(); pickNode(k); });
        grp.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pickNode(k); } });
      }
      grp.appendChild(svg("circle", { r: 26, class: "hit" })); grp.appendChild(svg("circle", { r: 9, class: "pulse" })); grp.appendChild(svg("circle", { r: tag || isBoard ? 7.5 : 5.5, class: "dotn" }));
      var name = N(k), main = name, sub = tag ? tag[S.lang] : null;
      if (tag && tag.same) { if (name.length > 16) main = sub; sub = null; }   // 랜드마크가 곧 그 역이면 이름을 두 번 적지 않는다
      else if (tag && (name.length > 16 || name === sub)) { main = sub; sub = null; }
      // 이름표 자리: t 위 · tl 위(왼쪽으로 붙임) · b 아래 · bl 아래(왼쪽으로 붙임) · l 왼쪽 · r 오른쪽. 랜드마크 이름과 글자 그림은 이름 바깥쪽으로 쌓는다.
      var lp = n.lp, side = lp === "l" || lp === "r", up = lp !== "b" && lp !== "bl", hug = lp === "tl" || lp === "bl";
      var lx = lp === "l" ? -15 : lp === "r" ? 15 : hug ? 8 : 0, ly = side ? 6 : up ? -16 : 30, anchor = lp === "l" || hug ? "end" : lp === "r" ? "start" : "middle";
      var tx = svg("text", { x: lx, y: ly, "text-anchor": anchor, class: "nm" }); tx.textContent = main; grp.appendChild(tx);
      var edge = up ? ly - (side ? 17 : 20) : ly + 15;
      if (sub) { var t2 = svg("text", { x: lx, y: edge, "text-anchor": anchor, class: "tg" }); t2.textContent = sub; grp.appendChild(t2); edge += up ? -14 : 14; }
      if (tag && tag.art) {
        var wide = Math.max.apply(null, tag.art.map(function (a) { return a.length; })), rows = tag.art.length, art = svg("text", { class: "art" });
        art.style.textAnchor = anchor;
        tag.art.forEach(function (ln2, i) { var ts = svg("tspan", { x: lx + (lp === "l" ? -12 : lp === "r" ? 12 : 0), y: up ? edge - (rows - 1 - i) * 11 : edge + i * 11 }); ts.textContent = ln2 + new Array(wide - ln2.length + 1).join(" "); art.appendChild(ts); });
        grp.appendChild(art);
      }
      NODE_EL[k] = grp; nodes.appendChild(grp);
    });
    var v = svg("g", { class: "venue", transform: "translate(" + M.venue.x + "," + M.venue.y + ")" });
    v.appendChild(svg("circle", { r: 12, class: "vpulse" })); v.appendChild(svg("rect", { x: -7, y: -7, width: 14, height: 14, transform: "rotate(45)", class: "vmark" }));
    var vn = svg("text", { x: 16, y: -10, class: "vn" }); vn.textContent = S.lang === "ko" ? S.show.venue : G.venues[S.show.venue].en; v.appendChild(vn);
    var vh = svg("text", { x: 16, y: 6, class: "tg" }); vh.textContent = t.here; v.appendChild(vh);
    g.appendChild(v);
    g.setAttribute("aria-label", t.mapNote);
  }
  function routeNodes(pl) {
    var M = G.map, board = M.nodes[stn(pl.code).name] ? stn(pl.code).name : "올림픽공원", d = pl.d;   // 약도에 없는 역(둔촌오륜)은 올림픽공원에서 이어 그린다
    function along(ln, a, b) { var L = M.lines[ln] || [], i = L.indexOf(a), j = L.indexOf(b), out = [], k; if (i < 0 || j < 0) return [a, b]; if (i <= j) for (k = i; k <= j; k++) out.push(L[k]); else for (k = i; k >= j; k--) out.push(L[k]); return out; }
    if (!d.hop) return along(M.lineOf[pl.code] || stn(pl.code).line, board, pl.to);
    var seq = pl.hot ? along(M.lineOf[pl.code], board, d.alt.hop.name).concat(along(M.lineOf[d.alt.mid.st], d.alt.hop.name, d.hop.name).slice(1)) : along(M.lineOf[pl.code], board, d.hop.name);
    if (pl.to !== d.hop.name) seq = seq.concat(along(M.lineOf[d.xfer.st], d.hop.name, pl.to).slice(1));
    return seq;
  }
  function renderMap() {
    var t = T(), s = S.show, dt = dayType(s), pl = PLAN, M = G.map;
    var mk = S.lang + "|" + dt + "|" + s.venue; if (mk !== MAPKEY) { buildMap(); MAPKEY = mk; }
    var L = $("routeL"), rk = pl && pl.last ? pl.d.id + "|" + pl.to + "|" + pl.code : "";
    $("map").classList.toggle("has", !!rk);
    Object.keys(NODE_EL).forEach(function (k) { NODE_EL[k].classList.remove("on", "to", "hop"); });
    Array.prototype.forEach.call(document.querySelectorAll("#map .walk"), function (w) { w.classList.remove("on"); });
    if (!rk) { L.textContent = ""; ROUTEKEY = ""; }
    else {
      var seq = routeNodes(pl), d = "M" + seq.map(function (k) { return pt(k).join(","); }).join(" L");   // 걷는 구간은 점선(.walk.on)이 따로 맡는다
      if (rk !== ROUTEKEY) {
        L.textContent = ""; var p = svg("path", { d: d, class: "route" }); L.appendChild(p); L.appendChild(svg("path", { d: d, class: "routeflow" }));
        if (!REDUCED) {
          var len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len; void p.getBoundingClientRect(); p.style.transition = "stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1)"; p.style.strokeDashoffset = "0";
          var car = svg("circle", { r: 6, class: "train" }); car.appendChild(svg("animateMotion", { dur: Math.max(2.6, len / 150).toFixed(1) + "s", repeatCount: "indefinite", path: d })); L.appendChild(car);   // 길을 따라 도는 작은 열차
        }
        var bn = M.nodes[seq[0]], bside = bn.lp === "l" || bn.lp === "r", bt = svg("text", { x: bn.x + (bn.lp === "l" ? -15 : bside ? 15 : 13), y: bn.y + (bside ? 23 : 25), "text-anchor": bn.lp === "l" ? "end" : "start", class: "boardtag" });
        bt.textContent = t.boardHere; L.appendChild(bt);
        ROUTEKEY = rk;
      }
      seq.forEach(function (k) { if (NODE_EL[k]) NODE_EL[k].classList.add("on"); });
      if (NODE_EL[pl.to]) NODE_EL[pl.to].classList.add("to");
      pl.conn.forEach(function (c) { var k = stn(c.st).name; if (NODE_EL[k]) NODE_EL[k].classList.add("hop"); });
      Array.prototype.forEach.call(document.querySelectorAll("#map .walk"), function (w) { if (w.dataset.k === seq[0]) w.classList.add("on"); });
    }
    // 큰 시각판
    var rt = $("ro-time"), alt = $("ro-alt"); alt.hidden = true; alt.textContent = "";   // 숨길 때 글도 비운다(다른 언어의 옛 글이 남지 않게)
    if (pl && pl.last) {
      var m = toMin(pl.last[0]);
      $("ro-label").textContent = t.col.leaveLabel + " · " + t.daytype[pl.dt]; setFlap(rt, clock(pl.leave), isNext(pl.leave)); rt.setAttribute("aria-label", t.col.leaveFor(St(pl.to)) + " " + clockMark(pl.leave));
      $("ro-sub").textContent = t.col.lastLine(clockMark(m), t.from(t.bound(N(pl.last[1])), St(stn(pl.code).name))) + " → " + St(pl.to);
      var others = candidates(pl.to).filter(function (c) { return c.d.id !== pl.d.id; });
      if (others.length) { var o = others[0], os = stn(o.code); alt.hidden = false; alt.textContent = t.alt({ line: t.line(os.line), st: St(os.name), time: clockMark(toMin(o.last[0])) }); alt.onclick = function () { go({ dest: o.d.id, to: pl.to, col: "host" }); }; }
    } else {
      $("ro-label").textContent = s.durSrc === "assumed" ? t.ro.endEst : t.ro.end; setFlap(rt, clock(endMin(s)), false); rt.setAttribute("aria-label", $("ro-label").textContent + " " + clock(endMin(s)));
      $("ro-sub").textContent = t.ro.pick;
    }
    // 흐르는 한 줄: 지금 타는 방향의 열차들
    var src = pl ? [pl.code, pl.dir] : [FLOW["5"][0], dirToward(FLOW["5"][0], FLOW["5"][1])], Ls = deps(src[0], src[1], dt);
    var line = Ls.map(function (x2) { return clock(toMin(x2[0])) + " " + t.bound(N(x2[1])); }).join("   >>>   ") + "   >>>   ", tk = $("tk");
    if (tk.dataset.v !== line) {
      tk.dataset.v = line; tk.textContent = ""; tk.appendChild(el("span", null, St(stn(src[0]).name) + "   >>>   " + line)); tk.appendChild(el("span", null, St(stn(src[0]).name) + "   >>>   " + line));
      tk.style.setProperty("--dur", Math.max(18, tk.scrollWidth / 2 / G.map.tickerSpeed).toFixed(0) + "s");   // 글이 길어도 같은 빠르기로 흐르게
    }
    $("c-tl").textContent = "OLYMPIC PARK · SEOUL · " + { DAY: "WEEKDAY", SAT: "SATURDAY", END: "SUN · HOLIDAY" }[dt];
    $("c-tr").textContent = t.mapNote;
  }

  // ---------- 사진과 글자 그림 ----------
  // 기본은 사진이다. 누르면 같은 사진을 글자 열넷으로 다시 그린다(아주 밝은 무대 조명은 주황 겹에 따로 찍고, 위에서부터 찍혀 내려온 뒤 조명이 깜빡인다). 다시 누르면 사진.
  var RAMP = " .,:;-=+*xX%#@", SHOT = null;
  function charRatio(pre) {
    var s = el("span", null, "MMMMMMMMMM"); s.style.cssText = "position:absolute;visibility:hidden;font-size:100px;line-height:1;white-space:pre"; pre.appendChild(s);
    var r = s.getBoundingClientRect().width / 1000; pre.removeChild(s); return r > 0.3 && r < 0.9 ? r : 0.6;
  }
  function fitAscii() { var w = $("shotbox").clientWidth; if (SHOT && w > 0) $("shotbox").style.fontSize = (w / (SHOT.cols * SHOT.ratio)).toFixed(3) + "px"; }
  function asciiFrame(upto, tw) {
    var o1 = [], o2 = [], n = RAMP.length, r, k;
    for (r = 0; r < SHOT.rows; r++) {
      var l1 = "", l2 = "";
      if (r < upto) for (k = 0; k < SHOT.cols; k++) {
        var i = r * SHOT.cols + k, v = SHOT.L[i]; if (tw && tw[i]) v = Math.min(1, v + tw[i]);
        var ch = RAMP[Math.min(n - 1, Math.floor(v * n))];
        if (v >= G.photo.hotFrom) { l1 += " "; l2 += ch; } else { l1 += ch; l2 += " "; }
      }
      o1.push(l1); o2.push(l2);
    }
    $("ascii").textContent = o1.join("\n"); $("ascii2").textContent = o2.join("\n");
  }
  function playAscii() {
    var run = ++SHOT.run; SHOT.settled = false;
    if (REDUCED) { asciiFrame(SHOT.rows); return; }
    var t0 = null; asciiFrame(0);
    function step(ts) { if (run !== SHOT.run) return; if (t0 == null) t0 = ts; var p = Math.min(1, (ts - t0) / 1100); asciiFrame(Math.ceil(SHOT.rows * p)); if (p < 1) requestAnimationFrame(step); else SHOT.settled = true; }
    requestAnimationFrame(step);
  }
  function twinkle() {   // 글자 그림이 다 그려진 동안에만 밝은 칸 몇 개가 깜빡인다(한 번만 건다)
    setInterval(function () {
      var fig = $("shot"), r = fig.getBoundingClientRect(); if (!SHOT || !SHOT.settled || document.hidden || r.bottom < 0 || r.top > window.innerHeight || !fig.classList.contains("ascii")) return;
      var tw = {}, k; for (k = 0; k < SHOT.lit.length / 14; k++) tw[SHOT.lit[Math.floor(Math.random() * SHOT.lit.length)]] = 0.22;
      asciiFrame(SHOT.rows, tw);
    }, 170);
  }
  function shotLabels() {
    var t = T(), on = $("shot").classList.contains("ascii"), box = $("shotbox");
    $("shothint").textContent = on ? t.toPhoto : t.toAscii;
    $("shotcap").textContent = t.photoCap + " — " + (on ? t.photoAscii : t.photoCrop) + " · ";
    $("shotreal").alt = t.photoCap; box.setAttribute("aria-label", on ? t.toPhoto : t.toAscii); box.setAttribute("aria-pressed", String(on));
  }
  function initPhoto() {
    var P = G.photo, fig = $("shot"), box = $("shotbox"), real = $("shotreal"), img = new Image();
    box.style.aspectRatio = P.crop.w + " / " + P.crop.h;   // 사진이 오기 전에 자리를 잡아 둔다
    img.onload = function () {
      try {
        var big = document.createElement("canvas"); big.width = P.crop.w; big.height = P.crop.h; big.getContext("2d").drawImage(img, P.crop.x, P.crop.y, P.crop.w, P.crop.h, 0, 0, P.crop.w, P.crop.h);
        real.src = big.toDataURL("image/jpeg", 0.86);
        var ratio = charRatio($("ascii")), cols = P.cols, rows = Math.round(cols * (P.crop.h / P.crop.w) * ratio), cv = document.createElement("canvas"); cv.width = cols; cv.height = rows;
        var cx = cv.getContext("2d"); cx.drawImage(img, P.crop.x, P.crop.y, P.crop.w, P.crop.h, 0, 0, cols, rows);
        var d = cx.getImageData(0, 0, cols, rows).data, L = [], lit = [], i;
        for (i = 0; i < cols * rows; i++) L.push((0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255);
        var srt = L.slice().sort(function (a, b) { return a - b; }), lo = srt[Math.floor((srt.length - 1) * P.lo)], hi = srt[Math.floor((srt.length - 1) * P.hi)];   // 사진마다 어두운 쪽·밝은 쪽을 백분위로 잘라 대비를 맞춘다
        for (i = 0; i < L.length; i++) { L[i] = Math.pow(Math.max(0, Math.min(1, (L[i] - lo) / ((hi - lo) || 1))), P.gamma); if (L[i] > 0.5) lit.push(i); }
        SHOT = { cols: cols, rows: rows, ratio: ratio, L: L, lit: lit, run: 0, settled: false };
        fig.classList.add("ok"); fitAscii(); if (!REDUCED) twinkle();
      } catch (e) { fig.classList.add("plain"); real.src = P.src; }   // 픽셀을 못 읽는 환경이면 사진만 보인다(글자 그림 단추는 숨긴다)
    };
    img.onerror = function () { fig.hidden = true; };
    img.src = P.src;
    window.addEventListener("resize", fitAscii);
    function toggle() { if (!SHOT) return; var on = fig.classList.toggle("ascii"); shotLabels(); fitAscii(); if (on) playAscii(); else { SHOT.run++; SHOT.settled = false; } }
    box.addEventListener("click", toggle);
    box.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toggle(); } });
  }

  // ---------- 검은 면 위의 손길: 가까운 역에 붙기·따라오는 불빛 ----------
  function nearest(ev) {
    var g = $("map"), m = g.getScreenCTM(); if (!m) return null;
    var p = g.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; p = p.matrixTransform(m.inverse());
    var best = null, bd = G.map.snap;
    function see(k, n) { var dd = Math.sqrt((n.x - p.x) * (n.x - p.x) + (n.y - p.y) * (n.y - p.y)); if (dd < bd) { bd = dd; best = k; } }
    Object.keys(G.map.nodes).forEach(function (k) { see(k, G.map.nodes[k]); }); see(null, G.map.venue);
    return best && PICKABLE.indexOf(best) >= 0 ? best : null;   // 가장 가까운 것이 공연장이나 타는 역이면 아무것도 고르지 않는다
  }
  function initMapTouch() {
    var night = $("night"), g = $("map"), near = null, raf = 0, last = null;
    function setNear(k) {
      if (k === near) return; if (near && NODE_EL[near]) NODE_EL[near].classList.remove("near"); near = k; if (near && NODE_EL[near]) NODE_EL[near].classList.add("near"); g.classList.toggle("aim", !!near);
      // 미리 보기: 누르기 전에 그 역까지 가는 마지막 열차와 타는 역을 보여 준다(누르면 나오는 답과 같은 값)
      var pk = $("peek"), c = near && NODE_EL[near] ? candidates(near) : [];
      if (!c.length) { pk.classList.remove("on"); return; }
      var dot = NODE_EL[near].querySelector(".dotn").getBoundingClientRect(), pr = night.getBoundingClientRect();
      pk.textContent = ""; pk.appendChild(el("b", null, clockMark(toMin(c[0].last[0])))); pk.appendChild(document.createTextNode(T().peek(St(near), St(stn(c[0].code).name))));
      var half = pk.offsetWidth / 2 + 8, cx = dot.left + dot.width / 2 - pr.left;
      pk.style.left = Math.max(half, Math.min(pr.width - half, cx)) + "px"; pk.style.top = (dot.top - pr.top) + "px"; pk.classList.add("on");
    }
    night.addEventListener("pointermove", function (ev) {
      if (ev.pointerType !== "mouse") return;   // 손가락·펜에는 「올려 두기」가 없다: 미리 보기와 가까운 역 표시는 마우스에서만
      last = ev; if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; var r = night.getBoundingClientRect(); night.style.setProperty("--mx", (last.clientX - r.left) + "px"); night.style.setProperty("--my", (last.clientY - r.top) + "px"); setNear(last.target.closest && last.target.closest(".readout") ? null : nearest(last)); });
    });
    night.addEventListener("pointerleave", function (ev) { if (ev.pointerType === "mouse") setNear(null); });
    window.addEventListener("hashchange", function () { setNear(null); });   // 답이 바뀌면 미리 보기와 가까운 역 표시를 접는다(마우스가 다시 움직이면 돌아온다)
    g.addEventListener("click", function (ev) { var k = nearest(ev); if (k) pickNode(k); });   // 역 동그라미를 빗맞혀도 가까운 역으로 고른다
  }

  // ---------- 복사·달력 ----------
  function cardText() {
    var pl = PLAN, s = pl.s, t = T(), m = toMin(pl.last[0]), st = stn(pl.code);
    var lines = t.card({ title: S.lang !== "ko" && s.enTitle ? s.enTitle + " (" + s.title + ")" : s.title, date: fmtDate(s.date, { month: "long", day: "numeric", weekday: "short" }), venue: venueName(s), start: t.startAt(s.start),
      dest: destLabel(pl.d), to: St(pl.to), line: t.line(st.line), st: St(st.name), daytype: t.daytype[pl.dt],
      time: clock(m) + (isNext(m) ? " (" + t.next + ")" : ""), term: t.bound(N(pl.last[1])), url: location.href });
    return lines.slice(0, -1).concat(connLines(pl), [t.col.card(clockMark(pl.leave), t.col.formula(pl.ci.walk, G.rules.leaveBuffer))], lines.slice(-1)).join("\n");
  }
  function flash(btn, text) { var old = btn.textContent; btn.textContent = text; setTimeout(function () { btn.textContent = old; }, 1400); }
  function copyCard() {
    if (!PLAN || !PLAN.last) return;
    var txt = cardText(), btn = $("b-copy"), done = function () { flash(btn, T().copied); };
    function fallback() { var ta = el("textarea"); ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) { /* 복사 권한이 없으면 그대로 둔다 */ } document.body.removeChild(ta); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback); else fallback();
  }
  function icsEsc(v) { return String(v).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  function icsFold(line) {
    var out = "", cur = "", bytes = 0;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i], code = line.charCodeAt(i), b = code < 0x80 ? 1 : code < 0x800 ? 2 : (code >= 0xD800 && code <= 0xDBFF) ? 4 : 3;
      if (b === 4) { ch += line[++i]; }
      if (bytes + b > 73) { out += cur + "\r\n "; cur = ""; bytes = 1; }
      cur += ch; bytes += b;
    }
    return out + cur;
  }
  function stamp(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  function saveIcs() {
    if (!PLAN || !PLAN.last) return;
    var pl = PLAN, s = pl.s, t = T(), p = s.date.split("-"), m = toMin(pl.last[0]), st = stn(pl.code);
    var start = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 0, m) - 9 * 3600000), end = new Date(start.getTime() + 60000);
    var x = { time: clock(m), term: t.bound(N(pl.last[1])), st: t.line(st.line) + " " + St(st.name), leave: clock(pl.leave) };
    var lead = m - pl.leave + G.rules.alarmBefore;   // 알림은 「늦어도 나설 시각」의 alarmBefore 분 전(일정 시작 = 마지막 열차 시각 기준으로 환산)
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//route-card//olympic-park//" + S.lang.toUpperCase(), "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      "UID:" + showId(s) + "-" + pl.d.id + "-" + pl.col + "-" + stamp(start) + "@route-card", "DTSTAMP:" + stamp(new Date()), "DTSTART:" + stamp(start), "DTEND:" + stamp(end),
      "SUMMARY:" + icsEsc(t.cal.sum(x)), "LOCATION:" + icsEsc(x.st), "DESCRIPTION:" + icsEsc(cardText()),
      "BEGIN:VALARM", "TRIGGER:-PT" + lead + "M", "ACTION:DISPLAY", "DESCRIPTION:" + icsEsc(t.cal.alarm(x)), "END:VALARM", "END:VEVENT", "END:VCALENDAR"];
    var blob = new Blob([lines.map(icsFold).join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" }), a = el("a");
    a.href = URL.createObjectURL(blob); a.download = "route-card-" + showId(s) + "-" + pl.d.id + "-" + pl.col + ".ics"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  // ---------- 한 번에 그리기 ----------
  var lastLang = null;
  function render() {
    parse();
    PLAN = S.dest ? plan(S.show, destById(S.dest), S.to, S.col) : null;
    renderFrame(); renderShows(); renderDests(); renderAnswer(); renderClaim(); renderTimeline(); renderMap();
    if (lastLang !== S.lang) { renderWhy(); lastLang = S.lang; }
    if (REVEAL) { REVEAL = false; if (PLAN) reveal(); }
  }
  $("b-copy").onclick = copyCard; $("b-ics").onclick = saveIcs;
  $("a-last").onclick = tapFlap; $("ro-time").onclick = tapFlap;
  window.addEventListener("hashchange", render);
  window.RC_APP = { state: S, shows: SHOWS, plan: plan, candidates: candidates, pickNode: pickNode, pickable: PICKABLE, routeNodes: routeNodes, destById: destById, dirToward: dirToward, lastTo: lastTo, ladder: ladder, reaches: reaches, median: MED, mean: AVG, lower: LOWER, showId: showId, dayType: dayType, go: go,
    cols: function () { return PLANS; }, cur: function () { return PLAN; }, cardText: function () { return PLAN && PLAN.last ? cardText() : ""; }, colInfo: colInfo, ratioFor: ratioFor, nightKind: nightKind };
  render(); initPhoto(); initMapTouch();
  watch($("shot")); watch($("row-why"));
})();
