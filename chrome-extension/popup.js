// TalkNative popup: today's three words, "Hear it", and today's IELTS cue card.

const $ = (id) => document.getElementById(id);
const store = chrome.storage.local;

/* ───────── Tabs ───────── */
const TABS = ['words', 'hear', 'ielts'];
function showTab(name) {
  TABS.forEach((t) => {
    $(`t-${t}`).setAttribute('aria-selected', String(t === name));
    $(`p-${t}`).hidden = t !== name;
  });
  store.set({ tab: name });
}
TABS.forEach((t) => $(`t-${t}`).addEventListener('click', () => showTab(t)));

/* ───────── Today's words ───────── */
const WORDS = window.TN_WORDS;
const DAYS = Math.floor(WORDS.length / 3);
const today = TN.dayNumber();
const dayIndex = ((today % DAYS) + DAYS) % DAYS;
$('day-label').textContent = `Day ${dayIndex + 1} of ${DAYS}`;

WORDS.slice(dayIndex * 3, dayIndex * 3 + 3).forEach(([word, pos, meaning, example]) => {
  const el = document.createElement('article');
  el.className = 'word';
  el.innerHTML = `
    <div class="word-top"><strong></strong><span class="pos"></span>
      <button class="icon-btn" data-say="word">${TN.icon.speaker}</button></div>
    <p class="meaning"></p>
    <div class="example"><button class="icon-btn" data-say="example">${TN.icon.speaker}</button><span></span></div>`;
  el.querySelector('strong').textContent = word;
  el.querySelector('.pos').textContent = pos;
  el.querySelector('.meaning').textContent = meaning;
  el.querySelector('.example span').textContent = example;
  el.querySelector('[data-say=word]').setAttribute('aria-label', `Hear “${word}”`);
  el.querySelector('[data-say=example]').setAttribute('aria-label', 'Hear the example sentence');
  el.querySelector('[data-say=word]').addEventListener('click', () => TN.speak(word, { rate: 0.85 }));
  el.querySelector('[data-say=example]').addEventListener('click', () => TN.speak(example, { rate: 0.95 }));
  $('words').appendChild(el);
});

/* ───────── Hear it ───────── */
const names = new Intl.DisplayNames(['en'], { type: 'language' });
const label = (tag) => {
  try { return names.of(tag) || tag; } catch { return tag; }
};

chrome.tts.getVoices((voices) => {
  const langs = [...new Set(voices.map((v) => v.lang).filter(Boolean))]
    .sort((a, b) => label(a).localeCompare(label(b)));
  for (const l of langs) {
    const o = document.createElement('option');
    o.value = l;
    o.textContent = label(l);
    $('lang').appendChild(o);
  }
  store.get(['lang']).then(({ lang }) => { if (lang && langs.includes(lang)) $('lang').value = lang; });
});

const setRateLabel = () => { $('rate-val').textContent = `${Number($('rate').value).toFixed(1)}×`; };
$('rate').addEventListener('input', () => { setRateLabel(); store.set({ rate: Number($('rate').value) }); });
$('lang').addEventListener('change', () => store.set({ lang: $('lang').value }));
$('text').addEventListener('input', () => store.set({ lastText: $('text').value }));

function detect(text) {
  return new Promise((resolve) => {
    chrome.i18n.detectLanguage(text, (r) => {
      const best = r && r.languages && r.languages[0];
      resolve(best && best.language !== 'und' ? best.language : '');
    });
  });
}

$('play').addEventListener('click', async () => {
  const text = $('text').value.trim();
  if (!text) { $('text').focus(); return; }
  let lang = $('lang').value;
  if (lang === 'auto') {
    lang = (await detect(text)) || 'en';
    $('detected').textContent = `Detected: ${label(lang)}`;
  } else {
    $('detected').textContent = '';
  }
  TN.speak(text, { lang, rate: Number($('rate').value) });
});
$('stop').addEventListener('click', () => chrome.tts.stop());

/* ───────── IELTS cue card ───────── */
const CARDS = window.TN_CUE_CARDS;
let cardIndex = ((today % CARDS.length) + CARDS.length) % CARDS.length;
function showCard() {
  const c = CARDS[cardIndex];
  $('cue-prompt').textContent = c.p;
  $('cue-bullets').replaceChildren(...c.b.map((b) => Object.assign(document.createElement('li'), { textContent: b })));
}
$('new-cue').addEventListener('click', () => {
  let next = cardIndex;
  while (next === cardIndex && CARDS.length > 1) next = Math.floor(Math.random() * CARDS.length);
  cardIndex = next;
  showCard();
});
$('start-cue').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL(`practice.html?card=${cardIndex}`) });
  window.close();
});

/* ───────── Restore where the user left off ───────── */
store.get(['tab', 'lastText', 'rate']).then(({ tab, lastText, rate }) => {
  if (lastText) $('text').value = lastText;
  if (rate) $('rate').value = rate;
  setRateLabel();
  // A selection read aloud from the right-click menu opens on "Hear it" next time.
  showTab(TABS.includes(tab) ? tab : 'words');
});
showCard();
