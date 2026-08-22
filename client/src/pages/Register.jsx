import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        roomNumber: "",
        phone: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await API.post("/auth/register", form);
            alert("Registration successful! Please log in.");
            navigate("/login");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Failed to register account"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hf-auth-page">
            <div className="hf-auth-card" style={{ maxWidth: "480px" }}>
                <div className="hf-auth-logo">
                    <div className="hf-logo-icon" style={{ marginBottom: "12px", width: "45px", height: "45px", borderRadius: "12px" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m12 3-10 9h3v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8h3L12 3z"/>
                        </svg>
                    </div>
                    <h1>HostelFix</h1>
                    <p>Create your student account</p>
                </div>

                {error && <div className="hf-error">{error}</div>}

                <form onSubmit={handleRegister}>
                    <div className="hf-form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            name="name"
                            className="hf-input"
                            type="text"
                            placeholder="John Doe"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="hf-form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            className="hf-input"
                            type="email"
                            placeholder="john.doe@college.edu"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="hf-form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            className="hf-input"
                            type="password"
                            placeholder="Minimum 6 characters"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "14px" }}>
                        <div className="hf-form-group">
                            <label htmlFor="roomNumber">Room Number</label>
                            <input
                                id="roomNumber"
                                name="roomNumber"
                                className="hf-input"
                                type="text"
                                placeholder="e.g. A-102"
                                value={form.roomNumber}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="hf-form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                id="phone"
                                name="phone"
                                className="hf-input"
                                type="tel"
                                placeholder="e.g. 9876543210"
                                value={form.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button className="hf-auth-button" type="submit" disabled={loading}>
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <div className="hf-auth-footer">
                    <p>
                        Already have an account?{" "}
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
                            Login
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;