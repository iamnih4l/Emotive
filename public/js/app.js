/**
 * EMOTIVE — Main Application Orchestrator
 * Connects UI, Web Audio Soundscape, Local Computer Vision, Story Engine, and Storage.
 */

import { soundEngine } from './audio.js';
import { visionProcessor, EXPRESSION_CATEGORIES } from './vision.js';
import { CURATED_PREMISES, ADAPTATION_RULES, dispatchParagraphGeneration } from './storyEngine.js';
import {
  saveStoryToArchive,
  getArchivedStories,
  getArchivedStory,
  deleteArchivedStory,
  exportStoryAsText,
  exportStoryAsMarkdown
} from './storage.js';

// ---------------------------------------------------------------------------
// APPLICATION STATE
// ---------------------------------------------------------------------------
const appState = {
  currentScreen: 'landing',
  premiseCycleIndex: 0,
  fontSizeIndex: 1, // 0: sm, 1: md, 2: lg, 3: xl
  readingPace: 'normal', // 'fast' (14s), 'normal' (22s), 'contemplative' (32s)
  soundscapeEnabled: true,
  engineConfig: {
    model: 'gemini-2.5-flash',
    connectionMode: 'auto',
    localApiKey: '',
    confidenceThreshold: 0.58
  },
  readingLoop: {
    timerId: null,
    elapsedSeconds: 0,
    targetSeconds: 22,
    isPaused: false,
    isGenerating: false
  },
  story: {
    storyId: '',
    title: '',
    premise: '',
    genre: 'Mystery',
    style: 'Literary',
    desiredLength: 8,
    audience: 'Young Adult / Literary (PG-13)',
    startingMood: 'Wistful & Mysterious',
    adaptationIntensity: 'BALANCED',
    adaptationEnabled: true,
    protagonist: '',
    boundaries: '',
    currentParagraphIndex: 0,
    paragraphs: [],
    narrativeSummary: '',
    plotThreads: [],
    currentNarrativeDirection: 'Establish the opening atmosphere, setting, and central intrigue.'
  }
};

// ---------------------------------------------------------------------------
// DOM REFERENCES
// ---------------------------------------------------------------------------
const el = {
  // Screens
  screenLanding: document.getElementById('screenLanding'),
  screenConfig: document.getElementById('screenConfig'),
  screenReading: document.getElementById('screenReading'),
  screenEnding: document.getElementById('screenEnding'),

  // Header Controls
  navHomeBtn: document.getElementById('navHomeBtn'),
  cameraStatusDot: document.getElementById('cameraStatusDot'),
  cameraStatusLabel: document.getElementById('cameraStatusLabel'),
  quickCameraToggleBtn: document.getElementById('quickCameraToggleBtn'),
  audioToggleBtn: document.getElementById('audioToggleBtn'),
  audioStatusIcon: document.getElementById('audioStatusIcon'),
  audioStatusLabel: document.getElementById('audioStatusLabel'),
  audioVolumeSlider: document.getElementById('audioVolumeSlider'),
  audioWaveCanvas: document.getElementById('audioWaveCanvas'),
  openArchiveDrawerBtn: document.getElementById('openArchiveDrawerBtn'),
  openPrivacyModalBtn: document.getElementById('openPrivacyModalBtn'),
  openEngineModalBtn: document.getElementById('openEngineModalBtn'),

  // Archive Drawer
  archiveDrawer: document.getElementById('archiveDrawer'),
  closeArchiveDrawerBtn: document.getElementById('closeArchiveDrawerBtn'),
  archiveDrawerBackdrop: document.getElementById('archiveDrawerBackdrop'),
  archivedStoriesList: document.getElementById('archivedStoriesList'),
  archiveEmptyState: document.getElementById('archiveEmptyState'),

  // Modals
  cameraConsentModal: document.getElementById('cameraConsentModal'),
  closeCameraConsentBtn: document.getElementById('closeCameraConsentBtn'),
  consentContinueWithoutCameraBtn: document.getElementById('consentContinueWithoutCameraBtn'),
  consentGrantCameraBtn: document.getElementById('consentGrantCameraBtn'),

  privacyInfoModal: document.getElementById('privacyInfoModal'),
  closePrivacyModalBtn: document.getElementById('closePrivacyModalBtn'),
  ackPrivacyModalBtn: document.getElementById('ackPrivacyModalBtn'),

  engineConfigModal: document.getElementById('engineConfigModal'),
  closeEngineModalBtn: document.getElementById('closeEngineModalBtn'),
  cfgGeminiModel: document.getElementById('cfgGeminiModel'),
  cfgConnectionMode: document.getElementById('cfgConnectionMode'),
  cfgLocalApiKey: document.getElementById('cfgLocalApiKey'),
  cfgConfidenceThreshold: document.getElementById('cfgConfidenceThreshold'),
  confThresholdVal: document.getElementById('confThresholdVal'),
  saveEngineConfigBtn: document.getElementById('saveEngineConfigBtn'),
  engineConfigSavedToast: document.getElementById('engineConfigSavedToast'),

  // Landing Screen
  landingStartBtn: document.getElementById('landingStartBtn'),
  landingNoCameraBtn: document.getElementById('landingNoCameraBtn'),

  // Config Screen
  quickStartRandomBtn: document.getElementById('quickStartRandomBtn'),
  inspirePremiseBtn: document.getElementById('inspirePremiseBtn'),
  cfgTitle: document.getElementById('cfgTitle'),
  cfgPremise: document.getElementById('cfgPremise'),
  cfgGenre: document.getElementById('cfgGenre'),
  cfgCustomGenre: document.getElementById('cfgCustomGenre'),
  cfgStyle: document.getElementById('cfgStyle'),
  cfgStartingMood: document.getElementById('cfgStartingMood'),
  cfgLength: document.getElementById('cfgLength'),
  cfgAudience: document.getElementById('cfgAudience'),
  cfgProtagonist: document.getElementById('cfgProtagonist'),
  cfgBoundaries: document.getElementById('cfgBoundaries'),
  cfgEnableCameraCheckbox: document.getElementById('cfgEnableCameraCheckbox'),
  backToLandingBtn: document.getElementById('backToLandingBtn'),
  beginReadingBtn: document.getElementById('beginReadingBtn'),

  // Reading Screen
  readingHeaderTitle: document.getElementById('readingHeaderTitle'),
  readingProgressBadge: document.getElementById('readingProgressBadge'),
  readingTimeRemaining: document.getElementById('readingTimeRemaining'),
  currentNarrativeMoodText: document.getElementById('currentNarrativeMoodText'),
  fontDecreaseBtn: document.getElementById('fontDecreaseBtn'),
  fontIncreaseBtn: document.getElementById('fontIncreaseBtn'),
  readingSpeedSelect: document.getElementById('readingSpeedSelect'),
  toggleInspectorBtn: document.getElementById('toggleInspectorBtn'),
  resetStoryBtn: document.getElementById('resetStoryBtn'),

  bookGenreLabel: document.getElementById('bookGenreLabel'),
  bookStyleLabel: document.getElementById('bookStyleLabel'),
  bookIntensityLabel: document.getElementById('bookIntensityLabel'),
  bookMainTitle: document.getElementById('bookMainTitle'),
  storyParagraphsContainer: document.getElementById('storyParagraphsContainer'),
  storyEvolvingIndicator: document.getElementById('storyEvolvingIndicator'),
  generationErrorBanner: document.getElementById('generationErrorBanner'),
  generationErrorMessage: document.getElementById('generationErrorMessage'),
  retryGenerationBtn: document.getElementById('retryGenerationBtn'),

  readingCycleStageLabel: document.getElementById('readingCycleStageLabel'),
  readingTimerCountdown: document.getElementById('readingTimerCountdown'),
  readingWindowProgressBar: document.getElementById('readingWindowProgressBar'),
  pauseAdaptationBtn: document.getElementById('pauseAdaptationBtn'),
  pauseBtnIcon: document.getElementById('pauseBtnIcon'),
  pauseBtnText: document.getElementById('pauseBtnText'),
  manualContinueBtn: document.getElementById('manualContinueBtn'),
  concludeStoryNowBtn: document.getElementById('concludeStoryNowBtn'),

  // Emotion Monitor Sidebar
  webcamVideo: document.getElementById('webcamVideo'),
  landmarkOverlayCanvas: document.getElementById('landmarkOverlayCanvas'),
  cameraOffOverlay: document.getElementById('cameraOffOverlay'),
  cameraOverlayStatusText: document.getElementById('cameraOverlayStatusText'),
  enableCameraFromMonitorBtn: document.getElementById('enableCameraFromMonitorBtn'),
  liveVideoBadge: document.getElementById('liveVideoBadge'),

  telemetryExpression: document.getElementById('telemetryExpression'),
  telemetryConfidence: document.getElementById('telemetryConfidence'),
  telemetryTrend: document.getElementById('telemetryTrend'),
  telemetryObservations: document.getElementById('telemetryObservations'),
  telemetryAdaptationActive: document.getElementById('telemetryAdaptationActive'),
  telemetryEngineState: document.getElementById('telemetryEngineState'),
  cooldownBadge: document.getElementById('cooldownBadge'),
  expressionBarsContainer: document.getElementById('expressionBarsContainer'),
  pendingDirectiveText: document.getElementById('pendingDirectiveText'),
  manualOverrideStatus: document.getElementById('manualOverrideStatus'),
  sidebarCameraToggleBtn: document.getElementById('sidebarCameraToggleBtn'),
  sidebarAdaptationToggleBtn: document.getElementById('sidebarAdaptationToggleBtn'),

  // Inspector Panel
  narrativeInspectorPanel: document.getElementById('narrativeInspectorPanel'),
  closeInspectorBtn: document.getElementById('closeInspectorBtn'),
  inspStoryId: document.getElementById('inspStoryId'),
  inspPlotDev: document.getElementById('inspPlotDev'),
  inspContinuity: document.getElementById('inspContinuity'),
  inspRawJson: document.getElementById('inspRawJson'),

  // Ending Screen
  endingStoryTitle: document.getElementById('endingStoryTitle'),
  endingStoryMeta: document.getElementById('endingStoryMeta'),
  exportStoryTxtBtn: document.getElementById('exportStoryTxtBtn'),
  exportStoryMdBtn: document.getElementById('exportStoryMdBtn'),
  continueFromEndingBtn: document.getElementById('continueFromEndingBtn'),
  toggleEvolutionSummaryBtn: document.getElementById('toggleEvolutionSummaryBtn'),
  restartNewStoryBtn: document.getElementById('restartNewStoryBtn'),
  saveToArchiveBtn: document.getElementById('saveToArchiveBtn'),
  archiveSavedToast: document.getElementById('archiveSavedToast'),
  evolutionSummarySection: document.getElementById('evolutionSummarySection'),
  evolutionAdaptationCount: document.getElementById('evolutionAdaptationCount'),
  evolutionTimelineList: document.getElementById('evolutionTimelineList'),
  endingFullManuscript: document.getElementById('endingFullManuscript')
};

// ---------------------------------------------------------------------------
// UI HELPERS & SCREEN NAVIGATION
// ---------------------------------------------------------------------------
function switchScreen(screenName) {
  appState.currentScreen = screenName;
  el.screenLanding.classList.toggle('hidden', screenName !== 'landing');
  el.screenConfig.classList.toggle('hidden', screenName !== 'config');
  el.screenReading.classList.toggle('hidden', screenName !== 'reading');
  el.screenEnding.classList.toggle('hidden', screenName !== 'ending');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initExpressionBars() {
  el.expressionBarsContainer.innerHTML = EXPRESSION_CATEGORIES.map(cat => `
    <div class="flex items-center gap-2">
      <span class="w-20 text-ivory-400 text-[10px]">${cat}</span>
      <div class="flex-1 h-1.5 rounded-full bg-midnight-950 overflow-hidden border border-ivory-300/10">
        <div id="bar_${cat}" class="h-full bg-amber-450/80 transition-all duration-200" style="width: ${cat === 'NEUTRAL' ? 75 : 5}%;"></div>
      </div>
      <span id="val_${cat}" class="w-9 text-right text-ivory-300 text-[10px]">${cat === 'NEUTRAL' ? '75%' : '5%'}</span>
    </div>
  `).join('');
}

function populateSamplePremise(index) {
  const sample = CURATED_PREMISES[index % CURATED_PREMISES.length];
  el.cfgTitle.value = sample.title;
  el.cfgPremise.value = sample.premise;
  el.cfgGenre.value = sample.genre;
  el.cfgStyle.value = sample.style;
  el.cfgStartingMood.value = sample.mood;
  el.cfgProtagonist.value = sample.protagonist;
  el.cfgBoundaries.value = sample.boundaries;
}

function updateCameraBadges() {
  const isOn = visionProcessor.enabled && !!visionProcessor.stream;
  el.cameraStatusDot.className = `w-2 h-2 rounded-full ${isOn ? 'bg-emerald-400 animate-pulse' : 'bg-ivory-400'}`;
  el.cameraStatusLabel.textContent = isOn ? 'CAMERA: LOCAL ON' : 'CAMERA: OFF';
  el.quickCameraToggleBtn.textContent = isOn ? 'Stop' : 'Enable';
  el.sidebarCameraToggleBtn.textContent = isOn ? 'Stop Camera' : 'Enable Camera';
  el.cfgEnableCameraCheckbox.checked = isOn;
}

function updateEmotionMonitorUI() {
  const signal = visionProcessor.evaluateAggregatedSignal(
    appState.story.adaptationIntensity,
    appState.engineConfig.confidenceThreshold,
    appState.story.adaptationEnabled,
    ADAPTATION_RULES
  );

  const activeExpr = visionProcessor.manualMoodOverride || (visionProcessor.enabled ? visionProcessor.currentEstimate : 'NEUTRAL');
  const confPct = visionProcessor.manualMoodOverride
    ? 95
    : (visionProcessor.enabled ? Math.round(visionProcessor.currentConfidence * 100) : 0);

  el.telemetryExpression.textContent = activeExpr;
  el.telemetryConfidence.textContent = visionProcessor.enabled || visionProcessor.manualMoodOverride
    ? `${confPct}% ${signal.sufficientEvidence ? '(Reliable)' : '(Below threshold)'}`
    : 'Camera Off (Manual Mode)';
  el.telemetryTrend.textContent = visionProcessor.manualMoodOverride
    ? 'Manual Selection Active'
    : (visionProcessor.enabled ? visionProcessor.recentTrend : 'Manual / Neutral');
  el.telemetryObservations.textContent = `${visionProcessor.windowSamples.length} / ${visionProcessor.minObservationsRequired} min samples`;

  el.telemetryAdaptationActive.textContent = appState.story.adaptationEnabled
    ? `Yes (${appState.story.adaptationIntensity})`
    : 'Disabled';
  el.telemetryAdaptationActive.className = appState.story.adaptationEnabled ? 'text-emerald-400' : 'text-ivory-400';

  el.cooldownBadge.textContent = visionProcessor.cooldownParagraphsRemaining > 0
    ? `Cooldown: ${visionProcessor.cooldownParagraphsRemaining} para`
    : 'Cooldown: Ready';

  el.pendingDirectiveText.textContent = signal.narrativeDirective;

  // Update probability bars
  for (const cat of EXPRESSION_CATEGORIES) {
    const barEl = document.getElementById(`bar_${cat}`);
    const valEl = document.getElementById(`val_${cat}`);
    let pct = Math.round((visionProcessor.smoothedProbs[cat] || 0) * 100);
    if (visionProcessor.manualMoodOverride) {
      pct = cat === visionProcessor.manualMoodOverride ? 95 : 1;
    }
    if (barEl) {
      barEl.style.width = `${pct}%`;
      barEl.className = `h-full transition-all duration-200 ${cat === activeExpr ? 'bg-amber-450' : 'bg-ivory-400/35'}`;
    }
    if (valEl) valEl.textContent = `${pct}%`;
  }
}

// ---------------------------------------------------------------------------
// STORY LIFECYCLE & READING ENGINE
// ---------------------------------------------------------------------------
function initializeStoryStateFromConfig() {
  const s = appState.story;
  const rawGenre = el.cfgGenre.value;
  const customGenre = el.cfgCustomGenre.value.trim();

  s.storyId = 'emotive_' + Date.now().toString(36);
  s.title = el.cfgTitle.value.trim();
  s.premise = el.cfgPremise.value.trim() || CURATED_PREMISES[0].premise;
  s.genre = rawGenre === 'Custom' && customGenre ? customGenre : rawGenre;
  s.style = el.cfgStyle.value;
  s.desiredLength = parseInt(el.cfgLength.value, 10) || 8;
  s.audience = el.cfgAudience.value;
  s.startingMood = el.cfgStartingMood.value;
  s.protagonist = el.cfgProtagonist.value.trim();
  s.boundaries = el.cfgBoundaries.value.trim();
  s.currentParagraphIndex = 0;
  s.paragraphs = [];
  s.narrativeSummary = '';
  s.plotThreads = [];
  s.currentNarrativeDirection = 'Establish opening scene and premise.';

  visionProcessor.resetObservationWindow();
  visionProcessor.cooldownParagraphsRemaining = 0;

  // Update Reading UI Headers
  el.bookGenreLabel.textContent = s.genre.toUpperCase();
  el.bookStyleLabel.textContent = `${s.style.toUpperCase()} STYLE`;
  el.bookIntensityLabel.textContent = `${s.adaptationIntensity} ADAPTATION`;
  el.bookMainTitle.textContent = s.title || 'Generating Title...';
  el.readingHeaderTitle.textContent = s.title || 'EMOTIVE Story';
  el.storyParagraphsContainer.innerHTML = '';
}

async function launchStorySession(withCamera) {
  el.cameraConsentModal.classList.add('hidden');
  initializeStoryStateFromConfig();
  switchScreen('reading');

  // Start soundscape if enabled
  if (appState.soundscapeEnabled) {
    await soundEngine.start();
    soundEngine.transitionMood('NEUTRAL');
  }

  if (withCamera) {
    try {
      el.cameraOverlayStatusText.textContent = 'Activating camera...';
      await visionProcessor.startCamera(el.webcamVideo, el.landmarkOverlayCanvas, () => {
        updateEmotionMonitorUI();
      });
      el.cameraOffOverlay.classList.add('hidden');
      el.liveVideoBadge.classList.remove('hidden');
      updateCameraBadges();
    } catch (err) {
      el.cameraOverlayStatusText.textContent = 'Camera unavailable. Manual mood selection active.';
      updateCameraBadges();
    }
  } else {
    visionProcessor.stopCamera();
    el.cameraOffOverlay.classList.remove('hidden');
    el.liveVideoBadge.classList.add('hidden');
    updateCameraBadges();
  }

  updateEmotionMonitorUI();
  await requestNextStoryParagraph(false);
}

async function requestNextStoryParagraph(isFinalParagraph = false) {
  if (appState.readingLoop.isGenerating) return;
  appState.readingLoop.isGenerating = true;

  el.generationErrorBanner.classList.add('hidden');
  el.storyEvolvingIndicator.classList.remove('hidden');
  el.telemetryEngineState.textContent = 'Composing next paragraph';
  el.manualContinueBtn.disabled = true;
  el.manualContinueBtn.classList.add('opacity-50');

  const signal = visionProcessor.evaluateAggregatedSignal(
    appState.story.adaptationIntensity,
    appState.engineConfig.confidenceThreshold,
    appState.story.adaptationEnabled,
    ADAPTATION_RULES
  );

  try {
    const { result, engineLabel } = await dispatchParagraphGeneration(
      appState.story,
      signal,
      isFinalParagraph,
      appState.engineConfig
    );

    commitGeneratedParagraph(result, signal, isFinalParagraph, engineLabel);
  } catch (err) {
    console.error('Story generation error:', err);
    el.storyEvolvingIndicator.classList.add('hidden');
    el.generationErrorBanner.classList.remove('hidden');
    el.generationErrorMessage.textContent = `${err.message}. You can retry or adjust settings.`;
    el.telemetryEngineState.textContent = 'Error — awaiting retry';
  } finally {
    appState.readingLoop.isGenerating = false;
    el.manualContinueBtn.disabled = false;
    el.manualContinueBtn.classList.remove('opacity-50');
  }
}

function commitGeneratedParagraph(result, signal, isFinalParagraph, usedEngineLabel) {
  const s = appState.story;
  if (!s.title && result.story_title) {
    s.title = result.story_title;
  }

  const paragraphNum = s.currentParagraphIndex + 1;
  const entry = {
    index: paragraphNum,
    text: result.paragraph.trim(),
    mood: result.narrative_mood || s.startingMood,
    intensity: typeof result.emotional_intensity === 'number' ? result.emotional_intensity : 0.6,
    plotDevelopment: result.plot_development || 'Narrative progressed.',
    continuityNotes: result.continuity_notes || 'Continuity maintained.',
    triggerExpression: paragraphNum === 1 ? 'OPENING SEED' : signal.apparentExpression,
    triggerConfidence: paragraphNum === 1 ? 1.0 : signal.confidence,
    triggerTrend: paragraphNum === 1 ? 'Initial Setup' : signal.trend,
    directiveApplied: paragraphNum === 1 ? 'Establish opening premise and atmosphere' : signal.narrativeDirective,
    engineUsed: usedEngineLabel
  };

  s.paragraphs.push(entry);
  s.currentParagraphIndex = paragraphNum;
  s.narrativeSummary = `${s.narrativeSummary ? s.narrativeSummary + ' ' : ''}[P${paragraphNum}]: ${entry.plotDevelopment}`;
  if (entry.continuityNotes) {
    s.plotThreads.push(entry.continuityNotes);
    if (s.plotThreads.length > 4) s.plotThreads.shift();
  }
  s.currentNarrativeDirection = entry.plotDevelopment;

  // Manage emotional cooldown
  if (paragraphNum > 1 && ['HAPPY', 'SAD', 'SURPRISED', 'FEAR', 'ANGRY'].includes(signal.apparentExpression) && signal.sufficientEvidence && !signal.cooldownActive) {
    visionProcessor.cooldownParagraphsRemaining = 1;
  } else if (visionProcessor.cooldownParagraphsRemaining > 0) {
    visionProcessor.cooldownParagraphsRemaining -= 1;
  }

  // Smoothly adapt generative soundscape to new mood
  if (appState.soundscapeEnabled && signal.apparentExpression) {
    soundEngine.transitionMood(signal.apparentExpression);
  }

  // Clear rolling observation window for next paragraph
  visionProcessor.resetObservationWindow();
  highlightManualMoodButtons(null);

  // Update Reading Headers
  el.readingHeaderTitle.textContent = s.title || 'Untitled Story';
  el.bookMainTitle.textContent = s.title || 'Untitled Story';
  el.readingProgressBadge.textContent = `Paragraph ${paragraphNum} of ${s.desiredLength}`;
  const remainingParas = Math.max(0, s.desiredLength - paragraphNum);
  const estMinutes = Math.max(1, Math.ceil((remainingParas * appState.readingLoop.targetSeconds) / 60));
  el.readingTimeRemaining.textContent = remainingParas > 0 ? `• ~${estMinutes} min remaining` : '• Final Paragraph';
  el.currentNarrativeMoodText.textContent = entry.mood;

  // Render paragraph into reading container
  renderParagraphElement(entry, paragraphNum === 1);

  // Update Inspector Panel
  el.inspStoryId.textContent = s.storyId;
  el.inspPlotDev.textContent = entry.plotDevelopment;
  el.inspContinuity.textContent = entry.continuityNotes;
  el.inspRawJson.textContent = JSON.stringify(result, null, 2);

  el.storyEvolvingIndicator.classList.add('hidden');
  el.telemetryEngineState.textContent = 'Observing reader';
  updateEmotionMonitorUI();

  // Story conclusion check
  if (isFinalParagraph || paragraphNum >= s.desiredLength) {
    stopReadingIntervalTimer();
    el.readingCycleStageLabel.textContent = 'STORY COMPLETE — CLICK CONTINUE TO VIEW MANUSCRIPT';
    el.readingTimerCountdown.textContent = 'Done';
    el.readingWindowProgressBar.style.width = '100%';

    // Auto-save completed story to persistent archive!
    saveStoryToArchive(s);

    setTimeout(() => {
      if (appState.currentScreen === 'reading' && appState.story.currentParagraphIndex >= appState.story.desiredLength) {
        showEndingScreen();
      }
    }, 6000);
  } else {
    // Dynamic pace adjustment
    const wordCount = entry.text.split(/\s+/).length;
    const basePace = appState.readingPace === 'fast' ? 14 : (appState.readingPace === 'contemplative' ? 32 : 22);
    const wordAdjustment = Math.round(Math.max(0, wordCount - 75) * 0.12);
    appState.readingLoop.targetSeconds = basePace + wordAdjustment;
    startReadingIntervalTimer();
  }
}

function renderParagraphElement(entry, isFirst) {
  const existingParas = el.storyParagraphsContainer.querySelectorAll('.story-para-block');
  existingParas.forEach(node => {
    node.classList.remove('text-ivory-50');
    node.classList.add('text-ivory-300/80');
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'story-para-block paragraph-enter text-ivory-50 space-y-2';

  const metaChip = entry.index > 1
    ? `<div class="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ivory-400/70 select-none">
         <span>§ ${entry.index}</span>
         <span>•</span>
         <span class="text-amber-350/80">Atmosphere: ${escapeHtml(entry.mood)}</span>
         ${entry.triggerExpression !== 'NEUTRAL' && entry.triggerExpression !== 'UNCERTAIN'
           ? `<span>•</span><span class="text-violet-450/90">Adapted to ${escapeHtml(entry.triggerExpression)} cue</span>`
           : ''}
       </div>`
    : '';

  wrapper.innerHTML = `
    ${metaChip}
    <p class="${isFirst ? 'drop-cap' : ''} leading-relaxed">${escapeHtml(entry.text)}</p>
  `;

  el.storyParagraphsContainer.appendChild(wrapper);

  setTimeout(() => {
    const rect = wrapper.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 80) {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 120);
}

function startReadingIntervalTimer() {
  stopReadingIntervalTimer();
  appState.readingLoop.elapsedSeconds = 0;
  updateReadingProgressBarUI();

  appState.readingLoop.timerId = setInterval(() => {
    if (appState.readingLoop.isPaused || appState.readingLoop.isGenerating || appState.currentScreen !== 'reading') {
      return;
    }
    appState.readingLoop.elapsedSeconds += 0.5;
    updateReadingProgressBarUI();

    if (appState.readingLoop.elapsedSeconds >= appState.readingLoop.targetSeconds) {
      stopReadingIntervalTimer();
      const isNextFinal = (appState.story.currentParagraphIndex + 1) >= appState.story.desiredLength;
      requestNextStoryParagraph(isNextFinal);
    }
  }, 500);
}

function stopReadingIntervalTimer() {
  if (appState.readingLoop.timerId) {
    clearInterval(appState.readingLoop.timerId);
    appState.readingLoop.timerId = null;
  }
}

function updateReadingProgressBarUI() {
  const rl = appState.readingLoop;
  const pct = Math.min(100, Math.round((rl.elapsedSeconds / rl.targetSeconds) * 100));
  const rem = Math.max(0, Math.ceil(rl.targetSeconds - rl.elapsedSeconds));

  el.readingWindowProgressBar.style.width = `${pct}%`;
  el.readingTimerCountdown.textContent = rl.isPaused ? 'Paused' : `${rem}s`;

  if (rl.isPaused) {
    el.readingCycleStageLabel.textContent = 'AUTO-ADVANCE PAUSED — CLICK CONTINUE WHEN READY';
  } else if (pct < 45) {
    el.readingCycleStageLabel.textContent = 'READING & OBSERVING EXPRESSION WINDOW...';
  } else if (pct < 85) {
    el.readingCycleStageLabel.textContent = 'AGGREGATING TEMPORAL EXPRESSION TREND...';
  } else {
    el.readingCycleStageLabel.textContent = 'PREPARING NEXT ADAPTIVE PARAGRAPH...';
  }
}

function showEndingScreen() {
  stopReadingIntervalTimer();
  const s = appState.story;
  switchScreen('ending');

  // Save to persistent storage
  saveStoryToArchive(s);

  el.endingStoryTitle.textContent = s.title || 'Completed Story';
  el.endingStoryMeta.textContent = `${s.genre.toUpperCase()} • ${s.style.toUpperCase()} • ${s.paragraphs.length} PARAGRAPHS`;

  const adaptedCount = s.paragraphs.filter((p, idx) => idx > 0 && p.triggerExpression !== 'UNCERTAIN' && p.triggerExpression !== 'NEUTRAL').length;
  el.evolutionAdaptationCount.textContent = `${adaptedCount} Adaptive Narrative Shifts`;

  el.evolutionTimelineList.innerHTML = s.paragraphs.map(p => `
    <div class="rounded-xl border border-ivory-300/10 bg-midnight-950/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="space-y-1">
        <div class="flex items-center gap-2 text-xs font-mono">
          <span class="text-amber-350">§ ${p.index}</span>
          <span class="text-ivory-400">•</span>
          <span class="text-ivory-200">${escapeHtml(p.mood)}</span>
          <span class="px-2 py-0.5 rounded bg-midnight-800 text-violet-450 text-[10px]">
            Cue: ${escapeHtml(p.triggerExpression)}
          </span>
        </div>
        <p class="text-xs text-ivory-300 font-light">${escapeHtml(p.plotDevelopment)}</p>
      </div>
      <div class="text-right font-mono text-[11px] text-ivory-400 shrink-0">
        Intensity: ${Math.round((p.intensity || 0.6) * 100)}%
      </div>
    </div>
  `).join('');

  el.endingFullManuscript.innerHTML = s.paragraphs.map((p, i) => `
    <p class="${i === 0 ? 'drop-cap' : ''} leading-relaxed">${escapeHtml(p.text)}</p>
  `).join('');
}

// ---------------------------------------------------------------------------
// ARCHIVE DRAWER
// ---------------------------------------------------------------------------
function openArchiveDrawer() {
  renderArchivedStoriesList();
  el.archiveDrawer.classList.remove('drawer-closed');
}

function closeArchiveDrawer() {
  el.archiveDrawer.classList.add('drawer-closed');
}

function renderArchivedStoriesList() {
  const list = getArchivedStories();
  if (list.length === 0) {
    el.archivedStoriesList.innerHTML = '';
    el.archiveEmptyState.classList.remove('hidden');
    return;
  }

  el.archiveEmptyState.classList.add('hidden');
  el.archivedStoriesList.innerHTML = list.map(story => {
    const dateFormatted = new Date(story.savedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <div class="p-4 rounded-xl border border-ivory-300/10 bg-midnight-900/60 hover:border-amber-450/40 transition-colors space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h4 class="font-display text-lg text-ivory-50 leading-tight">${escapeHtml(story.title)}</h4>
            <div class="flex items-center gap-2 text-[11px] text-ivory-400 font-mono mt-1">
              <span>${dateFormatted}</span>
              <span>•</span>
              <span class="text-amber-350">${escapeHtml(story.genre)}</span>
              <span>•</span>
              <span>${story.paragraphCount} §</span>
            </div>
          </div>
          <button data-delete-id="${story.id}" class="delete-story-btn text-ivory-400 hover:text-red-400 text-xs p-1" title="Delete from archive">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <p class="text-xs text-ivory-300/80 font-light line-clamp-2">${escapeHtml(story.paragraphs[0]?.text || story.premise)}</p>
        <div class="flex items-center gap-2 pt-1 border-t border-ivory-300/10">
          <button data-view-id="${story.id}" class="view-archived-btn text-xs text-amber-350 hover:underline">
            View Manuscript
          </button>
          <span class="text-ivory-400/40">•</span>
          <button data-export-txt-id="${story.id}" class="export-archived-txt-btn text-xs text-ivory-400 hover:text-ivory-200">
            Export .TXT
          </button>
          <span class="text-ivory-400/40">•</span>
          <button data-export-md-id="${story.id}" class="export-archived-md-btn text-xs text-ivory-400 hover:text-ivory-200">
            Export .MD
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach drawer action listeners
  el.archivedStoriesList.querySelectorAll('.view-archived-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-view-id');
      const story = getArchivedStory(id);
      if (story) {
        appState.story = { ...story, currentParagraphIndex: story.paragraphs.length };
        closeArchiveDrawer();
        showEndingScreen();
      }
    });
  });

  el.archivedStoriesList.querySelectorAll('.delete-story-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-id');
      deleteArchivedStory(id);
      renderArchivedStoriesList();
    });
  });

  el.archivedStoriesList.querySelectorAll('.export-archived-txt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-export-txt-id');
      const story = getArchivedStory(id);
      if (story) exportStoryAsText(story);
    });
  });

  el.archivedStoriesList.querySelectorAll('.export-archived-md-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-export-md-id');
      const story = getArchivedStory(id);
      if (story) exportStoryAsMarkdown(story);
    });
  });
}

function highlightManualMoodButtons(selectedMood) {
  document.querySelectorAll('.manual-mood-btn').forEach(btn => {
    const isMatch = btn.getAttribute('data-mood') === selectedMood;
    btn.className = isMatch
      ? 'manual-mood-btn px-2 py-1.5 rounded-lg border border-amber-450 bg-amber-450/20 text-[11px] text-amber-350 font-semibold transition-colors'
      : 'manual-mood-btn px-2 py-1.5 rounded-lg border border-ivory-300/15 bg-midnight-950 hover:border-amber-450/50 text-[11px] text-ivory-200 transition-colors';
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// EVENT LISTENERS INITIALIZATION
// ---------------------------------------------------------------------------
function attachEventListeners() {
  // Navigation
  el.navHomeBtn.addEventListener('click', () => {
    stopReadingIntervalTimer();
    switchScreen('landing');
  });

  // Camera Quick Toggle in Header
  el.quickCameraToggleBtn.addEventListener('click', async () => {
    if (visionProcessor.enabled) {
      visionProcessor.stopCamera();
      el.cameraOffOverlay.classList.remove('hidden');
      el.liveVideoBadge.classList.add('hidden');
    } else {
      await visionProcessor.startCamera(el.webcamVideo, el.landmarkOverlayCanvas, () => {
        updateEmotionMonitorUI();
      });
      el.cameraOffOverlay.classList.add('hidden');
      el.liveVideoBadge.classList.remove('hidden');
    }
    updateCameraBadges();
    updateEmotionMonitorUI();
  });

  // Ambient Audio Controls
  el.audioToggleBtn.addEventListener('click', async () => {
    const isPlaying = await soundEngine.toggle();
    appState.soundscapeEnabled = isPlaying;
    el.audioStatusLabel.textContent = isPlaying ? 'SOUND: ON' : 'SOUND: OFF';
    el.audioStatusIcon.className = `w-2 h-2 rounded-full ${isPlaying ? 'bg-amber-450 animate-pulse' : 'bg-ivory-400'}`;
  });

  el.audioVolumeSlider.addEventListener('input', () => {
    const vol = parseFloat(el.audioVolumeSlider.value);
    soundEngine.setVolume(vol);
  });

  // Archive Drawer
  el.openArchiveDrawerBtn.addEventListener('click', openArchiveDrawer);
  el.closeArchiveDrawerBtn.addEventListener('click', closeArchiveDrawer);
  el.archiveDrawerBackdrop.addEventListener('click', closeArchiveDrawer);

  // Privacy Modal
  el.openPrivacyModalBtn.addEventListener('click', () => el.privacyInfoModal.classList.remove('hidden'));
  el.closePrivacyModalBtn.addEventListener('click', () => el.privacyInfoModal.classList.add('hidden'));
  el.ackPrivacyModalBtn.addEventListener('click', () => el.privacyInfoModal.classList.add('hidden'));

  // Engine Modal
  el.openEngineModalBtn.addEventListener('click', () => el.engineConfigModal.classList.remove('hidden'));
  el.closeEngineModalBtn.addEventListener('click', () => el.engineConfigModal.classList.add('hidden'));
  el.cfgConfidenceThreshold.addEventListener('input', () => {
    el.confThresholdVal.textContent = `${el.cfgConfidenceThreshold.value}%`;
  });
  el.saveEngineConfigBtn.addEventListener('click', () => {
    appState.engineConfig.model = el.cfgGeminiModel.value.trim() || 'gemini-2.5-flash';
    appState.engineConfig.connectionMode = el.cfgConnectionMode.value;
    appState.engineConfig.localApiKey = el.cfgLocalApiKey.value.trim();
    appState.engineConfig.confidenceThreshold = parseInt(el.cfgConfidenceThreshold.value, 10) / 100;
    el.engineConfigSavedToast.classList.remove('opacity-0');
    updateEmotionMonitorUI();
    setTimeout(() => {
      el.engineConfigSavedToast.classList.add('opacity-0');
      el.engineConfigModal.classList.add('hidden');
    }, 700);
  });

  // Landing Screen
  el.landingStartBtn.addEventListener('click', () => {
    el.cfgEnableCameraCheckbox.checked = true;
    switchScreen('config');
  });
  el.landingNoCameraBtn.addEventListener('click', () => {
    el.cfgEnableCameraCheckbox.checked = false;
    visionProcessor.stopCamera();
    switchScreen('config');
  });

  // Config Screen
  el.backToLandingBtn.addEventListener('click', () => switchScreen('landing'));
  el.inspirePremiseBtn.addEventListener('click', () => {
    appState.premiseCycleIndex = (appState.premiseCycleIndex + 1) % CURATED_PREMISES.length;
    populateSamplePremise(appState.premiseCycleIndex);
  });

  el.cfgGenre.addEventListener('change', () => {
    const isCustom = el.cfgGenre.value === 'Custom';
    el.cfgCustomGenre.classList.toggle('hidden', !isCustom);
  });

  document.querySelectorAll('.intensity-card').forEach(card => {
    card.addEventListener('click', () => {
      const level = card.getAttribute('data-intensity');
      appState.story.adaptationIntensity = level;
      document.querySelectorAll('.intensity-card').forEach(c => {
        const active = c.getAttribute('data-intensity') === level;
        c.className = active
          ? 'intensity-card text-left p-4 rounded-xl border border-amber-450 bg-amber-450/10 transition-all'
          : 'intensity-card text-left p-4 rounded-xl border border-ivory-300/15 bg-midnight-900/60 hover:border-ivory-300/30 transition-all';
      });
    });
  });

  el.quickStartRandomBtn.addEventListener('click', () => {
    const randomIndex = Math.floor(Math.random() * CURATED_PREMISES.length);
    populateSamplePremise(randomIndex);
    if (el.cfgEnableCameraCheckbox.checked && !visionProcessor.enabled) {
      el.cameraConsentModal.classList.remove('hidden');
    } else {
      launchStorySession(el.cfgEnableCameraCheckbox.checked);
    }
  });

  el.beginReadingBtn.addEventListener('click', () => {
    if (el.cfgEnableCameraCheckbox.checked && !visionProcessor.enabled) {
      el.cameraConsentModal.classList.remove('hidden');
    } else {
      launchStorySession(el.cfgEnableCameraCheckbox.checked);
    }
  });

  // Consent Modal
  el.closeCameraConsentBtn.addEventListener('click', () => el.cameraConsentModal.classList.add('hidden'));
  el.consentContinueWithoutCameraBtn.addEventListener('click', () => {
    el.cfgEnableCameraCheckbox.checked = false;
    launchStorySession(false);
  });
  el.consentGrantCameraBtn.addEventListener('click', () => {
    launchStorySession(true);
  });

  // Reading Screen Font Size
  const fontClasses = ['reading-size-sm', 'reading-size-md', 'reading-size-lg', 'reading-size-xl'];
  const applyReadingFontSize = () => {
    fontClasses.forEach(cls => {
      el.storyParagraphsContainer.classList.remove(cls);
      el.endingFullManuscript.classList.remove(cls);
    });
    const chosen = fontClasses[appState.fontSizeIndex];
    el.storyParagraphsContainer.classList.add(chosen);
    el.endingFullManuscript.classList.add(chosen);
  };
  el.fontDecreaseBtn.addEventListener('click', () => {
    appState.fontSizeIndex = Math.max(0, appState.fontSizeIndex - 1);
    applyReadingFontSize();
  });
  el.fontIncreaseBtn.addEventListener('click', () => {
    appState.fontSizeIndex = Math.min(fontClasses.length - 1, appState.fontSizeIndex + 1);
    applyReadingFontSize();
  });

  el.readingSpeedSelect.addEventListener('change', () => {
    appState.readingPace = el.readingSpeedSelect.value;
    const nextTarget = appState.readingPace === 'fast' ? 14 : (appState.readingPace === 'contemplative' ? 32 : 22);
    appState.readingLoop.targetSeconds = nextTarget;
    updateReadingProgressBarUI();
  });

  el.toggleInspectorBtn.addEventListener('click', () => {
    el.narrativeInspectorPanel.classList.toggle('hidden');
  });
  el.closeInspectorBtn.addEventListener('click', () => {
    el.narrativeInspectorPanel.classList.add('hidden');
  });

  el.resetStoryBtn.addEventListener('click', () => {
    stopReadingIntervalTimer();
    switchScreen('config');
  });

  el.pauseAdaptationBtn.addEventListener('click', () => {
    appState.readingLoop.isPaused = !appState.readingLoop.isPaused;
    el.pauseBtnIcon.textContent = appState.readingLoop.isPaused ? '▶' : '⏸';
    el.pauseBtnText.textContent = appState.readingLoop.isPaused ? 'Resume Auto-Advance' : 'Pause Auto-Advance';
    updateReadingProgressBarUI();
  });

  el.manualContinueBtn.addEventListener('click', () => {
    if (appState.readingLoop.isGenerating) return;
    if (appState.story.currentParagraphIndex >= appState.story.desiredLength) {
      showEndingScreen();
      return;
    }
    stopReadingIntervalTimer();
    const isNextFinal = (appState.story.currentParagraphIndex + 1) >= appState.story.desiredLength;
    requestNextStoryParagraph(isNextFinal);
  });

  el.concludeStoryNowBtn.addEventListener('click', () => {
    if (appState.readingLoop.isGenerating) return;
    stopReadingIntervalTimer();
    appState.story.desiredLength = appState.story.currentParagraphIndex + 1;
    requestNextStoryParagraph(true);
  });

  el.retryGenerationBtn.addEventListener('click', () => {
    const isNextFinal = (appState.story.currentParagraphIndex + 1) >= appState.story.desiredLength;
    requestNextStoryParagraph(isNextFinal);
  });

  // Sidebar Camera Controls
  el.enableCameraFromMonitorBtn.addEventListener('click', async () => {
    await visionProcessor.startCamera(el.webcamVideo, el.landmarkOverlayCanvas, () => {
      updateEmotionMonitorUI();
    });
    el.cameraOffOverlay.classList.add('hidden');
    el.liveVideoBadge.classList.remove('hidden');
    updateCameraBadges();
  });

  el.sidebarCameraToggleBtn.addEventListener('click', async () => {
    if (visionProcessor.enabled) {
      visionProcessor.stopCamera();
      el.cameraOffOverlay.classList.remove('hidden');
      el.liveVideoBadge.classList.add('hidden');
    } else {
      await visionProcessor.startCamera(el.webcamVideo, el.landmarkOverlayCanvas, () => {
        updateEmotionMonitorUI();
      });
      el.cameraOffOverlay.classList.add('hidden');
      el.liveVideoBadge.classList.remove('hidden');
    }
    updateCameraBadges();
  });

  el.sidebarAdaptationToggleBtn.addEventListener('click', () => {
    appState.story.adaptationEnabled = !appState.story.adaptationEnabled;
    el.sidebarAdaptationToggleBtn.textContent = appState.story.adaptationEnabled
      ? 'Adaptation: ON'
      : 'Adaptation: OFF';
    updateEmotionMonitorUI();
  });

  // Manual Mood Selection
  document.querySelectorAll('.manual-mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.getAttribute('data-mood');
      if (visionProcessor.manualMoodOverride === mood) {
        visionProcessor.manualMoodOverride = null;
        el.manualOverrideStatus.textContent = 'Cleared manual override';
        highlightManualMoodButtons(null);
      } else {
        visionProcessor.manualMoodOverride = mood;
        el.manualOverrideStatus.textContent = `Locked: ${mood} for next paragraph`;
        highlightManualMoodButtons(mood);
        // Play mood sound immediately
        if (appState.soundscapeEnabled) {
          soundEngine.transitionMood(mood);
        }
      }
      updateEmotionMonitorUI();
    });
  });

  // Ending Screen Actions
  el.exportStoryTxtBtn.addEventListener('click', () => exportStoryAsText(appState.story));
  el.exportStoryMdBtn.addEventListener('click', () => exportStoryAsMarkdown(appState.story));

  el.continueFromEndingBtn.addEventListener('click', () => {
    appState.story.desiredLength += 3;
    switchScreen('reading');
    requestNextStoryParagraph(false);
  });

  el.toggleEvolutionSummaryBtn.addEventListener('click', () => {
    const isHidden = el.evolutionSummarySection.classList.toggle('hidden');
    el.toggleEvolutionSummaryBtn.textContent = isHidden
      ? 'Show Narrative Evolution Map'
      : 'Hide Narrative Evolution Map';
  });

  el.saveToArchiveBtn.addEventListener('click', () => {
    saveStoryToArchive(appState.story);
    el.archiveSavedToast.classList.remove('opacity-0');
    setTimeout(() => {
      el.archiveSavedToast.classList.add('opacity-0');
    }, 1500);
  });

  el.restartNewStoryBtn.addEventListener('click', () => switchScreen('config'));

  // Clean teardown on tab close
  window.addEventListener('beforeunload', () => {
    visionProcessor.stopCamera();
    soundEngine.stop();
  });
}

// ---------------------------------------------------------------------------
// BOOTSTRAP APPLICATION
// ---------------------------------------------------------------------------
function bootstrap() {
  initExpressionBars();
  populateSamplePremise(0);
  attachEventListeners();
  updateCameraBadges();
  updateEmotionMonitorUI();

  // Attach audio visualizer canvas
  if (el.audioWaveCanvas) {
    soundEngine.setVisualizerCanvas(el.audioWaveCanvas);
  }
}

bootstrap();
