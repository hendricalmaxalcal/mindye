let audioCtx;

function tone(freq, duration, type = "sine", volume = 0.2, delay = 0) {
  try {
    audioCtx =
      audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const start = audioCtx.currentTime + delay;
    osc.start(start);
    osc.stop(start + duration);
  } catch {
    // Sound is optional, so ignore any audio problem.
  }
}

export function beepSuccess() {
  tone(1200, 0.12);
}

export function beepError() {
  tone(300, 0.18, "square", 0.15);
  tone(220, 0.25, "square", 0.15, 0.2);
}