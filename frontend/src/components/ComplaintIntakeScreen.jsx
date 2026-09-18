import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ComplaintForm from "./ComplaintForm.jsx";
import AIAssistantPanel from "./AIAssistantPanel.jsx";
import {
  setField,
  startExtraction,
  setExtractionProgress,
  extractionSucceeded,
  extractionFailed,
  startSaving,
  saveSucceeded,
  saveFailed,
  resetForm,
} from "../store/slices/complaintSlice.js";
import { clearChat, addMessage } from "../store/slices/chatSlice.js";
import { extractFromFile, extractFromText, createComplaint } from "../api/api.js";

// Fake staged progress so the (usually sub-second) extraction call still
// reads as a multi-step AI pipeline in the UI, mirroring the reference demo.
const PROGRESS_STAGES = [
  { progress: 15, stage: "Reading document content..." },
  { progress: 35, stage: "Extracting structured fields..." },
  { progress: 55, stage: "Checking completeness..." },
  { progress: 70, stage: "Scanning for duplicate complaints..." },
  { progress: 85, stage: "Running AI risk classification..." },
  { progress: 95, stage: "Generating summary & CAPA suggestions..." },
];

export default function ComplaintIntakeScreen({ onSaved }) {
  const dispatch = useDispatch();
  const complaint = useSelector((state) => state.complaint);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const runStagedProgress = async () => {
    for (const step of PROGRESS_STAGES) {
      await new Promise((r) => setTimeout(r, 220));
      dispatch(setExtractionProgress(step));
    }
  };

  const handleExtractionResult = (result) => {
    dispatch(extractionSucceeded(result));
    dispatch(addMessage({ role: "assistant", content: result.assistant_message }));
  };

  const handleFile = async (file) => {
    dispatch(startExtraction({ fileName: file.name }));
    dispatch(addMessage({ role: "user", content: `Uploaded document: ${file.name}` }));
    try {
      const [result] = await Promise.all([extractFromFile(file), runStagedProgress()]);
      handleExtractionResult(result);
    } catch (err) {
      dispatch(extractionFailed(err?.response?.data?.detail || "Extraction failed. Please try again."));
      dispatch(addMessage({ role: "assistant", content: "Sorry, I couldn't process that document. Please try again or paste the text instead." }));
    }
  };

  const handlePasteText = async (text) => {
    dispatch(startExtraction({}));
    dispatch(addMessage({ role: "user", content: "Pasted complaint text for extraction." }));
    try {
      const [result] = await Promise.all([extractFromText(text), runStagedProgress()]);
      handleExtractionResult(result);
    } catch (err) {
      dispatch(extractionFailed(err?.response?.data?.detail || "Extraction failed. Please try again."));
      dispatch(addMessage({ role: "assistant", content: "Sorry, I couldn't process that text. Please try again." }));
    }
  };

  const handleFieldChange = (name, value) => {
    dispatch(setField({ name, value }));
  };

  const handleReset = () => {
    dispatch(resetForm());
    dispatch(clearChat());
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    dispatch(startSaving());
    setSaveError(null);
    try {
      const payload = {
        ...complaint.fields,
        source_document_name: complaint.sourceDocumentName,
        raw_extracted_text: complaint.rawExtractedText,
        completeness_score: complaint.completenessScore,
        missing_fields: complaint.missingFields,
        ai_risk_classification: complaint.aiRiskClassification,
        ai_risk_rationale: complaint.aiRiskRationale,
        root_cause_suggestions: complaint.rootCauseSuggestions,
        capa_recommendations: complaint.capaRecommendations,
        ai_summary: complaint.aiSummary,
        duplicate_of: complaint.duplicateOf,
      };
      const saved = await createComplaint(payload);
      dispatch(saveSucceeded(saved));
      setSaveSuccess(true);
      setTimeout(() => {
        handleReset();
        onSaved?.();
      }, 900);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Could not save complaint. Please check required fields.";
      dispatch(saveFailed(msg));
      setSaveError(msg);
    }
  };

  return (
    <div>
      {saveError && <div className="toast-banner badge-danger">{saveError}</div>}
      {saveSuccess && <div className="toast-banner badge-success">Complaint saved successfully.</div>}
      <div className="intake-grid">
        <ComplaintForm
          fields={complaint.fields}
          onFieldChange={handleFieldChange}
          onReset={handleReset}
          onSave={handleSave}
          isSaving={complaint.isSaving}
          missingFields={complaint.missingFields}
        />
        <AIAssistantPanel
          isExtracting={complaint.isExtracting}
          extractionProgress={complaint.extractionProgress}
          extractionStage={complaint.extractionStage}
          completenessScore={complaint.completenessScore}
          missingFields={complaint.missingFields}
          aiRiskClassification={complaint.aiRiskClassification}
          aiRiskRationale={complaint.aiRiskRationale}
          rootCauseSuggestions={complaint.rootCauseSuggestions}
          capaRecommendations={complaint.capaRecommendations}
          aiSummary={complaint.aiSummary}
          duplicateOf={complaint.duplicateOf}
          currentFields={complaint.fields}
          onFile={handleFile}
          onPasteText={handlePasteText}
        />
      </div>
    </div>
  );
}
