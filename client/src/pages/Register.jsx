import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, User, Mail, Lock, ArrowRight } from "lucide-react";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <ShieldCheck size={28} color="#38bdf8" />
          </div>
          <h1 style={styles.title}>INITIALIZE AGENT</h1>
          <p style={styles.subtitle}>Deploy your privacy monitoring node</p>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>OPERATIVE CODENAME</label>
            <div style={styles.inputWrapper}>
              <User size={16} color="#64748b" style={styles.fieldIcon} />
              <input
                type="text"
                placeholder="Rakshita"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>COMMUNICATION NODE (EMAIL)</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} color="#64748b" style={styles.fieldIcon} />
              <input
                type="email"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>ACCESS PHRASE (PASSWORD)</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} color="#64748b" style={styles.fieldIcon} />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={styles.input}
              />
            </div>
          </div>

          <button type="submit" style={styles.submitBtn}>
            <span>Create Credentials</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Already provisioned?</span>
          <Link to="/login" style={styles.link}>
            Authenticate Session
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b0f19",
    padding: "20px",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#141b2d",
    border: "1px solid #2d3748",
    borderRadius: "16px",
    padding: "36px 32px",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
  },
  header: {
    textAlign: "center",
    marginBottom: "28px",
  },
  iconWrapper: {
    display: "inline-flex",
    padding: "12px",
    borderRadius: "12px",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    border: "1px solid rgba(56, 189, 248, 0.2)",
    marginBottom: "14px",
  },
  title: {
    color: "#f8fafc",
    fontSize: "20px",
    fontWeight: "700",
    letterSpacing: "1px",
    margin: "0 0 6px 0",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "13px",
    margin: 0,
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#f87171",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.6px",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  fieldIcon: {
    position: "absolute",
    left: "12px",
  },
  input: {
    width: "100%",
    padding: "11px 12px 11px 38px",
    backgroundColor: "#0b0f19",
    border: "1px solid #2d3748",
    borderRadius: "8px",
    color: "#f8fafc",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  submitBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    marginTop: "6px",
    backgroundColor: "#0284c7",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
  footer: {
    marginTop: "24px",
    textAlign: "center",
    fontSize: "13px",
    color: "#64748b",
  },
  footerText: {
    marginRight: "6px",
  },
  link: {
    color: "#38bdf8",
    textDecoration: "none",
    fontWeight: "500",
  },
};

export default Register;
