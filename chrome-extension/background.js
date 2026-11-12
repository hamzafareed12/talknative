// TalkNative extension — background service worker.
// Right-click any selected text → "Hear it spoken": Chrome reads it aloud in the
// language it detects. Nothing leaves the browser except what Chrome's own
// text-to-speech voices need.

const MENU_HEAR = 'tn-hear';
const MENU_STOP = 'tn-stop';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_HEAR, title: 'Hear “%s” spoken', contexts: ['selection'] });
    chrome.contextMenus.create({ id: MENU_STOP, title: 'Stop speaking', contexts: ['selection'] });
  });
});

/** The language Chrome thinks the text is in, as a BCP-47 tag, or '' if unsure. */
function detect(text) {
  return new Promise((resolve) => {
    try {
      chrome.i18n.detectLanguage(text, (r) => {
        const best = r && r.isReliable !== false && r.languages && r.languages[0];
        resolve(best && best.language && best.language !== 'und' ? best.language : '');
      });
    } catch {
      resolve('');
    }
  });
}

async function speak(text) {
  const clean = text.replace(/\s+/g, ' ').trim().slice(0, 2000);
  if (!clean) return;
  const { rate = 1, lang: chosen = 'auto' } = await chrome.storage.local.get(['rate', 'lang']);
  const lang = chosen !== 'auto' ? chosen : (await detect(clean)) || 'en';
  // The popup then opens on "Hear it" with this text, ready to replay or slow down.
  await chrome.storage.local.set({ lastText: clean, tab: 'hear' });
  chrome.tts.stop();
  chrome.tts.speak(clean, { lang, rate: Number(rate) || 1, enqueue: false });
}

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === MENU_HEAR && info.selectionText) speak(info.selectionText);
  if (info.menuItemId === MENU_STOP) chrome.tts.stop();
});
