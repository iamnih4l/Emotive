# EMOTIVE — Public Launch Essay & Announcement Kit

Use these tailored templates to announce the EMOTIVE preprint and live project across major engineering and research platforms.

---

## 1. Hacker News ("Show HN") Template

**Title:** Show HN: EMOTIVE – An in-browser closed-loop AI story that feels its reader

**URL:** https://emotive-omega.vercel.app/ (or preprint link)

**Body:**

Hi HN,

I built **EMOTIVE**, an open-source, in-browser adaptive storytelling system where the narrative and soundscape adapt in real time to your facial micro-expressions as you read.

Most LLM storytelling is unidirectional: the model writes, and the human passively consumes. When interactive fiction is attempted, it usually takes the form of disruptive "Choose Your Own Adventure" button prompts that break literary flow.

In live human storytelling, a speaker watches the listener's eyes, furrowed brow, or involuntary smile, and modulates pacing, tone, and suspense accordingly. EMOTIVE brings that closed loop to consumer browsers:

**How it works under the hood:**
1. **100% Client-Side Vision (Zero Biometrics Uploaded):** Uses MediaPipe FaceLandmarker via WebAssembly GPU acceleration to extract 52 FACS blendshapes locally at ~10 Hz. No camera frames, images, or face embeddings ever leave your device.
2. **Noise Rejection (EMA + Hysteresis):** Raw computer vision is noisy (blinks, gaze shifts, lighting). We apply an Exponential Moving Average filter ($\alpha = 0.22$) combined with a state hysteresis margin ($\delta = 0.09$) so transient twitches don't cause chaotic narrative thrashing.
3. **Psychological Counterpoint vs. Naive Mirroring:** Instead of naive emotional reflection (e.g. user smiles $\to$ tell a joke), EMOTIVE employs artistic counterpoint—if you're smiling, it might introduce a poignant vulnerability or bittersweet revelation; if you look tense, it heightens the stakes and deepens character agency.
4. **Procedural Web Audio Engine:** A 4-voice ambient pad synthesized completely on the fly using the native Web Audio API (zero audio samples streamed). Chords and low-pass filter cutoffs dynamically shift between evocative presets (e.g. lush Cmaj9 for warmth, Am7 for melancholy, and diminished sub-bass for suspense).
5. **Vonnegut Dramatic Arc Visualizer:** An interactive canvas tracks the cumulative sentiment trajectory of the story in real time.

Live demo: https://emotive-omega.vercel.app/  
GitHub: https://github.com/iamnih4l/Emotive  
Paper / Preprint: Included in the repository under `/paper`.

I'd love your feedback on the latency, the narrative pacing, and whether the emotional counterpoint felt subtle or noticeable!

---

## 2. Twitter / X Announcement Thread

**Tweet 1 (Hook + Video/Demo):**
Storytelling has always been a conversation—until AI made it a one-way broadcast.

Today I'm open-sourcing **EMOTIVE**: an in-browser closed-loop storytelling engine where the story and soundtrack adapt in real time to your involuntary facial expressions as you read.

100% private. 0 video leaves your device. 🧵👇
[Include video / screenshot / link: https://emotive-omega.vercel.app/]

**Tweet 2 (Privacy Architecture):**
Most affective systems raise severe privacy concerns.

EMOTIVE runs entirely inside a client-side WebAssembly sandbox. It computes 52 FACS blendshapes using MediaPipe directly on your GPU.

No webcam frames, pixel data, or biometric templates are ever transmitted to any server.

**Tweet 3 (Mathematical Signal Filtering):**
Raw vision classification is inherently jittery—blinks and micro-saccades will destroy narrative immersion.

We implemented an Exponential Moving Average (EMA, $\alpha=0.22$) paired with a 9% hysteresis threshold to eliminate noise while maintaining <450ms reaction times.

**Tweet 4 (Psychological Counterpoint):**
The biggest pitfall in affective computing is naive mirroring (e.g. if the user smiles, write happy text).

High literature relies on **counterpoint**:
- Sensed joy $\to$ bittersweet revelation
- Sensed sadness $\to$ unexpected relic of solace
- Sensed suspense $\to$ elevated stakes and moral choice

**Tweet 5 (Procedural Audio):**
Zero audio assets are streamed over the network.

A custom 4-voice synthesizer uses the Web Audio API to cross-fade ambient pad voicings (Cmaj9, Am7, Dsus2, diminished drones) with resonant biquad filtering that harmonizes with your emotional state.

**Tweet 6 (Paper + Links):**
We've published the full research preprint paper and study protocol targeting ICIDS / ACM C&C in the repository!

Try it live: https://emotive-omega.vercel.app/
GitHub: https://github.com/iamnih4l/Emotive

Feedback, PRs, and thoughts welcome! 🚀

---

## 3. Substack / Medium Technical Blog Header

**Title:** Beyond the Prompt: Building a Closed-Loop Affective Storytelling System in the Browser  
**Subtitle:** How in-browser WebAssembly computer vision, mathematical signal smoothing, and procedural Web Audio turn passive reading into a bi-directional performance.

*(Body maps directly to Section 1–8 of `EMOTIVE_RESEARCH_PREPRINT.md`)*
