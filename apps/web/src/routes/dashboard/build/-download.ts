import { api } from "@/utils/axios";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadFile(path: string, content: string): void {
  const filename = path.split("/").pop() || path;
  triggerDownload(new Blob([content], { type: "text/plain" }), filename);
}

export async function downloadZip(sessionId: string): Promise<void> {
  const res = await api.get(`/agent/sandbox/${sessionId}/download`, {
    responseType: "blob",
  });
  triggerDownload(res.data, `${sessionId}.zip`);
}
