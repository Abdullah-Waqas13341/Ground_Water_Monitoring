import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: "user",
        createdAt: new Date().toISOString(),
      });

      alert("Registration Successful!");

      navigate("/dashboard");

    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleRegister}>
        <h2 style={styles.heading}>Create Account</h2>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
          required
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />

        <button type="submit" style={styles.button}>
          Sign Up
        </button>

        <p style={styles.text}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Login
          </Link>
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
    background: "linear-gradient(to right, #0f172a, #1e3a8a)",
    padding: "20px",
  },

  form: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  heading: {
    textAlign: "center",
    marginBottom: "10px",
    color: "#0f172a",
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
    padding: "12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },

  text: {
    textAlign: "center",
    marginTop: "10px",
    color: "#374151",
  },

  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "bold",
  },
};