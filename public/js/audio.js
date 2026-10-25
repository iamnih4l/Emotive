/**
 * EMOTIVE — Procedural Generative Atmosphere Soundscape Engine
 * 100% Self-Contained Web Audio API synthesis.
 * Zero external audio assets, zero network latency, seamless procedural mood crossfading.
 */

class AmbientSoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.droneGain = null;
    this.textureGain = null;
    this.filterNode = null;
    this.analyser = null;

    this.droneOscillators = [];
    this.noiseNode = null;
    this.lfoNode = null;

    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.55;
    this.currentMood = 'NEUTRAL';
    this.visualizerCanvas = null;
    this.animFrameId = null;

    // Harmonic frequency maps for each mood (base Hz for 4-voice ambient pad)
    this.moodHarmonics = {
      HAPPY: [130.81, 196.00, 246.94, 329.63], // C3, G3, B3, E4 (Lush Cmaj9)
      SAD: [110.00, 164.81, 196.00, 261.63],   // A2, E3, G3, C4 (Poignant Am7)
      SURPRISED: [146.83, 220.00, 329.63, 440.00], // D3, A3, E4, A4 (Open Ethereal Dsus2)
      FEAR: [87.31, 130.81, 185.00, 220.00],    // F2, C3, F#3 (Diminished sub-bass tension)
      ANGRY: [82.41, 123.47, 164.81, 246.94],   // E2, B2, E3, B3 (Driving resonant power fifths)
      NEUTRAL: [110.00, 164.81, 220.00, 329.63], // A2, E3, A3, E4 (Balanced contemplative drone)
      UNCERTAIN: [110.00, 164.81, 220.00, 329.63]
    };

    this.filterCutoffs = {
      HAPPY: 680,
      SAD: 360,
      SURPRISED: 780,
      FEAR: 260,
      ANGRY: 520,
      NEUTRAL: 440,
      UNCERTAIN: 440
    };
  }

  /**
   * Lazily initialize AudioContext on user interaction
   */
  async initAudioContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported in this browser.');
      return;
    }

    this.ctx = new AudioContextClass();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

    // Dynamic Filter Node for ambient darkness/brightness
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(440, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // Analyser Node for the interactive visualizer
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.85;

    // Connect Filter -> Master -> Analyser -> Destination
    this.filterNode.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Sub-gains
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.droneGain.connect(this.filterNode);

    this.textureGain = this.ctx.createGain();
    this.textureGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    this.textureGain.connect(this.filterNode);

    this.createAtmosphericDrone();
    this.createAtmosphericTexture();
  }

  /**
   * 4-Voice Detuned Ambient Harmonic Pad
   */
  createAtmosphericDrone() {
    if (!this.ctx) return;
    const freqs = this.moodHarmonics[this.currentMood] || this.moodHarmonics.NEUTRAL;

    // Destroy existing oscillators if any
    this.droneOscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    });
    this.droneOscillators = [];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      // Rich sine and soft triangle mix
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Subtle detune for natural analog choral warmth
      const detuneCents = (idx - 1.5) * 4.5;
      osc.detune.setValueAtTime(detuneCents, this.ctx.currentTime);

      if (panner) {
        panner.pan.setValueAtTime((idx - 1.5) * 0.35, this.ctx.currentTime);
        osc.connect(panner);
        panner.connect(this.droneGain);
      } else {
        osc.connect(this.droneGain);
      }

      osc.start();
      this.droneOscillators.push(osc);
    });
  }

  /**
   * Procedural atmospheric vinyl/rain/coastal wind noise
   */
  createAtmosphericTexture() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of pink/brown noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Filtered brown noise for natural wind/sea presence
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Bandpass filter for textured rain/wind character
    const textureFilter = this.ctx.createBiquadFilter();
    textureFilter.type = 'bandpass';
    textureFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    textureFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    noiseSource.connect(textureFilter);
    textureFilter.connect(this.textureGain);
    noiseSource.start();
    this.noiseNode = noiseSource;
  }

  /**
   * Start or resume ambient playback
   */
  async start() {
    await this.initAudioContext();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.volume, now + 1.8);
    this.isPlaying = true;

    this.startVisualizer();
  }

  /**
   * Smoothly fade out ambient soundscape
   */
  stop() {
    if (!this.ctx || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 1.2);
    this.isPlaying = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /**
   * Toggle soundscape on/off
   */
  async toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      await this.start();
      return true;
    }
  }

  /**
   * Smoothly transition chord harmonics and filter cutoffs when narrative mood adapts
   */
  transitionMood(newMood) {
    if (!this.ctx || !this.isPlaying) {
      this.currentMood = newMood;
      return;
    }

    const targetMood = this.moodHarmonics[newMood] ? newMood : 'NEUTRAL';
    if (targetMood === this.currentMood) return;
    this.currentMood = targetMood;

    const now = this.ctx.currentTime;
    const freqs = this.moodHarmonics[targetMood];
    const cutoff = this.filterCutoffs[targetMood] || 440;

    // Smoothly glide oscillator frequencies over 3 seconds
    this.droneOscillators.forEach((osc, idx) => {
      if (freqs[idx]) {
        osc.frequency.cancelScheduledValues(now);
        osc.frequency.setValueAtTime(osc.frequency.value, now);
        osc.frequency.exponentialRampToValueAtTime(freqs[idx], now + 2.8);
      }
    });

    // Smoothly shift filter cutoff
    this.filterNode.frequency.cancelScheduledValues(now);
    this.filterNode.frequency.setValueAtTime(this.filterNode.frequency.value, now);
    this.filterNode.frequency.exponentialRampToValueAtTime(cutoff, now + 3.0);
  }

  /**
   * Volume control
   */
  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.masterGain && this.isPlaying && !this.isMuted) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.15);
    }
  }

  /**
   * Mute toggle
   */
  setMuted(muted) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain && this.isPlaying) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.volume, now + 0.2);
    }
  }

  /**
   * Attach visualizer canvas
   */
  setVisualizerCanvas(canvas) {
    this.visualizerCanvas = canvas;
    if (this.isPlaying) {
      this.startVisualizer();
    }
  }

  /**
   * Render subtle dynamic waveform
   */
  startVisualizer() {
    if (!this.visualizerCanvas || !this.analyser) return;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const canvas = this.visualizerCanvas;
    const ctx = canvas.getContext('2d');
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!this.isPlaying) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      this.animFrameId = requestAnimationFrame(render);
      this.analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 1.8;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = Math.max(2, (dataArray[i] / 255) * (canvas.height - 4));
        const alpha = Math.min(0.9, 0.25 + (dataArray[i] / 255) * 0.65);

        ctx.fillStyle = `rgba(212, 155, 67, ${alpha})`;
        const y = (canvas.height - barHeight) / 2;
        ctx.fillRect(x, y, barWidth - 1, barHeight);

        x += barWidth;
        if (x > canvas.width) break;
      }
    };

    render();
  }
}

export const soundEngine = new AmbientSoundEngine();
