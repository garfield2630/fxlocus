const PAIR = /\b([A-Z]{3})\/([A-Z]{3})\b/g;
const PAIR2 = /\b([A-Z]{6})\b/g;

const MAP: Array<[RegExp, string[]]> = [
  [/gold|黄金|xau/i, ["XAUUSD"]],
  [/silver|白银|xag/i, ["XAGUSD"]],
  [/wti|us oil|原油/i, ["USOIL"]],
  [/brent/i, ["UKOIL"]],
  [/bitcoin|btc|比特币/i, ["BTCUSD"]],
  [/ethereum|eth|以太坊/i, ["ETHUSD"]],
  [/nasdaq|ndx/i, ["NDX"]],
  [/sp500|s&p/i, ["SPX"]],
  [/dow|djia/i, ["DJI"]],
  [/dxy|美元指数/i, ["DXY"]]
];

export function extractSymbolsHeuristic(text: string) {
  const out = new Set<string>();
  const t = (text || "").toUpperCase();

  for (const match of t.matchAll(PAIR)) {
    out.add(`${match[1]}${match[2]}`);
  }

  for (const match of t.matchAll(PAIR2)) {
    const symbol = match[1];
    if (/^[A-Z]{6}$/.test(symbol)) out.add(symbol);
  }

  for (const [re, symbols] of MAP) {
    if (re.test(text)) symbols.forEach((symbol) => out.add(symbol));
  }

  return Array.from(out).slice(0, 12);
}
