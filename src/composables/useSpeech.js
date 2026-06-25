import { ref } from 'vue'

// Voices load asynchronously in Chrome — resolve once available
function loadVoices() {
  return new Promise(resolve => {
    const v = window.speechSynthesis.getVoices()
    if (v.length) { resolve(v); return }
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      resolve(window.speechSynthesis.getVoices())
    }, { once: true })
  })
}

export function useSpeech() {
  const speaking = ref(false)
  const hasIrishVoice = ref(null) // null = unknown, true/false once loaded

  // Eagerly check for an Irish voice so the UI can reflect availability
  if ('speechSynthesis' in window) {
    loadVoices().then(voices => {
      hasIrishVoice.value = voices.some(v => v.lang.startsWith('ga'))
    })
  }

  async function speak(text) {
    if (!('speechSynthesis' in window)) return

    // If already speaking the same text, cancel (toggle off)
    if (speaking.value) {
      window.speechSynthesis.cancel()
      return
    }

    window.speechSynthesis.cancel()

    const voices   = await loadVoices()
    const irishVoice = voices.find(v => v.lang.startsWith('ga'))

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang  = irishVoice ? irishVoice.lang : 'ga-IE'
    utter.rate  = 0.82
    if (irishVoice) utter.voice = irishVoice

    utter.onstart = () => { speaking.value = true }
    utter.onend   = () => { speaking.value = false }
    utter.onerror = () => { speaking.value = false }

    window.speechSynthesis.speak(utter)
  }

  return { speak, speaking, hasIrishVoice }
}
