/*
  POSTS LIST
  Every post on the site is listed here, newest first.
  To add a post: copy posts/_template.html, write it, then add one entry at the TOP of this list.

  type:  "news"      = facts only, linked to original sources
         "take"      = a labeled opinion piece (Perspective)
         "explainer" = what something means and what to do about it
  scope: any of "Alabama", "Georgia", "Florida", "Tennessee", "Mississippi",
         "South Carolina", "North Carolina", "Louisiana", "Kentucky", "Southeast", "Federal", "Election"
*/
window.QH_POSTS = [
  {
    slug: "medicaid-rule-oct-13",
    title: "New federal rule cuts Medicaid funding for trans youth care starting Oct. 13",
    type: "news",
    date: "2026-09-29",
    scope: ["Federal", "Southeast"],
    dek: "A final CMS rule bars federal Medicaid and CHIP dollars from paying for puberty blockers, hormones or surgery for minors. Here is what changes and who it touches."
  },
  {
    slug: "alabama-election-deadlines",
    title: "Alabama votes Nov. 3: every deadline, in one place",
    type: "explainer",
    date: "2026-09-29",
    scope: ["Alabama", "Election"],
    dek: "Register by Oct. 19. There is no early voting in Alabama, so know your absentee dates and bring a photo ID."
  },
  {
    slug: "is-my-marriage-safe",
    title: "Is my marriage safe? Where same-sex marriage stands in fall 2026",
    type: "explainer",
    date: "2026-09-29",
    scope: ["Federal", "Tennessee", "Southeast"],
    dek: "The Supreme Court turned down the Kim Davis case, and the Respect for Marriage Act is still law. States are testing the edges anyway."
  },
  {
    slug: "why-queerham-exists",
    title: "Why queerham exists",
    type: "explainer",
    date: "2026-09-29",
    scope: ["Southeast"],
    dek: "Queer Southerners deserve to know what is happening to their rights, in plain language, from sources they can trust."
  }
];
