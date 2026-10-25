/**
 * EMOTIVE — Local Browser Computer Vision & Expression Analyzer
 * MediaPipe Tasks Vision FaceLandmarker (52 FACS Blendshapes),
 * Temporal Smoothing (EMA), Hysteresis, and Rolling Window Aggregation.
 * 100% Client-Side: Zero video frames or biometric features ever leave the device.
 */

export const EXPRESSION_CATEGORIES = ['HAPPY', 'SAD', 'SURPRISED', 'FEAR', 'ANGRY', 'NEUTRAL'];

export class VisionProcessor {
  constructor() {
    this.enabled = false;
    this.stream = null;
    this.landmarker = null;
    this.modelLoading = false;
    this.modelReady = false;
    this.rafId = null;
    this.lastFrameTime = 0;

    // Temporal smoothing and window state
    this.windowSamples = []; // Array of { timestamp, dominant, confidence, probs }
    this.smoothedProbs = {
      HAPPY: 0.05,
      SAD: 0.05,
      SURPRISED: 0.05,
      FEAR: 0.05,
      ANGRY: 0.05,
      NEUTRAL: 0.75
    };
    this.currentEstimate = 'NEUTRAL';
    this.currentConfidence = 0.75;
    this.recentTrend = 'Stable';
    this.minObservationsRequired = 10;
    this.hysteresisMargin = 0.09;
    this.cooldownParagraphsRemaining = 0;
    this.manualMoodOverride = null;

    this.onUpdateCallback = null;
    this.videoElement = null;
    this.canvasElement = null;
  }

  async ensureLandmarkerLoaded() {
    if (this.landmarker) return this.landmarker;
    if (this.modelLoading) return null;

    this.modelLoading = true;
    try {
      const visionModule = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
      const { FaceLandmarker, FilesetResolver } = visionModule;
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      this.landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
        numFaces: 1
      });
      this.modelReady = true;
      this.modelLoading = false;
      return this.landmarker;
    } catch (err) {
      console.warn('FaceLandmarker network load error; fallback mode active:', err);
      this.modelLoading = false;
      return null;
    }
  }

  /**
   * Translates 52 FACS Blendshapes into 6 Primary Emotion Probabilities
   */
  classifyBlendshapesToExpressions(categories) {
    const map = {};
    for (const item of categories) {
      map[item.categoryName] = item.score;
    }

    const smile = ((map.mouthSmileLeft || 0) + (map.mouthSmileRight || 0)) / 2;
    const cheekSquint = ((map.cheekSquintLeft || 0) + (map.cheekSquintRight || 0)) / 2;
    const frown = ((map.mouthFrownLeft || 0) + (map.mouthFrownRight || 0)) / 2;
    const browInnerUp = map.browInnerUp || 0;
    const browDown = ((map.browDownLeft || 0) + (map.browDownRight || 0)) / 2;
    const browOuterUp = ((map.browOuterUpLeft || 0) + (map.browOuterUpRight || 0)) / 2;
    const eyeWide = ((map.eyeWideLeft || 0) + (map.eyeWideRight || 0)) / 2;
    const jawOpen = map.jawOpen || 0;
    const mouthPress = ((map.mouthPressLeft || 0) + (map.mouthPressRight || 0)) / 2;
    const mouthStretch = ((map.mouthStretchLeft || 0) + (map.mouthStretchRight || 0)) / 2;
    const noseSneer = ((map.noseSneerLeft || 0) + (map.noseSneerRight || 0)) / 2;

    // FACS Action Unit Combinations
    const rawHappy = Math.min(1, smile * 1.45 + cheekSquint * 0.55);
    const rawSad = Math.min(1, frown * 1.3 + browInnerUp * 0.85 + mouthPress * 0.35);
    const rawSurprised = Math.min(1, (eyeWide * 1.1 + browOuterUp * 0.9 + jawOpen * 1.1) * 0.85);
    const rawFear = Math.min(1, eyeWide * 0.85 + browInnerUp * 0.9 + mouthStretch * 0.95);
    const rawAngry = Math.min(1, browDown * 1.35 + noseSneer * 0.7 + mouthPress * 0.65);

    const maxExpressive = Math.max(rawHappy, rawSad, rawSurprised, rawFear, rawAngry);
    const rawNeutral = Math.max(0.12, 1.0 - maxExpressive * 1.15);

    const total = rawHappy + rawSad + rawSurprised + rawFear + rawAngry + rawNeutral + 1e-5;
    return {
      HAPPY: rawHappy / total,
      SAD: rawSad / total,
      SURPRISED: rawSurprised / total,
      FEAR: rawFear / total,
      ANGRY: rawAngry / total,
      NEUTRAL: rawNeutral / total
    };
  }

  async startCamera(videoElement, canvasElement, onUpdateCallback) {
    if (this.stream) return true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Webcam API is unavailable in this browser context.');
    }

    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.onUpdateCallback = onUpdateCallback;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: 'user' },
      audio: false
    });

    this.stream = stream;
    this.enabled = true;
    this.videoElement.srcObject = stream;
    await this.videoElement.play();

    // Load landmarker asynchronously
    this.ensureLandmarkerLoaded();

    // Start frame processing loop (~10 Hz for lightweight CPU footprint)
    if (this.rafId) cancelAnimationFrame(this.rafId);
    const processFrame = (timestamp) => {
      if (!this.enabled || !this.stream) return;
      if (timestamp - this.lastFrameTime >= 105) {
        this.lastFrameTime = timestamp;
        this.analyzeCurrentFrame(timestamp);
      }
      this.rafId = requestAnimationFrame(processFrame);
    };
    this.rafId = requestAnimationFrame(processFrame);
    return true;
  }

  stopCamera() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    if (this.canvasElement) {
      const ctx = this.canvasElement.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
    this.enabled = false;
    if (this.onUpdateCallback) this.onUpdateCallback();
  }

  analyzeCurrentFrame(timestamp) {
    const video = this.videoElement;
    if (!video || video.readyState < 2) return;

    let frameProbs = null;
    const canvas = this.canvasElement;
    const ctx = canvas ? canvas.getContext('2d') : null;

    if (canvas && canvas.width !== video.videoWidth && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.landmarker && this.modelReady) {
      try {
        const result = this.landmarker.detectForVideo(video, timestamp);
        if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
          frameProbs = this.classifyBlendshapesToExpressions(result.faceBlendshapes[0].categories);
        }

        // Render minimal landmark mesh overlay dots
        if (ctx && result.faceLandmarks && result.faceLandmarks.length > 0) {
          const landmarks = result.faceLandmarks[0];
          ctx.fillStyle = 'rgba(212, 155, 67, 0.45)';
          const keyIndices = [33, 133, 362, 263, 61, 291, 0, 17, 70, 300, 105, 334];
          for (const idx of keyIndices) {
            const pt = landmarks[idx];
            if (pt) {
              ctx.beginPath();
              ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      } catch (err) {
        // Frame timing edge case
      }
    }

    if (!frameProbs) return;
    this.ingestObservation(frameProbs);
  }

  ingestObservation(frameProbs) {
    const alpha = 0.22; // EMA smoothing coefficient

    // 1. Exponential Moving Average
    for (const cat of EXPRESSION_CATEGORIES) {
      this.smoothedProbs[cat] = this.smoothedProbs[cat] * (1 - alpha) + (frameProbs[cat] || 0) * alpha;
    }

    // 2. Determine best category
    let bestCat = 'NEUTRAL';
    let bestScore = -1;
    for (const cat of EXPRESSION_CATEGORIES) {
      if (this.smoothedProbs[cat] > bestScore) {
        bestScore = this.smoothedProbs[cat];
        bestCat = cat;
      }
    }

    // 3. Hysteresis check
    const currentScore = this.smoothedProbs[this.currentEstimate] || 0;
    if (bestCat !== this.currentEstimate && bestScore > currentScore + this.hysteresisMargin) {
      this.currentEstimate = bestCat;
    }
    this.currentConfidence = this.smoothedProbs[this.currentEstimate];

    // 4. Rolling observation window (keep up to 40 samples)
    this.windowSamples.push({
      timestamp: Date.now(),
      dominant: this.currentEstimate,
      confidence: this.currentConfidence,
      probs: { ...this.smoothedProbs }
    });
    if (this.windowSamples.length > 40) {
      this.windowSamples.shift();
    }

    // 5. Trend analysis
    if (this.windowSamples.length >= 6) {
      const half = Math.floor(this.windowSamples.length / 2);
      const firstHalf = this.windowSamples.slice(0, half);
      const secondHalf = this.windowSamples.slice(half);
      const avgFirst = firstHalf.reduce((acc, s) => acc + (s.probs[this.currentEstimate] || 0), 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((acc, s) => acc + (s.probs[this.currentEstimate] || 0), 0) / secondHalf.length;
      const delta = avgSecond - avgFirst;
      if (delta > 0.04) this.recentTrend = 'Increasing';
      else if (delta < -0.04) this.recentTrend = 'Subsiding';
      else this.recentTrend = 'Steady';
    } else {
      this.recentTrend = 'Gathering samples';
    }

    if (this.onUpdateCallback) this.onUpdateCallback();
  }

  evaluateAggregatedSignal(adaptationIntensity, confidenceThreshold, isAdaptationEnabled, adaptationRules) {
    const intensityKey = (adaptationIntensity || 'BALANCED').toLowerCase();

    // 1. Manual Reader Override
    if (this.manualMoodOverride) {
      const chosen = this.manualMoodOverride;
      return {
        apparentExpression: chosen,
        confidence: 0.95,
        trend: 'Manual Selection Active',
        sufficientEvidence: true,
        cooldownActive: false,
        source: 'manual',
        narrativeDirective: adaptationRules[chosen] ? adaptationRules[chosen][intensityKey] : adaptationRules.NEUTRAL[intensityKey]
      };
    }

    // 2. Adaptation disabled
    if (!isAdaptationEnabled) {
      return {
        apparentExpression: 'NEUTRAL',
        confidence: 0,
        trend: 'Adaptation Paused',
        sufficientEvidence: false,
        cooldownActive: false,
        source: 'disabled',
        narrativeDirective: adaptationRules.NEUTRAL[intensityKey]
      };
    }

    // 3. Minimum samples check
    if (!this.enabled || this.windowSamples.length < this.minObservationsRequired) {
      return {
        apparentExpression: 'UNCERTAIN',
        confidence: Math.round(this.currentConfidence * 100) / 100,
        trend: this.windowSamples.length === 0 ? 'Camera Off' : 'Insufficient Samples',
        sufficientEvidence: false,
        cooldownActive: false,
        source: 'insufficient_data',
        narrativeDirective: adaptationRules.UNCERTAIN[intensityKey]
      };
    }

    // 4. Cooldown Check
    if (this.cooldownParagraphsRemaining > 0 && this.currentEstimate !== 'NEUTRAL') {
      return {
        apparentExpression: this.currentEstimate,
        confidence: Math.round(this.currentConfidence * 100) / 100,
        trend: `${this.recentTrend} (In Cooldown)`,
        sufficientEvidence: true,
        cooldownActive: true,
        source: 'webcam_cooldown',
        narrativeDirective: adaptationRules.NEUTRAL[intensityKey]
      };
    }

    // 5. Aggregate rolling window
    const counts = {};
    let sumConf = 0;
    for (const sample of this.windowSamples) {
      counts[sample.dominant] = (counts[sample.dominant] || 0) + 1;
      sumConf += sample.confidence;
    }
    let windowDominant = this.currentEstimate;
    let maxCount = 0;
    for (const [k, c] of Object.entries(counts)) {
      if (c > maxCount) {
        maxCount = c;
        windowDominant = k;
      }
    }
    const avgConfidence = sumConf / this.windowSamples.length;
    const isReliable = avgConfidence >= (confidenceThreshold || 0.58);

    if (!isReliable) {
      return {
        apparentExpression: 'UNCERTAIN',
        confidence: Math.round(avgConfidence * 100) / 100,
        trend: this.recentTrend,
        sufficientEvidence: false,
        cooldownActive: false,
        source: 'webcam_low_confidence',
        narrativeDirective: adaptationRules.UNCERTAIN[intensityKey]
      };
    }

    const ruleSet = adaptationRules[windowDominant] || adaptationRules.NEUTRAL;
    return {
      apparentExpression: windowDominant,
      confidence: Math.round(avgConfidence * 100) / 100,
      trend: this.recentTrend,
      sufficientEvidence: true,
      cooldownActive: false,
      source: 'webcam_verified',
      narrativeDirective: ruleSet[intensityKey]
    };
  }

  resetObservationWindow() {
    this.windowSamples = [];
    this.manualMoodOverride = null;
  }
}

export const visionProcessor = new VisionProcessor();
