const API_BASE = "/api/v2/pdf";

export async function downloadReport(data: { projectName: string; items: any[] }) {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.projectName}-report.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
