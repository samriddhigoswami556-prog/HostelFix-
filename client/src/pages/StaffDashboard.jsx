import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function StaffDashboard() {
    const navigate = useNavigate();

    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Search and filter states
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");

    const user = JSON.parse(localStorage.getItem("user"));

    const fetchComplaints = async () => {
        try {
            const response = await API.get("/staff/complaints");
            setComplaints(response.data);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 401) {
                localStorage.clear();
                navigate("/login");
                return;
            }
            if (error.response?.status === 403) {
                setError("You do not have permission to access this page.");
                return;
            }
            setError(
                error.response?.data?.message ||
                "Failed to load complaints"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await API.put(`/staff/complaints/${id}/status`, {
                status: status
            });
            await fetchComplaints();
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                "Failed to update complaint status"
            );
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    // Calculate overall stats
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === "Pending").length;
    const inProgress = complaints.filter(c => c.status === "In Progress").length;
    const resolved = complaints.filter(c => c.status === "Resolved").length;

    // Apply filtering
    const filteredComplaints = complaints.filter((c) => {
        const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                             c.description.toLowerCase().includes(search.toLowerCase()) ||
                             (c.roomNumber && c.roomNumber.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = statusFilter === "All" || c.status === statusFilter;
        const matchesCategory = categoryFilter === "All" || c.category === categoryFilter;
        const matchesPriority = priorityFilter === "All" || c.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });

    if (loading) {
        return (
            <div className="hf-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
                <h2 style={{ color: "var(--text-muted)", fontWeight: 500 }}>Loading Staff Dashboard...</h2>
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
                    <span>HostelFix Staff</span>
                </div>
                <div className="hf-user-area">
                    <span className="hf-user">
                        👤 {user?.name || "Staff Admin"}
                    </span>
                    <button className="hf-logout" onClick={logout}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* PAGE */}
            <div className="hf-page">
                <div className="hf-container">
                    
                    {/* HEADING */}
                    <div className="hf-heading">
                        <h1>Complaint Management</h1>
                        <p>Monitor, assign and update student hostel complaints.</p>
                    </div>

                    {/* STATS */}
                    <div className="hf-stats">
                        <div className="hf-stat-card">
                            <h3>Total Complaints</h3>
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

                    {/* SECTION HEADER */}
                    <div className="hf-section-header">
                        <h2>All Complaints</h2>
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
                                placeholder="Search by title, desc, room..."
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
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                        >
                            <option value="All">All Priorities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
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

                    {error && <div className="hf-error">{error}</div>}

                    {/* COMPLAINTS LIST */}
                    <div className="hf-complaints">
                        {filteredComplaints.length === 0 ? (
                            <div className="hf-empty">
                                <div className="hf-empty-icon">📋</div>
                                <h3>No complaints found</h3>
                                <p>
                                    {complaints.length === 0
                                        ? "There are currently no complaints in the system."
                                        : "No complaints matches your filters."}
                                </p>
                            </div>
                        ) : (
                            filteredComplaints.map((complaint) => (
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

                                    {/* STATUS UPDATOR CONTAINER */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "18px" }}>
                                        <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                                            Submitted by: <strong>{complaint.student?.name || "Student"}</strong>
                                        </span>

                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)" }}>
                                                Update Status:
                                            </span>
                                            <select
                                                className="hf-status-select"
                                                style={{ width: "auto", padding: "8px 12px", fontSize: "14px" }}
                                                value={complaint.status}
                                                onChange={(e) => updateStatus(complaint._id, e.target.value)}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Resolved">Resolved</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

export default StaffDashboard;