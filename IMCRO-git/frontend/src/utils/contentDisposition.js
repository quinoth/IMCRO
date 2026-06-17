export function getDownloadFilename(contentDisposition, fallbackFilename) {
  const fallback = fallbackFilename || "download";
  if (!contentDisposition) return fallback;

  const encodedMatch = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(contentDisposition);
  if (encodedMatch) {
    const encoded = encodedMatch[1].trim().replace(/^"(.*)"$/, "$1");
    try {
      const decoded = decodeURIComponent(encoded);
      if (decoded) return decoded;
    } catch {
      // Fall through to the ASCII filename fallback below.
    }
  }

  const plainMatch = /filename\s*=\s*(?:"([^"]*)"|([^;]*))/i.exec(contentDisposition);
  const plain = (plainMatch?.[1] || plainMatch?.[2] || "").trim();
  return plain || fallback;
}
