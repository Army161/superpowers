import { renderPulseCard } from "./card-renderer.js";

const linkInput = document.getElementById("link-input") as HTMLInputElement;
const titleInput = document.getElementById("title-input") as HTMLInputElement;
const generateBtn = document.getElementById("generate-btn") as HTMLButtonElement;
const downloadBtn = document.getElementById("download-btn") as HTMLButtonElement;
const copyBtn = document.getElementById("copy-btn") as HTMLButtonElement;
const canvas = document.getElementById("card-canvas") as HTMLCanvasElement;

async function fetchLatestPulse(): Promise<{
  pulseScore: number;
  txHash: string;
  topTopics: string[];
}> {
  try {
    const res = await fetch("/api/pulse/latest");
    if (res.ok) return res.json();
  } catch {
    /* fallback to demo data */
  }

  return {
    pulseScore: 72,
    txHash: "5Kq7xPulseWarm20260920160000abc123",
    topTopics: ["trending-now", "viral-format"],
  };
}

async function generate() {
  const link = linkInput.value.trim();
  if (!link) {
    linkInput.focus();
    return;
  }

  const pulse = await fetchLatestPulse();

  renderPulseCard(canvas, {
    link,
    title: titleInput.value.trim(),
    pulseScore: pulse.pulseScore,
    txHash: pulse.txHash,
    topTopics: pulse.topTopics,
  });

  downloadBtn.disabled = false;
  copyBtn.disabled = false;
}

generateBtn.addEventListener("click", generate);

downloadBtn.addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = `signal-pulse-${Date.now()}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
});

copyBtn.addEventListener("click", async () => {
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy to Clipboard";
      }, 2000);
    } catch {
      copyBtn.textContent = "Copy failed";
    }
  });
});

renderPulseCard(canvas, {
  link: "https://x.com/example/status/123",
  title: "Preview — paste your link above",
  pulseScore: 45,
  txHash: "preview000000000000000000000",
  topTopics: [],
});
