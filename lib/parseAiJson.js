function extractJsonSlice(text) {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (start === -1) {
      if (ch === "{" || ch === "[") {
        start = i;
        depth = 1;
      }
      continue;
    }

    if (ch === "{" || ch === "[") {
      depth++;
    } else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

export function parseAiJson(rawText, label = "AI response") {
  if (typeof rawText !== "string" || rawText.trim().length === 0) {
    throw new Error(`${label} is empty`);
  }

  const trimmed = rawText.trim();

  try {
    return JSON.parse(trimmed);
  } catch (_) {
    // Continue with tolerant extraction.
  }

  // Handle fenced blocks like ```json ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) {
    const fenced = fenceMatch[1].trim();
    try {
      return JSON.parse(fenced);
    } catch (_) {
      const slice = extractJsonSlice(fenced);
      if (slice) {
        return JSON.parse(slice);
      }
    }
  }

  const extracted = extractJsonSlice(trimmed);
  if (extracted) {
    return JSON.parse(extracted);
  }

  throw new Error(`${label} does not contain valid JSON`);
}
