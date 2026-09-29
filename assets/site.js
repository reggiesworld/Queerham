/* queerham site engine: chrome, motion, cursor, feed rendering, posts, checklists */
(function () {
  var body = document.body;
  var root = body.getAttribute("data-root") || "";
  var page = body.getAttribute("data-page") || "";
  var ELECTION = new Date("2026-11-03T07:00:00-06:00");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ago(d) {
    var s = Math.max(1, Math.round((Date.now() - new Date(d)) / 1000));
    if (s < 60) return "just now";
    var m = Math.round(s / 60); if (m < 60) return m + "m ago";
    var h = Math.round(m / 60); if (h < 24) return h + "h ago";
    var dd = Math.round(h / 24); if (dd < 7) return dd + "d ago";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function clock(d) { return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }

  /* Theme */
  var saved = store("qh-theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  /* Header */
  var links = [
    ["live.html", "Live Feed", "live"], ["joy.html", "Queer Joy", "joy"], ["world.html", "Wider World", "world"], ["polls.html", "Polls", "polls"], ["news.html", "Stories", "news"],
    ["states.html", "States", "states"], ["federal.html", "Federal", "federal"],
    ["protect.html", "Protect", "protect"], ["vote.html", "Vote", "vote"], ["about.html", "About", "about"]
  ];
  var header = document.getElementById("site-header");
  if (header) {
    header.className = "site-header";
    header.innerHTML =
      '<div class="wrap bar">' +
      '<a class="logo" href="' + root + 'index.html" data-cursor="Home">queer<span>ham</span></a>' +
      '<nav class="nav" id="nav" aria-label="Main">' + links.map(function (l) {
        return '<a href="' + root + l[0] + '"' + (page === l[2] ? ' aria-current="page"' : "") + ">" + l[1] + "</a>";
      }).join("") + "</nav>" +
      '<div class="tools">' +
      '<a class="live-pill magnetic" href="' + root + 'live.html"><span class="dot"></span><span class="txt">Live</span></a>' +
      '<button class="theme-btn" id="theme-btn" type="button" aria-label="Toggle dark mode"></button>' +
      '<button class="menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button>' +
      "</div></div>";
    var tb = document.getElementById("theme-btn");
    var setLabel = function () { tb.textContent = isDark() ? "Light" : "Dark"; };
    setLabel();
    tb.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      store("qh-theme", next); setLabel();
    });
    var mb = document.getElementById("menu-btn"), nav = document.getElementById("nav");
    mb.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      mb.setAttribute("aria-expanded", open ? "true" : "false");
      mb.textContent = open ? "Close" : "Menu";
      document.documentElement.style.overflow = open ? "hidden" : "";
    });
  }

  /* Progress bar, header hide on scroll */
  var pb = document.createElement("div"); pb.className = "progress-bar"; body.appendChild(pb);
  var lastY = window.scrollY, ticking = false, velocity = 0;
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    pb.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
    if (header && !(document.getElementById("nav") || {}).classList.contains("open")) {
      header.classList.toggle("hide", y > lastY && y > 240);
    }
    velocity = y - lastY; lastY = y; ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });

  /* Ticker (live headlines) */
  var ticker = document.getElementById("ticker");
  if (ticker) {
    ticker.className = "ticker";
    ticker.innerHTML = '<div class="ticker-inner"><a class="ticker-label" href="' + root + 'live.html"><span class="dot"></span>Live</a><div class="marquee" aria-label="Latest headlines"><div class="marquee-track" id="ticker-track"></div></div></div>';
  }
  function fillTicker(items) {
    var track = document.getElementById("ticker-track");
    if (!track || !items.length) return;
    var days = Math.ceil((ELECTION - new Date()) / 86400000);
    var html = "";
    if (days > 0) html += '<a href="' + root + 'vote.html"><span class="src">Vote</span>' + days + " days until Election Day</a><span class=\"sep\"></span>";
    html += items.slice(0, 14).map(function (i) {
      return '<a href="' + esc(i.link) + '" target="_blank" rel="noopener"><span class="src">' + esc(i.source) + "</span>" + esc(i.title) + '</a><span class="sep"></span>';
    }).join("");
    track.innerHTML = html + '<span aria-hidden="true" style="display:contents">' + html + "</span>";
    track.style.setProperty("--dur", Math.max(60, items.length * 7) + "s");
  }

  /* Footer */
  var footer = document.getElementById("site-footer");
  if (footer) {
    footer.innerHTML =
      '<section class="help"><div class="wrap">' +
      "<h3>In crisis right now?</h3>" +
      '<span>Call or text <a href="tel:988">988</a></span>' +
      '<span>Trevor Project <a href="tel:18664887386">1-866-488-7386</a></span>' +
      '<span>Trans Lifeline <a href="tel:8775658860">877-565-8860</a></span>' +
      '<span>LGBT National Hotline <a href="tel:18888434564">888-843-4564</a></span>' +
      "</div></section>" +
      '<div class="site-footer"><div class="wrap"><div class="cols">' +
      "<div><p style=\"font:600 1.3rem var(--display);letter-spacing:-.02em;color:var(--ink);max-width:420px\">News, advocacy and plain-language guides for queer people across the South.</p>" +
      '<p class="updated">Based in Birmingham, Alabama. Nothing here is legal or medical advice. Live headlines link to outside outlets that queerham does not control.</p>' +
      '<p class="font-credit">Logo set in <a href="https://www.typewithpride.com/" target="_blank" rel="noopener">Gilbert</a>, the typeface honoring Gilbert Baker, licensed <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.</p></div>' +
      '<div><strong>Read</strong><ul><li><a href="' + root + 'live.html">Live feed</a></li><li><a href="' + root + 'joy.html">Queer Joy</a></li><li><a href="' + root + 'world.html">Wider world</a></li><li><a href="' + root + 'polls.html">Polls</a></li><li><a href="' + root + 'news.html">Stories</a></li>' +
      '<li><a href="' + root + 'states.html">State tracker</a></li><li><a href="' + root + 'federal.html">Federal tracker</a></li><li><a href="' + root + 'vote.html">Vote 2026</a></li></ul></div>' +
      '<div><strong>About</strong><ul><li><a href="' + root + 'about.html">Who runs this</a></li><li><a href="' + root + 'about.html#standards">Editorial standards</a></li>' +
      '<li><a href="' + root + 'about.html#corrections">Corrections</a></li><li><a href="https://www.instagram.com/queer.ham/" target="_blank" rel="noopener">Instagram</a></li></ul></div>' +
      '</div><div class="footer-word" aria-hidden="true">queer<span>ham</span></div></div></div>';
  }

  /* Posts (original stories) */
  var TYPE_NAMES = { news: "News", take: "Perspective", explainer: "Explainer" };
  function fmt(d) { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  function card(p, big) {
    return '<article class="card' + (big ? " big" : "") + '" data-type="' + p.type + '" data-scope="' + p.scope.join("|") + '" data-cursor="Read">' +
      '<span class="label ' + p.type + '">' + TYPE_NAMES[p.type] + "</span>" +
      '<h3><a href="' + root + "posts/" + p.slug + '.html">' + p.title + "</a></h3>" +
      "<p>" + p.dek + "</p>" +
      '<div class="meta">' + fmt(p.date) + " / " + p.scope.join(", ") + "</div></article>";
  }
  var posts = window.QH_POSTS || [];
  var feat = document.getElementById("featured");
  if (feat && posts.length) feat.innerHTML = card(posts[0], true) + '<div class="stack">' + posts.slice(1, 3).map(function (p) { return card(p); }).join("") + "</div>";
  var list = document.getElementById("post-list");
  if (list) {
    var limit = parseInt(list.getAttribute("data-limit") || "0", 10);
    var items = limit ? posts.slice(0, limit) : posts;
    list.innerHTML = items.length ? items.map(function (p) { return card(p); }).join("") : '<p class="meta">No posts yet.</p>';
  }
  var filters = document.getElementById("filters");
  if (filters && list) {
    var active = { type: "all", scope: "all" };
    filters.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      var group = b.getAttribute("data-group");
      active[group] = b.getAttribute("data-value");
      filters.querySelectorAll('.chip[data-group="' + group + '"]').forEach(function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
      var shown = 0;
      list.querySelectorAll(".card").forEach(function (c) {
        var ok = (active.type === "all" || c.getAttribute("data-type") === active.type) &&
          (active.scope === "all" || c.getAttribute("data-scope").split("|").indexOf(active.scope) > -1);
        c.style.display = ok ? "" : "none"; if (ok) shown++;
      });
      var empty = document.getElementById("empty"); if (empty) empty.style.display = shown ? "none" : "block";
    });
  }

  /* Countdown, timelines, checklists */
  document.querySelectorAll('[data-count="election"]').forEach(function (el) {
    el.setAttribute("data-count", Math.max(0, Math.ceil((ELECTION - new Date()) / 86400000)));
  });
  document.querySelectorAll("[data-countdown]").forEach(function (el) {
    var d = Math.ceil((ELECTION - new Date()) / 86400000); el.textContent = d > 0 ? d : "Today";
  });
  document.querySelectorAll(".timeline").forEach(function (tl) {
    var now = new Date(), nextSet = false;
    tl.querySelectorAll("li[data-date]").forEach(function (li) {
      var d = new Date(li.getAttribute("data-date"));
      if (d < now) li.classList.add("past"); else if (!nextSet) { li.classList.add("next"); nextSet = true; }
    });
  });
  document.querySelectorAll(".checklist[data-key]").forEach(function (cl) {
    var key = "qh-" + cl.getAttribute("data-key"), st = {};
    try { st = JSON.parse(store(key) || "{}"); } catch (e) { st = {}; }
    var boxes = cl.querySelectorAll("input[type=checkbox]");
    var out = document.querySelector('[data-progress="' + cl.getAttribute("data-key") + '"]');
    function upd() { var n = 0; boxes.forEach(function (b) { if (b.checked) n++; }); if (out) out.textContent = n + " of " + boxes.length + " done"; }
    boxes.forEach(function (b, i) { b.checked = !!st[i]; b.addEventListener("change", function () { st[i] = b.checked; store(key, JSON.stringify(st)); upd(); }); });
    upd();
  });

  /* Reading progress on articles */
  var art = document.querySelector(".article");
  if (art) {
    var rp = document.createElement("div"); rp.className = "read-progress"; body.appendChild(rp);
    window.addEventListener("scroll", function () {
      var r = art.getBoundingClientRect(), tot = r.height - innerHeight;
      rp.style.width = Math.min(100, Math.max(0, (-r.top / (tot > 0 ? tot : 1)) * 100)) + "%";
    }, { passive: true });
  }

  /* Reveal on scroll */
  var io = ("IntersectionObserver" in window && !reduce) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  function reveal(scope) {
    (scope || document).querySelectorAll(".card, .section-head, .timeline li, details, .stat, .legend > div, .checklist li, .table-scroll, .callout, .feed-note, .story").forEach(function (el, i) {
      if (el.classList.contains("reveal")) return;
      if (!io) return;
      el.classList.add("reveal");
      el.style.setProperty("--d", (i % 6) * 0.06 + "s");
      io.observe(el);
    });
  }

  window.QHReveal = reveal;

  /* Count up */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduce) { el.textContent = target; return; }
    var t0 = performance.now(), dur = 1400;
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur); p = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * p); if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  var cio = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
  }) : null;
  function observeCounts() { document.querySelectorAll("[data-count]").forEach(function (el) { if (cio) cio.observe(el); else countUp(el); }); }

  /* Big kinetic marquee: drifts on its own, speeds up with scroll */
  document.querySelectorAll(".mega-track").forEach(function (track) {
    track.innerHTML += track.innerHTML;
    if (reduce) return;
    var x = 0, dir = track.getAttribute("data-dir") === "right" ? 1 : -1;
    (function loop() {
      var half = track.scrollWidth / 2;
      x += dir * (0.6 + Math.min(Math.abs(velocity) * 0.25, 14));
      if (x <= -half) x += half; if (x > 0) x -= half;
      track.style.transform = "translate3d(" + x + "px,0,0)";
      velocity *= 0.92;
      requestAnimationFrame(loop);
    })();
  });

  /* Custom cursor */
  function initCursor() {
    if (!fine || reduce) return;
    var dot = document.createElement("div"), ring = document.createElement("div");
    dot.className = "cursor-dot"; ring.className = "cursor-ring"; ring.innerHTML = "<span></span>";
    body.appendChild(dot); body.appendChild(ring);
    document.documentElement.classList.add("has-cursor");
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, scale = 1;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
      document.documentElement.classList.remove("cursor-hidden");
    });
    document.addEventListener("mouseleave", function () { document.documentElement.classList.add("cursor-hidden"); });
    window.addEventListener("mousedown", function () { scale = .75; });
    window.addEventListener("mouseup", function () { scale = 1; });
    document.addEventListener("mouseover", function (e) {
      var t = e.target.closest("a, button, summary, label, input, [data-cursor]");
      var lbl = t && t.closest("[data-cursor]");
      ring.classList.toggle("is-label", !!lbl);
      ring.classList.toggle("is-link", !!t && !lbl);
      ring.querySelector("span").textContent = lbl ? lbl.getAttribute("data-cursor") : "";
    });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0) scale(" + scale + ")";
      requestAnimationFrame(loop);
    })();
  }

  /* Magnetic buttons */
  function magnet() {
    if (!fine || reduce) return;
    document.querySelectorAll(".btn, .magnetic").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.25 + "px," + (e.clientY - r.top - r.height / 2) * 0.35 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* Live feed rendering */
  function storyHTML(i, lead) {
    var tags = i.regions.concat(i.topics).slice(0, 4).map(function (t) { return '<span class="tag' + (t === "Queer Joy" ? " good" : "") + '">' + esc(t) + "</span>"; }).join("");
    var fav = i.domain ? '<img src="https://www.google.com/s2/favicons?domain=' + encodeURIComponent(i.domain) + '&sz=64" alt="" loading="lazy" width="16" height="16">' : "";
    return '<a class="story' + (lead ? " lead" : "") + '" href="' + esc(i.link) + '" target="_blank" rel="noopener" data-cursor="Read" data-link="' + esc(i.link) + '">' +
      '<div class="time"><b>' + ago(i.date) + "</b>" + clock(i.date) + "</div>" +
      "<div><div class=\"src\">" + fav + esc(i.source) + (lead ? " / " + ago(i.date) : "") + "</div><h3>" + esc(i.title) + "</h3><div>" + tags + "</div></div>" +
      '<span class="go" aria-hidden="true">&rarr;</span></a>';
  }
  function tileHTML(i) {
    return '<a class="card tile" href="' + esc(i.link) + '" target="_blank" rel="noopener" data-cursor="Read">' +
      '<div class="kicker" style="margin:0">' + esc(i.topics[0] || "") + " / " + ago(i.date) + "</div>" +
      "<h3>" + esc(i.title) + '</h3><div class="meta">' + esc(i.source) + "</div></a>";
  }

  function initFeed() {
    if (!window.QHFeed) return;
    var boxes = Array.prototype.slice.call(document.querySelectorAll("[data-feed]"));
    var channels = {};
    boxes.forEach(function (box) { channels[box.getAttribute("data-feed")] = 1; });
    if (document.getElementById("ticker-track")) channels.queer = 1;
    var toast = null, pending = null;

    boxes.forEach(function (box) {
      var ch = box.getAttribute("data-feed"), full = box.hasAttribute("data-full"), layout = box.getAttribute("data-layout") || "list";
      var limit = parseInt(box.getAttribute("data-limit") || "0", 10);
      var filt = { region: "All", topic: box.getAttribute("data-topic") || "All", q: "" };
      var chipsEl = box.getAttribute("data-chips") ? document.getElementById(box.getAttribute("data-chips")) : null;
      var prevLinks = {}, first = true;
      var topicList = ch === "world" ? QHFeed.worldTopics : QHFeed.topics;
      box.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';

      if (full) {
        var side = document.getElementById(box.getAttribute("data-side"));
        side.innerHTML =
          '<div><h4>Search</h4><input class="search" type="search" placeholder="Search headlines" aria-label="Search headlines"></div>' +
          (ch === "queer" ? '<div><h4>Where</h4><div class="filters" data-group-box="region"></div></div>' : "") +
          '<div><h4>Topic</h4><div class="filters" data-group-box="topic"></div></div>' +
          '<div class="feed-note">Headlines come straight from independent and community newsrooms, never national mainstream outlets. Newest first, refreshed every few minutes. queerham does not write or endorse them.</div>';
        side.querySelector(".search").addEventListener("input", function () { filt.q = this.value.toLowerCase(); draw(QHFeed[ch].state); });
        side.addEventListener("click", function (e) {
          var b = e.target.closest(".chip"); if (!b) return;
          filt[b.getAttribute("data-group")] = b.getAttribute("data-value"); draw(QHFeed[ch].state);
        });
        if (!toast) {
          toast = document.createElement("button"); toast.className = "toast"; toast.type = "button";
          toast.addEventListener("click", function () { toast.classList.remove("show"); if (pending) { pending(); pending = null; } window.scrollTo({ top: box.offsetTop - 120, behavior: "smooth" }); });
          body.appendChild(toast);
        }
      }
      if (chipsEl) chipsEl.addEventListener("click", function (e) {
        var b = e.target.closest(".chip"); if (!b) return;
        filt.topic = b.getAttribute("data-value"); draw(QHFeed[ch].state);
      });

      function chips(group, values, items, key) {
        var counts = {};
        items.forEach(function (i) { i[key].forEach(function (v) { counts[v] = (counts[v] || 0) + 1; }); });
        return ["All"].concat(values.filter(function (v) { return counts[v]; })).map(function (v) {
          return '<button class="chip' + (v === "Queer Joy" ? " good" : "") + '" type="button" data-group="' + group + '" data-value="' + v + '" aria-pressed="' + (filt[group] === v) + '">' + v +
            (v === "All" ? "" : '<span class="n">' + counts[v] + "</span>") + "</button>";
        }).join("");
      }
      function draw(st, markNew) {
        if (full) {
          var side = document.getElementById(box.getAttribute("data-side"));
          var rb = side.querySelector('[data-group-box="region"]'), tb = side.querySelector('[data-group-box="topic"]');
          if (rb) rb.innerHTML = chips("region", QHFeed.regions, st.items, "regions");
          if (tb) tb.innerHTML = chips("topic", topicList, st.items, "topics");
        }
        if (chipsEl) chipsEl.innerHTML = chips("topic", topicList, st.items, "topics");
        var shown = st.items.filter(function (i) {
          return (filt.region === "All" || i.regions.indexOf(filt.region) > -1) &&
            (filt.topic === "All" || i.topics.indexOf(filt.topic) > -1) &&
            (!filt.q || (i.title + " " + i.source).toLowerCase().indexOf(filt.q) > -1);
        });
        if (limit) shown = shown.slice(0, limit);
        box.innerHTML = shown.length ? shown.map(function (i, n) { return layout === "tiles" ? tileHTML(i) : storyHTML(i, full && n === 0 && !filt.q); }).join("") :
          '<p class="meta" style="padding:24px 0">' + (st.loading ? "Loading headlines" : "Nothing here right now. Check back soon.") + "</p>";
        if (markNew) box.querySelectorAll(".story").forEach(function (s) { if (!prevLinks[s.getAttribute("data-link")]) s.classList.add("is-new"); });
        prevLinks = {}; st.items.forEach(function (i) { prevLinks[i.link] = 1; });
        reveal(box);
      }
      QHFeed[ch].on(function (st, extra) {
        if (st.loading && !first) return;
        if (extra.fresh && full && !first) {
          pending = function () { draw(st, true); };
          toast.innerHTML = '<span class="dot"></span>' + extra.fresh + " new " + (extra.fresh === 1 ? "story" : "stories");
          toast.classList.add("show"); return;
        }
        draw(st, !!extra.fresh);
        if (st.items.length) first = false;
      });
    });

    var statusEls = document.querySelectorAll("[data-feed-status]");
    function status(st, extra) {
      var txt = st.loading ? "Checking for new stories" :
        st.live ? "Live / updated " + (st.updated ? ago(st.updated) : "") :
        extra && extra.failed ? "Live sources unreachable, showing saved headlines" : "Showing saved headlines";
      statusEls.forEach(function (el) { el.innerHTML = '<span class="dot"></span>' + txt; });
    }
    if (channels.queer) QHFeed.queer.on(function (st, extra) { status(st, extra); if (!st.loading) fillTicker(st.items); });
    Object.keys(channels).forEach(function (ch) { QHFeed[ch].load(); });
    setInterval(function () { Object.keys(channels).forEach(function (ch) { QHFeed[ch].load(true); }); }, 5 * 60 * 1000);
    setInterval(function () { if (channels.queer) status(QHFeed.queer.state, {}); }, 60 * 1000);
  }

  /* Preloader (home page, once per session) */
  function ready() { document.documentElement.classList.add("is-ready"); body.classList.add("is-ready"); }
  var pre = document.getElementById("preloader");
  var seen = null; try { seen = sessionStorage.getItem("qh-pre"); } catch (e) {}
  if (pre && !seen && !reduce) {
    try { sessionStorage.setItem("qh-pre", "1"); } catch (e) {}
    var c = pre.querySelector(".count"), b = pre.querySelector(".bar"), n = 0;
    var iv = setInterval(function () {
      n = Math.min(100, n + Math.ceil(Math.random() * 14));
      c.textContent = n + "%"; b.style.width = n + "%";
      if (n >= 100) { clearInterval(iv); setTimeout(function () { pre.classList.add("done"); ready(); setTimeout(function () { pre.remove(); }, 1100); }, 250); }
    }, 70);
  } else {
    if (pre) pre.remove();
    requestAnimationFrame(ready);
  }

  /* Boot */
  function boot() { initCursor(); magnet(); reveal(); observeCounts(); initFeed(); onScroll(); }
  if (window.QHFeed) boot();
  else {
    var s = document.createElement("script");
    s.src = root + "assets/feed.js";
    s.onload = boot; s.onerror = boot;
    document.head.appendChild(s);
  }
})();
