import { useState, useEffect, useCallback } from "react";
import { apiAssistantStatus, authFetch } from "../../api.js";
import { API_BASE } from "../../constants/index.js";
import StatusPanel from "./StatusPanel.jsx";
import UpdatePanel from "./UpdatePanel.jsx";
import TestChatPanel from "./TestChatPanel.jsx";
import AssistantSettingsPanel from "./AssistantSettingsPanel.jsx";

const POLL_INTERVAL = 3000;

async function readJson(response) {
  return response.json().catch(() => null);
}

function getErrorMessage(data, fallback) {
  if (!data?.detail) return fallback;
  if (typeof data.detail === "string") return data.detail;
  return fallback;
}

export default function ChatSettings() {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const assistant = await apiAssistantStatus();
      let updateStatus = {};
      let updateError = null;

      try {
        const updateRes = await authFetch(`${API_BASE}/admin/update/status`);
        const updateData = await readJson(updateRes);
        if (!updateRes.ok) {
          throw new Error(getErrorMessage(updateData, `HTTP ${updateRes.status}`));
        }
        updateStatus = updateData || {};
      } catch (e) {
        updateError = e.message || "Не удалось получить статус обновления индекса";
      }

      setStatus({ ...updateStatus, assistant, updateError });
      setStatusError(null);
    } catch (e) {
      setStatusError(e.message || "Не удалось получить статус ассистента");
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const runTask = useCallback(async (endpoint) => {
    const res = await authFetch(`${API_BASE}${endpoint}`, { method: "POST" });
    const data = await readJson(res);
    if (!res.ok) {
      throw new Error(getErrorMessage(data, `HTTP ${res.status}`));
    }
    await fetchStatus();
    return data;
  }, [fetchStatus]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <AssistantSettingsPanel onSaved={fetchStatus} />
        <StatusPanel
          status={status}
          loading={loadingStatus}
          error={statusError}
        />
        <UpdatePanel
          status={status}
          onRun={runTask}
        />
      </div>

      <TestChatPanel />
    </div>
  );
}
