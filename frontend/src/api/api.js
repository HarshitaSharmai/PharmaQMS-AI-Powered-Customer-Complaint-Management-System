import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/** Extract complaint fields from an uploaded file (multipart/form-data). */
export async function extractFromFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/api/ai/extract", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** Extract complaint fields from pasted text. */
export async function extractFromText(text) {
  const formData = new FormData();
  formData.append("text", text);
  const { data } = await api.post("/api/ai/extract", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function sendChatMessage(message, currentFields) {
  const { data } = await api.post("/api/ai/chat", {
    message,
    current_fields: currentFields,
  });
  return data;
}

export async function createComplaint(payload) {
  const { data } = await api.post("/api/complaints", payload);
  return data;
}

export async function listComplaints() {
  const { data } = await api.get("/api/complaints");
  return data;
}

export async function updateComplaint(id, payload) {
  const { data } = await api.put(`/api/complaints/${id}`, payload);
  return data;
}
