// IELTS Speaking Part 2 practice: 1 minute to prepare, up to 2 minutes to speak,
// recorded in this tab only so the learner can listen back.

const $ = (id) => document.getElementById(id);
const CARDS = window.TN_CUE_CARDS;
const PREP = 60;
const TALK = 120;

let cardIndex = Number(new URLSearchParams(location.search).get('card'));
if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= CARDS.length) cardIndex = Math.floor(Math.random() * CARDS.length);

let timer = null;
let recorder = null;
let stream = null;
let chunks = [];
let audioUrl = null;
let talkStart = 0;

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function setRing(left, total, colour) {
  $('clock').textContent = fmt(left);
  $('ring').style.setProperty('--p', String(1 - left / total));
  $('ring').style.setProperty('--c', colour);
}

function countdown(total, colour, onEnd) {
  clearInterval(timer);
  let left = total;
  setRing(left, total, colour);
  timer = setInterval(() => {
    left -= 1;
    setRing(Math.max(left, 0), total, colour);
    if (left <= 0) { clearInterval(timer); onEnd(); }
  }, 1000);
}

function showCard() {
  const c = CARDS[cardIndex];
  $('topic').textContent = c.t;
  $('prompt').textContent = c.p;
  $('bullets').replaceChildren(...c.b.map((b) => Object.assign(document.createElement('li'), { textContent: b })));
  $('part3').replaceChildren(...c.q.map((q) => Object.assign(document.createElement('li'), { textContent: q })));
  document.title = `${c.t} – IELTS Speaking Part 2 practice – TalkNative`;
}

function reset() {
  clearInterval(timer);
  stopRecording(false);
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = null;
  $('playback').removeAttribute('src');
  $('after').hidden = true;
  $('notes-box').hidden = true;
  $('notes').value = '';
  $('mic-msg').hidden = true;
  $('rec').classList.remove('on');
  $('go').hidden = false;
  $('go').textContent = 'Start the 1-minute preparation';
  $('skip').hidden = true;
  $('finish').hidden = true;
  $('stage-title').textContent = 'Ready when you are';
  $('stage-text').textContent = 'You get one minute to prepare and make notes, then up to two minutes to speak, just like the real test.';
  document.querySelectorAll('.check input').forEach((i) => { i.checked = false; });
  setRing(PREP, PREP, 'var(--blue)');
}

function prepare() {
  $('go').hidden = true;
  $('skip').hidden = false;
  $('notes-box').hidden = false;
  $('notes').focus();
  $('stage-title').textContent = 'Prepare';
  $('stage-text').textContent = 'Jot down a few key words for each point. Speaking starts automatically when the minute is up.';
  // Ask for the microphone now, so the prompt doesn't eat into speaking time.
  getMic();
  countdown(PREP, 'var(--blue)', speakNow);
}

async function getMic() {
  if (stream) return stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  } catch {
    $('mic-msg').textContent = 'The microphone is blocked, so this answer won’t be recorded. You can still use the timer. To record, allow the microphone for this page in Chrome’s address bar.';
    $('mic-msg').hidden = false;
    return null;
  }
}

async function speakNow() {
  clearInterval(timer);
  $('skip').hidden = true;
  $('finish').hidden = false;
  $('stage-title').textContent = 'Speak now';
  $('stage-text').textContent = 'Talk about each point on the card. Aim to keep going until the examiner would stop you.';
  const s = await getMic();
  if (s && window.MediaRecorder) {
    const rec = new MediaRecorder(s);
    const parts = [];
    chunks = parts;
    rec.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };
    rec.onstop = () => {
      if (!parts.length || chunks !== parts) return; // a newer attempt has started
      audioUrl = URL.createObjectURL(new Blob(parts, { type: rec.mimeType || 'audio/webm' }));
      $('playback').src = audioUrl;
    };
    rec.start();
    recorder = rec;
    $('rec').classList.add('on');
  }
  talkStart = Date.now();
  countdown(TALK, 'var(--green)', finish);
}

function stopRecording(keep = true) {
  if (recorder && recorder.state !== 'inactive') {
    if (!keep) chunks = [];
    recorder.stop();
  }
  recorder = null;
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
}

function finish() {
  clearInterval(timer);
  stopRecording(true);
  $('rec').classList.remove('on');
  $('finish').hidden = true;
  $('go').hidden = false;
  $('go').textContent = 'Try this card again';
  const spoke = Math.min(TALK, Math.round((Date.now() - talkStart) / 1000));
  setRing(spoke, TALK, 'var(--green)');
  $('ring').style.setProperty('--p', String(spoke / TALK));
  $('stage-title').textContent = spoke >= TALK ? 'Time’s up' : `You spoke for ${fmt(spoke)}`;
  $('stage-text').textContent = spoke < 60
    ? 'Under a minute is short for Part 2. Listen back, then try again and aim for well over a minute.'
    : 'Listen back, tick what you managed, then try the Part 3 questions out loud.';
  $('after').hidden = false;
}

$('go').addEventListener('click', () => { reset(); prepare(); });
$('skip').addEventListener('click', speakNow);
$('finish').addEventListener('click', finish);
$('next').addEventListener('click', () => {
  let next = cardIndex;
  while (next === cardIndex && CARDS.length > 1) next = Math.floor(Math.random() * CARDS.length);
  cardIndex = next;
  history.replaceState(null, '', `?card=${cardIndex}`);
  showCard();
  reset();
});

showCard();
reset();
