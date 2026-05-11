const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));

function normalize(value, min, max) {
  if (max === min) return 0.5;
  return clamp((value - min) / (max - min));
}

function layerScore(data) {
  const price = clamp(0.5 + (data.momentum || 0) * 0.2 - (data.volatility || 0) * 0.15);
  const group = clamp(0.5 - (data.correlation || 0) * 0.2 + (data.divergence || 0) * 0.2);
  const flow = clamp(0.5 + (data.fiiFlow || 0) * 0.2 + (data.volume || 0) * 0.1);
  const macro = clamp(0.5 - normalize(data.oil || 0, 70, 100) * 0.2 - normalize(data.vix || 0, 12, 30) * 0.2);

  const score = 0.3 * price + 0.3 * group + 0.2 * flow + 0.2 * macro;

  let state = "NEUTRAL";
  if (score >= 0.65) state = "BULLISH";
  else if (score <= 0.45) state = "DEFENSIVE";

  const reasons = [];
  if (group < 0.5) reasons.push("High correlation risk");
  if (flow < 0.5) reasons.push("Weak FII flows");
  if (macro < 0.5) reasons.push("Macro pressure rising");
  if (price < 0.45) reasons.push("Price momentum weak");

  return {
    state,
    confidence: Math.round(score * 100),
    score: Number(score.toFixed(2)),
    breakdown: { price, group, flow, macro },
    reasons,
  };
}

export function computeSignal(input) {
  return layerScore(input);
}
