import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function StudentDashboard() {
    const navigate = useNavigate();

    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search and filter states
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");

    // MFA Modal and State
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
    const [isMfaEnabled, setIsMfaEnabled] = useState(user?.isMfaEnabled || false);
    const [mfaModalOpen, setMfaModalOpen] = useState(false);
    const [mfaQrCode, setMfaQrCode] = useState("");
    const [mfaSecret, setMfaSecret] = useState("");
    const [totpInput, setTotpInput] = useState("");
    const [mfaMessage, setMfaMessage] = useState("");
    const [mfaError, setMfaError] = useState("");
    const [mfaActionLoading, setMfaActionLoading] = useState(false);
    const [disablePassword, setDisablePassword] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [complaintsRes, profileRes] = await Promise.allSettled([
                    API.get("/complaints"),
                    API.get("/auth/me")
                ]);

                if (complaintsRes.status === "fulfilled") {
                    setComplaints(complaintsRes.value.data);
                }

                if (profileRes.status === "fulfilled") {
                    const profile = profileRes.value.data;
                    setIsMfaEnabled(profile.isMfaEnabled);
                    const updatedUser = { ...user, isMfaEnabled: profile.isMfaEnabled };
                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                }
            } catch (error) {
                console.error(error);
                if (error.response?.status === 401) {
                    localStorage.clear();
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    // Open MFA Setup
    const handleOpenMfaModal = async () => {
        setMfaModalOpen(true);
        setMfaMessage("");
        setMfaError("");
        setTotpInput("");

        if (!isMfaEnabled) {
            setMfaActionLoading(true);
            try {
                const res = await API.post("/auth/mfa/setup");
                setMfaQrCode(res.data.qrCode);
                setMfaSecret(res.data.secret);
            } catch (err) {
                setMfaError(err.response?.data?.message || "Failed to initiate MFA setup");
            } finally {
                setMfaActionLoading(false);
            }
        }
    };

    // Verify and enable MFA
    const handleVerifyMfa = async (e) => {
        e.preventDefault();
        setMfaError("");
        setMfaActionLoading(true);

        try {
            const res = await API.post("/auth/mfa/verify", { totpCode: totpInput });
            setIsMfaEnabled(true);
            setMfaMessage("Two-factor authentication successfully enabled!");
            const updatedUser = { ...user, isMfaEnabled: true };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (err) {
            setMfaError(err.response?.data?.message || "Invalid 6-digit code. Please check your authenticator app.");
        } finally {
            setMfaActionLoading(false);
        }
    };

    // Disable MFA
    const handleDisableMfa = async (e) => {
        e.preventDefault();
        setMfaError("");
        setMfaActionLoading(true);

        try {
            await API.post("/auth/mfa/disable", { password: disablePassword });
            setIsMfaEnabled(false);
            setMfaQrCode("");
            setMfaSecret("");
            setDisablePassword("");
            setMfaMessage("Two-factor authentication has been disabled.");
            const updatedUser = { ...user, isMfaEnabled: false };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (err) {
            setMfaError(err.response?.data?.message || "Failed to disable MFA. Please check password.");
        } finally {
            setMfaActionLoading(false);
        }
    };

    // Calculate stats
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === "Pending").length;
    const inProgress = complaints.filter((c) => c.status === "In Progress").length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;

    // Filter complaints
    const filteredComplaints = complaints.filter((c) => {
        const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                             c.description.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "All" || c.status === statusFilter;
        const matchesCategory = categoryFilter === "All" || c.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    if (loading) {
        return (
            <div className="hf-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
                <h2 style={{ color: "var(--text-muted)", fontWeight: 500 }}>Loading Dashboard...</h2>
            </div>
        );
    }

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
                <div className="hf-user-area" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                        onClick={handleOpenMfaModal}
                        style={{
                            background: isMfaEnabled ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            color: isMfaEnabled ? "#059669" : "#dc2626",
                            border: `1px solid ${isMfaEnabled ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                            borderRadius: "20px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                    >
                        <span>{isMfaEnabled ? "🛡️ 2FA Enabled" : "⚠️ Enable 2FA"}</span>
                    </button>

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

            {/* MAIN CONTAINER */}
            <div className="hf-page">
                <div className="hf-container">
                    {/* HEADING */}
                    <div className="hf-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
                        <div style={{ flex: 1 }}>
                            <h1>Student Dashboard</h1>
                            <p>Submit and monitor complaints for Room {user?.roomNumber}.</p>
                        </div>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button className="hf-btn hf-btn-primary" onClick={() => navigate("/complaints/new")}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                New Complaint
                            </button>
                        </div>
                    </div>

                    {/* STATS */}
                    <div className="hf-stats">
                        <div className="hf-stat-card">
                            <h3>Total Submitted</h3>
                            <div className="hf-stat-number">{total}</div>
                        </div>
                        <div className="hf-stat-card stat-pending">
                            <h3>Pending</h3>
                            <div className="hf-stat-number">{pending}</div>
                        </div>
                        <div className="hf-stat-card stat-progress">
                            <h3>In Progress</h3>
                            <div className="hf-stat-number">{inProgress}</div>
                        </div>
                        <div className="hf-stat-card stat-resolved">
                            <h3>Resolved</h3>
                            <div className="hf-stat-number">{resolved}</div>
                        </div>
                    </div>

                    {/* COMPLAINTS LIST HEADER */}
                    <div className="hf-section-header">
                        <h2>My Complaints</h2>
                    </div>

                    {/* CONTROLS (SEARCH & FILTER) */}
                    <div className="hf-controls">
                        <div className="hf-search-container">
                            <span className="hf-search-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                </svg>
                            </span>
                            <input
                                type="text"
                                className="hf-search"
                                placeholder="Search by title or description..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <select
                            className="hf-filter"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            <option value="Electrical">Electrical</option>
                            <option value="Plumbing">Plumbing</option>
                            <option value="Cleaning">Cleaning</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Internet">Internet</option>
                            <option value="Other">Other</option>
                        </select>

                        <select
                            className="hf-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                    </div>

                    {/* COMPLAINTS LIST */}
                    {filteredComplaints.length === 0 ? (
                        <div className="hf-empty">
                            <div className="hf-empty-icon">📋</div>
                            <h3>No complaints found</h3>
                            <p>
                                {complaints.length === 0
                                    ? "You haven't submitted any complaints yet."
                                    : "No complaints match your active filters."}
                            </p>
                            {complaints.length === 0 && (
                                <button className="hf-btn hf-btn-primary" onClick={() => navigate("/complaints/new")}>
                                    Submit First Complaint
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="hf-complaints">
                            {filteredComplaints.map((complaint) => (
                                <div className="hf-complaint-card" key={complaint._id}>
                                    <div className="hf-complaint-top">
                                        <div>
                                            <div className="hf-complaint-title">{complaint.title}</div>
                                        </div>
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

                                    <p className="hf-description">{complaint.description}</p>

                                    <div className="hf-meta">
                                        <span className="hf-meta-item">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                                <polyline points="9 22 9 12 15 12 15 22"/>
                                            </svg>
                                            Room {complaint.roomNumber}
                                        </span>
                                        <span className="hf-meta-item">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
                                            </svg>
                                            {complaint.category}
                                        </span>
                                        <span className="hf-meta-item">
                                            <span className={`priority-badge ${
                                                complaint.priority === "Low"
                                                    ? "priority-low"
                                                    : complaint.priority === "Medium"
                                                    ? "priority-medium"
                                                    : "priority-high"
                                            }`}>
                                                {complaint.priority} Priority
                                            </span>
                                        </span>
                                        <span className="hf-meta-item" style={{ marginLeft: "auto" }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                            </svg>
                                            {new Date(complaint.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                        </span>
                                    </div>

                                    <div className="hf-card-actions">
                                        <button className="hf-btn hf-btn-secondary" onClick={() => navigate(`/complaints/${complaint._id}`)}>
                                            View Progress Details
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MFA MODAL */}
            {mfaModalOpen && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 1000,
                    padding: "20px"
                }}>
                    <div style={{
                        background: "#ffffff",
                        borderRadius: "16px",
                        maxWidth: "480px",
                        width: "100%",
                        padding: "28px",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                        position: "relative"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h2 style={{ margin: 0, fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <span>🔐</span> Two-Factor Authentication (TOTP)
                            </h2>
                            <button
                                onClick={() => setMfaModalOpen(false)}
                                style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#9ca3af" }}
                            >
                                ×
                            </button>
                        </div>

                        {mfaMessage && (
                            <div style={{ padding: "10px 14px", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", borderRadius: "8px", marginBottom: "14px", fontSize: "14px" }}>
                                ✅ {mfaMessage}
                            </div>
                        )}

                        {mfaError && (
                            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", marginBottom: "14px", fontSize: "14px" }}>
                                ⚠️ {mfaError}
                            </div>
                        )}

                        {isMfaEnabled ? (
                            <div>
                                <div style={{ textAlign: "center", padding: "16px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0", marginBottom: "18px" }}>
                                    <div style={{ fontSize: "36px", marginBottom: "6px" }}>🛡️</div>
                                    <h3 style={{ margin: "0 0 4px 0", color: "#166534" }}>Account is MFA Protected</h3>
                                    <p style={{ margin: 0, fontSize: "13px", color: "#15803d" }}>
                                        Every login requires a 6-digit TOTP code from Google or Microsoft Authenticator.
                                    </p>
                                </div>

                                <form onSubmit={handleDisableMfa} style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
                                    <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "10px" }}>
                                        To disable 2FA, confirm your account password:
                                    </p>
                                    <input
                                        type="password"
                                        placeholder="Enter password"
                                        className="hf-input"
                                        value={disablePassword}
                                        onChange={(e) => setDisablePassword(e.target.value)}
                                        required
                                        style={{ marginBottom: "12px" }}
                                    />
                                    <button
                                        type="submit"
                                        className="hf-btn"
                                        disabled={mfaActionLoading}
                                        style={{ width: "100%", background: "#ef4444", color: "#ffffff", border: "none" }}
                                    >
                                        {mfaActionLoading ? "Processing..." : "Disable Two-Factor Authentication"}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontSize: "14px", color: "#4b5563", marginTop: 0, lineHeight: 1.5 }}>
                                    Protect your HostelFix account with Google or Microsoft Authenticator.
                                </p>

                                {mfaActionLoading && !mfaQrCode ? (
                                    <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>Generating QR code...</div>
                                ) : (
                                    <>
                                        {mfaQrCode && (
                                            <div style={{ textAlign: "center", margin: "16px 0" }}>
                                                <img
                                                    src={mfaQrCode}
                                                    alt="Authenticator QR Code"
                                                    style={{ width: "170px", height: "170px", border: "2px solid #e5e7eb", borderRadius: "10px", padding: "6px" }}
                                                />
                                                <div style={{ marginTop: "8px", fontSize: "12px", color: "#6b7280" }}>
                                                    Secret Key: <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>{mfaSecret}</code>
                                                </div>
                                            </div>
                                        )}

                                        <form onSubmit={handleVerifyMfa}>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                                                Enter 6-digit Authenticator Code:
                                            </label>
                                            <input
                                                type="text"
                                                maxLength="6"
                                                pattern="\d{6}"
                                                placeholder="123456"
                                                className="hf-input"
                                                value={totpInput}
                                                onChange={(e) => setTotpInput(e.target.value)}
                                                required
                                                style={{ textAlign: "center", letterSpacing: "4px", fontSize: "18px", fontWeight: "bold", marginBottom: "14px" }}
                                            />
                                            <button
                                                type="submit"
                                                className="hf-btn hf-btn-primary"
                                                disabled={mfaActionLoading}
                                                style={{ width: "100%" }}
                                            >
                                                {mfaActionLoading ? "Verifying..." : "Verify & Activate 2FA"}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentDashboard;