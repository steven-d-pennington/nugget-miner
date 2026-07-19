import OpenAI from 'openai';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

if (!process.env.OPENAI_API_KEY?.trim()) {
  throw new Error('OPENAI_API_KEY is required. Set it only for this command and remove it afterward.');
}

const model = process.env.OPENAI_TTS_MODEL ?? 'tts-1-hd';
const voice = process.env.OPENAI_TTS_VOICE ?? 'onyx';
const speed = Number(process.env.OPENAI_TTS_SPEED ?? '0.95');
const outputDirectory = path.resolve('docs/hackathon/demo-video-final/activation-narration');

const cues = [
  [0.5, 8, "Good ideas arrive while you're moving, then disappear inside a long voice note."],
  [8, 16, 'Nugget starts with one tap: capture first, organize later.'],
  [16, 29, 'The voice-first screen stays deliberately simple. I can speak naturally, watch the live waveform, and stop when the thought is out of my head.'],
  [29, 49, 'The recording is saved in this browser before cloud processing begins. Nugget can transcribe the audio, organize the transcript, and return a reviewable result without losing the source.'],
  [49, 62, "For this interface walkthrough, I'm switching to a clearly disclosed, preprocessed safe capture. One ramble has become three separate idea drafts."],
  [62, 78, 'Each draft is editable before I trust it: title, summary, category, tags, goals, blockers, research needs, and next actions. Grounding labels show how every field relates to the source.'],
  [78, 90, "Confirmed ideas become a searchable local library. This view uses Nugget's labeled sample data, so it does not make a new GPT call."],
  [90, 107, 'Opening an idea keeps its summary, category, tags, goals, blockers, research, and next actions together instead of burying the useful parts back inside a transcript.'],
  [107, 115, "I captured this feature idea in Nugget itself. That saved thought became what you're seeing now."],
  [115, 129, 'Work with this idea can explore a thought, create a plan, or prepare a grounded brief for another AI. The source transcript stays off unless I explicitly include it.'],
  [129, 133, 'I confirm exactly what is sent, then GPT-5.6 gets to work.'],
  [133, 157, 'The result is a structured, editable brief with an objective, context, assumptions, constraints, deliverables, and success criteria. It stays grounded in the organized idea, labels missing context instead of inventing it, and produces a prompt I can copy or download.'],
  [157, 166, 'Settings keeps the privacy boundary visible and reports live Whisper and GPT-5.6 Terra health.'],
  [166, 171.2, 'Nugget captures ideas and helps bring them into the real world.'],
].map(([startSeconds, endSeconds, text], index) => ({
  id: index + 1,
  startSeconds,
  endSeconds,
  text,
  filename: `activation-${String(index + 1).padStart(2, '0')}.mp3`,
}));

await mkdir(outputDirectory, { recursive: true });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

for (const cue of cues) {
  const response = await client.audio.speech.create({
    model,
    voice,
    input: cue.text,
    response_format: 'mp3',
    speed,
  });
  await writeFile(path.join(outputDirectory, cue.filename), Buffer.from(await response.arrayBuffer()));
  console.log(`Generated cue ${cue.id}/${cues.length}: ${cue.filename}`);
}

await writeFile(
  path.join(outputDirectory, 'manifest.json'),
  `${JSON.stringify({ model, voice, speed, generatedAt: new Date().toISOString(), cues }, null, 2)}\n`,
  'utf8',
);

console.log(`Saved narration manifest: ${path.join(outputDirectory, 'manifest.json')}`);
