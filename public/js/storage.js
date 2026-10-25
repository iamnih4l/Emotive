/**
 * EMOTIVE — Manuscript Archive & Storage Manager
 * Persistent local storage for completed stories, retrieval, and multi-format exports.
 */

const STORAGE_KEY = 'emotive_manuscript_archive';

export function getArchivedStories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.sort((a, b) => b.savedAt - a.savedAt) : [];
  } catch (err) {
    console.error('Failed to load archived stories:', err);
    return [];
  }
}

export function saveStoryToArchive(story) {
  if (!story || !story.paragraphs || story.paragraphs.length === 0) return null;

  try {
    const list = getArchivedStories();
    const totalWords = story.paragraphs.reduce((sum, p) => sum + (p.text ? p.text.split(/\s+/).length : 0), 0);
    const adaptationCount = story.paragraphs.filter((p, i) => i > 0 && p.triggerExpression && p.triggerExpression !== 'UNCERTAIN' && p.triggerExpression !== 'NEUTRAL').length;

    const archiveItem = {
      id: story.storyId || 'emotive_' + Date.now().toString(36),
      title: story.title || 'Untitled Narrative',
      genre: story.genre || 'Literary Fiction',
      style: story.style || 'Literary',
      premise: story.premise || '',
      startingMood: story.startingMood || 'Contemplative',
      adaptationIntensity: story.adaptationIntensity || 'BALANCED',
      paragraphs: story.paragraphs,
      savedAt: Date.now(),
      wordCount: totalWords,
      paragraphCount: story.paragraphs.length,
      adaptationCount
    };

    // Upsert by story ID
    const existingIndex = list.findIndex(item => item.id === archiveItem.id);
    if (existingIndex >= 0) {
      list[existingIndex] = archiveItem;
    } else {
      list.unshift(archiveItem);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return archiveItem;
  } catch (err) {
    console.error('Failed to save story to archive:', err);
    return null;
  }
}

export function getArchivedStory(storyId) {
  const list = getArchivedStories();
  return list.find(s => s.id === storyId) || null;
}

export function deleteArchivedStory(storyId) {
  try {
    const list = getArchivedStories();
    const updated = list.filter(s => s.id !== storyId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('Failed to delete story:', err);
    return false;
  }
}

export function exportStoryAsText(story) {
  const title = (story.title || 'EMOTIVE STORY').toUpperCase();
  const dateStr = new Date(story.savedAt || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const lines = [
    '====================================================================',
    title,
    `Date: ${dateStr}`,
    `Genre: ${story.genre} | Style: ${story.style} | Adaptation: ${story.adaptationIntensity}`,
    'Generated with EMOTIVE — An AI Story That Feels Its Reader',
    '====================================================================',
    '',
    ...story.paragraphs.map(p => p.text + '\n'),
    '--------------------------------------------------------------------',
    'NARRATIVE EVOLUTION MAP (EXPRESSION CUES & DIRECTIVES)',
    '--------------------------------------------------------------------',
    ...story.paragraphs.map(p =>
      `§ ${p.index} [Mood: ${p.mood || 'Contemplative'} | Cue: ${p.triggerExpression || 'OPENING'} | Confidence: ${Math.round((p.triggerConfidence || 1) * 100)}%]:\n  → Plot: ${p.plotDevelopment || 'Scene advanced'}`
    ),
    '===================================================================='
  ];

  triggerDownload(lines.join('\n'), `${sanitizeFilename(story.title || 'emotive_manuscript')}.txt`, 'text/plain;charset=utf-8');
}

export function exportStoryAsMarkdown(story) {
  const title = story.title || 'EMOTIVE Story';
  const dateStr = new Date(story.savedAt || Date.now()).toISOString();

  const lines = [
    '---',
    `title: "${title}"`,
    `genre: "${story.genre}"`,
    `style: "${story.style}"`,
    `adaptation_intensity: "${story.adaptationIntensity}"`,
    `date: "${dateStr}"`,
    'engine: "EMOTIVE Adaptive Literary Engine"',
    '---',
    '',
    `# ${title}`,
    '',
    `*${story.genre} • ${story.style} Style • ${story.paragraphs.length} Paragraphs*`,
    '',
    '---',
    '',
    ...story.paragraphs.map(p => `${p.text}\n`),
    '---',
    '',
    '## Narrative Evolution Record',
    '',
    '| § | Narrative Mood | Reader Expression Cue | Plot Development |',
    '|---|---|---|---|',
    ...story.paragraphs.map(p =>
      `| ${p.index} | ${p.mood || 'N/A'} | \`${p.triggerExpression || 'OPENING'}\` | ${p.plotDevelopment || 'N/A'} |`
    )
  ];

  triggerDownload(lines.join('\n'), `${sanitizeFilename(title)}.md`, 'text/markdown;charset=utf-8');
}

function sanitizeFilename(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'emotive_story';
}

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
