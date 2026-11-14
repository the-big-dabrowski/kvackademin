/**
 * Optional read-aloud with the Web Speech API.
 * Only ever started by a button press, never automatically.
 */

const VOICE_LANG = { en: 'en-GB', sv: 'sv-SE' };

export function isSpeechSupported() {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function speak(text, lang) {
  if (!isSpeechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = VOICE_LANG[lang] ?? lang;
  const voice = synth.getVoices().find((v) => v.lang.replace('_', '-') === utterance.lang);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.9;
  synth.speak(utterance);
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
