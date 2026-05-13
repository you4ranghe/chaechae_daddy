// AI가 가끔 JSON string 값 안에 escape 안 한 raw newline/tab/control char를 넣어
// JSON.parse가 깨지는 케이스를 흡수한다.
// 1차 시도가 실패하면 string 리터럴 내부의 제어 문자만 escape해 재시도.
export function safeJsonParse<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return JSON.parse(repairControlCharsInStrings(raw)) as T;
  }
}

function repairControlCharsInStrings(s: string): string {
  let out = "";
  let inString = false;
  let escape = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (escape) {
      out += ch;
      escape = false;
      continue;
    }

    if (ch === "\\") {
      out += ch;
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }

    if (inString) {
      if (ch === "\n") { out += "\\n"; continue; }
      if (ch === "\r") { out += "\\r"; continue; }
      if (ch === "\t") { out += "\\t"; continue; }
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        out += "\\u" + code.toString(16).padStart(4, "0");
        continue;
      }
    }

    out += ch;
  }

  return out;
}
