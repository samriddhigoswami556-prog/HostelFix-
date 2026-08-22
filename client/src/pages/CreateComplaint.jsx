import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function CreateComplaint() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "Electrical",
        priority: "Medium",
        roomNumber: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && user.roomNumber) {
            setForm((prev) => ({ ...prev, roomNumber: user.roomNumber }));
        }
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await API.post("/complaints", form);
            alert("Complaint submitted successfully!");
            navigate("/dashboard");
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.clear();
                navigate("/login");
                return;
            }
            setError(
                error.response?.data?.message ||
                "Failed to submit complaint"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

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

            {/* PAGE */}
            <div className="hf-page">
                <div className="hf-container" style={{ maxWidth: "700px" }}>
                    {/* BACK TO DASHBOARD */}
                    <div style={{ marginBottom: "20px" }}>
                        <button className="hf-btn hf-btn-secondary" style={{ padding: "8px 14px", fontWeight: 600 }} onClick={() => navigate("/dashboard")}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                            </svg>
                            Back to Dashboard
                        </button>
                    </div>

                    <div className="hf-heading">
                        <h1>Submit a Complaint</h1>
                        <p>Submit a new hostel fix request and our staff will resolve it shortly.</p>
                    </div>

                    {error && <div className="hf-error">{error}</div>}

                    {/* FORM CARD */}
                    <div className="hf-auth-card" style={{ maxWidth: "100%", textAlign: "left", padding: "32px" }}>
                        <form onSubmit={handleSubmit}>
                            <div className="hf-form-group">
                                <label htmlFor="title">Issue Title</label>
                                <input
                                    id="title"
                                    type="text"
                                    name="title"
                                    className="hf-input"
                                    placeholder="e.g. Ceiling fan making loud noise"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="hf-form-group">
                                <label htmlFor="description">Detailed Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    className="hf-textarea"
                                    placeholder="Describe the issue in detail. When did it start? What exactly is not working?"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows="5"
                                    required
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="hf-form-row">
                                <div className="hf-form-group">
                                    <label htmlFor="category">Category</label>
                                    <select
                                        id="category"
                                        name="category"
                                        className="hf-status-select"
                                        value={form.category}
                                        onChange={handleChange}
                                    >
                                        <option value="Electrical">Electrical</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Cleaning">Cleaning</option>
                                        <option value="Furniture">Furniture</option>
                                        <option value="Internet">Internet</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="hf-form-group">
                                    <label htmlFor="priority">Priority level</label>
                                    <select
                                        id="priority"
                                        name="priority"
                                        className="hf-status-select"
                                        value={form.priority}
                                        onChange={handleChange}
                                    >
                                        <option value="Low">Low (Can wait)</option>
                                        <option value="Medium">Medium (Normal)</option>
                                        <option value="High">High (Urgent)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="hf-form-group">
                                <label htmlFor="roomNumber">Room Number</label>
                                <input
                                    id="roomNumber"
                                    type="text"
                                    name="roomNumber"
                                    className="hf-input"
                                    placeholder="e.g. A-102"
                                    value={form.roomNumber}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                                <button
                                    type="button"
                                    className="hf-btn hf-btn-secondary"
                                    onClick={() => navigate("/dashboard")}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="hf-btn hf-btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? "Submitting..." : "Submit Complaint"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateComplaint;