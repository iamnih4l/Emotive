# Contributing to EMOTIVE

Thank you for your interest in contributing to **EMOTIVE**! We welcome ideas, bug reports, and pull requests to enhance the adaptive literary experience.

---

## 🛠️ Development Setup

1. **Fork & Clone**:
   ```bash
   git clone https://github.com/iamnih4l/Emotive.git
   cd Emotive
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY if testing against the live Gemini model
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🎨 Areas for Contribution

- **Narrative Styles & Prompts**: Enriching [public/js/storyEngine.js](file:///c:/Users/nihal/OneDrive/Desktop/emotive-app/public/js/storyEngine.js) with new genres, nuanced emotional counterpoint directives, and expanded premises.
- **Soundscape Design**: Adding procedural Web Audio synth algorithms or textures to [public/js/audio.js](file:///c:/Users/nihal/OneDrive/Desktop/emotive-app/public/js/audio.js).
- **Computer Vision & Ergonomics**: Optimizing FACS blendshape thresholds or temporal smoothing curves in [public/js/vision.js](file:///c:/Users/nihal/OneDrive/Desktop/emotive-app/public/js/vision.js).
- **Export & Formats**: Expanding manuscript exports in [public/js/storage.js](file:///c:/Users/nihal/OneDrive/Desktop/emotive-app/public/js/storage.js) (e.g. EPUB or printable PDF).

---

## 📋 Pull Request Guidelines

1. Create a feature branch (`git checkout -b feature/my-feature`).
2. Adhere to the zero-external-dependency philosophy for audio/vision (client-side privacy is paramount).
3. Ensure no secrets, keys, or temporary files are committed.
4. Open a clear Pull Request explaining the rationale, changes, and verification steps.
