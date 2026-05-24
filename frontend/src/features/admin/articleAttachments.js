export function buildPendingAttachments(files, apiMode, createObjectUrl = (file) => URL.createObjectURL(file)) {
  return Array.from(files || []).map((file) => ({
    name: file.name,
    size: file.size,
    type: (file.name.split(".").pop() || "").toUpperCase(),
    url: apiMode ? "" : createObjectUrl(file),
    uploading: apiMode,
  }));
}
