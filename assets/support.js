/*
  SUPPORT SETTINGS
  After you create your Stripe Payment Link (see README, "Turn on memberships"), paste the links below.
  Until paymentLink is filled in, the Support page says "Memberships open soon" instead of taking payments.
*/
window.QH_SUPPORT = {
  price: "$3",
  period: "month",
  // Stripe Payment Link for the $3/month membership, e.g. "https://buy.stripe.com/abc123"
  paymentLink: "https://buy.stripe.com/00w4gB2RfeUF4WMgyycMM01",
  // Stripe customer portal link where members can update or cancel, e.g. "https://billing.stripe.com/p/login/abc123"
  manageLink: "https://billing.stripe.com/p/login/9B63cxdvT7sd9d25TUcMM00",
  // What members see on their bank statement. Set the same text in Stripe (Settings > Business > Public details > Statement descriptor).
  // A neutral name protects readers who aren't out to everyone who sees their statements.
  descriptor: "QH MEDIA"
};
