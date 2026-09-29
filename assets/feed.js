/*
  queerham live feed engine
  Two channels:
    queer : news that affects LGBTQ+ people, with a "Queer Joy" tag
    world : the wider world (climate, AI and tech, health care, justice, economy)

  Where headlines come from, in order:
    1. data/feeds.json  - written every 15 minutes by the GitHub job in .github/workflows (most reliable)
    2. rss2json.com     - the visitor's browser reads a small set of feeds directly (fallback)
    3. SNAPSHOT below   - real headlines saved in Sept. 2026, used only if everything else fails

  Only independent and community outlets are used. No national mainstream outlets (see BLOCKED).
  To add an outlet, add a line to SOURCES. Set browser:true only for feeds you have confirmed load through rss2json.
*/
(function () {
  var ROOT = (document.body && document.body.getAttribute("data-root")) || "";

  var SOURCES = {
    queer: [
      { id: "lgbtqnation", name: "LGBTQ Nation", url: "https://www.lgbtqnation.com/feed/", queer: true, browser: true },
      { id: "erin", name: "Erin in the Morning", url: "https://www.erininthemorning.com/feed", queer: true, browser: true },
      { id: "advocate", name: "The Advocate", url: "https://www.advocate.com/feeds/feed.rss", queer: true, browser: true },
      { id: "them", name: "them", url: "https://www.them.us/feed/rss", queer: true, browser: true },
      { id: "19th", name: "The 19th", url: "https://19thnews.org/feed/", browser: true },
      { id: "capitalb", name: "Capital B", url: "https://www.capitalbnews.org/rss/", browser: true },
      { id: "alreflector", name: "Alabama Reflector", url: "https://alabamareflector.com/feed/" },
      { id: "alreporter", name: "Alabama Political Reporter", url: "https://www.alreporter.com/feed/" },
      { id: "garecorder", name: "Georgia Recorder", url: "https://georgiarecorder.com/feed/" },
      { id: "flphoenix", name: "Florida Phoenix", url: "https://floridaphoenix.com/feed/" },
      { id: "tnlookout", name: "Tennessee Lookout", url: "https://tennesseelookout.com/feed/" },
      { id: "msttoday", name: "Mississippi Today", url: "https://mississippitoday.org/feed/" },
      { id: "scgazette", name: "SC Daily Gazette", url: "https://scdailygazette.com/feed/" },
      { id: "ncnewsline", name: "NC Newsline", url: "https://ncnewsline.com/feed/" },
      { id: "lailluminator", name: "Louisiana Illuminator", url: "https://lailluminator.com/feed/" },
      { id: "kylantern", name: "Kentucky Lantern", url: "https://kentuckylantern.com/feed/" }
    ],
    world: [
      { id: "insideclimate", name: "Inside Climate News", url: "https://insideclimatenews.org/feed/", topic: "Climate", browser: true },
      { id: "grist", name: "Grist", url: "https://grist.org/feed/", topic: "Climate", browser: true },
      { id: "kffhealth", name: "KFF Health News", url: "https://kffhealthnews.org/feed/", topic: "Health care", browser: true },
      { id: "techreview", name: "MIT Technology Review", url: "https://www.technologyreview.com/feed/", topic: "AI & tech", browser: true },
      { id: "restofworld", name: "Rest of World", url: "https://restofworld.org/feed/latest/", topic: "AI & tech", browser: true },
      { id: "propublica", name: "ProPublica", url: "https://feeds.propublica.org/propublica/main", topic: "Accountability", browser: true },
      { id: "marshall", name: "The Marshall Project", url: "https://www.themarshallproject.org/rss/recent.rss", topic: "Justice", browser: true },
      { id: "conversation", name: "The Conversation", url: "https://theconversation.com/us/articles.atom", topic: "Research", browser: true }
    ]
  };

  // Outlets never shown anywhere on queerham. Matching is by outlet name or web address, case-insensitive.
  var BLOCKED = [
    "fox", "cnn", "msnbc", "ms now", "nbc", "abc news", "abcnews", "cbs", "new york times", "nytimes", "washington post",
    "washingtonpost", "wall street journal", "wsj", "usa today", "usatoday", "reuters", "associated press", "apnews", "ap news",
    "bloomberg", "politico", "the hill", "thehill", "npr", "pbs", "newsweek", "new york post", "nypost", "yahoo", "bbc",
    "the guardian", "theguardian", "axios", "time.com", "time magazine", "daily mail", "dailymail", "business insider",
    "forbes", "los angeles times", "latimes", "cnbc", "breitbart", "daily wire", "dailywire", "newsmax", "huffpost",
    "huffington post", "the atlantic", "vox", "people.com", "tmz", "c-span", "upi"
  ];
  var NOT_BLOCKED_EXCEPTIONS = ["foxboro"];
  function isBlocked(source, domain, link) {
    var hay = (" " + (source || "") + " " + (domain || "") + " " + (link || "") + " ").toLowerCase();
    if (NOT_BLOCKED_EXCEPTIONS.some(function (e) { return hay.indexOf(e) > -1; })) return false;
    return BLOCKED.some(function (b) {
      if (b.length <= 4) return new RegExp("(^|[^a-z])" + b.replace(/[.]/g, "\\.") + "([^a-z]|$)").test(hay);
      return hay.indexOf(b) > -1;
    });
  }

  var STATES = {
    Alabama: ["alabama", "birmingham", "montgomery", "huntsville", "mobile, ", "tuscaloosa", "auburn", "hoover", "dothan", "ivey", "tuberville"],
    Georgia: ["georgia", "atlanta", "savannah", "athens, ga", "kemp"],
    Florida: ["florida", " fla. ", "miami", "tampa", "orlando", "tallahassee", "jacksonville", "desantis"],
    Tennessee: ["tennessee", " tenn. ", "nashville", "memphis", "knoxville", "chattanooga"],
    Mississippi: ["mississippi", "jackson, miss"],
    "South Carolina": ["south carolina", "charleston", "columbia, s.c"],
    "North Carolina": ["north carolina", " nc ", "charlotte", "raleigh", "durham", "asheville"],
    Louisiana: ["louisiana", "new orleans", "baton rouge"],
    Kentucky: ["kentucky", "louisville", "lexington"]
  };
  var FEDERAL = ["supreme court", "congress", "federal", "trump", "white house", "hhs", "pentagon", "u.s. senate", "justice department", "doj", "fda", "cms", "title ix", "passport", "state department", "military"];
  var TOPICS = {
    Health: ["health", "medicaid", "hormone", "gender-affirming", "clinic", "hospital", "hiv", "prep", "doctor", "care ban", "puberty"],
    Courts: ["court", "judge", "ruling", "rules", "lawsuit", "sue", "suing", "appeal", "injunction"],
    Schools: ["school", "student", "teacher", "library", "book", "university", "college", "campus", "title ix"],
    Elections: ["election", "candidate", "vote", "voter", "ballot", "campaign", "midterm", "governor", "senate race", "primary"],
    Family: ["marriage", "married", "adopt", "foster", "parent", "custody", "family"],
    Safety: ["attack", "violence", "killed", "murder", "hate crime", "threat", "shooting", "assault", "charged"]
  };
  var WORLD_TOPICS = [
    ["AI & tech", /(\bai\b|a\.i\.|artificial intelligence|chatbot|openai|anthropic|machine learning|algorithm|data center|tech\b|robot|deepfake)/i],
    ["Climate", /(climate|heat wave|extreme heat|hurricane|flood|wildfire|emission|carbon|drought|storm|fossil|solar|wind power|pollution|environment)/i],
    ["Health care", /(health|medicaid|medicare|hospital|drug|vaccine|insurance|doctor|patient|clinic|mental|disease|emergency room)/i],
    ["Economy", /(economy|jobs|wage|inflation|tariff|housing|rent|prices|cost of living|layoff|workers|union|poverty)/i],
    ["Justice", /(prison|jail|police|incarcerat|sentenc|court|judge|immigra|deport)/i]
  ];
  var GOOD = /(\bwins?\b|\bwon\b|victor|\bblock(s|ed)\b|strikes? down|struck down|rules? in favor|protect(s|ion|ions)?\b|celebrat|first (openly|out|trans|transgender|gay|lesbian|nonbinary|black)|\belected\b|historic|defeat(ed|s)?\b|repeal(ed|s)? (the |a )?(ban|rule|law)|restor|expand|joy|thriv|milestone|honor|award|opens|launch|scholarship|festival|record (turnout|crowd|number)|kills .* rule|vetoe?s? .*(anti|ban)|love|wedding|fight back|not going away)/i;
  var WIN_VERB = /(block|strike|struck|defeat|kill|repeal|veto|overturn|rules? in favor|scrap|end(s|ed)? .*(ban|rule))/i;
  var SOFT_BAD = /(\bbans?\b|restrict|reject)/i;
  var HARD_BAD = /(attack|deranged|charged|arrest|murder|killed|dies|dead|threat|hate crime|slur|fired|sentence|abuse|shooting|assault|boycott|mock|decrying|silencing|anti-trans ad)/i;
  function isGood(title) {
    if (HARD_BAD.test(title)) return false;
    if (SOFT_BAD.test(title) && !WIN_VERB.test(title)) return false;
    return GOOD.test(title);
  }
  var RELEVANT = /(lgbt|queer|gay|lesbian|bisexual|\btrans\b|transgender|nonbinary|non-binary|same-sex|pride|drag|gender|homosexual|two-spirit|intersex|\bhiv\b|rainbow)/i;

  function decode(s) { var el = document.createElement("textarea"); el.innerHTML = s || ""; return el.value.replace(/<[^>]*>/g, ""); }
  function hostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }
  function parseDate(s) {
    if (!s) return new Date();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) return new Date(s.replace(" ", "T") + "Z");
    var d = new Date(s);
    return isNaN(d) ? new Date() : d;
  }

  function classifyQueer(title) {
    var t = " " + title.toLowerCase() + " ";
    var regions = [];
    Object.keys(STATES).forEach(function (s) { if (STATES[s].some(function (k) { return t.indexOf(k) > -1; })) regions.push(s); });
    if (FEDERAL.some(function (k) { return t.indexOf(k) > -1; })) regions.push("Federal");
    var topics = [];
    if (isGood(title)) topics.push("Queer Joy");
    Object.keys(TOPICS).forEach(function (k) { if (TOPICS[k].some(function (w) { return t.indexOf(w) > -1; })) topics.push(k); });
    return { regions: regions, topics: topics };
  }
  function classifyWorld(title, src) {
    var hit = WORLD_TOPICS.filter(function (p) { return p[1].test(title); })[0];
    return { regions: [], topics: [hit ? hit[0] : (src.topic || "News")] };
  }

  function normalize(raw, src, channel) {
    var title = decode(raw.title).replace(/\s+/g, " ").trim();
    var c = channel === "world" ? classifyWorld(title, src) : classifyQueer(title);
    return {
      title: title, link: raw.link, source: src.name, domain: hostOf(raw.link) || hostOf(src.url), sourceId: src.id,
      date: parseDate(raw.pubDate).toISOString(), regions: c.regions, topics: c.topics
    };
  }

  function keeper(channel) {
    return function (item) {
      if (!item.title || !item.link) return false;
      if (isBlocked(item.source, item.domain, item.link)) return false;
      if (/\/aggregators\//.test(item.link) || /quick-hit/.test(item.link)) return false;
      if (Date.now() - new Date(item.date) > 1000 * 60 * 60 * 24 * (channel === "world" ? 14 : 45)) return false;
      if (channel === "world") return true;
      var src = SOURCES.queer.filter(function (s) { return s.id === item.sourceId; })[0];
      return (src && src.queer) || RELEVANT.test(item.title);
    };
  }

  function dedupe(items) {
    var seen = {}, out = [];
    items.forEach(function (i) {
      var k = i.title.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").slice(0, 9).join(" ");
      if (!seen[k]) { seen[k] = 1; out.push(i); }
    });
    return out.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  }

  function timed(url, ms) {
    var ctl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, ms || 9000);
    return fetch(url, ctl ? { signal: ctl.signal, cache: "no-cache" } : {}).finally(function () { clearTimeout(t); });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* Route 1: data/feeds.json from the scheduled job */
  var dataPromise = null, dataAt = 0;
  function getData() {
    if (dataPromise && Date.now() - dataAt < 4 * 60 * 1000) return dataPromise;
    dataAt = Date.now();
    dataPromise = timed(ROOT + "data/feeds.json?t=" + Math.floor(Date.now() / 60000), 6000)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        if (!j || !j.generated || Date.now() - new Date(j.generated) > 3 * 60 * 60 * 1000) throw new Error("stale");
        return j;
      });
    dataPromise.catch(function () {});
    return dataPromise;
  }

  /* Route 2: rss2json, one feed at a time with a short gap to respect its limits */
  function viaJson(src) {
    return timed("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(src.url))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        if (j.status !== "ok") throw new Error(j.message);
        return j.items.map(function (i) { return { title: i.title, link: i.link, pubDate: i.pubDate }; });
      });
  }
  function browserFetch(channel) {
    var list = SOURCES[channel].filter(function (s) { return s.browser; });
    var all = [];
    return list.reduce(function (p, src, i) {
      return p.then(function () { return i ? wait(250) : null; }).then(function () {
        return viaJson(src).then(function (items) {
          all = all.concat(items.map(function (x) { return normalize(x, src, channel); }));
        }).catch(function () {});
      });
    }, Promise.resolve()).then(function () { return all; });
  }

  function createChannel(channel, snapshot) {
    var CACHE_KEY = "qh-" + channel + "-v3", TTL = 10 * 60 * 1000;
    var keep = keeper(channel);
    var listeners = [];
    var state = { items: [], live: false, updated: null, loading: false, mode: "" };
    function emit(extra) { listeners.forEach(function (fn) { fn(state, extra || {}); }); }
    function readCache() { try { var c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); return c && c.items ? c : null; } catch (e) { return null; } }
    function writeCache(items, mode) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), items: items, mode: mode })); } catch (e) {} }

    function load(force) {
      var cached = readCache();
      if (!state.items.length) {
        if (cached) { state.items = cached.items; state.live = true; state.updated = new Date(cached.t); state.mode = cached.mode; }
        else if (snapshot.length) {
          state.items = snapshot.map(function (s) { return normalize({ title: s.title, link: s.link, pubDate: s.date }, { id: s.sourceId, name: s.source, url: s.link }, channel); }).filter(keep);
        }
        emit();
      }
      if (!force && cached && Date.now() - cached.t < TTL) return Promise.resolve(state);
      state.loading = true; emit();
      return getData().then(function (d) {
        var raw = (d.channels && d.channels[channel]) || [];
        if (!raw.length) throw new Error("empty");
        var byId = {}; SOURCES[channel].forEach(function (s) { byId[s.id] = s; });
        return { items: raw.map(function (x) { return normalize(x, byId[x.sourceId] || { id: x.sourceId, name: x.source || x.sourceId, url: x.link }, channel); }), mode: "server", at: new Date(d.generated) };
      }).catch(function () {
        return browserFetch(channel).then(function (items) { return { items: items, mode: "browser", at: new Date() }; });
      }).then(function (res) {
        state.loading = false;
        var all = dedupe(res.items.filter(keep));
        if (all.length) {
          var before = {}; state.items.forEach(function (i) { before[i.link] = 1; });
          var fresh = state.live ? all.filter(function (i) { return !before[i.link]; }).length : 0;
          state.items = all; state.live = true; state.updated = res.at; state.mode = res.mode;
          writeCache(all, res.mode);
          emit({ fresh: fresh });
        } else emit({ failed: true });
        return state;
      });
    }
    return { load: load, state: state, on: function (fn) { listeners.push(fn); if (state.items.length) fn(state, {}); } };
  }

  // Real headlines from Sept. 2026, shown only until live headlines arrive, or if every source is unreachable.
  var SNAPSHOT_QUEER = [
    { title: "\"God was speaking to her\": Christian wins right to adopt kids & reject their LGBTQ+ identity", link: "https://www.lgbtqnation.com/2026/09/god-was-speaking-to-her-christian-wins-right-to-adopt-kids-reject-their-lgbtq-identity/", source: "LGBTQ Nation", sourceId: "lgbtqnation", date: "2026-09-29T13:30:00Z" },
    { title: "Trump admin announces pro-LGBTQ+ antidiscrimination rule ends tomorrow", link: "https://www.lgbtqnation.com/2026/09/a-monstrous-injustice-admin-announces-pro-lgbtq-antidiscrimination-rule-ends-tomorrow/", source: "LGBTQ Nation", sourceId: "lgbtqnation", date: "2026-09-28T19:00:00Z" },
    { title: "A school board passed a blanket ban on rainbow imagery in schools. Students are suing.", link: "https://www.lgbtqnation.com/2026/09/a-school-board-passed-a-blanket-ban-on-rainbow-imagery-in-schools-students-are-suing/", source: "LGBTQ Nation", sourceId: "lgbtqnation", date: "2026-09-28T18:00:00Z" },
    { title: "Federal court rules against voluntary \"X\" gender markers because they could out nonbinary people", link: "https://www.lgbtqnation.com/2026/09/federal-court-rules-against-voluntary-x-gender-markers-because-they-could-out-nonbinary-people/", source: "LGBTQ Nation", sourceId: "lgbtqnation", date: "2026-09-28T15:30:00Z" },
    { title: "The Ohio Democratic Party is silencing its Pride caucus over criticism of a \"transgender ideology\" ad", link: "https://www.erininthemorning.com/p/the-ohio-democratic-party-is-silencing", source: "Erin in the Morning", sourceId: "erin", date: "2026-09-24T22:54:07Z" },
    { title: "\"We're not going away\": Texas town's Pride festival vows to fight after council attempts to block it", link: "https://www.erininthemorning.com/p/were-not-going-away-texas-towns-pride", source: "Erin in the Morning", sourceId: "erin", date: "2026-09-22T13:34:42Z" },
    { title: "VA Gov. Spanberger kills Youngkin-era rule that would have banned trans students from bathrooms", link: "https://www.erininthemorning.com/p/va-gov-spanberger-kills-youngkin", source: "Erin in the Morning", sourceId: "erin", date: "2026-09-16T17:57:54Z" },
    { title: "Alabama absentee voting deadlines for 2026 General Election", link: "https://www.alreporter.com/2026/09/10/alabama-absentee-voting-deadlines-for-2026-general-election/", source: "Alabama Political Reporter", sourceId: "alreporter", date: "2026-09-10T15:00:00Z" },
    { title: "Alabamians to vote on four statewide constitutional amendments in November", link: "https://alabamareflector.com/2026/08/05/alabamians-to-vote-on-four-statewide-constitutional-amendments-in-november/", source: "Alabama Reflector", sourceId: "alreflector", date: "2026-08-05T15:00:00Z" }
  ];

  window.QHFeed = {
    queer: createChannel("queer", SNAPSHOT_QUEER),
    world: createChannel("world", []),
    regions: ["Alabama", "Georgia", "Florida", "Tennessee", "Mississippi", "South Carolina", "North Carolina", "Louisiana", "Kentucky", "Federal"],
    topics: ["Queer Joy"].concat(Object.keys(TOPICS)),
    worldTopics: ["AI & tech", "Climate", "Health care", "Economy", "Justice", "Accountability", "Research"],
    sources: SOURCES,
    isBlocked: isBlocked
  };
})();
