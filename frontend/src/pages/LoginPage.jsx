import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../api/client";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const { auth, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 Redirect if already logged in
  useEffect(() => {
    if (auth?.token) {
      navigate(auth.user.role === "faculty" ? "/faculty" : "/student", {
        replace: true,
      });
    }
  }, [auth, navigate]);

  // 🔥 Handle Login
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });

      // ✅ SUCCESS TOAST
      toast.success("Login successful 👋");

      login(data);
      localStorage.setItem("token", data.token);
      setAuthToken(data.token);

      // ⏳ Delay navigation so toast is visible
      setTimeout(() => {
        navigate(data.user.role === "faculty" ? "/faculty" : "/student");
      }, 1000);

    } catch (err) {
      // ❌ ERROR TOAST
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          flex: 1,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <h1 style={{ fontSize: "40px", marginBottom: "10px" }}>
          📡 RFID Attendance System
        </h1>
        <p style={{ fontSize: "18px", opacity: 0.9 }}>
          Smart IoT-based attendance tracking system for students and faculty.
        </p>

        <div style={{ marginTop: "30px", opacity: 0.9, lineHeight: "1.6" }}>
          <p>
            This system provides real-time attendance tracking using RFID
            technology, ensures secure authentication for both students and
            faculty, and offers an interactive analytics dashboard for
            monitoring attendance trends and performance.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div className="login-card">
          <h2 style={{ marginBottom: "5px" }}>Welcome Back 👋</h2>
          <p style={{ marginBottom: "20px", opacity: 0.8 }}>
            Login to continue
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div>
              <label>📧 Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="login-input"
              />
            </div>

            <div>
              <label>🔒 Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="login-input"
              />
            </div>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;