import { api } from "@/utils/axios";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// The file's own content is already in the query cache — no API call needed,
// just package it as a Blob and hand it to the browser's download flow.
export function downloadFile(path: string, content: string): void {
  const filename = path.split("/").pop() || path;
  triggerDownload(new Blob([content], { type: "text/plain" }), filename);
}

// Unlike a single file, the full project has to be zipped server-side (the
// sandbox's files live in E2B, not in anything the browser can reach directly).
export async function downloadZip(sessionId: string): Promise<void> {
  const res = await api.get(`/agent/sandbox/${sessionId}/download`, {
    responseType: "blob",
  });
  triggerDownload(res.data, `${sessionId}.zip`);
}
