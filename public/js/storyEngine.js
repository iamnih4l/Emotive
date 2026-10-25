/**
 * EMOTIVE — Adaptive Narrative Engine & Story Dispatcher
 * Manages premise generation, prompt structuring, and 3-tier execution:
 * 1. Server Proxy (/api/generate-paragraph)
 * 2. Client Direct Key (Google AI Studio)
 * 3. Built-in Stateful Offline Adaptive Literary Engine
 */

export const CURATED_PREMISES = [
  {
    title: "The Lighthouse at Eventide",
    premise: "Every Sunday, Mira returned to the abandoned lighthouse where her father had taught her to read the stars.",
    genre: "Mystery",
    style: "Literary",
    mood: "Wistful & Mysterious",
    protagonist: "Mira, an archivist of coastal maps searching for the meaning behind her father's disappearance",
    boundaries: "Atmospheric coastal mystery; focus on memory, family letters, and discovery"
  },
  {
    title: "Chronicle of the Glass Botanist",
    premise: "In the subterranean vaults beneath Oakhaven, Julian tended the last orchard of bioluminescent orchids that bloomed only when someone spoke a forgotten truth.",
    genre: "Fantasy",
    style: "Poetic",
    mood: "Luminous Wonder",
    protagonist: "Julian, a quiet apprentice botanist who guards the city's living memory",
    boundaries: "Lyrical wonder and gentle intrigue"
  },
  {
    title: "The Last Train from Station Nine",
    premise: "The rain had stopped at midnight, but Clara remained beneath the station clock holding a brass key to a locker that hadn't existed for thirty years.",
    genre: "Psychological Thriller",
    style: "Cinematic",
    mood: "Suspenseful & Unsettled",
    protagonist: "Clara, a former sound restorer who hears a familiar voice in an old station recording",
    boundaries: "Psychological tension without graphic violence"
  },
  {
    title: "Orbit of Quiet Things",
    premise: "Six months into her solo listening post above the methane clouds of Titan, Elena received an acoustic transmission playing a lullaby from her childhood kitchen.",
    genre: "Science Fiction",
    style: "Minimalist",
    mood: "Melancholic Calm",
    protagonist: "Dr. Elena Vance, deep-space acoustic telemetry specialist",
    boundaries: "Introspective speculative fiction focused on human connection"
  }
];

export const ADAPTATION_RULES = {
  HAPPY: {
    label: 'Apparent Happiness / Positive Cue',
    subtle: 'Infuse the prose with a delicate bittersweet undertone—a fleeting shadow of impermanence or quiet nostalgia beneath the warmth.',
    balanced: 'Introduce emotional vulnerability, a bittersweet revelation, or an unexpected cost to a recent comfort so the moment gains poignant depth.',
    intense: 'Pivot the emotional momentum with a poignant loss, an unexpected departure, or a fragile truth that complicates the protagonist’s joy.'
  },
  SAD: {
    label: 'Apparent Sadness / Melancholy Cue',
    subtle: 'Soften the atmosphere with a gentle sensory detail of warmth, shelter, or quiet resilience.',
    balanced: 'Introduce a gesture of warmth, a forgotten relic of hope, an unexpected ally, or a meaningful discovery that offers solace.',
    intense: 'Reveal a deeply moving connection, reconciliation, or a transformative message of hope that reframes the protagonist’s sorrow.'
  },
  SURPRISED: {
    label: 'Apparent Surprise / Alertness Cue',
    subtle: 'Sharpen the sensory focus and introduce an unexpected detail in the environment that rewards close attention.',
    balanced: 'Introduce a narrative twist, uncover a concealed motive, or shift the protagonist’s understanding of previous events.',
    intense: 'Unveil a major hidden truth or sudden reversal that changes the stakes of the central mystery while honoring established clues.'
  },
  FEAR: {
    label: 'Apparent Fear / Apprehension Cue',
    subtle: 'Heighten atmospheric hush, shadows, and anticipation without crossing into distressing content.',
    balanced: 'Increase suspense and uncertainty around an approaching threshold while giving the protagonist a clear choice to make.',
    intense: 'Bring the looming tension to an immediate, high-stakes threshold where the protagonist must confront the unknown directly.'
  },
  ANGRY: {
    label: 'Apparent Anger / Frustration Cue',
    subtle: 'Quicken the rhythm of the prose with decisive verbs and heightened friction.',
    balanced: 'Introduce direct confrontation, decisive agency, or a moment of cathartic defiance where the protagonist refuses to remain passive.',
    intense: 'Ignite a pivotal confrontation or bold act of agency that shatters an obstacle and reshapes the power dynamic.'
  },
  NEUTRAL: {
    label: 'Neutral / Contemplative Cue',
    subtle: 'Continue the current narrative trajectory smoothly with rich sensory grounding.',
    balanced: 'Advance the plot naturally, deepen character motivations, and steadily build narrative momentum.',
    intense: 'Deepen the central mystery and advance the primary plot thread toward its next major milestone.'
  },
  UNCERTAIN: {
    label: 'Uncertain / Low Confidence Signal',
    subtle: 'Avoid abrupt emotional adjustments; continue the established story arc naturally.',
    balanced: 'Preserve the current emotional trajectory and develop the scene organically.',
    intense: 'Maintain narrative continuity and advance the established plot thread without forcing an artificial mood swing.'
  }
};

export function buildGeminiSystemInstruction() {
  return `You are EMOTIVE, a master literary novelist and adaptive narrative engine.
You write stories one single paragraph at a time, responding subtly and coherently to the reader's apparent facial-expression signal while preserving strict narrative continuity, character motivations, established facts, and unresolved plot threads.

CRITICAL STORYTELLING RULES:
1. Generate EXACTLY ONE rich, evocative paragraph of story prose (roughly 85 to 140 words).
2. Continue directly from the previous paragraph. Never repeat openings or stitch unrelated scenes together.
3. NEVER mention cameras, facial expressions, emotion detection, AI, or the reader inside the story prose.
4. Interpret the reader's expression signal as an artistic counterpoint or deepening device:
   - HAPPY signal -> Introduce bittersweet nuance, emotional vulnerability, an unexpected sacrifice, or a poignant complication.
   - SAD signal -> Introduce warmth, a forgotten trace of hope, reconciliation, or a comforting discovery.
   - SURPRISED signal -> Introduce a narrative twist, uncover a hidden truth, or reframe an earlier clue.
   - FEAR signal -> Heighten atmospheric suspense and uncertainty appropriate to the genre without gratuitous distress.
   - ANGRY signal -> Introduce confrontation, decisive agency, or cathartic defiance.
   - NEUTRAL or UNCERTAIN -> Continue the established narrative trajectory organically.
5. Respond ONLY with a valid JSON object matching this exact schema:
{
  "story_title": "Optional updated or generated title if not yet set",
  "paragraph": "The single story paragraph prose...",
  "narrative_mood": "2-3 word mood description (e.g., Bittersweet & Luminous)",
  "emotional_intensity": 0.68,
  "plot_development": "Brief 1-sentence summary of what advanced in this paragraph",
  "continuity_notes": "Updated note on character state and unresolved plot threads"
}`;
}

export function buildParagraphRequestPayload(storyState, signal, isFinalParagraph) {
  const s = storyState;
  const previousParagraphsText = s.paragraphs.map((p, i) => `[Paragraph ${i + 1}]: ${p.text}`).join('\n\n');
  const lastParagraph = s.paragraphs.length > 0 ? s.paragraphs[s.paragraphs.length - 1].text : '';

  return {
    story_id: s.storyId,
    story_title: s.title || 'Untitled Story',
    story_premise: s.premise,
    genre: s.genre,
    writing_style: s.style,
    intended_audience_and_rating: s.audience,
    main_characters_and_motivations: s.protagonist || 'Compelling protagonist grounded in the premise.',
    world_building_and_boundaries: s.boundaries || 'Atmospheric realism appropriate to the genre.',
    current_story_position: `Generating Paragraph ${s.currentParagraphIndex + 1} of ${s.desiredLength}${isFinalParagraph ? ' (FINAL CONCLUDING PARAGRAPH)' : ''}`,
    compressed_narrative_summary: s.narrativeSummary || 'Story is beginning.',
    previous_paragraphs: previousParagraphsText || 'None yet (Generate the opening paragraph).',
    most_recent_paragraph: lastParagraph || 'None yet.',
    unresolved_plot_threads: s.plotThreads.length > 0 ? s.plotThreads : ['Central mystery introduced in premise'],
    current_narrative_direction: s.currentNarrativeDirection,
    latest_aggregated_expression_signal: s.currentParagraphIndex === 0
      ? { status: 'Opening paragraph — establish premise and starting mood' }
      : {
          apparent_expression: signal.apparentExpression,
          confidence: signal.confidence,
          recent_trend: signal.trend,
          sufficient_evidence: signal.sufficientEvidence,
          source: signal.source
        },
    reader_adaptation_intensity: s.adaptationIntensity,
    instructions_for_next_narrative_development: isFinalParagraph
      ? `Bring the story to a resonant, emotionally satisfying literary conclusion that resolves the central premise while honoring the directive: ${signal.narrativeDirective}`
      : (s.currentParagraphIndex === 0
          ? `Write the opening paragraph establishing the premise ("${s.premise}"), protagonist, and starting mood (${s.startingMood}).`
          : signal.narrativeDirective)
  };
}

/**
 * Built-in Stateful Offline Adaptive Narrative Engine
 */
export function synthesizeAdaptiveParagraphLocally(payload, signal, isFinalParagraph, storyState) {
  const s = storyState;
  const idx = s.currentParagraphIndex;
  const expr = idx === 0 ? 'OPENING' : signal.apparentExpression;

  let protagonistName = 'Mira';
  const nameMatch = (s.protagonist || s.premise || '').match(/\b([A-Z][a-z]{2,11})\b/);
  if (nameMatch && !['Every', 'The', 'In', 'Six', 'When', 'After', 'Beneath'].includes(nameMatch[1])) {
    protagonistName = nameMatch[1];
  }

  const isLighthouse = s.premise.toLowerCase().includes('lighthouse') || s.premise.toLowerCase().includes('stars');

  // Opening paragraph
  if (idx === 0) {
    const text = isLighthouse
      ? `${s.premise.trim()} Salt wind threaded through the broken lantern gallery high above the tide, carrying the faint metallic chime of the brass astrolabe he had left bolted to the parapet. For three autumns ${protagonistName} had climbed the spiral stone steps alone, convinced the coastguard ledger had recorded everything that remained of his final night—until the floorboards beneath the prism table shifted under her boot heel.`
      : `${s.premise.trim()} In the quiet hush that followed, ${protagonistName} paused at the threshold, noticing how the amber light caught the edges of an unsealed cedar box resting where no one had stood for years. Every detail of the room seemed arranged not by accident, but as part of a patient conversation waiting to be resumed.`;

    return {
      story_title: s.title || (isLighthouse ? 'The Lighthouse at Eventide' : 'The Architecture of Echoes'),
      paragraph: text,
      narrative_mood: s.startingMood,
      emotional_intensity: 0.54,
      plot_development: `${protagonistName} discovers a concealed physical trace that reopens the central mystery.`,
      continuity_notes: `${protagonistName} is at the threshold of discovery; the hidden compartment has just been revealed.`
    };
  }

  // Concluding paragraph
  if (isFinalParagraph) {
    const endings = {
      HAPPY: `Dawn spilled silver across the horizon as ${protagonistName} folded the fragile chart back into her coat. The truth was hers at last, luminous and undeniable, yet it carried a quiet ache: to follow the coordinates meant leaving behind the only sanctuary where his memory still felt near. Stepping out into the rising wind, she locked the heavy door behind her for the final time, trading the comfort of ghosts for the uncharted water ahead.`,
      SAD: `Beneath the final fold of parchment, ${protagonistName} uncovered a postscript written in steady, unhurried ink: "Do not grieve the years we stood apart; every tide you watched from this tower, I was watching the same stars from the other side of the bay." The cold weight in her chest loosened into a quiet, enduring warmth. As the first morning light touched the glass, she knew she was no longer searching for someone lost—she was simply walking toward someone waiting.`,
      SURPRISED: `When ${protagonistName} held the glass lens up to the rising sun, the engraved calibrations aligned with the coastal village across the strait—revealing that the signals had never been recorded from the past at all, but transmitted less than an hour ago. The mystery had not ended; it had merely shed its disguise, opening onto a living horizon she was finally ready to cross.`,
      FEAR: `The shadows along the gallery receded as the morning beacon caught the prism, revealing that the footsteps on the stair belonged not to a stranger, but to the old harbor keeper carrying the second half of the logbook. Breathing out the tension she had held all night, ${protagonistName} accepted the leather-bound volume and stepped out into the clear, steady light of day.`,
      ANGRY: `Refusing to let silence claim another year, ${protagonistName} engaged the ancient brass gears of the lantern assembly with both hands until the shuttered lens swung open to the sea. The beam cut cleanly through the coastal fog—an unmistakable declaration that the vigil was over, and that she would author what came next on her own terms.`,
      NEUTRAL: `As the tide turned and the first pale light steadied the horizon, ${protagonistName} gathered the letters, the brass key, and the annotated chart into her satchel. The questions that had drawn her here no longer felt like wounds; they had become a compass, pointing steadily toward the life waiting beyond the cliffs.`
    };

    return {
      story_title: s.title,
      paragraph: endings[expr] || endings.NEUTRAL,
      narrative_mood: expr === 'HAPPY' ? 'Bittersweet Resolution' : (expr === 'SAD' ? 'Luminous Solace' : 'Quiet Catharsis'),
      emotional_intensity: 0.78,
      plot_development: `${protagonistName} resolves the central arc and steps into the future.`,
      continuity_notes: `Narrative concluded at Paragraph ${idx + 1}.`
    };
  }

  // Intermediate adaptive paragraphs
  const stageSlot = (idx - 1) % 4;
  const adaptiveLibrary = {
    HAPPY: [
      {
        text: `That moment of quiet triumph lingered only briefly before ${protagonistName} lifted the oilcloth beneath the instrument and found his familiar blue wool scarf—still smelling faintly of cedar and sea salt. Wrapped inside it lay a sealed envelope addressed in her name, yet the postmark on the corner bore tomorrow's date, and the farewell line visible through the thin paper spoke of a departure that could never be undone.`,
        mood: 'Bittersweet & Vulnerable',
        intensity: 0.72,
        dev: 'A joyful discovery is tempered by a poignant symbol of farewell and an impossible timestamp.',
        notes: `${protagonistName} holds the unopened letter wrapped in the blue scarf.`
      },
      {
        text: `For a heartbeat, the pieces fit together with exhilarating clarity, warming the cold stone room. Then ${protagonistName} noticed the margin annotation written in a second, shakier hand: the person who had safeguarded these records for her all these years had done so at the cost of their own freedom, and their final entry ended mid-sentence.`,
        mood: 'Poignant Melancholy',
        intensity: 0.75,
        dev: 'Reveals the quiet sacrifice made by an unseen ally.',
        notes: `The margin notes reveal a protector's sacrifice.`
      },
      {
        text: `Even as relief softened ${protagonistName}'s shoulders, the chime of the harbor bell down the cliff reminded her of what the discovery required. Keeping the truth safe meant surrendering the one keepsake that had anchored her through the longest winters.`,
        mood: 'Tender Impermanence',
        intensity: 0.68,
        dev: 'Introduces an emotional trade-off between preserving the past and moving forward.',
        notes: `${protagonistName} must choose between her keepsake and the truth.`
      },
      {
        text: `A faint, genuine warmth returned to the room as ${protagonistName} traced the familiar handwriting, until she turned the page and realized the final chapter of the journal had been deliberately torn away—leaving behind only the scent of rain and an unspoken apology.`,
        mood: 'Wistful Longing',
        intensity: 0.70,
        dev: 'A comforting memory gives way to a missing journal page.',
        notes: `The torn journal page remains to be recovered.`
      }
    ],
    SAD: [
      {
        text: `Just as the silence threatened to feel unbearable, ${protagonistName}'s fingers brushed a recessed brass latch inside the frame. It yielded with a soft click, revealing a hand-drawn map of a sheltered cove beyond the cliffs—and beneath the compass rose, in unmistakable handwriting, five steady words: "I have been waiting, ${protagonistName}."`,
        mood: 'Warmth & Renewed Hope',
        intensity: 0.66,
        dev: 'Uncovers a hidden map and a deeply reassuring message of hope.',
        notes: `${protagonistName} now possesses the cove map and the reassuring inscription.`
      },
      {
        text: `Through the tall casement window, the heavy fog parted just enough for a warm amber lantern across the water to blink twice—the old childhood signal for safe harbor. Whatever had been lost to the years, ${protagonistName} realized she was not carrying this vigil alone tonight.`,
        mood: 'Comforting Resonance',
        intensity: 0.62,
        dev: 'An answering lantern signal across the water restores hope and connection.',
        notes: `Someone across the water is answering the childhood signal.`
      },
      {
        text: `Nestled at the bottom of the drawer lay a small music cylinder that still turned smoothly when ${protagonistName} wound the key. Its clear, unhurried notes filled the chamber like a gentle hand on her shoulder, reminding her of the promise that no distance was permanent.`,
        mood: 'Solace & Grace',
        intensity: 0.60,
        dev: 'A delicate keepsake offers emotional solace and steadies the protagonist.',
        notes: `The music cylinder's melody provides a key rhythmic clue.`
      },
      {
        text: `From the courtyard below came the soft call of the night watchman offering a thermos of hot tea and a dry wool cloak. In his quiet kindness, ${protagonistName} recognized an old friend who had kept watch over this place simply so she would have somewhere warm to return to.`,
        mood: 'Reconciliation & Shelter',
        intensity: 0.58,
        dev: 'An unexpected gesture of human kindness brings warmth to the scene.',
        notes: `The watchman allies with ${protagonistName}.`
      }
    ],
    SURPRISED: [
      {
        text: `When ${protagonistName} angled the parchment toward the lantern flame, a second layer of heat-sensitive ink bloomed across the surface—inverting everything she had assumed. The coordinates were not a record of where the vessel had vanished, but a blueprint showing the tower itself had been built to conceal a passage beneath the sea wall.`,
        mood: 'Startling Revelation',
        intensity: 0.82,
        dev: 'Hidden ink reveals the setting itself conceals an underground passage.',
        notes: `The coordinates point beneath the sea wall rather than out to sea.`
      },
      {
        text: `The brass key did not fit the rusted padlock on the trunk at all; instead, when ${protagonistName} set it on the iron table, it slid magnetized toward the center of the compass dial and rotated the entire floor mosaic by thirty degrees.`,
        mood: 'Unexpected Twist',
        intensity: 0.80,
        dev: 'The key activates a concealed mechanism in the compass dial.',
        notes: `The rotated mosaic exposes a new chamber.`
      },
      {
        text: `Looking closer at the photograph tucked inside the ledger, ${protagonistName} froze: the reflection in the glass behind the subject showed her own silhouette standing in the doorway—taken only minutes before she had entered the room.`,
        mood: 'Uncanny Discovery',
        intensity: 0.85,
        dev: 'A temporal or observational twist reframes the protagonist’s understanding of events.',
        notes: `${protagonistName} realizes the observer is present right now.`
      },
      {
        text: `The voice on the wax cylinder paused, and beneath the surface static ${protagonistName} heard the unmistakable sound of the station clock chiming thirteen times—an acoustic code that pointed directly to the archive she had left unlocked at home.`,
        mood: 'Sudden Reframing',
        intensity: 0.79,
        dev: 'An acoustic clue links the mystery back to the protagonist’s own archive.',
        notes: `The thirteen chimes unlock the cipher.`
      }
    ],
    FEAR: [
      {
        text: `The draft from the stairwell abruptly stilled, and the candle flame leaned toward the closed oak door as though drawn by a slow, deliberate breath on the other side. ${protagonistName} kept her hand steady on the latch, knowing that whoever stood beyond the threshold also held the missing page.`,
        mood: 'Taut Suspense',
        intensity: 0.81,
        dev: 'Heightens atmospheric suspense as a presence approaches the threshold.',
        notes: `Tension peaks at the closed oak door.`
      },
      {
        text: `Far below, the tide surged against the foundation stones with a hollow resonance that echoed up the spiral shaft, while one by one the corridor lamps flickered and dimmed. ${protagonistName} memorized the final symbols on the chart before the shadow reached the landing.`,
        mood: 'Shadowed Uncertainty',
        intensity: 0.78,
        dev: 'Rising tide and dimming lamps create urgent narrative pressure.',
        notes: `${protagonistName} has memorized the symbols under pressure.`
      },
      {
        text: `A faint scraping sound echoed from the gallery above—measured, unhurried, and matching ${protagonistName}'s own cadence step for step. When she stopped on the thirteenth stair, the sound took one step more before falling completely silent.`,
        mood: 'Hushed Apprehension',
        intensity: 0.83,
        dev: 'Builds psychological suspense on the spiral stair.',
        notes: `An unseen figure mirrors ${protagonistName}'s ascent.`
      },
      {
        text: `The barometer on the wall dropped sharply, fog pressing thick and white against the glass panes until the coastline vanished altogether. In that isolated hush, ${protagonistName} had to decide whether to trust the cipher or seal the vault before midnight.`,
        mood: 'Atmospheric Tension',
        intensity: 0.76,
        dev: 'Encircling fog isolates the setting and forces a critical choice.',
        notes: `Midnight deadline approaches.`
      }
    ],
    ANGRY: [
      {
        text: `Tired of cryptic half-truths and locked drawers, ${protagonistName} struck the rusted iron hasp with the heavy brass counterweight until the lock sheared cleanly away. If the past had been engineered to keep her waiting in the dark, she would force it into the light herself.`,
        mood: 'Fierce Agency',
        intensity: 0.84,
        dev: `${protagonistName} takes decisive physical action to break through an obstacle.`,
        notes: `The locked chest is forced open through sheer resolve.`
      },
      {
        text: `When the voice from the landing warned her to turn back for her own protection, ${protagonistName} did not retreat a single inch. She stepped directly into the lantern glow, holding the ledger high and demanding the truth that had been withheld from her family for a decade.`,
        mood: 'Cathartic Confrontation',
        intensity: 0.86,
        dev: `${protagonistName} confronts the gatekeeper of the secret head-on.`,
        notes: `Direct confrontation shifts the balance of power to ${protagonistName}.`
      },
      {
        text: `Instead of following the cautious instructions inked in the margin, ${protagonistName} swept the decoy charts from the desk and aligned the primary lenses according to her own calculations—proving in a single blaze of refracted light that the official record had been a lie.`,
        mood: 'Defiant Clarity',
        intensity: 0.82,
        dev: `${protagonistName} rejects false guidance and proves her own hypothesis.`,
        notes: `The refracted beam reveals the true alignment.`
      },
      {
        text: `Every instinct told ${protagonistName} that patience had been a trap. With steady, uncompromising resolve, she unbolted the storm shutters and let the salt gale sweep through the stagnant chamber, clearing away years of secrecy in a single breath.`,
        mood: 'Unyielding Resolve',
        intensity: 0.80,
        dev: `${protagonistName} shatters the room's stagnation and seizes agency.`,
        notes: `The opened storm shutters reveal the harbor below.`
      }
    ],
    NEUTRAL: [
      {
        text: `Methodically, ${protagonistName} laid the weathered pages side by side across the oak table, comparing the dates in the margin against the lunar tables pasted inside the cover. Piece by piece, a deliberate pattern emerged—each entry corresponded to a night when the coastal fog had cut the village off from the mainland.`,
        mood: 'Contemplative Intrigue',
        intensity: 0.56,
        dev: `${protagonistName} cross-references the clues and uncovers a seasonal pattern.`,
        notes: `The entries align with nights of heavy coastal fog.`
      },
      {
        text: `Moving with quiet concentration, ${protagonistName} carried the brass lantern up to the observation deck, where the instruments remained calibrated to a fixed point on the northern horizon. The air smelled of rain and old copper, holding the stillness of a room that remembered its keeper.`,
        mood: 'Atmospheric Stillness',
        intensity: 0.52,
        dev: 'Deepens the sensory atmosphere and advances to the observation deck.',
        notes: `The northern horizon calibration is established.`
      },
      {
        text: `In the margin of the third ledger, ${protagonistName} recognized a series of initials belonging to the harbor master who had signed the original inquiry. Understanding his motive required tracing how those two lives had intersected before the storm of '98.`,
        mood: 'Measured Investigation',
        intensity: 0.58,
        dev: 'Connects the ledger initials to the historical storm.',
        notes: `The harbor master's involvement is now a central thread.`
      },
      {
        text: `While the clock ticked steadily against the stone wall, ${protagonistName} adjusted the Vernier scale on the telescope until the distant sea mark came into sharp focus. There, carved into the granite piling at low water, was the matching emblem from her father's ring.`,
        mood: 'Steady Discovery',
        intensity: 0.61,
        dev: 'Telescope alignment reveals the matching emblem on the sea mark.',
        notes: `The granite piling emblem confirms the next destination.`
      }
    ]
  };

  const bucket = ['HAPPY', 'SAD', 'SURPRISED', 'FEAR', 'ANGRY'].includes(expr) ? expr : 'NEUTRAL';
  const item = adaptiveLibrary[bucket][stageSlot];

  return {
    story_title: s.title || 'The Lighthouse at Eventide',
    paragraph: item.text,
    narrative_mood: item.mood,
    emotional_intensity: item.intensity,
    plot_development: item.dev,
    continuity_notes: item.notes
  };
}

/**
 * Dispatch Paragraph Generation across Tier 1 (Proxy), Tier 2 (Direct Key), or Tier 3 (Offline Engine)
 */
export async function dispatchParagraphGeneration(storyState, signal, isFinalParagraph, engineConfig) {
  const systemInstruction = buildGeminiSystemInstruction();
  const promptPayload = buildParagraphRequestPayload(storyState, signal, isFinalParagraph);
  const mode = engineConfig.connectionMode || 'auto';
  const model = engineConfig.model || 'gemini-2.5-flash';

  let structuredResult = null;
  let engineLabel = 'Gemini Adaptive Engine';

  // Tier 1: Server Proxy
  if (mode === 'proxy' || (mode === 'auto' && window.location.protocol.startsWith('http') && !window.location.hostname.includes('googleusercontent'))) {
    try {
      const proxyUrl = window.location.origin + '/api/generate-paragraph';
      const resp = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, systemInstruction, promptPayload })
      });
      if (resp.ok) {
        structuredResult = await resp.json();
        engineLabel = `Server Proxy (${model})`;
      } else if (mode === 'proxy') {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Server proxy returned HTTP ${resp.status}`);
      }
    } catch (proxyErr) {
      if (mode === 'proxy') throw proxyErr;
    }
  }

  // Tier 2: Direct Google AI Studio Key
  if (!structuredResult && (mode === 'direct' || (mode === 'auto' && engineConfig.localApiKey))) {
    const apiKey = (engineConfig.localApiKey || '').trim();
    if (!apiKey) {
      throw new Error('No local Gemini API key configured in Engine Settings.');
    }
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(promptPayload, null, 2) }] }],
        generationConfig: {
          temperature: 0.85,
          topP: 0.92,
          responseMimeType: 'application/json'
        }
      })
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Gemini API request failed (${resp.status}): ${errText.slice(0, 140)}`);
    }
    const data = await resp.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Gemini returned an empty candidate response.');
    structuredResult = JSON.parse(rawText);
    engineLabel = `Gemini Direct (${model})`;
  }

  // Tier 3: Built-in Stateful Offline Literary Engine
  if (!structuredResult) {
    await new Promise(resolve => setTimeout(resolve, 650));
    structuredResult = synthesizeAdaptiveParagraphLocally(promptPayload, signal, isFinalParagraph, storyState);
    engineLabel = 'EMOTIVE Adaptive Engine';
  }

  if (!structuredResult || typeof structuredResult.paragraph !== 'string' || !structuredResult.paragraph.trim()) {
    throw new Error('Model response failed schema validation (missing paragraph string).');
  }

  return {
    result: structuredResult,
    engineLabel
  };
}
