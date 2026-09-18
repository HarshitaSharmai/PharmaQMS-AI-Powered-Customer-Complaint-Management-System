const COMPLAINT_SOURCES = ["Email", "Phone Call", "Customer Portal", "Distributor", "Field Visit", "Regulatory Authority"];
const COMPLAINT_TYPES = [
  "Discoloration",
  "Foreign Particle",
  "Packaging Defect",
  "Short Shelf Life",
  "Efficacy Issue",
  "Documentation Error",
  "Physical Damage",
  "Labeling Error",
  "Other",
];
const SEVERITIES = ["Critical", "Major", "Minor"];
const PRIORITIES = ["High", "Medium", "Low"];

function Field({ label, name, value, onChange, placeholder, missing, full, hint }) {
  return (
    <div className={`form-field${full ? " full" : ""}`}>
      <label className="form-label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        className={`input${value ? " ai-filled" : ""}`}
        value={value || ""}
        placeholder={placeholder || "Awaiting AI extraction..."}
        onChange={(e) => onChange(name, e.target.value)}
      />
      {missing && <span className="form-hint">Missing - required for complete record</span>}
      {hint && !missing && <span className="form-hint">{hint}</span>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, missing }) {
  return (
    <div className="form-field">
      <label className="form-label" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        className={`select${value ? " ai-filled" : ""}`}
        value={value || ""}
        onChange={(e) => onChange(name, e.target.value)}
      >
        <option value="">Awaiting AI extraction...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {missing && <span className="form-hint">Missing - required for complete record</span>}
    </div>
  );
}

function DateField({ label, name, value, onChange, missing }) {
  return (
    <div className="form-field">
      <label className="form-label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        className={`input${value ? " ai-filled" : ""}`}
        value={value || ""}
        placeholder="DD-MM-YYYY"
        onChange={(e) => onChange(name, e.target.value)}
      />
      {missing && <span className="form-hint">Missing - required for complete record</span>}
    </div>
  );
}

export default function ComplaintForm({ fields, onFieldChange, onReset, onSave, isSaving, missingFields = [] }) {
  const isMissing = (name) => missingFields.includes(name);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h1 className="panel-title">Log Customer Complaint</h1>
          <p className="panel-subtitle">API &amp; FDF Quality Assurance Module</p>
        </div>
        <span className="badge badge-warning">Pending Triage</span>
      </div>

      <div className="form-body">
        <div className="form-section">
          <h2 className="form-section-label">1. Origin &amp; Customer Details</h2>
          <div className="form-row">
            <SelectField
              label="Complaint Source"
              name="complaint_source"
              value={fields.complaint_source}
              onChange={onFieldChange}
              options={COMPLAINT_SOURCES}
              missing={isMissing("complaint_source")}
            />
            <Field
              label="Customer Name"
              name="customer_name"
              value={fields.customer_name}
              onChange={onFieldChange}
              missing={isMissing("customer_name")}
            />
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-label">2. Product &amp; Batch Identification</h2>
          <div className="form-row">
            <Field
              label="Product Name"
              name="product_name"
              value={fields.product_name}
              onChange={onFieldChange}
              missing={isMissing("product_name")}
            />
            <Field
              label="Product Strength/Grade"
              name="product_strength_grade"
              value={fields.product_strength_grade}
              onChange={onFieldChange}
              placeholder="e.g. 500mg, USP Grade"
            />
          </div>
          <div className="form-row">
            <Field
              label="Batch/Lot Number"
              name="batch_lot_number"
              value={fields.batch_lot_number}
              onChange={onFieldChange}
              missing={isMissing("batch_lot_number")}
            />
            <DateField
              label="Manufacturing Date"
              name="manufacturing_date"
              value={fields.manufacturing_date}
              onChange={onFieldChange}
              missing={isMissing("manufacturing_date")}
            />
          </div>
          <div className="form-row">
            <DateField
              label="Expiry Date"
              name="expiry_date"
              value={fields.expiry_date}
              onChange={onFieldChange}
              missing={isMissing("expiry_date")}
            />
            <div className="form-field">
              <label className="form-label" htmlFor="quantity_affected">
                Quantity Affected
              </label>
              <div className="input-with-suffix">
                <input
                  id="quantity_affected"
                  className={`input${fields.quantity_affected ? " ai-filled" : ""}`}
                  value={fields.quantity_affected || ""}
                  placeholder="Awaiting AI extraction..."
                  onChange={(e) => onFieldChange("quantity_affected", e.target.value)}
                />
                <span className="input-suffix">{fields.quantity_unit || "kg"}</span>
              </div>
              {isMissing("quantity_affected") && (
                <span className="form-hint">Missing - required for complete record</span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-label">3. Complaint Details</h2>
          <div className="form-row">
            <SelectField
              label="Complaint Type"
              name="complaint_type"
              value={fields.complaint_type}
              onChange={onFieldChange}
              options={COMPLAINT_TYPES}
              missing={isMissing("complaint_type")}
            />
            <DateField
              label="Complaint Date"
              name="complaint_date"
              value={fields.complaint_date}
              onChange={onFieldChange}
              missing={isMissing("complaint_date")}
            />
          </div>
          <div className="form-row">
            <div className="form-field full">
              <label className="form-label" htmlFor="detailed_description">
                Detailed Complaint Description
              </label>
              <textarea
                id="detailed_description"
                className={`textarea${fields.detailed_description ? " ai-filled" : ""}`}
                value={fields.detailed_description || ""}
                placeholder="Awaiting AI extraction..."
                onChange={(e) => onFieldChange("detailed_description", e.target.value)}
              />
              {isMissing("detailed_description") && (
                <span className="form-hint">Missing - required for complete record</span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-label">4. Initial Assessment &amp; Priority</h2>
          <div className="form-row">
            <SelectField
              label="Initial Severity"
              name="initial_severity"
              value={fields.initial_severity}
              onChange={onFieldChange}
              options={SEVERITIES}
              missing={isMissing("initial_severity")}
            />
            <SelectField
              label="Priority"
              name="priority"
              value={fields.priority}
              onChange={onFieldChange}
              options={PRIORITIES}
              missing={isMissing("priority")}
            />
          </div>
        </div>
      </div>

      <div className="form-footer">
        <button className="btn btn-secondary" onClick={onReset} type="button">
          ↺ Reset Form
        </button>
        <button className="btn btn-primary" onClick={onSave} disabled={isSaving} type="button">
          {isSaving ? "Saving..." : "🖫 Save Complaint"}
        </button>
      </div>
    </section>
  );
}
