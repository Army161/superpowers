export type PulseState = "flat" | "warm" | "hot" | "peak";

export function scoreToState(score: number): PulseState {
  if (score >= 95) return "peak";
  if (score >= 85) return "hot";
  if (score >= 70) return "warm";
  return "flat";
}

export function stateColor(state: PulseState): string {
  switch (state) {
    case "peak":
      return "#ff0066";
    case "hot":
      return "#00ff88";
    case "warm":
      return "#ffb020";
    default:
      return "#555566";
  }
}

export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  score: number,
  color: string
): void {
  const amplitude = height * 0.35 * (score / 100);
  const midY = y + height / 2;
  const points = 80;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";

  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const px = x + t * width;
    const wave =
      Math.sin(t * Math.PI * 8 + Date.now() / 500) * amplitude * 0.5 +
      Math.sin(t * Math.PI * 3) * amplitude * 0.3 +
      Math.sin(t * Math.PI * 15 + 1.5) * amplitude * 0.2;
    const py = midY + wave;

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }

  ctx.stroke();

  if (score >= 95) {
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export function drawGlitchOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  for (let i = 0; i < 8; i++) {
    const gy = Math.random() * height;
    const gh = 2 + Math.random() * 6;
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? "255,0,102" : "0,255,136"}, 0.15)`;
    ctx.fillRect(0, gy, width, gh);
  }
}
