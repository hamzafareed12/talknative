// Shared helpers for the popup and the practice page.

const TN = {
  /** Every link back to the site says where it came from, so visits from the extension show in analytics. */
  tag(a) {
    const url = new URL(a.href);
    url.searchParams.set('utm_source', 'chrome_extension');
    url.searchParams.set('utm_medium', 'extension');
    if (a.dataset.utm) url.searchParams.set('utm_campaign', a.dataset.utm);
    a.href = url.toString();
  },

  /** Days since 1 Jan 1970 in the user's own time zone, so "today" changes at their midnight. */
  dayNumber(d = new Date()) {
    return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
  },

  speak(text, opts = {}) {
    chrome.tts.stop();
    chrome.tts.speak(text, { lang: opts.lang || 'en-GB', rate: opts.rate || 1, enqueue: false });
  },

  icon: {
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>',
  },
};

document.querySelectorAll('a[href^="https://www.talknative.io"]').forEach((a) => TN.tag(a));
