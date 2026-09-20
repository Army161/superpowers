import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export interface DailyPost {
  day: number;
  date: string;
  postType: string;
  caption: string;
  waveformState: "flat" | "warm" | "hot" | "peak";
  platforms: string[];
}

const WAVEFORM_COLORS = {
  flat: "#555566",
  warm: "#ffb020",
  hot: "#00ff88",
  peak: "#ff0066",
};

function generateWaveformSvg(state: keyof typeof WAVEFORM_COLORS, seed: number): string {
  const color = WAVEFORM_COLORS[state];
  const amplitude = state === "flat" ? 15 : state === "warm" ? 35 : state === "hot" ? 55 : 70;
  let path = "M0 200";
  for (let i = 1; i <= 24; i++) {
    const x = i * 50;
    const y = 200 + Math.sin(i * 0.8 + seed) * amplitude + Math.sin(i * 2.1 + seed * 0.5) * (amplitude * 0.4);
    path += ` L${x} ${y.toFixed(0)}`;
  }

  const glitch =
    state === "peak"
      ? `<rect x="0" y="180" width="1200" height="4" fill="#00ff88" opacity="0.3"/>
         <rect x="0" y="220" width="1200" height="3" fill="#ff0066" opacity="0.3"/>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" fill="none">
  <rect width="1200" height="400" fill="#0a0a0f"/>
  <path d="${path}" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  ${glitch}
  <text x="60" y="60" font-family="monospace" font-size="24" fill="#8888a0">CULTURE PULSE</text>
  <text x="60" y="360" font-family="monospace" font-size="18" fill="${color}">${state.toUpperCase()}</text>
</svg>`;
}

const CALENDAR: Omit<DailyPost, "date">[] = [
  { day: -30, postType: "waveform-react", caption: "...", waveformState: "warm", platforms: ["x"] },
  { day: -29, postType: "pure-waveform", caption: "", waveformState: "flat", platforms: ["x"] },
  { day: -23, postType: "daily-pulse", caption: "Today's rhythm.", waveformState: "warm", platforms: ["x", "tiktok"] },
  { day: -16, postType: "template-drop", caption: "Overlay pack in bio.", waveformState: "hot", platforms: ["x"] },
  { day: -14, postType: "forge-beta", caption: "Make your own.", waveformState: "hot", platforms: ["x"] },
  { day: -6, postType: "teaser", caption: "Culture now has a ticker.", waveformState: "peak", platforms: ["x"] },
  { day: -1, postType: "launch-eve", caption: "Tomorrow.", waveformState: "peak", platforms: ["x", "tiktok"] },
];

export async function generateStealthAssets(outDir: string): Promise<DailyPost[]> {
  await mkdir(outDir, { recursive: true });
  await mkdir(join(outDir, "posts"), { recursive: true });
  await mkdir(join(outDir, "templates"), { recursive: true });

  const launchDate = new Date("2026-10-20T16:00:00Z");
  const posts: DailyPost[] = [];

  for (const entry of CALENDAR) {
    const date = new Date(launchDate);
    date.setDate(date.getDate() + entry.day);

    const post: DailyPost = {
      ...entry,
      date: date.toISOString().split("T")[0],
    };
    posts.push(post);

    const svg = generateWaveformSvg(entry.waveformState, Math.abs(entry.day));
    const filename = `day-${String(Math.abs(entry.day)).padStart(2, "0")}-${entry.postType}.svg`;
    await writeFile(join(outDir, "posts", filename), svg);

    const postMeta = {
      ...post,
      suggestedCaption: entry.caption,
      imageFile: filename,
      rules: ["No token mention", "No price talk", "Waveform-first"],
    };
    await writeFile(
      join(outDir, "posts", filename.replace(".svg", ".json")),
      JSON.stringify(postMeta, null, 2)
    );
  }

  await writeFile(
    join(outDir, "outreach-template.txt"),
    `Subject: waveform overlay pack — no promo

Hey [name] — made a free pulse/EKG overlay for trending moments.
No brand, no ask. Figma + PNG in link.

If it fits your edit style, use it. Would love to see what you make.

— Culture Pulse`
  );

  await writeFile(join(outDir, "calendar-summary.json"), JSON.stringify(posts, null, 2));

  return posts;
}
