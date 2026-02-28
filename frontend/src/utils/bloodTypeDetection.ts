/**
 * Detects blood type from text content using strict priority-ordered regex.
 * Tests AB+/AB- before A+/A-, B+/B-, O+/O- to avoid false positives.
 */

const BLOOD_TYPE_PATTERNS: Array<{ type: string; patterns: RegExp[] }> = [
  {
    type: "AB+",
    patterns: [
      /\bAB\s*\+/i,
      /\bAB\s*positive\b/i,
      /blood\s*(group|type)\s*[:\-]?\s*AB\s*\+/i,
      /blood\s*(group|type)\s*[:\-]?\s*AB\s*positive/i,
      /group\s*[:\-]?\s*AB\s*\+/i,
      /group\s*[:\-]?\s*AB\s*positive/i,
    ],
  },
  {
    type: "AB-",
    patterns: [
      /\bAB\s*\-/i,
      /\bAB\s*negative\b/i,
      /blood\s*(group|type)\s*[:\-]?\s*AB\s*\-/i,
      /blood\s*(group|type)\s*[:\-]?\s*AB\s*negative/i,
      /group\s*[:\-]?\s*AB\s*\-/i,
      /group\s*[:\-]?\s*AB\s*negative/i,
    ],
  },
  {
    type: "A+",
    patterns: [
      /\bA\s*\+(?!B)/i,
      /\bA\s*positive\b/i,
      /blood\s*(group|type)\s*[:\-]?\s*A\s*\+(?!B)/i,
      /blood\s*(group|type)\s*[:\-]?\s*A\s*positive/i,
      /group\s*[:\-]?\s*A\s*\+(?!B)/i,
      /group\s*[:\-]?\s*A\s*positive/i,
    ],
  },
  {
    type: "A-",
    patterns: [
      /\bA\s*\-(?!B)/i,
      /\bA\s*negative\b/i,
      /blood\s*(group|type)\s*[:\-]?\s*A\s*\-(?!B)/i,
      /blood\s*(group|type)\s*[:\-]?\s*A\s*negative/i,
      /group\s*[:\-]?\s*A\s*\-(?!B)/i,
      /group\s*[:\-]?\s*A\s*negative/i,
    ],
  },
  {
    type: "B+",
    patterns: [
      /\bB\s*\+/i,
      /\bB\s*positive\b/i,
      /blood\s*(group|type)\s*[:\-]?\s*B\s*\+/i,
      /blood\s*(group|type)\s*[:\-]?\s*B\s*positive/i,
      /group\s*[:\-]?\s*B\s*\+/i,
      /group\s*[:\-]?\s*B\s*positive/i,
    ],
  },
  {
    type: "B-",
    patterns: [
      /\bB\s*\-/i,
      /\bB\s*negative\b/i,
      /blood\s*(group|type)\s*[:\-]?\s*B\s*\-/i,
      /blood\s*(group|type)\s*[:\-]?\s*B\s*negative/i,
      /group\s*[:\-]?\s*B\s*\-/i,
      /group\s*[:\-]?\s*B\s*negative/i,
    ],
  },
  {
    type: "O+",
    patterns: [
      /\bO\s*\+/i,
      /\bO\s*positive\b/i,
      /blood\s*(group|type)\s*[:\-]?\s*O\s*\+/i,
      /blood\s*(group|type)\s*[:\-]?\s*O\s*positive/i,
      /group\s*[:\-]?\s*O\s*\+/i,
      /group\s*[:\-]?\s*O\s*positive/i,
    ],
  },
  {
    type: "O-",
    patterns: [
      /\bO\s*\-/i,
      /\bO\s*negative\b/i,
      /blood\s*(group|type)\s*[:\-]?\s*O\s*\-/i,
      /blood\s*(group|type)\s*[:\-]?\s*O\s*negative/i,
      /group\s*[:\-]?\s*O\s*\-/i,
      /group\s*[:\-]?\s*O\s*negative/i,
    ],
  },
];

export function detectBloodTypeFromText(text: string): string | null {
  if (!text || text.trim().length === 0) return null;

  // Sanitize: remove non-printable characters that could cause false matches
  const sanitized = text.replace(/[^\x20-\x7E\n\r\t]/g, " ");

  for (const { type, patterns } of BLOOD_TYPE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(sanitized)) {
        return type;
      }
    }
  }
  return null;
}

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];
