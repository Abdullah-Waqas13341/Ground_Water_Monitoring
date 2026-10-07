import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Smart Groundwater Monitoring System</h1>

      <p style={styles.subtitle}>
        Real-time monitoring, analytics, and sensor-based groundwater tracking system
      </p>

      <div style={styles.buttonRow}>
        <Link to="/login" style={styles.buttonPrimary}>Login</Link>
        <Link to="/register" style={styles.buttonSecondary}>Sign Up</Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(to right, #0f172a, #1e3a8a)",
    color: "white",
    textAlign: "center",
    padding: "20px",
  },
  title: {
    fontSize: "40px",
    fontWeight: "bold",
    marginBottom: "15px",
  },
  subtitle: {
    fontSize: "18px",
    maxWidth: "600px",
    marginBottom: "30px",
    opacity: 0.8,
  },
  buttonRow: {
    display: "flex",
    gap: "20px",
  },
  buttonPrimary: {
    padding: "12px 25px",
    background: "#22c55e",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "bold",
  },
  buttonSecondary: {
    padding: "12px 25px",
    background: "white",
    color: "#1e3a8a",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "bold",
  },
};