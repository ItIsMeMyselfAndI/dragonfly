const API_BASE = "/api/v2/storage";

export async function uploadToStorage(file: File, path: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", path);
  
  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) throw new Error("Failed to upload file");
  return await response.json();
}

export async function deleteFromStorage(path: string) {
  const response = await fetch(`${API_BASE}/delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });
  
  if (!response.ok) throw new Error("Failed to delete file");
  return await response.json();
}
