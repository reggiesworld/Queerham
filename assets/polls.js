/*
  queerham live polls
  Reads the public polling tables that Wikipedia editors keep for each race (every released poll, with pollster,
  dates and sample) through Wikipedia's open API, straight in the visitor's browser. Nothing is typed in by hand.
  Candidate names and parties come from RACES below, so an edit to a Wikipedia page cannot change who is shown.
  Polls sponsored by national mainstream outlets are skipped (see MEDIA).
  To add a race, add a line to RACES with the Wikipedia page name and the candidates' last names.
*/
(function () {
  var RACES = [
    { id: "al-gov", state: "Alabama", office: "Governor", page: "2026_Alabama_gubernatorial_election", c: [["Tuberville", "Tommy Tuberville", "R"], ["Jones", "Doug Jones", "D"]] },
    { id: "al-sen", state: "Alabama", office: "U.S. Senate", page: "2026_United_States_Senate_election_in_Alabama", c: [["Moore", "Barry Moore", "R"], ["Wess", "Everett Wess", "D"]] },
    { id: "al-ag", state: "Alabama", office: "Attorney General", page: "2026_Alabama_Attorney_General_election", c: [["Robertson", "Katherine Robertson", "R"], ["McLaughlin", "Jeff McLaughlin", "D"]] },
    { id: "ga-sen", state: "Georgia", office: "U.S. Senate", page: "2026_United_States_Senate_election_in_Georgia", c: [["Collins", "Mike Collins", "R"], ["Ossoff", "Jon Ossoff", "D"]] },
    { id: "ga-gov", state: "Georgia", office: "Governor", page: "2026_Georgia_gubernatorial_election", c: [["Jackson", "Rick Jackson", "R"], ["Bottoms", "Keisha Lance Bottoms", "D"]] },
    { id: "ga-lg", state: "Georgia", office: "Lt. Governor", page: "2026_Georgia_lieutenant_gubernatorial_election", c: [["Dolezal", "Greg Dolezal", "R"], ["McLaurin", "Josh McLaurin", "D"]] },
    { id: "nc-sen", state: "North Carolina", office: "U.S. Senate", page: "2026_United_States_Senate_election_in_North_Carolina", c: [["Whatley", "Michael Whatley", "R"], ["Cooper", "Roy Cooper", "D"]] },
    { id: "fl-gov", state: "Florida", office: "Governor", page: "2026_Florida_gubernatorial_election", c: [["Donalds", "Byron Donalds", "R"], ["Jolly", "David Jolly", "D"]] },
    { id: "fl-sen", state: "Florida", office: "U.S. Senate", page: "2026_United_States_Senate_election_in_Florida", c: [["Moody", "Ashley Moody", "R"], ["Nixon", "Angie Nixon", "D"]] },
    { id: "tn-gov", state: "Tennessee", office: "Governor", page: "2026_Tennessee_gubernatorial_election", c: [["Blackburn", "Marsha Blackburn", "R"], ["Green", "Jerri Green", "D"]] },
    { id: "tn-sen", state: "Tennessee", office: "U.S. Senate", page: "2026_United_States_Senate_election_in_Tennessee", c: [["Hagerty", "Bill Hagerty", "R"], ["Bradshaw", "Marquita Bradshaw", "D"]] },
    { id: "sc-gov", state: "South Carolina", office: "Governor", page: "2026_South_Carolina_gubernatorial_election", c: [["Wilson", "Alan Wilson", "R"], ["Johnson", "Jermaine Johnson", "D"]] },
    { id: "sc-sen", state: "South Carolina", office: "U.S. Senate", page: "2026_United_States_Senate_election_in_South_Carolina", c: [["Graham", "Darline Graham", "R"], ["Andrews", "Annie Andrews", "D"]] },
    { id: "ms-sen", state: "Mississippi", office: "U.S. Senate", page: "2026_United_States_Senate_election_in_Mississippi", c: [["Hyde-Smith", "Cindy Hyde-Smith", "R"], ["Colom", "Scott Colom", "D"], ["Pinkins", "Ty Pinkins", "I"]] },
    { id: "la-sen", state: "Louisiana", office: "U.S. Senate", page: "2026_United_States_Senate_election_in_Louisiana", c: [["Letlow", "Julia Letlow", "R"], ["Davis", "Jamie Davis", "D"]] },
    { id: "ky-sen", state: "Kentucky", office: "U.S. Senate", page: "2026_United_States_Senate_election_in_Kentucky", c: [["Barr", "Andy Barr", "R"], ["Booker", "Charles Booker", "D"]] },
    { id: "tx-sen", state: "Texas", office: "U.S. Senate", page: "2026_United_States_Senate_election_in_Texas", c: [["Paxton", "Ken Paxton", "R"], ["Talarico", "James Talarico", "D"]] },
    { id: "tx-gov", state: "Texas", office: "Governor", page: "2026_Texas_gubernatorial_election", c: [["Abbott", "Greg Abbott", "R"], ["Hinojosa", "Gina Hinojosa", "D"]] }
  ];
  var MEDIA = /(fox|cnn|msnbc|\bnbc\b|abc news|\babc\b|\bcbs\b|new york times|\bnyt\b|washington post|wall street journal|\bwsj\b|usa today|reuters|associated press|ap-norc|\bnpr\b|\bpbs\b|politico|the hill|bloomberg|cnbc|newsweek|yahoo|the economist|daily mail|newsnation|nexstar)/i;
  var RATERS = [["Cook", /cook/i], ["Sabato", /sabato/i], ["Inside Elections", /inside elections/i]];
  var ELECTION = new Date("2026-11-03T12:00:00-06:00");
  var CACHE = "qh-polls-v2", TTL = 20 * 60 * 1000;
  var MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function clean(s) { return (s || "").replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim(); }

  function endDate(txt) {
    var t = txt.toLowerCase().replace(/sept\b/, "september");
    var year = (t.match(/(20\d\d)/g) || []).pop();
    var best = -1, mon = -1;
    MONTHS.forEach(function (m, i) {
      var re = new RegExp("\\b" + m.slice(0, 3) + "[a-z]*\\.?", "g"), mm;
      while ((mm = re.exec(t))) if (mm.index > best) { best = mm.index; mon = i; }
    });
    if (mon < 0 || !year) return null;
    var after = t.slice(best).replace(year, "");
    var days = after.match(/\d{1,2}/g);
    return new Date(+year, mon, days ? +days[days.length - 1] : 15, 12);
  }

  // Expand a table into a full grid, resolving rowspan and colspan. links[r] holds the citation links of the row's pollster cell.
  function grid(table, doc) {
    var rows = [], spans = {}, lspans = {};
    rows.links = [];
    Array.prototype.forEach.call(table.querySelectorAll("tr"), function (tr, r) {
      var row = [], c = 0, rowLinks = null;
      Array.prototype.forEach.call(tr.children, function (cell) {
        while (spans[r + "," + c] !== undefined) { if (c === 0) rowLinks = lspans[r + ",0"]; row[c] = spans[r + "," + c]; c++; }
        var rs = +cell.getAttribute("rowspan") || 1, cs = +cell.getAttribute("colspan") || 1, txt = clean(cell.textContent);
        var cellLinks = null;
        if (c === 0 && doc) {
          cellLinks = Array.prototype.map.call(cell.querySelectorAll("sup.reference a"), function (a) {
            var li = doc.getElementById(decodeURIComponent((a.getAttribute("href") || "").replace(/^#/, "")));
            var ext = li && li.querySelector("a.external");
            return ext ? { url: ext.getAttribute("href"), text: li.textContent } : null;
          }).filter(Boolean);
          rowLinks = cellLinks;
        }
        for (var i = 0; i < cs; i++) {
          row[c + i] = txt;
          for (var k = 1; k < rs; k++) { spans[(r + k) + "," + (c + i)] = txt; if (c + i === 0) lspans[(r + k) + ",0"] = cellLinks; }
        }
        c += cs;
      });
      while (spans[r + "," + c] !== undefined) { if (c === 0) rowLinks = lspans[r + ",0"]; row[c] = spans[r + "," + c]; c++; }
      rows.push(row);
      rows.links.push(rowLinks || []);
    });
    return rows;
  }

  // Words that identify a pollster (skips generic words shared by many firms), plus the squashed name, e.g. "bigdatapoll".
  var GENERIC = /^(the|and|for|research|group|polling|poll|polls|insights|strategies|strategy|associates|partners|solutions|public|policy|university|college|institute|center|opinion|survey|surveys|data|analytics|consulting|communications|market|news|inc|llc|international)$/;
  function idents(name) {
    var out = [];
    name.toLowerCase().replace(/\([^)]*\)/g, " ").split(/\/|&| and /).forEach(function (part) {
      var squashed = part.replace(/[^a-z0-9]/g, "");
      if (squashed.length >= 5) out.push(squashed);
      (part.match(/[a-z][a-z0-9]{3,}/g) || []).forEach(function (w) { if (!GENERIC.test(w)) out.push(w); });
    });
    return out.filter(function (x, i, a) { return a.indexOf(x) === i; });
  }
  function has(hay, ids) {
    var sq = hay.replace(/[^a-z0-9]/g, "");
    return ids.some(function (t) { return sq.indexOf(t) > -1; });
  }
  // The link must belong to this pollster. A link naming a different pollster from the same race is rejected even if
  // the citation's title looks right. Links to neutral hosts (PDF hosts, cloud drives) are trusted only if the title names the pollster.
  function pickSource(pollster, links, allNames) {
    if (!links || !links.length) return null;
    var own = idents(pollster);
    var others = [];
    allNames.forEach(function (n) { if (n !== pollster) idents(n).forEach(function (t) { if (own.indexOf(t) < 0 && others.indexOf(t) < 0) others.push(t); }); });
    for (var i = 0; i < links.length; i++) {
      var url = (links[i].url || "").toLowerCase(), text = (links[i].text || "").toLowerCase();
      if (has(url, own)) return links[i].url;
      if (has(url, others)) continue;
      if (has(text, own)) return links[i].url;
    }
    return null;
  }

  function parseRace(race, html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var h2 = "", h3 = "", table = null, pred = null;
    Array.prototype.some.call(doc.querySelectorAll("h2, h3, h4, table.wikitable"), function (el) {
      if (el.tagName === "H2") { h2 = el.textContent; h3 = ""; return false; }
      if (el.tagName === "H3" || el.tagName === "H4") { h3 = el.textContent; return false; }
      if (!/general election/i.test(h2)) return false;
      var first = el.querySelector("tr");
      var head = first ? first.textContent.toLowerCase() : "";
      if (!pred && /predictions/i.test(h3)) pred = el;
      if (!table && /poll source/.test(head) && race.c.every(function (c) { return head.indexOf(c[0].toLowerCase()) > -1; })) table = el;
      return !!(table && pred);
    });
    var ratings = [];
    if (pred) grid(pred, null).forEach(function (row) {
      RATERS.forEach(function (rt) {
        if (row[0] && rt[1].test(row[0]) && row[1] && !ratings.some(function (x) { return x[0] === rt[0]; })) ratings.push([rt[0], row[1]]);
      });
    });
    var polls = [], dropped = [];
    if (table) {
      var g = grid(table, doc), head = g[0].map(function (h) { return h.toLowerCase(); });
      var col = race.c.map(function (c) { return head.findIndex(function (h) { return h.indexOf(c[0].toLowerCase()) > -1; }); });
      var und = head.findIndex(function (h) { return /undecided/.test(h); });
      var names = g.slice(1).map(function (row) { return row[0] || ""; }).filter(function (n, i, a) { return n && a.indexOf(n) === i; });
      g.slice(1).forEach(function (row, idx) {
        var pollster = row[0] || "";
        if (!pollster || MEDIA.test(pollster) || /average|aggregat/i.test(pollster)) return;
        var d = endDate(row[1] || "");
        var vals = col.map(function (i) { var v = parseFloat((row[i] || "").replace(/[^\d.]/g, "")); return i > -1 && !isNaN(v) ? v : null; });
        if (!d || vals[0] === null || vals[1] === null) return;
        // Sanity checks: real percentages, a total that is possible, and a source that belongs to this pollster.
        var sum = vals.reduce(function (a, b) { return a + (b || 0); }, 0);
        if (vals.some(function (v) { return v !== null && (v < 0 || v > 100); }) || sum > 101) { dropped.push(pollster + ": impossible numbers"); return; }
        var src = pickSource(pollster, g.links[idx + 1], names);
        if (!src) { dropped.push(pollster + ": no matching source"); return; }
        if (MEDIA.test(src)) return;
        polls.push({ pollster: pollster, dates: row[1], sample: row[2] || "", moe: row[3] || "", end: d.toISOString(), v: vals, und: und > -1 ? parseFloat(row[und]) || null : null, src: src });
      });
    }
    // One entry per poll: when a pollster reports likely-voter, registered-voter and all-adult versions, keep likely voters.
    var byKey = {};
    polls.forEach(function (p) {
      var k = p.pollster + "|" + p.dates, cur = byKey[k];
      var rank = function (x) { return /\(LV\)/.test(x.sample) ? 0 : /\(RV\)/.test(x.sample) ? 1 : 2; };
      if (!cur || rank(p) < rank(cur)) byKey[k] = p;
    });
    polls = Object.keys(byKey).map(function (k) { return byKey[k]; });
    polls.sort(function (a, b) { return new Date(b.end) - new Date(a.end); });
    return { polls: polls, ratings: ratings, dropped: dropped };
  }

  function average(polls, n) {
    if (!polls.length) return null;
    var latest = new Date(polls[0].end);
    var recent = polls.filter(function (p) { return latest - new Date(p.end) <= 30 * 864e5; }).slice(0, 6);
    // With only one poll in the last 30 days, show that poll alone rather than mixing in stale ones.
    var out = [];
    for (var i = 0; i < n; i++) {
      var vs = recent.map(function (p) { return p.v[i]; }).filter(function (x) { return x !== null && x !== undefined; });
      out.push(vs.length ? Math.round(vs.reduce(function (a, b) { return a + b; }, 0) / vs.length * 10) / 10 : null);
    }
    return { vals: out, count: recent.length };
  }

  // Use the newest version of the page that has stood for at least 3 hours, so fresh vandalism never reaches the site.
  var SETTLE_HOURS = 3;
  function fetchRace(race) {
    var api = "https://en.wikipedia.org/w/api.php?format=json&origin=*&formatversion=2&";
    var cutoff = new Date(Date.now() - SETTLE_HOURS * 3600e3).toISOString();
    return fetch(api + "action=query&prop=revisions&rvprop=ids|timestamp&rvlimit=1&rvdir=older&rvstart=" + cutoff + "&redirects=1&titles=" + race.page)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (q) {
        var pg = q.query && q.query.pages && q.query.pages[0];
        var rev = pg && pg.revisions && pg.revisions[0];
        if (!rev) throw new Error("no settled revision");
        return fetch(api + "action=parse&prop=text&oldid=" + rev.revid)
          .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
          .then(function (j) {
            if (j.error) throw new Error(j.error.code);
            var d = parseRace(race, j.parse.text);
            d.asOf = rev.timestamp; d.revid = rev.revid;
            return d;
          });
      });
  }

  /* Rendering */
  function color(p) { return p === "R" ? "var(--rep)" : p === "D" ? "var(--dem)" : "var(--ind)"; }
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return "source"; } }
  function fmtDate(iso) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

  function trend(race, polls) {
    if (polls.length < 3) return "";
    var W = 600, H = 190, L = 34, R = 96, T = 14, B = 26;
    var pts = polls.slice().reverse();
    var t0 = new Date(pts[0].end).getTime(), t1 = ELECTION.getTime();
    var all = []; pts.forEach(function (p) { p.v.forEach(function (x) { if (x !== null) all.push(x); }); });
    var lo = Math.max(0, Math.floor((Math.min.apply(null, all) - 4) / 5) * 5), hi = Math.min(100, Math.ceil((Math.max.apply(null, all) + 4) / 5) * 5);
    var x = function (t) { return L + (t - t0) / (t1 - t0 || 1) * (W - L - R); };
    var y = function (v) { return T + (hi - v) / (hi - lo || 1) * (H - T - B); };
    var grid = "", tick;
    for (tick = lo; tick <= hi; tick += (hi - lo > 20 ? 10 : 5)) grid += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(tick) + '" y2="' + y(tick) + '" class="gl"/><text x="' + (L - 6) + '" y="' + (y(tick) + 4) + '" class="ax" text-anchor="end">' + tick + "%</text>";
    var ex = x(t1);
    grid += '<line x1="' + ex + '" x2="' + ex + '" y1="' + T + '" y2="' + (H - B) + '" class="ed"/><text x="' + ex + '" y="' + (H - 8) + '" class="ax" text-anchor="middle">Nov. 3</text>';
    grid += '<text x="' + L + '" y="' + (H - 8) + '" class="ax">' + fmtDate(pts[0].end) + "</text>";
    var series = race.c.map(function (c, i) {
      var sp = pts.filter(function (p) { return p.v[i] !== null; });
      var avg = sp.map(function (p, k) {
        var win = sp.slice(Math.max(0, k - 2), k + 1).map(function (q) { return q.v[i]; });
        return [x(new Date(p.end).getTime()), y(win.reduce(function (a, b) { return a + b; }, 0) / win.length)];
      });
      var line = avg.length > 1 ? '<polyline points="' + avg.map(function (a) { return a[0].toFixed(1) + "," + a[1].toFixed(1); }).join(" ") + '" fill="none" stroke="' + color(c[2]) + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' : "";
      var dots = sp.map(function (p) { return '<circle cx="' + x(new Date(p.end).getTime()).toFixed(1) + '" cy="' + y(p.v[i]).toFixed(1) + '" r="3.5" fill="' + color(c[2]) + '" class="pd"/>'; }).join("");
      var last = avg[avg.length - 1];
      var label = last ? '<text x="' + (last[0] + 8) + '" y="' + (last[1] + 4) + '" class="dl">' + esc(c[0]) + "</text>" : "";
      return { el: dots + line + label, lastY: last ? last[1] : 0 };
    });
    var hits = pts.map(function (p, k) {
      return '<rect x="' + (x(new Date(p.end).getTime()) - 7) + '" y="' + T + '" width="14" height="' + (H - T - B) + '" class="hit" data-k="' + (pts.length - 1 - k) + '"/>';
    }).join("");
    return '<div class="trend"><svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(race.office + " polls over time in " + race.state) + '">' + grid +
      series.map(function (s) { return s.el; }).join("") + '<line class="xh" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) + '"/>' + hits + '</svg><div class="tip" role="status"></div></div>';
  }

  function card(race, data, big) {
    var polls = data.polls, avg = average(polls, race.c.length);
    var ratings = data.ratings.map(function (r) { return '<span class="tag">' + esc(r[0]) + ": " + esc(r[1]) + "</span>"; }).join("");
    var body;
    if (!avg) {
      body = data.dropped && data.dropped.length ?
        '<p style="margin:8px 0 0">Polls exist for this race, but none passed our source checks yet. See the compiled list below to check them yourself.</p>' :
        '<p style="margin:8px 0 0">No public polls released for this race yet.</p>';
    } else {
      var order = race.c.map(function (c, i) { return i; }).filter(function (i) { return avg.vals[i] !== null; }).sort(function (a, b) { return avg.vals[b] - avg.vals[a]; });
      var lead = order[0], second = order[1];
      var margin = second !== undefined ? Math.round((avg.vals[lead] - avg.vals[second]) * 10) / 10 : 0;
      var total = avg.vals.reduce(function (a, b) { return a + (b || 0); }, 0);
      var split = race.c.map(function (c, i) {
        if (avg.vals[i] === null) return "";
        return '<span class="seg" style="flex:' + avg.vals[i] + ";background:" + color(c[2]) + '"></span>';
      }).join("") + (total < 100 ? '<span class="seg und" style="flex:' + (100 - total) + '"></span>' : "");
      var cands = race.c.map(function (c, i) {
        if (avg.vals[i] === null) return "";
        return '<div class="cand"><span class="sw" style="background:' + color(c[2]) + '"></span><span class="nm">' + esc(c[1]) + ' <span class="pt">(' + c[2] + ')</span></span><span class="pc">' + avg.vals[i] + "%</span></div>";
      }).join("");
      var latest = polls[0];
      var rows = polls.map(function (p) {
        return "<tr><td>" + esc(p.pollster) + "</td><td>" + esc(p.dates) + "</td><td>" + esc(p.sample) + "</td>" + race.c.map(function (c, i) { return "<td>" + (p.v[i] !== null ? p.v[i] + "%" : "") + "</td>"; }).join("") +
          '<td><a href="' + esc(p.src) + '" target="_blank" rel="noopener">' + esc(host(p.src)) + "</a></td></tr>";
      }).join("");
      body =
        '<div class="lead-line"><span class="lead-nm">' + esc(race.c[lead][0]) + '</span> <span class="lead-mg" style="color:' + color(race.c[lead][2]) + '">' + (margin > 0 ? "+" + margin : "Tied") + "</span></div>" +
        '<p class="meta" style="margin:0 0 14px">' + (avg.count === 1 ? "Latest poll" : "Average of the " + avg.count + " most recent polls") + "</p>" +
        '<div class="split" role="img" aria-label="' + esc(race.c.map(function (c, i) { return c[1] + " " + (avg.vals[i] || 0) + " percent"; }).join(", ")) + '">' + split + "</div>" +
        '<div class="cands">' + cands + "</div>" +
        (big ? trend(race, polls) : "") +
        '<p class="meta latest">Latest: ' + esc(latest.pollster) + " / " + esc(latest.dates) + (latest.sample ? " / " + esc(latest.sample) : "") +
        ' / <a href="' + esc(latest.src) + '" target="_blank" rel="noopener">read the release</a></p>' +
        '<details class="poll-table"><summary>All ' + polls.length + " poll" + (polls.length === 1 ? "" : "s") + '</summary><div class="table-scroll"><table><thead><tr><th>Pollster</th><th>Dates</th><th>Sample</th>' +
        race.c.map(function (c) { return "<th>" + esc(c[0]) + "</th>"; }).join("") + "<th>Original release</th></tr></thead><tbody>" + rows + "</tbody></table></div></details>";
    }
    return '<article class="card race' + (big ? " race-big" : "") + '" data-state="' + esc(race.state) + '" data-race="' + race.id + '">' +
      '<div class="kicker">' + esc(race.state) + " / " + esc(race.office) + "</div>" +
      (ratings ? '<div class="ratings">' + ratings + "</div>" : "") + body +
      '<a class="src-link" href="https://en.wikipedia.org/w/index.php?oldid=' + (data.revid || "") + '#General_election" target="_blank" rel="noopener">Compiled list' + (data.asOf ? ", as of " + new Date(data.asOf).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "") + " &rarr;</a></article>";
  }

  function wireTrends(scope) {
    scope.querySelectorAll(".trend").forEach(function (tr) {
      var cardEl = tr.closest(".race"), race = RACES.filter(function (r) { return r.id === cardEl.getAttribute("data-race"); })[0];
      var data = STORE[race.id]; if (!data) return;
      var tip = tr.querySelector(".tip"), xh = tr.querySelector(".xh"), svg = tr.querySelector("svg");
      function show(rect) {
        var p = data.polls[+rect.getAttribute("data-k")];
        var cx = +rect.getAttribute("x") + 7;
        xh.setAttribute("x1", cx); xh.setAttribute("x2", cx); xh.style.opacity = 1;
        tip.innerHTML = "<b>" + esc(p.pollster) + "</b><br>" + esc(p.dates) + "<br>" + race.c.map(function (c, i) { return p.v[i] !== null ? '<span class="sw" style="background:' + color(c[2]) + '"></span>' + esc(c[0]) + " " + p.v[i] + "%" : ""; }).join("<br>");
        var box = svg.getBoundingClientRect(), px = cx / 600 * box.width;
        tip.style.left = Math.min(Math.max(px, 70), box.width - 70) + "px"; tip.classList.add("on");
      }
      function hide() { tip.classList.remove("on"); xh.style.opacity = 0; }
      tr.querySelectorAll(".hit").forEach(function (h) {
        h.addEventListener("mouseenter", function () { show(h); });
        h.addEventListener("click", function () { show(h); });
      });
      tr.addEventListener("mouseleave", hide);
    });
  }

  var STORE = {};
  function readCache() { try { var c = JSON.parse(localStorage.getItem(CACHE) || "null"); return c && Date.now() - c.t < TTL ? c : null; } catch (e) { return null; } }
  function writeCache() { try { localStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), data: STORE })); } catch (e) {} }

  function render(target, ids, big) {
    var races = RACES.filter(function (r) { return ids.indexOf(r.id) > -1 || (ids[0] === "*south" && r.state !== "Alabama"); });
    target.innerHTML = races.map(function (r) {
      return STORE[r.id] ? card(r, STORE[r.id], big) : STORE[r.id] === false ?
        '<article class="card race" data-state="' + esc(r.state) + '"><div class="kicker">' + esc(r.state) + " / " + esc(r.office) + '</div><p class="meta">Could not load polls right now. <a href="https://en.wikipedia.org/wiki/' + r.page + '" target="_blank" rel="noopener">See the source table</a>.</p></article>' :
        '<article class="card race" data-state="' + esc(r.state) + '"><div class="kicker">' + esc(r.state) + " / " + esc(r.office) + '</div><div class="skeleton" style="height:120px;border:0;border-radius:12px"></div></article>';
    }).join("");
    wireTrends(target);
    if (window.QHReveal) window.QHReveal(target);
  }

  function status(txt) { document.querySelectorAll("[data-polls-status]").forEach(function (el) { el.textContent = txt; }); }

  function init() {
    var targets = Array.prototype.slice.call(document.querySelectorAll("[data-polls]"));
    if (!targets.length) return;
    var need = {};
    targets.forEach(function (t) {
      var ids = t.getAttribute("data-polls").split(",");
      RACES.forEach(function (r) { if (ids.indexOf(r.id) > -1 || (ids[0] === "*south" && r.state !== "Alabama")) need[r.id] = r; });
    });
    function paint() { targets.forEach(function (t) { render(t, t.getAttribute("data-polls").split(","), t.hasAttribute("data-big")); }); }
    var cached = readCache();
    if (cached) { STORE = cached.data; paint(); status("Checked " + Math.max(1, Math.round((Date.now() - cached.t) / 60000)) + "m ago"); return; }
    paint(); status("Loading the latest polls");
    var list = Object.keys(need).map(function (k) { return need[k]; });
    var done = 0;
    Promise.all(list.map(function (r) {
      return fetchRace(r).then(function (d) { STORE[r.id] = d; }).catch(function () { STORE[r.id] = false; }).then(function () {
        done++; if (done % 4 === 0) paint();
      });
    })).then(function () {
      paint(); writeCache();
      var ok = list.filter(function (r) { return STORE[r.id]; }).length;
      status(ok ? "Checked just now" : "Polls could not load right now");
    });
    // State filter on the polls page
    var chips = document.getElementById("poll-states");
    if (chips) {
      var states = ["All"].concat(RACES.filter(function (r) { return r.state !== "Alabama"; }).map(function (r) { return r.state; }).filter(function (s, i, a) { return a.indexOf(s) === i; }));
      chips.innerHTML = states.map(function (s, i) { return '<button class="chip" type="button" data-v="' + s + '" aria-pressed="' + (i === 0) + '">' + s + "</button>"; }).join("");
      chips.addEventListener("click", function (e) {
        var b = e.target.closest(".chip"); if (!b) return;
        chips.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", c === b); });
        var v = b.getAttribute("data-v");
        document.querySelectorAll("#polls-south .race").forEach(function (c) { c.style.display = v === "All" || c.getAttribute("data-state") === v ? "" : "none"; });
      });
    }
  }

  window.QHPolls = { races: RACES, init: init, parseRace: parseRace, endDate: endDate, fetchRace: fetchRace, average: average };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
