const scoreEl = document.getElementById("pulse-score");
const statusEl = document.getElementById("pulse-status");
const canvas = document.getElementById("waveform");
const platformBars = document.getElementById("platform-bars");
const topicList = document.getElementById("topic-list");
const eventPanel = document.getElementById("event-panel");
const eventName = document.getElementById("event-name");
const lastUpdate = document.getElementById("last-update");

function scoreColor(score) {
  if (score >= 95) return "#ff0066";
  if (score >= 85) return "#00ff88";
  if (score >= 70) return "#ffb020";
  return "#555566";
}

function drawWaveform(score) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const color = scoreColor(score);
  const amp = (score / 100) * 60;

  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;

  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const x = t * w;
    const y = h / 2 + Math.sin(t * Math.PI * 10 + Date.now() / 400) * amp * 0.6
      + Math.sin(t * Math.PI * 4) * amp * 0.4;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function renderPlatformBars(breakdown) {
  platformBars.innerHTML = "";
  for (const [platform, value] of Object.entries(breakdown)) {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span class="bar-label">${platform}</span>
      <div class="bar-track"><div class="bar-fill" style="width: ${(value * 100).toFixed(0)}%"></div></div>
    `;
    platformBars.appendChild(row);
  }
}

async function fetchPulse() {
  try {
    const res = await fetch("/api/pulse/latest");
    if (res.ok) return res.json();
  } catch { /* fallback */ }

  return {
    pulseScore: 72,
    status: "OK",
    event: "PulseWarm",
    platformBreakdown: { x: 0.78, tiktok: 0.65, reddit: 0.71, youtube: 0.42, googleTrends: 0.55 },
    topTopics: ["trending-now", "viral-format", "breaking-culture"],
    timestamp: new Date().toISOString(),
  };
}

async function update() {
  const data = await fetchPulse();
  const score = data.pulseScore ?? 0;

  scoreEl.textContent = data.pulseScore ?? "—";
  scoreEl.style.color = scoreColor(score);
  statusEl.textContent = data.status === "DEGRADED" ? "DEGRADED — oracle partial outage" : "LIVE";
  lastUpdate.textContent = new Date(data.timestamp).toLocaleString();

  drawWaveform(score);
  renderPlatformBars(data.platformBreakdown ?? {});

  topicList.innerHTML = "";
  for (const topic of data.topTopics ?? []) {
    const li = document.createElement("li");
    li.textContent = topic;
    topicList.appendChild(li);
  }

  if (data.event) {
    eventPanel.hidden = false;
    eventName.textContent = data.event;
  } else {
    eventPanel.hidden = true;
  }
}

update();
setInterval(update, 60_000);
setInterval(() => drawWaveform(parseInt(scoreEl.textContent) || 45), 100);
