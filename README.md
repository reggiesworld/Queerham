# queerham website

A plain HTML site. No build step, no database. Open `index.html` in a browser to preview.

## What's in here

| File | What it is |
| --- | --- |
| `index.html` | Home page |
| `live.html` | Live headline feed with search and state/topic filters |
| `joy.html` | Queer Joy: wins, firsts and celebrations |
| `world.html` | The wider world: climate, AI, health care, economy, justice |
| `polls.html` | Live polls for Alabama and Southern races |
| `news.html` | Your own stories, with filters |
| `states.html` | State-by-state tracker |
| `federal.html` | Federal tracker |
| `protect.html` | Protect yourself checklists and help directory |
| `vote.html` | Nonpartisan Alabama voting guide |
| `about.html` | Who runs it, editorial standards, corrections |
| `posts/` | One file per post |
| `assets/posts.js` | The list of posts (drives the home page and News page) |
| `assets/style.css` | All styling |
| `assets/site.js` | Menu, dark mode, custom cursor, animations, countdown, checklists |
| `assets/feed.js` | The live feeds: which outlets they read, the blocked list, tagging |
| `assets/polls.js` | Live polls: which races, how numbers are read and averaged |
| `assets/fonts/` | Gilbert logo font |
| `scripts/update-data.mjs` | The 15-minute news fetcher used in Option A |

## What updates on its own

| Section | Where it comes from | How often |
| --- | --- | --- |
| Live feed and Queer Joy | Queer outlets (LGBTQ Nation, Erin in the Morning, The Advocate, them) plus independent Southern newsrooms (Alabama Reflector, Alabama Political Reporter, Georgia Recorder, Tennessee Lookout, Mississippi Today and more), The 19th and Capital B | Every 15 minutes |
| Wider World | Inside Climate News, Grist, KFF Health News, MIT Technology Review, Rest of World, ProPublica, The Marshall Project, The Conversation | Every 15 minutes |
| Polls | The public polling tables for each race on Wikipedia, read live through Wikipedia's open API. Candidate names are fixed in `assets/polls.js`. | Every page visit (saved for 20 minutes) |

- **No mainstream national outlets, ever.** Fox News, CNN and other national networks and papers are blocked in `assets/feed.js` (the `BLOCKED` list) and in `assets/polls.js` (the `MEDIA` list, which also drops polls those outlets sponsor).
- **Queer Joy** is picked automatically: headlines about wins, firsts, court victories and celebrations, minus anything about attacks, arrests or bans.
- **To add an outlet,** add one line to `SOURCES` in `assets/feed.js`. **To add a race,** add one line to `RACES` in `assets/polls.js`.

## Two ways to host it

### Option A: GitHub Pages (recommended, most reliable)
A free scheduled job (`.github/workflows/update-data.yml`) fetches every news feed on GitHub's servers every 15 minutes and saves the headlines into `data/feeds.json`, so visitors' browsers never hit rate limits.
1. Create a free account at github.com and a new public repository named `queerham`.
2. Upload everything in this folder (including the hidden `.github` folder) to the repository.
3. In the repository, go to **Settings > Pages**, set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
4. Go to **Actions**, open **Update live news** and click **Run workflow** once to fill the feed right away. It then runs on its own every 15 minutes.
5. Custom domain: in **Settings > Pages**, enter `queerham.com`, then add the DNS records GitHub shows at your domain registrar.

### Option B: Netlify drag-and-drop (fastest)
Go to https://app.netlify.com/drop and drag this folder on. Everything works, but the news feeds load straight from visitors' browsers through the free rss2json.com service, which limits how many feeds one visitor can pull at once. The core feeds (queer outlets and Wider World) load reliably. The Southern newsroom feeds only come through in Option A.

To update later, drag the folder onto the same site's Deploys page.

## Credits
- Logo typeface: Gilbert, honoring Gilbert Baker, licensed CC BY-SA 4.0 (credited in the site footer, which the license requires).


## Add a post

Easiest: send Claude the post (or a link plus your notes) and ask for the updated site files.

By hand:
1. Copy `posts/_template.html` and rename it, e.g. `posts/tn-marriage-bill-signed.html`.
2. Fill in the title, label (News, Explainer or My Take), date, text and sources.
3. Open `assets/posts.js` and add an entry at the top of the list with the same `slug` (file name without `.html`).
4. Re-upload the folder.

## House rules

- Every post gets exactly one label: News, Explainer or My Take.
- News always links to its source.
- Update the "Last checked" date on the tracker pages when you review them.
- No em dashes.
