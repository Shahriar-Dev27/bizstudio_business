/** encodeURIComponent throws URIError on a lone surrogate (possible via paste); valid text is untouched. */
export function encodeIdea(value: string): string {
  try {
    return encodeURIComponent(value);
  } catch {
    let safe = "";
    for (let i = 0; i < value.length; i += 1) {
      const unit = value.charCodeAt(i);
      const next = value.charCodeAt(i + 1);
      if (unit >= 0xd800 && unit <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) {
        safe += value[i] + value[i + 1];
        i += 1;
      } else if (unit >= 0xd800 && unit <= 0xdfff) {
        safe += "�";
      } else {
        safe += value[i];
      }
    }
    return encodeURIComponent(safe);
  }
}
