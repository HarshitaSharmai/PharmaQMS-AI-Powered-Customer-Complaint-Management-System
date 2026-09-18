import { useState } from "react";
import FileDropzone from "./FileDropzone.jsx";
import ChatBox from "./ChatBox.jsx";

export default function AIAssistantPanel({
  isExtracting,
  extractionProgress,
  extractionStage,
  completenessScore,
  missingFields = [],
  aiRiskClassification,
  aiRiskRationale,
  rootCauseSuggestions = [],
  capaRecommendations = [],
  aiSummary,
  duplicateOf = [],
  currentFields,
  onFile,
  onPasteText,
}) {
  const [showPaste, setShowPaste] = useState(false);
  const [pasteValue, setPasteValue] = useState("");

  const hasResults = completenessScore !== null && completenessScore !== undefined;

  const riskBadgeClass =
    aiRiskClassification === "Critical"
      ? "badge-danger"
      : aiRiskClassification === "Major"
      ? "badge-warning"
      : aiRiskClassification === "Minor"
      ? "badge-success"
      : "badge-neutral";

  const handlePasteSubmit = () => {
    if (!pasteValue.trim()) return;
    onPasteText(pasteValue.trim());
    setShowPaste(false);
    setPasteValue("");
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title" style={{ fontSize: 15 }}>
            ✨ AI Complaint Intake Assistant
          </h2>
        </div>
        <span className="badge badge-info">BETA</span>
      </div>

      <div className="ai-panel-body">
        <FileDropzone onFile={onFile} disabled={isExtracting} />

        <div className="divider-or">OR</div>

        {!showPaste ? (
          <button className="paste-btn" onClick={() => setShowPaste(true)} disabled={isExtracting}>
            📄 Paste Complaint Text / Email
          </button>
        ) : (
          <div className="paste-textarea-wrap">
            <textarea
              className="textarea"
              placeholder="Paste the complaint email or text here..."
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={handlePasteSubmit} disabled={isExtracting}>
                Analyze Text
              </button>
              <button className="btn btn-secondary" onClick={() => setShowPaste(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="info-box">
          ⓘ Supported formats: PDF, DOCX, TXT, EML
          <br />
          Max file size: 10MB
        </div>

        {isExtracting && (
          <div className="progress-section">
            <div className="progress-label-row">
              <span>Extraction Progress</span>
              <span>{extractionProgress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${extractionProgress}%` }} />
            </div>
            <div className="progress-note">{extractionStage || "Analyzing document content..."}</div>
          </div>
        )}

        {hasResults && !isExtracting && (
          <>
            <div className="ai-insight-card">
              <p className="ai-insight-title">📋 Completeness Check</p>
              <p className="ai-insight-text">
                {completenessScore}% complete.{" "}
                {missingFields.length > 0
                  ? `Missing: ${missingFields.join(", ")}.`
                  : "All required fields captured."}
              </p>
            </div>

            {aiRiskClassification && (
              <div className="ai-insight-card">
                <p className="ai-insight-title">⚠️ AI Risk Classification</p>
                <span className={`badge ${riskBadgeClass}`}>{aiRiskClassification}</span>
                {aiRiskRationale && (
                  <p className="ai-insight-text" style={{ marginTop: 8 }}>
                    {aiRiskRationale}
                  </p>
                )}
              </div>
            )}

            {duplicateOf.length > 0 && (
              <div className="ai-insight-card" style={{ borderColor: "#fecaca", background: "#fff5f5" }}>
                <p className="ai-insight-title">🔁 Possible Duplicate Complaints</p>
                <ul className="ai-insight-list">
                  {duplicateOf.map((d, i) => (
                    <li key={i}>
                      Complaint #{d.id?.slice(0, 8)} - {d.reason} (match {Math.round((d.score || 0) * 100)}%)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {rootCauseSuggestions.length > 0 && (
              <div className="ai-insight-card">
                <p className="ai-insight-title">🔎 Root Cause Suggestions</p>
                <ul className="ai-insight-list">
                  {rootCauseSuggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {capaRecommendations.length > 0 && (
              <div className="ai-insight-card">
                <p className="ai-insight-title">✅ CAPA Recommendations</p>
                <ul className="ai-insight-list">
                  {capaRecommendations.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiSummary && (
              <div className="ai-insight-card">
                <p className="ai-insight-title">📝 Complaint Summary</p>
                <p className="ai-insight-text">{aiSummary}</p>
              </div>
            )}
          </>
        )}

        <ChatBox currentFields={currentFields} />
      </div>
    </section>
  );
}
