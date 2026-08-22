import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

function ComplaintDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        const fetchComplaint = async () => {
            try {
                const response = await API.get(`/complaints/${id}`);
                setComplaint(response.data);
            } catch (error) {
                console.error(error);
                if (error.response?.status === 401) {
                    localStorage.clear();
                    navigate("/login");
                    return;
                }
                setError(
                    error.response?.data?.message ||
                    "Failed to load complaint details"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchComplaint();
    }, [id, navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    if (loading) {
        return (
            <div className="hf-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
                <h2 style={{ color: "var(--text-muted)", fontWeight: 500 }}>Loading complaint details...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="hf-page">
                <div className="hf-container" style={{ maxWidth: "600px", textAlign: "center" }}>
                    <div className="hf-error" style={{ textAlign: "center", padding: "24px" }}>
                        <h3 style={{ marginBottom: "8px" }}>Error</h3>
                        <p>{error}</p>
                    </div>
                    <button className="hf-btn hf-btn-primary" onClick={() => navigate("/dashboard")}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="hf-page">
                <div className="hf-container" style={{ maxWidth: "600px", textAlign: "center" }}>
                    <div className="hf-empty">
                        <div className="hf-empty-icon">🔍</div>
                        <h3>Complaint not found</h3>
                        <p>The complaint you are trying to view does not exist or has been removed.</p>
                        <button className="hf-btn hf-btn-primary" onClick={() => navigate("/dashboard")}>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Determine timeline status states
    const isPendingActive = ["Pending", "In Progress", "Resolved"].includes(complaint.status);
    const isInProgressActive = ["In Progress", "Resolved"].includes(complaint.status);
    const isResolvedActive = complaint.status === "Resolved";

    return (
        <div>
            {/* NAVBAR */}
            <nav className="hf-navbar">
                <div className="hf-logo">
                    <div className="hf-logo-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m12 3-10 9h3v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8h3L12 3z"/>
                        </svg>
                    </div>
                    <span>HostelFix</span>
                </div>
                <div className="hf-user-area">
                    <span className="hf-user">
                        <span style={{ fontSize: "16px" }}>👋</span>
                        <span>{user?.name}</span>
                        <span style={{ color: "var(--text-muted)", fontWeight: "normal", fontSize: "13px" }}>(Room {user?.roomNumber})</span>
                    </span>
                    <button className="hf-logout" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* PAGE CONTENT */}
            <div className="hf-page">
                <div className="hf-container">
                    {/* BACK ACTION */}
                    <div style={{ marginBottom: "20px" }}>
                        <button className="hf-btn hf-btn-secondary" style={{ padding: "8px 14px", fontWeight: 600 }} onClick={() => navigate("/dashboard")}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                            </svg>
                            Back to Dashboard
                        </button>
                    </div>

                    <div className="hf-heading">
                        <h1>Complaint details</h1>
                        <p>Track progress of your submitted issue.</p>
                    </div>

                    {/* DETAIL GRID */}
                    <div className="hf-detail-grid">
                        
                        {/* LEFT: COMPLAINT MAIN DETAILS */}
                        <div className="hf-detail-main">
                            <div className="hf-detail-header">
                                <div className="hf-detail-title">{complaint.title}</div>
                                <span className={`status-badge ${
                                    complaint.status === "Pending"
                                        ? "status-pending"
                                        : complaint.status === "In Progress"
                                        ? "status-progress"
                                        : "status-resolved"
                                }`}>
                                    {complaint.status}
                                </span>
                            </div>

                            <div style={{ marginBottom: "24px" }}>
                                <h3 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: 700 }}>
                                    Issue Description
                                </h3>
                                <p style={{ fontSize: "16px", color: "var(--text-main)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                                    {complaint.description}
                                </p>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", borderTop: "1px solid var(--border-color)", paddingTop: "24px" }}>
                                <div>
                                    <span style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>Category</span>
                                    <span className="hf-meta-item" style={{ fontSize: "14px", fontWeight: 600 }}>
                                        {complaint.category}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>Priority</span>
                                    <span className={`priority-badge ${
                                        complaint.priority === "Low"
                                            ? "priority-low"
                                            : complaint.priority === "Medium"
                                            ? "priority-medium"
                                            : "priority-high"
                                    }`}>
                                        {complaint.priority}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ display: "block", fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>Room Number</span>
                                    <span className="hf-meta-item" style={{ fontSize: "14px", fontWeight: 600 }}>
                                        Room {complaint.roomNumber}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: TIMELINE SIDEBAR */}
                        <div className="hf-detail-sidebar">
                            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, paddingBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>
                                Progress Timeline
                            </h2>

                            <div className="hf-timeline">
                                {/* SUBMITTED */}
                                <div className="hf-timeline-item active">
                                    <div className="hf-timeline-dot" style={{ borderColor: "var(--primary)", backgroundColor: "var(--primary)" }} />
                                    <div className="hf-timeline-title">Submitted</div>
                                    <div className="hf-timeline-desc">
                                        Received on {new Date(complaint.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                </div>

                                {/* PENDING */}
                                <div className={`hf-timeline-item pending ${isPendingActive ? "active" : ""}`}>
                                    <div className="hf-timeline-dot" />
                                    <div className="hf-timeline-title">Pending Staff Action</div>
                                    <div className="hf-timeline-desc">Awaiting allocation to maintenance staff</div>
                                </div>

                                {/* IN PROGRESS */}
                                <div className={`hf-timeline-item progress ${isInProgressActive ? "active" : ""}`}>
                                    <div className="hf-timeline-dot" />
                                    <div className="hf-timeline-title">In Progress</div>
                                    <div className="hf-timeline-desc">Maintenance team is working on the fix</div>
                                </div>

                                {/* RESOLVED */}
                                <div className={`hf-timeline-item resolved ${isResolvedActive ? "active" : ""}`}>
                                    <div className="hf-timeline-dot" />
                                    <div className="hf-timeline-title">Resolved</div>
                                    <div className="hf-timeline-desc">Issue resolved and closed successfully</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default ComplaintDetails;