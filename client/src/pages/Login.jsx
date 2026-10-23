import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [mfaStep, setMfaStep] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Sample logins for faculty evaluation
    const demoAccounts = [
        {
            label: "Student 1 (Aarav - Room B-304)",
            role: "student",
            badgeColor: "#3b82f6",
            badgeBg: "#eff6ff",
            email: "student@hostelfix.com",
            password: "Student12345",
            icon: "🎓"
        },
        {
            label: "Student 2 (Priya - Room A-102)",
            role: "student",
            badgeColor: "#059669",
            badgeBg: "#ecfdf5",
            email: "priya@hostelfix.com",
            password: "Student12345",
            icon: "🎓"
        },
        {
            label: "Hostel Staff / Warden",
            role: "staff",
            badgeColor: "#d97706",
            badgeBg: "#fffbeb",
            email: "staff@hostelfix.com",
            password: "Staff12345",
            icon: "🛠️"
        }
    ];

    const handleFillDemo = (acc) => {
        setEmail(acc.email);
        setPassword(acc.password);
        setError("");
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const payload = {
                email,
                password,
                ...(mfaStep ? { totpCode } : {})
            };

            const response = await API.post("/auth/login", payload);

            // If 2FA is required for this user
            if (response.data.mfaRequired) {
                setMfaStep(true);
                setLoading(false);
                return;
            }

            localStorage.setItem(
                "token",
                response.data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

            if (response.data.user.role === "staff") {
                navigate("/staff-dashboard");
            } else {
                navigate("/dashboard");
            }

        } catch (error) {
            if (!error.response) {
                setError(
                    "Cannot reach backend server. Please make sure 'node server.js' is running on port 5000!"
                );
            } else {
                setError(
                    error.response?.data?.message ||
                    "Invalid email or password. Please verify credentials."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hf-auth-page">
            <div className="hf-auth-card" style={{ maxWidth: "460px" }}>
                <div className="hf-auth-logo">
                    <div className="hf-logo-icon" style={{ marginBottom: "12px", width: "45px", height: "45px", borderRadius: "12px" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m12 3-10 9h3v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8h3L12 3z"/>
                        </svg>
                    </div>
                    <h1>HostelFix</h1>
                    <p>{mfaStep ? "Two-Factor Verification (TOTP)" : "Resolve room issues in a snap"}</p>
                </div>

                {error && <div className="hf-error">{error}</div>}

                <form onSubmit={handleLogin}>
                    {!mfaStep ? (
                        <>
                            <div className="hf-form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    id="email"
                                    className="hf-input"
                                    type="email"
                                    placeholder="your.email@college.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="hf-form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    className="hf-input"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button className="hf-auth-button" type="submit" disabled={loading}>
                                {loading ? "Logging in..." : "Log In"}
                            </button>

                            {/* DEMO / SAMPLE LOGINS FOR FACULTY EVALUATION */}
                            <div style={{
                                marginTop: "20px",
                                padding: "14px",
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                textAlign: "left"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "14px" }}>⚡</span>
                                    <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#475569" }}>
                                        Sample Logins (Click to Auto-Fill):
                                    </span>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {demoAccounts.map((acc, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleFillDemo(acc)}
                                            style={{
                                                padding: "8px 10px",
                                                background: "#ffffff",
                                                border: "1px solid #cbd5e1",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                transition: "all 0.2s ease"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = acc.badgeColor;
                                                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = "#cbd5e1";
                                                e.currentTarget.style.boxShadow = "none";
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b", display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <span>{acc.icon}</span> {acc.label}
                                                </div>
                                                <div style={{ fontSize: "11px", color: "#64748b" }}>
                                                    {acc.email} | <span style={{ fontFamily: "monospace" }}>{acc.password}</span>
                                                </div>
                                            </div>
                                            <span style={{
                                                fontSize: "11px",
                                                fontWeight: "600",
                                                padding: "2px 8px",
                                                borderRadius: "12px",
                                                color: acc.badgeColor,
                                                background: acc.badgeBg,
                                                border: `1px solid ${acc.badgeColor}33`
                                            }}>
                                                Use
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ textAlign: "center", marginBottom: "16px", padding: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px" }}>
                                <p style={{ fontSize: "13px", color: "#166534", margin: 0 }}>
                                    🔒 <strong>Two-Factor Authentication Active</strong><br />
                                    Enter the 6-digit code from Google or Microsoft Authenticator
                                </p>
                            </div>

                            <div className="hf-form-group">
                                <label htmlFor="totpCode">6-Digit Authenticator Code</label>
                                <input
                                    id="totpCode"
                                    className="hf-input"
                                    type="text"
                                    maxLength="6"
                                    pattern="\d{6}"
                                    autoFocus
                                    placeholder="123456"
                                    style={{ letterSpacing: "4px", textAlign: "center", fontSize: "18px", fontWeight: "bold" }}
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value)}
                                    required
                                />
                            </div>

                            <button className="hf-auth-button" type="submit" disabled={loading}>
                                {loading ? "Verifying..." : "Verify & Sign In"}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setMfaStep(false); setTotpCode(""); setError(""); }}
                                style={{ marginTop: "10px", width: "100%", background: "transparent", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "13px" }}
                            >
                                ← Back to credentials
                            </button>
                        </>
                    )}
                </form>

                {!mfaStep && (
                    <div className="hf-auth-footer">
                        <p>
                            Don't have an account?{" "}
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/register"); }}>
                                Register
                            </a>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Login;