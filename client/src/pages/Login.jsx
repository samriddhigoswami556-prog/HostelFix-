import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await API.post("/auth/login", {
                email,
                password
            });

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
                "Invalid email or password"
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
                    <p>Resolve room issues in a snap</p>
                </div>

                {error && <div className="hf-error">{error}</div>}

                <form onSubmit={handleLogin}>
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
                </form>

                <div className="hf-auth-footer">
                    <p>
                        Don't have an account?{" "}
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/register"); }}>
                            Register
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;