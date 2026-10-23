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
            setError(
                error.response?.data?.message ||
                "Authentication failed. Please verify credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hf-auth-page">
            <div className="hf-auth-card">
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