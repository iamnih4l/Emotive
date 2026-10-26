# Share Copy Variants: EMOTIVE

## 1. Twitter / X (Short, Punchy)
```text
What if the book was reading you?

I built EMOTIVE: an adaptive AI storyteller where Google Gemini 2.5 Flash reshapes the narrative and procedural Web Audio ambient soundscapes based on your real-time facial expressions.

100% in-browser MediaPipe WebAssembly. Zero video uploads.

Try it live: https://emotive-omega.vercel.app/
GitHub: https://github.com/iamnih4l/Emotive
```

## 2. Twitter / X (Thread Hook)
```text
1/4 Traditional books are frozen artifacts. Conventional AI story generators dump 1,000 words in one generic shot.

So I built EMOTIVE — an interactive literary engine that treats reading as a two-way performance. 🧵👇

2/4 As you read paragraph by paragraph, a client-side MediaPipe vision model calculates 52 FACS facial blendshapes (smiles, frowns, widened eyes) via WebAssembly.

Zero raw frames or biometrics leave your browser.

3/4 Your emotional cue guides Gemini 2.5 Flash as an artistic counterpoint:
• Smile? Introduce bittersweet depth.
• Surprised? Unveil a hidden secret.
• Tense? Modulate the procedural Web Audio synthesizer from Cmaj9 to Am7.

4/4 Try the live demo in your browser:
https://emotive-omega.vercel.app/

Code is 100% open source:
https://github.com/iamnih4l/Emotive
```

## 3. LinkedIn (Story / Engineering Craft)
```text
Most AI writing tools write *at* you. I wanted to build an AI that listens.

Meet EMOTIVE: an adaptive literary engine where the narrative, pacing, and procedural ambient soundscape respond in real time to the reader's facial expressions.

Here's how the technical architecture works:

1. In-Browser Computer Vision (MediaPipe + WebGL):
Subtle expression cues are computed locally across 52 FACS blendshapes. An Exponential Moving Average (α=0.22) filter and ±9% hysteresis prevent jitter and misclassifications. Privacy guarantee: No video or biometrics ever touch a server.

2. Paragraph-by-Paragraph Narrative Synthesis:
Instead of generating full chapters at once, Gemini 2.5 Flash generates 85–130 word increments. The reader's emotional signal acts as a prompt counterpoint—deepening tension, unveiling secrets, or providing bittersweet solace.

3. Zero-Asset Procedural Audio Engine:
Using the native Web Audio API, a 4-voice detuned harmonic synthesizer dynamically shifts frequencies and filter cutoffs over 2.8s parameter ramps to mirror the story's mood.

4. Kurt Vonnegut Emotional Arc Canvas:
When the story finishes, the engine renders an interactive HTML5 emotional trajectory visualizing how your facial reactions sculpted the plot.

Try it live (no login required): https://emotive-omega.vercel.app/
Open-source repository: https://github.com/iamnih4l/Emotive
```

## 4. Hacker News (Show HN)
```text
Show HN: EMOTIVE – An AI story engine that responds to reader facial expressions

URL: https://emotive-omega.vercel.app/
GitHub: https://github.com/iamnih4l/Emotive

Hi HN,

I built EMOTIVE, an experiment in bi-directional reading where narrative prose and procedural ambient audio adapt paragraph-by-paragraph to the reader's emotional expressions.

Key technical decisions:
- 100% Client-Side Vision: Runs MediaPipe FaceLandmarker via WebAssembly/WebGL in the browser. Only high-level discrete emotion signals (e.g., SURPRISED, 91%) are sent to the story prompt. Raw video frames never leave RAM.
- Procedural Soundscapes: Built entirely with the Web Audio API (oscillators, biquad filters, Brownian noise generator). No external audio files or bandwidth required.
- Dynamic Counterpoint: Rather than flattering the reader's emotion, the prompt engine uses psychological counterpoint (e.g. smiles trigger bittersweet nuances; widened eyes trigger structural plot inversions).
- Output: Concludes with an interactive Kurt Vonnegut narrative arc canvas showing your reading journey.

Would love feedback on the pacing and emotion classification thresholds!
```
