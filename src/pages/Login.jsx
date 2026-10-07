import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleLogin}>
        <h2>Login</h2>

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button style={styles.button}>Login</button>

        <p>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    color: "white",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "30px",
    background: "#1e293b",
    borderRadius: "10px",
    width: "300px",
  },
  input: {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #475569",
  background: "#ffffff",
  color: "#000000",
  fontSize: "16px",
  outline: "none",
},
  button: {
    padding: "10px",
    background: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: "5px",
  },
};