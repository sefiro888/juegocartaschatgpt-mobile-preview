class AudioSynthService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundEnabled: boolean = false;

  init() {
    if (this.ctx) return;
    try {
      const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
      const AudioContextConstructor = typeof AudioContext !== 'undefined'
        ? AudioContext
        : audioWindow.webkitAudioContext;
      if (!AudioContextConstructor) return;
      const context = new AudioContextConstructor();
      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(0.2, context.currentTime); // Master volume 20%
      masterGain.connect(context.destination);
      this.ctx = context;
      this.masterGain = masterGain;
    } catch (error) {
      console.warn('Web Audio API not supported', error);
    }
  }

  toggleSound(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  // Soft card select/hover click
  playHover() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;
    
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, time);
    osc.frequency.exponentialRampToValueAtTime(1000, time + 0.04);

    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.04);
  }

  // Summon Slam (deep seismic thud)
  playSummonSlam() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const time = this.ctx.currentTime;
    
    // Sub-bass oscillator
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(100, time);
    subOsc.frequency.exponentialRampToValueAtTime(35, time + 0.25);
    subGain.gain.setValueAtTime(0.3, time);
    subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(time);
    subOsc.stop(time + 0.3);

    // Noise/rustle for debris
    try {
      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, time);
      filter.Q.setValueAtTime(1, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.1, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(time);
      noise.stop(time + 0.22);
    } catch {
      // Fallback if buffer creation fails
    }
  }

  // Combat Clash (sword hit / hit impact)
  playClash() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const time = this.ctx.currentTime;

    // Resonant sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, time);
    osc.frequency.exponentialRampToValueAtTime(60, time + 0.18);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, time);
    filter.Q.setValueAtTime(4, time);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  // Ice spell / Freeze effect
  playFreeze() {
    if (!this.soundEnabled) return;
    this.init();
    const ctx = this.ctx;
    const masterGain = this.masterGain;
    if (!ctx || !masterGain) return;

    const time = ctx.currentTime;
    
    // High-pitched crystal synth
    for (let i = 0; i < 3; i++) {
      const delay = i * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800 + Math.random() * 600, time + delay);
      osc.frequency.exponentialRampToValueAtTime(90 + Math.random() * 30, time + delay + 0.35);

      gain.gain.setValueAtTime(0.06, time + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, time + delay + 0.35);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(time + delay);
      osc.stop(time + delay + 0.4);
    }
  }

  // Turn Change gong chime
  playTurnChange() {
    if (!this.soundEnabled) return;
    this.init();
    const ctx = this.ctx;
    const masterGain = this.masterGain;
    if (!ctx || !masterGain) return;

    const time = ctx.currentTime;
    
    // Major chord sweep
    const freqs = [220, 277.18, 329.63, 440];
    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + 0.55);
    });
  }
}

export const audioService = new AudioSynthService();
