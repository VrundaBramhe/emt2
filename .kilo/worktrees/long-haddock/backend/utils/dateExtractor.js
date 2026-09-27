// Extracts a date from raw OCR text, handling common receipt date formats

const DATE_PATTERNS = [
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
  // YYYY/MM/DD or YYYY-MM-DD
  /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,
  // 12 Jan 2026 / 12 January 2026
  /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{2,4})/i,
];

const MONTH_MAP = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

const extractDate = (text) => {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      try {
        let day, month, year;

        if (pattern === DATE_PATTERNS[0]) {
          [, day, month, year] = match;
        } else if (pattern === DATE_PATTERNS[1]) {
          [, year, month, day] = match;
        } else if (pattern === DATE_PATTERNS[2]) {
          [, day, , year] = match;
          const monthAbbr = match[2].toLowerCase().slice(0, 3);
          month = MONTH_MAP[monthAbbr];
        }

        if (year.length === 2) year = "20" + year;
        day = day.padStart(2, "0");
        month = month.padStart(2, "0");

        const isoDate = `${year}-${month}-${day}`;
        const parsed = new Date(isoDate);

        if (!isNaN(parsed) && parsed <= new Date() && parsed.getFullYear() > 2015) {
          return isoDate;
        }
      } catch {
        continue;
      }
    }
  }
  return null;
};

module.exports = { extractDate };