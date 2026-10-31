# EMOTIVE: A Closed-Loop Affective Narrative System (CLANS) Using In-Browser Facial Blendshapes and Procedural Soundscapes

**Mohammed Nihal**  
*Independent Researcher*  
`nihalnihz95@gmail.com` — [GitHub: iamnih4l/Emotive](https://github.com/iamnih4l/Emotive) — [Live Demo](https://emotive-omega.vercel.app/)

---

## Abstract

Interactive storytelling systems powered by Large Language Models (LLMs) predominantly operate as unidirectional generation pipelines: the reader passively consumes text, or intermittently intervenes via explicit choice trees. In this paper, we present **EMOTIVE**, a zero-install, privacy-preserving **Closed-Loop Affective Narrative System (CLANS)** that continuously and unobtrusively modulates narrative trajectory, dramatic counterpoint, and multi-layered procedural soundscapes based on real-time involuntary facial micro-expressions. Operating entirely client-side within a sandboxed WebAssembly runtime, EMOTIVE tracks 52 Facial Action Coding System (FACS) blendshapes at ~10 Hz using MediaPipe FaceLandmarker without transmitting video frames, pixel data, or biometric templates to any server. To eliminate camera flicker, involuntary blinks, and micro-expressions from causing narrative instability, we implement an Exponential Moving Average (EMA) filter ($\alpha = 0.22$) paired with a state hysteresis barrier ($\delta = 0.09$). Rather than employing simplistic emotional mirroring (e.g., generating lighthearted content when a smile is detected), the narrative controller adopts **Psychological Counterpoint**, dynamically enriching prose with dramatic irony, bittersweet subversion, or suspenseful thresholds. In parallel, a procedural Web Audio synthesizer modulates 4-voice harmonic ambient pads and resonant biquad filters without external audio assets. We detail the mathematical signal pipeline, narrative prompt structuring, zero-biometrics privacy architecture, and an empirical telemetry protocol measuring reading dwell pace (WPM), transition stability, and post-reading Likert evaluations.

**Keywords**: Affective Computing, Interactive Storytelling, Large Language Models, In-Browser Computer Vision, Web Audio API, Closed-Loop Interaction, Human-Computer Interaction.

**ACM CCS Concepts**:  
- *Human-centered computing* $\to$ *Human computer interaction (HCI)*; *Interactive systems and tools*;  
- *Computing methodologies* $\to$ *Natural language generation*; *Computer vision representations*;  
- *Applied computing* $\to$ *Media arts*.

---

## 1. Introduction

Generative artificial intelligence has democratized the on-demand creation of long-form literary prose. However, modern human-AI storytelling systems remain fundamentally **unidirectional**: a model generates narrative tokens, and the human reader serves merely as an optical consumer. Where interactivity is attempted—such as in classic "Choose Your Own Adventure" branching paradigms—interaction is discrete, cognitively disruptive, and relies on explicit button presses that rupture narrative absorption and literary flow \cite{murray1997hamlet, ryan2001narrative}.

In live human storytelling, by contrast, a master orator never speaks in a vacuum. A storyteller constantly observes the audience's subtle bodily cues: a furrowed brow, an involuntary gasp, a leaning forward in suspense, or a fleeting smirk. These involuntary micro-expressions provide continuous affective feedback that guides the speaker's vocal cadence, tension, and thematic emphasis.

```mermaid
graph TD
    subgraph Traditional ["Conventional LLM Storytelling (Unidirectional)"]
        LLM0["Static Prompt / LLM"] --> Text0["Generated Prose"]
        Text0 --> Human0["Passive Human Reader"]
    end

    subgraph CLANS ["EMOTIVE Closed-Loop Affective System (Bi-Directional)"]
        StoryEngine["Adaptive LLM Story Engine"] --> Prose["Paragraph Display & Arc Visualizer"]
        Prose --> Reader["Human Reader"]
        Reader -. "Involuntary Micro-Expressions" .-> Cam["Local Webcam (WASM Sandbox)"]
        Cam --> Blendshapes["52 FACS Blendshapes"]
        Blendshapes --> SignalFilter["EMA (α=0.22) + Hysteresis (δ=0.09)"]
        SignalFilter --> Controller["Psychological Counterpoint Controller"]
        Controller --> Audio["Procedural Web Audio Engine"]
        Controller --> StoryEngine
    end
```

### 1.1 The Challenge of In-Browser Affective Feedback
Bringing closed-loop affective feedback to consumer web browsers presents three severe technical and design challenges:

1. **Biometric Privacy & Trust**: Users rightly refuse to upload raw camera streams or facial recordings to external servers. Affective tracking must execute 100% locally on edge hardware with zero server-side image leakage.
2. **Signal Noise & False Transitions**: Raw computer vision blendshape estimations fluctuate wildly due to head orientation, ambient lighting variations, and involuntary blinks. Feeding instantaneous raw classifications directly into generative prompts produces chaotic, unreadable narratives.
3. **The Fallacy of Direct Mirroring**: Intuitive affective systems tend to naively mirror user emotion (e.g., if the user looks sad, tell a cheerful joke). In artistic literature, however, direct mirroring feels patronizing and breaks suspense. Compelling narrative requires **artistic counterpoint**—deepening sorrow with bittersweet solace, or introducing tension precisely when the reader feels comfortable.

### 1.2 Core Contributions
In this work, we present **EMOTIVE**, addressing each of these challenges through the following contributions:

- **Zero-Install Client-Side Affective Pipeline**: An in-browser WebAssembly (WASM) vision pipeline utilizing GPU-accelerated MediaPipe FaceLandmarker to infer 52 FACS blendshapes and categorize six primary affective states (`HAPPY`, `SAD`, `SURPRISED`, `FEAR`, `ANGRY`, `NEUTRAL`) at ~10 Hz with zero server transmission.
- **Dual-Stage Noise Rejection**: A mathematical formulation combining Exponential Moving Average smoothing ($\alpha = 0.22$) with a dynamic hysteresis boundary ($\delta = 0.09$) and observation window accumulation, eliminating blink artifacts while preserving response latency under $450\text{ ms}$.
- **Psychological Counterpoint Narrative Architecture**: A structured prompting engine that steers LLM paragraph generation (Google Gemini 2.5 Flash) using literary counterpoint principles rather than direct mirroring, maintaining strict continuity, character agency, and multi-beat emotional trajectories.
- **Procedural Multi-Sensory Web Audio Engine**: A self-contained Web Audio synthesis system that dynamically cross-fades 4-voice harmonic ambient pads and resonant biquad filter cutoffs in real time without external audio samples or network overhead.
- **Empirical Research Telemetry & Study Protocol**: A lightweight, anonymous telemetry instrumentation system tracking word-per-minute (WPM) reading dwell times, emotional transitions, and integrated post-reading Likert scales.

---

## 2. Related Work

### 2.1 Affective Computing & Facial Action Coding
Ekman and Friesen's Facial Action Coding System (FACS) \cite{ekman1978facial} remains the foundational standard for decomposing facial motion into individual Action Units (AUs). Rosalind Picard's seminal work on Affective Computing \cite{picard2000affective} established the necessity of empathetic computational interfaces. While early systems required specialized multi-spectral cameras or intrusive physiological sensors (GSR, ECG), recent advances in deep learning landmarker architectures—specifically Google's MediaPipe \cite{lugaresi2019mediapipe}—allow real-time 3D facial mesh estimation and 52-blendshape decomposition directly inside web browsers via WebAssembly and WebGL/WebGPU.

### 2.2 Interactive Narrative & LLM Steering
Computational interactive narrative generation has evolved from rule-based planners like Façade \cite{mateas2003facade} to contemporary Large Language Model steering \cite{riedl2010narrative, brown2020language}. While LLMs excel at generating localized prose, steering them to produce sustained literary tension across sequential beats remains challenging. Works like TaleBrush \cite{chung2022talebrush} explored sketch-based visual sentiment steering. However, TaleBrush relies on manual, explicit user trajectory drawing. EMOTIVE differs fundamentally by deriving steering signals **implicitly and continuously** from autonomic reader physiology.

### 2.3 Procedural Audio in Affective Systems
Audio significantly modulates narrative transportation and emotional arousal \cite{cohen2001music}. Traditional interactive games utilize pre-recorded audio stems with horizontal re-sequencing or vertical layering. In browser environments, pre-recorded audio assets incur substantial latency, bandwidth, and licensing constraints. Procedural synthesis using the native Web Audio API \cite{smus2013web} enables continuous parameter modulation (oscillator frequency, filter resonance, envelope timing) directly synchronized with reader affect.

---

## 3. System Architecture & Signal Processing

The EMOTIVE architecture consists of five modular subsystems:

```mermaid
flowchart TD
    subgraph ClientSandbox ["100% Client-Side WebAssembly Sandbox"]
        direction TB
        V[Webcam Video Stream] --> MP[MediaPipe Tasks Vision WASM]
        MP --> Blend[52 FACS Blendshapes Vector]
        Blend --> AU[Action Unit Linear Combiner]
        AU --> EMA[Exponential Moving Average: α=0.22]
        EMA --> Hyst[Hysteresis Dynamic Threshold: δ=0.09]
        Hyst --> State[Affective Prior State Vector]
    end

    subgraph Modulation ["Adaptive Narrative & Sound Controllers"]
        State --> Sound[Procedural Web Audio Engine]
        State --> PromptEngine[Counterpoint Payload Constructor]
    end

    subgraph LLM ["Cloud Inference"]
        PromptEngine --> Gemini[Google Gemini 2.5 Flash]
        Gemini --> JSON[Structured Paragraph + Tone JSON]
    end

    subgraph UI ["Reader Interface"]
        JSON --> Parchment[Parchment Drop-Cap Typography]
        JSON --> Vonnegut[Kurt Vonnegut Arc Visualizer]
        Sound --> AcousticPad[4-Voice Ambient Soundscape]
    end

    subgraph Storage ["Anonymous Research Telemetry"]
        UI --> Telemetry[Serverless / Local SQLite Telemetry Drain]
    end
```

### 3.1 In-Browser Vision & FACS Blendshape Decomposition
EMOTIVE accesses the reader's local webcam via standard `navigator.mediaDevices.getUserMedia` constrained to a lightweight resolution ($480 \times 360$ at 30 FPS). Frames are processed by `@mediapipe/tasks-vision` loaded in a WebAssembly worker with GPU delegate acceleration. The landmarker yields 52 normalized blendshape coefficients $b_k \in [0, 1]$.

We map these raw blendshapes to six primary emotional categories via empirical Action Unit combinations:

$$\begin{aligned}
S_{\text{happy}} &= \min\left(1.0, \, 1.45 \cdot \bar{b}_{\text{smile}} + 0.55 \cdot \bar{b}_{\text{cheekSquint}}\right) \\
S_{\text{sad}} &= \min\left(1.0, \, 1.30 \cdot \bar{b}_{\text{frown}} + 0.85 \cdot b_{\text{browInnerUp}} + 0.35 \cdot \bar{b}_{\text{mouthPress}}\right) \\
S_{\text{surprised}} &= \min\left(1.0, \, 0.85 \cdot \left(1.1 \cdot \bar{b}_{\text{eyeWide}} + 0.9 \cdot \bar{b}_{\text{browOuterUp}} + 1.1 \cdot b_{\text{jawOpen}}\right)\right) \\
S_{\text{fear}} &= \min\left(1.0, \, 0.85 \cdot \bar{b}_{\text{eyeWide}} + 0.90 \cdot b_{\text{browInnerUp}} + 0.95 \cdot \bar{b}_{\text{mouthStretch}}\right) \\
S_{\text{angry}} &= \min\left(1.0, \, 1.35 \cdot \bar{b}_{\text{browDown}} + 0.70 \cdot \bar{b}_{\text{noseSneer}} + 0.65 \cdot \bar{b}_{\text{mouthPress}}\right)
\end{aligned}$$

where bilateral blendshapes (e.g., `mouthSmileLeft` and `mouthSmileRight`) are averaged: $\bar{b}_{\text{smile}} = \frac{1}{2}(b_{\text{smileL}} + b_{\text{smileR}})$.

Neutral expression probability is derived as the complementary floor:
$$S_{\text{neutral}} = \max\left(0.12, \, 1.0 - 1.15 \cdot \max_{c \in C_{\text{expressive}}} S_c\right)$$

The resulting vector is normalized over the unit simplex:
$$P_c(t) = \frac{S_c(t)}{\sum_{j \in C} S_j(t) + \epsilon}$$

### 3.2 Dual-Stage Signal Filtering: EMA & Hysteresis
Raw camera classifications exhibit high frequency jitter caused by lighting flicker, gaze saccades, and involuntary blinks ($100\text{–}400\text{ ms}$). To achieve smooth temporal integration, EMOTIVE applies a two-stage filter:

#### Stage 1: Exponential Moving Average (EMA)
For each emotional category $c \in C$ at discrete time-step $t$:
$$\bar{P}_c(t) = \alpha \cdot P_c(t) + (1 - \alpha) \cdot \bar{P}_c(t - 1)$$
Through empirical testing across varying lighting conditions, we determined $\alpha = 0.22$ as the Pareto-optimal smoothing coefficient, providing robust blink rejection while restricting response lag to $< 400\text{ ms}$.

#### Stage 2: State Hysteresis Barrier
To prevent rapid oscillating transitions between competing dominant emotions, a transition from current state $E_{\text{curr}}$ to candidate state $E_{\text{cand}}$ occurs if and only if:
$$\bar{P}_{E_{\text{cand}}}(t) > \bar{P}_{E_{\text{curr}}}(t) + \delta_{\text{hysteresis}}$$
where $\delta_{\text{hysteresis}} = 0.09$. If the margin is not satisfied, the system retains $E_{\text{curr}}$.

```mermaid
stateDiagram-v2
    [*] --> NEUTRAL
    NEUTRAL --> HAPPY: P(HAPPY) > P(NEUTRAL) + 0.09
    HAPPY --> NEUTRAL: P(NEUTRAL) > P(HAPPY) + 0.09
    NEUTRAL --> SAD: P(SAD) > P(NEUTRAL) + 0.09
    SAD --> NEUTRAL: P(NEUTRAL) > P(SAD) + 0.09
    NEUTRAL --> SURPRISED: P(SURPRISED) > P(NEUTRAL) + 0.09
    NEUTRAL --> FEAR: P(FEAR) > P(NEUTRAL) + 0.09
    NEUTRAL --> ANGRY: P(ANGRY) > P(NEUTRAL) + 0.09
```

---

## 4. Adaptive Narrative Engine & Psychological Counterpoint

### 4.1 The Counterpoint Taxonomy
Rather than naively reflecting the reader's state, EMOTIVE implements a literary **Psychological Counterpoint Engine**. High literature achieves resonance through dramatic contrast, irony, and tension modulation:

| Sensed Reader Affect | Naive Mirroring (Rejected) | Psychological Counterpoint (EMOTIVE) | Literary Function |
| :--- | :--- | :--- | :--- |
| **HAPPY** | Tell a joke / cheerful resolution | Introduce bittersweet vulnerability or an unexpected cost to recent joy | Complicates protagonist satisfaction; adds depth |
| **SAD** | Wallow in despair | Introduce an unexpected ally, a relic of hope, or quiet resilience | Provides emotional catharsis and narrative solace |
| **SURPRISED** | Over-explain the event | Unveil a hidden underlying motive that reframes prior clues | Rewards reader alertness; deepens intrigue |
| **FEAR** | Gratuitous shock horror | Elevate atmospheric suspense and present a high-stakes ethical choice | Empowers character agency under tension |
| **ANGRY** | Rant / escalate violence | Deliver decisive character agency, direct defiance, or cathartic confrontation | Shatters narrative paralysis; shifts power dynamic |
| **NEUTRAL** | Random plot injection | Deepen sensory atmosphere and advance core mystery organically | Builds steady immersion and world texture |

### 4.2 Sequential Generation & Structured JSON Contract
EMOTIVE generates narratives incrementally, producing one self-contained paragraph ($85\text{–}140$ words) per narrative beat. To ensure programmatic reliability, the model is constrained to return a strict JSON schema:

```json
{
  "story_title": "The Lighthouse at Eventide",
  "paragraph": "The brass mechanism within the lantern room groaned, its clockwork teeth biting into rusted iron as Clara adjusted the mirror...",
  "narrative_mood": "Wistful & Suspenseful",
  "emotional_intensity": 0.72,
  "plot_development": "Clara discovers her father's handwritten coordinates etched into the brass housing.",
  "continuity_notes": "Clara possesses the key; storm approaches; midnight deadline remains unresolved."
}
```

The system instruction explicitly forbids the LLM from ever mentioning cameras, vision models, facial expressions, or reader physiology within the prose.

### 4.3 Emotional Arc Visualization (Vonnegut Trajectory)
Following Kurt Vonnegut's classic narrative shape taxonomy \cite{vonnegut1981shapes}, each paragraph's emotional valence $V \in [-1.0, +1.0]$ and intensity $I \in [0.0, 1.0]$ are plotted on an interactive HTML5 canvas, mapping the cumulative dramatic trajectory across the reading session.

---

## 5. Procedural Multi-Sensory Web Audio Synthesizer

To reinforce narrative immersion without streaming pre-recorded audio files, EMOTIVE implements a procedural sound engine using the native browser Web Audio API:

```mermaid
graph LR
    subgraph AudioEngine ["Procedural Web Audio Engine"]
        Osc1["Oscillator 1 (Fundamental)"] --> Gain1["Pad Gain"]
        Osc2["Oscillator 2 (Fifth)"] --> Gain1
        Osc3["Oscillator 3 (Octave/Seventh)"] --> Gain1
        Osc4["Oscillator 4 (Ninth/Tension)"] --> Gain1
        Noise["White Noise Buffer"] --> BPF["Bandpass Filter"]
        BPF --> TextureGain["Wind/Texture Gain"]
        Gain1 --> Biquad["Biquad Low-Pass Filter (Q = 2.4)"]
        TextureGain --> Biquad
        Biquad --> Master["Master Gain & Compressor"]
        Master --> Destination["AudioContext.destination (Speakers)"]
    end
```

### 5.1 Harmonic Frequency Mapping
Each affective state dynamically shifts the base frequencies of four sinusoidal and triangle oscillators to evocative chord voicings:

- **HAPPY**: Cmaj9 chord ($130.81\text{ Hz}, 196.00\text{ Hz}, 246.94\text{ Hz}, 329.63\text{ Hz}$), filter cutoff $680\text{ Hz}$.
- **SAD**: Am7 chord ($110.00\text{ Hz}, 164.81\text{ Hz}, 196.00\text{ Hz}, 261.63\text{ Hz}$), filter cutoff $360\text{ Hz}$.
- **SURPRISED**: Open Dsus2 ($146.83\text{ Hz}, 220.00\text{ Hz}, 329.63\text{ Hz}, 440.00\text{ Hz}$), filter cutoff $780\text{ Hz}$.
- **FEAR**: Diminished sub-bass ($87.31\text{ Hz}, 130.81\text{ Hz}, 185.00\text{ Hz}, 220.00\text{ Hz}$), filter cutoff $260\text{ Hz}$.
- **ANGRY**: Power fifths ($82.41\text{ Hz}, 123.47\text{ Hz}, 164.81\text{ Hz}, 246.94\text{ Hz}$), filter cutoff $520\text{ Hz}$.
- **NEUTRAL**: Open fifth drone ($110.00\text{ Hz}, 164.81\text{ Hz}, 220.00\text{ Hz}, 329.63\text{ Hz}$), filter cutoff $440\text{ Hz}$.

Transitions utilize `exponentialRampToValueAtTime` over a $2.8\text{ s}$ window, preventing clicks, acoustic pops, or abrupt tonal disruptions.

---

## 6. Anonymous Telemetry & Evaluation Protocol

### 6.1 Zero-Biometrics Privacy Architecture
Affective systems frequently trigger surveillance anxiety. EMOTIVE implements an uncompromising privacy guarantee:
1. **Client Isolation**: All video capture, landmark extraction, and blendshape classification run in the client's WebAssembly sandbox.
2. **Explicit Track Termination**: When the session concludes or camera toggle is disengaged, `MediaStream.getTracks().forEach(t => t.stop())` terminates hardware capture immediately.
3. **Payload Sanitization**: Serverless telemetry endpoints accept only aggregated numeric scalars (e.g., total dwell time, WPM reading velocity, aggregate categorical counts, and optional Likert ratings). No IP addresses, user identifiers, or biometric embeddings are collected.

### 6.2 Empirical Study Design & Hypotheses
To validate EMOTIVE, we formulate three formal hypotheses:

- **$H_1$ (Narrative Transportation)**: Closed-loop affective adaptation creates significantly higher Narrative Transportation Scale (NTS \cite{green2000transportation}) scores than static, linear reading.
- **$H_2$ (Affective Attunement)**: Psychological counterpoint yields higher perceived narrative depth and responsiveness than 1:1 emotional mirroring.
- **$H_3$ (Multi-Modal Synergy)**: Synchronous procedural audio modulates reading pace consistency, reducing rapid skimming without causing cognitive fatigue.

#### Telemetry Variables
The telemetry collector (`/api/telemetry`) logs:
$$\text{Session} = \left\langle \text{ID}, \, T_{\text{total}}, \, \text{WPM}_{\text{avg}}, \, \vec{C}_{\text{emotions}}, \, \left[\Delta t_k, w_k, e_k, c_k\right]_{k=1}^K, \, \vec{R}_{\text{likert}} \right\rangle$$
where $\vec{R}_{\text{likert}}$ records post-reading evaluations on a 5-point scale across:
1. *Absorption*: "I felt completely absorbed in the unfolding story."
2. *Affective Attunement*: "The narrative felt subtly responsive to my emotional state."
3. *Soundscape Synergy*: "The real-time generative audio enhanced the emotional depth."

---

## 7. Discussion & Limitations

### 7.1 Lighting and Pose Invariance
MediaPipe FaceLandmarker provides robust facial tracking under ambient indoor lighting. However, extreme low-light environments ($< 20\text{ lux}$) degrade blendshape confidence. EMOTIVE detects low-confidence conditions ($P_{\text{max}} < 0.35$) and gracefully falls back to an `UNCERTAIN` state, maintaining story continuity without abrupt shifts.

### 7.2 Cognitive vs. Involuntary Expressions
Facial expressions during solitary reading are often subtle. Unlike conversational interaction, solitary reading frequently elicits suppressed micro-expressions. The $9\%$ hysteresis threshold and cumulative observation window allow EMOTIVE to detect sustained affective tendencies rather than transient twitches.

### 7.3 Ethical Guardrails
EMOTIVE enforces narrative safety through system prompting constraints. The engine is instructed to explore poignant and suspenseful literary themes while strictly prohibiting distressing, violent, or psychologically manipulative outputs.

---

## 8. Conclusion & Future Work

We have presented **EMOTIVE**, an open-source, in-browser Closed-Loop Affective Narrative System that bridges computational literature, affective computing, and procedural audio. By combining local WebAssembly computer vision with Exponential Moving Average smoothing and Psychological Counterpoint steering, EMOTIVE transforms passive reading into a dynamic, bi-directional aesthetic experience while preserving absolute reader privacy.

Future work will expand the system to multi-reader collective narratives, integrate eye-gaze pupil dilation tracking for cognitive load estimation, and explore long-form chapter-length story arcs.

---

## References

\begin{thebibliography}{10}

\bibitem{brown2020language}
Tom Brown, Benjamin Mann, Nick Ryder, Melanie Subbiah, Jared~D Kaplan, Prafulla Dhariwal, Arvind Neelakantan, Pranav Shyam, Girish Sastry, Amanda Askell, et~al. 2020.
\newblock Language models are few-shot learners.
\newblock {\em Advances in Neural Information Processing Systems}, 33:1877--1901.

\bibitem{chung2022talebrush}
John~Qian Chung, Eytan Adar, and Minsuk Kahng. 2022.
\newblock TaleBrush: Sketching stories with generative pretrained language models.
\newblock In {\em Proceedings of the 2022 CHI Conference on Human Factors in Computing Systems}, pages 1--19.

\bibitem{cohen2001music}
Annabel~J Cohen. 2001.
\newblock Music as a source of emotion in film.
\newblock {\em Music and Emotion: Theory and Research}, pages 249--272.

\bibitem{ekman1978facial}
Paul Ekman and Wallace~V Friesen. 1978.
\newblock {\em Facial Action Coding System: A Technique for the Measurement of Facial Movement}.
\newblock Consulting Psychologists Press, Palo Alto, CA.

\bibitem{green2000transportation}
Melanie~C Green and Timothy~C Brock. 2000.
\newblock The role of transportation in the persuasiveness of public narratives.
\newblock {\em Journal of Personality and Social Psychology}, 79(5):701.

\bibitem{lugaresi2019mediapipe}
Camillo Lugaresi, Jiuqiang Tang, Hadon Nash, Chris McClanahan, Esha Uboweja, Michael Hays, Fan Zhang, Chuo-Ling Chang, Ming~Guang Yong, Juhyun Lee, et~al. 2019.
\newblock MediaPipe: A framework for building perception pipelines.
\newblock {\em arXiv preprint arXiv:1906.08172}.

\bibitem{mateas2003facade}
Michael Mateas and Andrew Stern. 2003.
\newblock Fa{\c{c}}ade: An experiment in building a fully-realized interactive drama.
\newblock In {\em Game Developers Conference (GDC)}, volume~2.

\bibitem{murray1997hamlet}
Janet~Horowitz Murray. 1997.
\newblock {\em Hamlet on the Holodeck: The Future of Narrative in Cyberspace}.
\newblock MIT Press, Cambridge, MA.

\bibitem{picard2000affective}
Rosalind~W Picard. 2000.
\newblock {\em Affective Computing}.
\newblock MIT Press, Cambridge, MA.

\bibitem{riedl2010narrative}
Mark~O Riedl and Robert~Michael Young. 2010.
\newblock Narrative planning: Balancing plot and character.
\newblock {\em Journal of Artificial Intelligence Research}, 39:217--268.

\bibitem{ryan2001narrative}
Marie-Laure Ryan. 2001.
\newblock {\em Narrative as Virtual Reality: Immersion and Interactivity in Literature and Electronic Media}.
\newblock JHU Press, Baltimore, MD.

\bibitem{smus2013web}
Boris Smus. 2013.
\newblock {\em Web Audio API: Advanced Sound for Games and Interactive Apps}.
\newblock O'Reilly Media, Sebastopol, CA.

\bibitem{vonnegut1981shapes}
Kurt Vonnegut. 1981.
\newblock {\em Palm Sunday: An Autobiographical Collage}.
\newblock Delacorte Press, New York, NY.

\end{thebibliography}
