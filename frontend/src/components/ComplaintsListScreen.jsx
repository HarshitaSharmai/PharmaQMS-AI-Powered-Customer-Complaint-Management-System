import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStart, fetchSucceeded, fetchFailed } from "../store/slices/complaintsListSlice.js";
import { listComplaints } from "../api/api.js";

function riskBadgeClass(level) {
  if (level === "Critical") return "badge-danger";
  if (level === "Major") return "badge-warning";
  if (level === "Minor") return "badge-success";
  return "badge-neutral";
}

export default function ComplaintsListScreen() {
  const dispatch = useDispatch();
  const { items, isLoading, error } = useSelector((state) => state.complaintsList);

  useEffect(() => {
    const load = async () => {
      dispatch(fetchStart());
      try {
        const data = await listComplaints();
        dispatch(fetchSucceeded(data));
      } catch (err) {
        dispatch(fetchFailed(err?.message || "Failed to load complaints"));
      }
    };
    load();
  }, [dispatch]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h1 className="panel-title">All Complaints</h1>
          <p className="panel-subtitle">Complaints logged in the QMS, newest first</p>
        </div>
        <span className="badge badge-info">{items.length} total</span>
      </div>

      <div style={{ padding: "0 0 8px" }}>
        {isLoading && <div className="empty-state">Loading complaints...</div>}
        {error && <div className="empty-state">{error}</div>}
        {!isLoading && !error && items.length === 0 && (
          <div className="empty-state">
            No complaints logged yet. Go to <strong>Log Complaint</strong> to create one.
          </div>
        )}
        {!isLoading && !error && items.length > 0 && (
          <div className="table-wrap">
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Batch/Lot</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Priority</th>
                  <th>AI Risk</th>
                  <th>Completeness</th>
                  <th>Status</th>
                  <th>Logged</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td>{c.customer_name || "—"}</td>
                    <td>{c.product_name || "—"}</td>
                    <td>{c.batch_lot_number || "—"}</td>
                    <td>{c.complaint_type || "—"}</td>
                    <td>{c.initial_severity || "—"}</td>
                    <td>{c.priority || "—"}</td>
                    <td>
                      {c.ai_risk_classification ? (
                        <span className={`badge ${riskBadgeClass(c.ai_risk_classification)}`}>
                          {c.ai_risk_classification}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{c.completeness_score != null ? `${c.completeness_score}%` : "—"}</td>
                    <td>
                      <span className="badge badge-neutral">{c.status}</span>
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
