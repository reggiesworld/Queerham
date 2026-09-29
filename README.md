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
| `support.html` | The $3/month membership page |
| `thanks.html` | Where Stripe sends new members after checkout |
| `posts/` | One file per post |
| `assets/posts.js` | The list of posts (drives the home page and News page) |
| `assets/style.css` | All styling |
| `assets/site.js` | Menu, dark mode, custom cursor, animations, countdown, checklists |
| `assets/feed.js` | The live feeds: which outlets they read, the blocked list, tagging |
| `assets/support.js` | Your Stripe links and statement name for memberships |
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

## Turn on memberships ($3/month)

Payments run through Stripe. No login or server needed, and card details never touch your site.

1. Create a free account at https://dashboard.stripe.com/register and finish the business setup. Stripe needs your details and a bank account for payouts.
2. Set your statement descriptor to something discreet in **Settings > Business > Public details > Statement descriptor**, for example `QH MEDIA`. It should match `descriptor` in `assets/support.js`.
3. Go to **Product catalog > Add product**. Name it `queerham member`, choose **Recurring**, **$3.00 USD**, **Monthly**, then save.
4. Open the product and click **Create payment link**. Under **After payment**, choose **Don't show confirmation page** and enter `https://queerham.com/thanks.html` (or your github.io address plus `/thanks.html`). Create the link and copy it.
5. Go to **Settings > Billing > Customer portal**, turn it on, allow customers to cancel, and copy the **login link**.
6. Open `assets/support.js` and paste the payment link into `paymentLink` and the portal login link into `manageLink`. Commit the change.

Until `paymentLink` is filled in, the Support page shows "Memberships open soon" instead of a checkout button.

Stripe charges 2.9% plus 30 cents per payment, so each $3 membership nets about $2.61.

## Turn on Your Voices submissions
Readers send stories from the form at the bottom of the Stories page. Submissions come to your email and nothing is published until you add it.
1. Create a free account at https://formspree.io and click **New form**. Name it `Your Voices` and set the email to where you want stories sent.
2. Copy the form's link (it looks like `https://formspree.io/f/abcdwxyz`).
3. Paste it into `storyForm` in `assets/support.js` and upload that file.
4. Send yourself a test story. The first one asks you to confirm your email.

To publish one: copy `posts/_voices-template.html`, paste in the story, and add it to `assets/posts.js` with `type: "voices"` and `byline: "Jordan, Mobile, AL"`. Or send it to Claude.

## Link previews
When a page is shared on Instagram, iMessage, Facebook, X or Slack, it shows `assets/og.png` with the page's title and description.
If you move to queerham.com, find and replace `https://reggiesworld.github.io/Queerham/` with `https://queerham.com/` in every .html file so previews keep working.

## Credits
- Logo typeface: Gilbert, honoring Gilbert Baker, licensed CC BY-SA 4.0 (credited at the bottom of the About page, which the license requires).


## Add a post

Easiest: send Claude the post (or a link plus your notes) and ask for the updated site files.

By hand:
1. Copy `posts/_template.html` and rename it, e.g. `posts/tn-marriage-bill-signed.html`.
2. Fill in the title, label (News, Explainer or Perspective), date, text and sources.
3. Open `assets/posts.js` and add an entry at the top of the list with the same `slug` (file name without `.html`).
4. Re-upload the folder.

## After changing a CSS or JS file
Every page loads the assets with `?v=...` on the end so visitors' browsers fetch the new version. When you change anything in `assets/`, bump that version in every .html file (find and replace `?v=20260929d`), or ask Claude to.

## House rules

- Every post gets exactly one label: News, Explainer or Perspective.
- News always links to its source.
- Update the "Last checked" date on the tracker pages when you review them.
- No em dashes.
