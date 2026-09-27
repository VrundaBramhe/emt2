// Fallback amount extraction using keyword-tiered regex matching.
// Used when Donut fails to return an amount, or as a cross-check.

const AMOUNT_TIERS = [
  ["grand total", "net payable", "amount payable", "balance due", "amount due"],
  ["total amount", "net amount", "amount paid", "bill amount", "total payable"],
  ["total"],
];

const EXCLUDE_LINE_KEYWORDS = [
  "subtotal", "sub total", "sub-total", "discount",
  "cgst", "sgst", "gst", "tax", "service charge",
];

const numberPattern = /(?:rs\.?|inr|₹|\$)?\s?([0-9]{1,3}(?:[,\.][0-9]{2,3})*(?:\.[0-9]{1,2})?)/gi;

const extractNumberFromLine = (line) => {
  const matches = [...line.matchAll(numberPattern)];
  if (matches.length === 0) return null;
  const rawNum = matches[matches.length - 1][1].replace(/,/g, "");
  const val = parseFloat(rawNum);
  return !isNaN(val) && val > 0 ? val : null;
};

const extractAmountFallback = (text) => {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const tier of AMOUNT_TIERS) {
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const isExcluded = EXCLUDE_LINE_KEYWORDS.some((ex) => lowerLine.includes(ex));
      if (isExcluded) continue;

      const matchedKeyword = tier.find((kw) => lowerLine.includes(kw));
      if (matchedKeyword) {
        const val = extractNumberFromLine(line);
        if (val !== null) return val;
      }
    }
  }

  const candidateLines = lines.filter(
    (l) => !EXCLUDE_LINE_KEYWORDS.some((ex) => l.toLowerCase().includes(ex))
  );
  const allNumbers = candidateLines
    .flatMap((l) => [...l.matchAll(numberPattern)])
    .map((m) => parseFloat(m[1].replace(/,/g, "")))
    .filter((n) => !isNaN(n) && n > 0 && n < 10000000);

  return allNumbers.length > 0 ? Math.max(...allNumbers) : null;
};

module.exports = { extractAmountFallback };