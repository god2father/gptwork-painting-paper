type WebkitAudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext
}

export async function playBladeUnsheathe(): Promise<void> {
  const AudioContextClass = window.AudioContext ?? (window as WebkitAudioWindow).webkitAudioContext
  if (!AudioContextClass) return

  const context = new AudioContextClass()
  try {
    if (context.state === 'suspended') await context.resume()
    const now = context.currentTime
    const master = context.createGain()
    master.gain.setValueAtTime(0.2, now)
    master.connect(context.destination)

    const noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.9), context.sampleRate)
    const noise = noiseBuffer.getChannelData(0)
    for (let index = 0; index < noise.length; index += 1) {
      const progress = index / noise.length
      noise[index] = (Math.random() * 2 - 1) * (1 - progress * 0.72)
    }
    const scrape = context.createBufferSource()
    const scrapeFilter = context.createBiquadFilter()
    const scrapeGain = context.createGain()
    scrape.buffer = noiseBuffer
    scrapeFilter.type = 'bandpass'
    scrapeFilter.frequency.setValueAtTime(900, now)
    scrapeFilter.frequency.exponentialRampToValueAtTime(4200, now + 0.62)
    scrapeFilter.Q.setValueAtTime(1.15, now)
    scrapeGain.gain.setValueAtTime(0.0001, now)
    scrapeGain.gain.exponentialRampToValueAtTime(0.42, now + 0.035)
    scrapeGain.gain.exponentialRampToValueAtTime(0.06, now + 0.62)
    scrapeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)
    scrape.connect(scrapeFilter).connect(scrapeGain).connect(master)

    const blade = context.createOscillator()
    const bladeGain = context.createGain()
    blade.type = 'triangle'
    blade.frequency.setValueAtTime(680, now)
    blade.frequency.exponentialRampToValueAtTime(3600, now + 0.48)
    bladeGain.gain.setValueAtTime(0.0001, now)
    bladeGain.gain.exponentialRampToValueAtTime(0.2, now + 0.02)
    bladeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58)
    blade.connect(bladeGain).connect(master)

    const ring = context.createOscillator()
    const ringGain = context.createGain()
    ring.type = 'sine'
    ring.frequency.setValueAtTime(4100, now + 0.26)
    ring.frequency.exponentialRampToValueAtTime(2450, now + 0.8)
    ringGain.gain.setValueAtTime(0.0001, now)
    ringGain.gain.setValueAtTime(0.0001, now + 0.24)
    ringGain.gain.exponentialRampToValueAtTime(0.12, now + 0.29)
    ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85)
    ring.connect(ringGain).connect(master)

    scrape.start(now)
    blade.start(now)
    ring.start(now + 0.24)
    scrape.stop(now + 0.92)
    blade.stop(now + 0.62)
    ring.stop(now + 0.88)
    window.setTimeout(() => void context.close(), 1200)
  } catch {
    void context.close()
  }
}
