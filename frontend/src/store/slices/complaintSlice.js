import { createSlice } from "@reduxjs/toolkit";

export const emptyFields = {
  complaint_source: "",
  customer_name: "",
  product_name: "",
  product_strength_grade: "",
  batch_lot_number: "",
  manufacturing_date: "",
  expiry_date: "",
  quantity_affected: "",
  quantity_unit: "kg",
  complaint_type: "",
  complaint_date: "",
  detailed_description: "",
  initial_severity: "",
  priority: "",
};

const initialState = {
  fields: { ...emptyFields },
  sourceDocumentName: null,

  // AI-derived data
  completenessScore: null,
  missingFields: [],
  aiRiskClassification: null,
  aiRiskRationale: null,
  rootCauseSuggestions: [],
  capaRecommendations: [],
  aiSummary: null,
  duplicateOf: [],
  rawExtractedText: null,

  // UI state
  isExtracting: false,
  extractionProgress: 0,
  extractionStage: "",
  isSaving: false,
  savedComplaintId: null,
  error: null,
};

const complaintSlice = createSlice({
  name: "complaint",
  initialState,
  reducers: {
    setField(state, action) {
      const { name, value } = action.payload;
      state.fields[name] = value;
    },
    startExtraction(state, action) {
      state.isExtracting = true;
      state.extractionProgress = 5;
      state.extractionStage = "Uploading document...";
      state.error = null;
      state.sourceDocumentName = action.payload?.fileName || null;
    },
    setExtractionProgress(state, action) {
      state.extractionProgress = action.payload.progress;
      state.extractionStage = action.payload.stage;
    },
    extractionSucceeded(state, action) {
      const result = action.payload;
      state.fields = { ...state.fields, ...result.fields };
      state.completenessScore = result.completeness_score;
      state.missingFields = result.missing_fields || [];
      state.aiRiskClassification = result.ai_risk_classification;
      state.aiRiskRationale = result.ai_risk_rationale;
      state.rootCauseSuggestions = result.root_cause_suggestions || [];
      state.capaRecommendations = result.capa_recommendations || [];
      state.aiSummary = result.ai_summary;
      state.duplicateOf = result.duplicate_of || [];
      state.rawExtractedText = result.raw_extracted_text;
      // Auto-fill severity/priority from AI risk classification when not already set
      if (!state.fields.initial_severity && result.ai_risk_classification) {
        state.fields.initial_severity = result.ai_risk_classification;
      }
      state.isExtracting = false;
      state.extractionProgress = 100;
      state.extractionStage = "Done";
    },
    extractionFailed(state, action) {
      state.isExtracting = false;
      state.extractionProgress = 0;
      state.error = action.payload;
    },
    startSaving(state) {
      state.isSaving = true;
      state.error = null;
    },
    saveSucceeded(state, action) {
      state.isSaving = false;
      state.savedComplaintId = action.payload.id;
    },
    saveFailed(state, action) {
      state.isSaving = false;
      state.error = action.payload;
    },
    resetForm() {
      return { ...initialState };
    },
  },
});

export const {
  setField,
  startExtraction,
  setExtractionProgress,
  extractionSucceeded,
  extractionFailed,
  startSaving,
  saveSucceeded,
  saveFailed,
  resetForm,
} = complaintSlice.actions;

export default complaintSlice.reducer;
