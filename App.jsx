import { useEffect, useState } from "react";
import a1Questions from "./data/a1Questions";
import a2Questions from "./data/a2Questions";
import b1Questions from "./data/b1Questions";
import b2Questions from "./data/b2Questions";
import c1Questions from "./data/c1Questions";
import c2Questions from "./data/c2Questions";
import "./index.css";

const USER_KEY = "englishLabUser";
const HISTORY_KEY = "englishLabTestHistory";

function getLevel(score) {
  if (score <= 15) return "A1";
  if (score <= 25) return "A2";
  if (score <= 35) return "B1-";
  if (score <= 43) return "B1";
  if (score <= 47) return "B1+";
  return "B2";
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;
}

function loadJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [code, setCode] = useState("");

  const [testType, setTestType] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [testScore, setTestScore] = useState(0);

  useEffect(() => {
    const savedUser = loadJSON(USER_KEY, null);
    const savedHistory = loadJSON(HISTORY_KEY, []);

    setHistory(savedHistory);

    if (savedUser?.loggedIn) {
      setUser(savedUser);
      setScreen("dashboard");
    }
  }, []);

  const questionBanks = {
    A1: a1Questions,
    A2: a2Questions,
    B1: b1Questions,
    B2: b2Questions,
    C1: c1Questions,
    C2: c2Questions,
  };

  const questions = questionBanks[testType] || [];

  useEffect(() => {
    if (screen !== "test") return;

    if (timeLeft <= 0) {
      finishTest();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [screen, timeLeft]);

  const register = (e) => {
    e.preventDefault();

    const { email, phone, password, confirmPassword } = registerData;

    if (!email || !phone || !password || !confirmPassword) {
      alert("Barcha maydonlarni to'ldiring.");
      return;
    }

    if (!email.includes("@")) {
      alert("To'g'ri email kiriting.");
      return;
    }

    if (password.length < 6) {
      alert("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Parollar bir xil emas.");
      return;
    }

    const existing = loadJSON(USER_KEY, null);

    if (existing?.email?.toLowerCase() === email.trim().toLowerCase()) {
      alert("Bu email bilan akkaunt allaqachon mavjud. Sign In orqali kiring.");
      return;
    }

    const newUser = {
      email: email.trim(),
      phone: phone.trim(),
      password,
      verified: false,
      loggedIn: false,
    };

    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setRegisterData({
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
    setCode("");
    setScreen("verify");
  };

  const login = (e) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      alert("Email va parolni kiriting.");
      return;
    }

    const saved = loadJSON(USER_KEY, null);

    if (!saved) {
      alert("Akkaunt topilmadi. Avval ro'yxatdan o'ting.");
      return;
    }

    if (
      loginData.email.trim().toLowerCase() !==
      String(saved.email).trim().toLowerCase()
    ) {
      alert("Email yoki parol noto'g'ri.");
      return;
    }

    if (loginData.password !== saved.password) {
      alert("Email yoki parol noto'g'ri.");
      return;
    }

    if (!saved.verified) {
      alert("Telefon raqamingiz hali tasdiqlanmagan.");
      setScreen("verify");
      return;
    }

    const loggedUser = { ...saved, loggedIn: true };
    localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
    setUser(loggedUser);
    setLoginData({ email: "", password: "" });
    setScreen("dashboard");
  };

  const verifyCode = (e) => {
    e.preventDefault();

    if (code !== "123456") {
      alert("Tasdiqlash kodi noto'g'ri.");
      return;
    }

    const saved = loadJSON(USER_KEY, null);

    if (!saved) {
      alert("Akkaunt topilmadi.");
      setScreen("register");
      return;
    }

    const verifiedUser = {
      ...saved,
      verified: true,
      loggedIn: true,
    };

    localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));
    setUser(verifiedUser);
    setCode("");
    setScreen("dashboard");
  };

  const logout = () => {
    const saved = loadJSON(USER_KEY, null);

    if (saved) {
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({ ...saved, loggedIn: false })
      );
    }

    setUser(null);
    setScreen("login");
  };

  const startTest = (type) => {
    const durations = {
      A1: 20,
      A2: 22,
      B1: 25,
      B2: 30,
      C1: 35,
      C2: 40,
    };

    setTestType(type);
    setQuestionIndex(0);
    setAnswers({});
    setTestScore(0);
    setTimeLeft((durations[type] || 25) * 60);
    setScreen("test");
  };

  const selectAnswer = (index) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: index,
    }));
  };

  const finishTest = () => {
    const finalScore = questions.reduce(
      (total, question, index) =>
        total + (answers[index] === question.answer ? 1 : 0),
      0
    );

    const result = {
      id: Date.now(),
      test: `${testType} Grammar Test`,
      type: testType,
      score: finalScore,
      total: questions.length,
      level: testType === "B2" ? "B2" : getLevel(finalScore),
      date: new Date().toLocaleString("uz-UZ"),
      answers,
    };

    const updated = [result, ...history];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
    setTestScore(finalScore);
    setScreen("result");
  };

  const nextQuestion = () => {
    if (questionIndex === questions.length - 1) {
      finishTest();
    } else {
      setQuestionIndex((prev) => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
    }
  };

  const clearDemoAccount = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(HISTORY_KEY);
    setUser(null);
    setHistory([]);
    setScreen("welcome");
  };

  if (screen === "welcome") {
    return (
      <div className="welcome-page">
        <div className="hero-glow" />
        <div className="welcome-content">
          <div className="logo">ENGLISH<span>LAB</span></div>
          <h1>
            Discover Your
            <br />
            <span>English Level</span>
          </h1>
          <p>
            Test your English grammar, discover your level and improve your skills.
          </p>
          <div className="welcome-buttons">
            <button className="primary-btn" onClick={() => setScreen("register")}>
              Create Account
            </button>
            <button className="secondary-btn" onClick={() => setScreen("login")}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "login") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">ENGLISH<span>LAB</span></div>
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to continue</p>
          <form onSubmit={login}>
            <input
              type="email"
              placeholder="Email address"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />
            <button className="primary-btn full" type="submit">Sign In</button>
          </form>
          <p className="switch-text">
            Don't have an account?{" "}
            <span onClick={() => setScreen("register")}>Create one</span>
          </p>
        </div>
      </div>
    );
  }

  if (screen === "register") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">ENGLISH<span>LAB</span></div>
          <h2>Create Account</h2>
          <p className="auth-subtitle">Start your English journey</p>
          <form onSubmit={register}>
            <input
              type="email"
              placeholder="Gmail / Email"
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
            />
            <input
              type="tel"
              placeholder="+998 90 123 45 67"
              value={registerData.phone}
              onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
            />
            <input
              type="password"
              placeholder="Create password"
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={registerData.confirmPassword}
              onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
            />
            <button className="primary-btn full" type="submit">Create Account</button>
          </form>
          <p className="switch-text">
            Already have an account?{" "}
            <span onClick={() => setScreen("login")}>Sign in</span>
          </p>
        </div>
      </div>
    );
  }

  if (screen === "verify") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">ENGLISH<span>LAB</span></div>
          <h2>Verify Phone</h2>
          <p className="auth-subtitle">
            Enter the 6-digit verification code.
          </p>
          <form onSubmit={verifyCode}>
            <input
              type="text"
              maxLength="6"
              inputMode="numeric"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <button className="primary-btn full" type="submit">Verify Account</button>
          </form>
          <p className="demo-code">Demo code: <b>123456</b></p>
        </div>
      </div>
    );
  }

  if (screen === "profile") {
    const average = history.length
      ? Math.round(
          history.reduce((sum, item) => sum + (item.score / item.total) * 100, 0) /
            history.length
        )
      : 0;

    return (
      <div className="dashboard">
        <header className="topbar">
          <div className="logo">ENGLISH<span>LAB</span></div>
          <button className="profile-button" onClick={() => setScreen("dashboard")}>
            ← Dashboard
          </button>
        </header>

        <main className="profile-page">
          <div className="profile-header">
            <div className="avatar">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h1>My Profile</h1>
              <p>Account, progress and test history</p>
            </div>
          </div>

          <div className="profile-grid">
            <div className="profile-card">
              <h3>Account Information</h3>
              <div className="profile-row"><span>Email</span><strong>{user?.email}</strong></div>
              <div className="profile-row"><span>Phone</span><strong>{user?.phone}</strong></div>
              <div className="profile-row"><span>Status</span><strong className="verified">✓ Verified</strong></div>
            </div>

            <div className="profile-card">
              <h3>Test Statistics</h3>
              <div className="stats-grid">
                <div className="stat-box">
                  <strong>{history.length}</strong>
                  <span>Tests Taken</span>
                </div>
                <div className="stat-box">
                  <strong>{average}%</strong>
                  <span>Average Score</span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-card history-card">
            <h3>Test History</h3>
            <p className="history-subtitle">Your completed tests and results</p>

            {history.length === 0 ? (
              <div className="empty-history">
                <h4>No tests completed yet</h4>
                <p>Complete any A1–C2 test and your result will appear here.</p>
              </div>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div className="history-item" key={item.id}>
                    <div>
                      <h4>{item.test}</h4>
                      <span>{item.date}</span>
                    </div>
                    <div className="history-result">
                      <strong>{item.score}/{item.total}</strong>
                      <span>{item.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="profile-logout-area">
            <button className="logout-btn" onClick={logout}>⇥ Log Out</button>
          </div>
        </main>
      </div>
    );
  }

  if (screen === "dashboard") {
    const latest = history[0];

    return (
      <div className="dashboard">
        <header className="topbar">
          <div className="logo">ENGLISH<span>LAB</span></div>
          <button className="profile-button" onClick={() => setScreen("profile")}>
            <span className="mini-avatar">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </span>
            Profile
          </button>
        </header>

        <main className="dashboard-content">
          <section className="dashboard-hero">
            <p className="eyebrow">ENGLISH ASSESSMENT</p>
            <h1>
              Welcome back,
              <br />
              <span>{user?.email?.split("@")[0]}</span>
            </h1>
            <p>Choose a test and measure your English grammar level.</p>
          </section>

          <section className="test-grid">
            {[
              ["A1", "Beginner", 20],
              ["A2", "Elementary", 22],
              ["B1", "Intermediate", 25],
              ["B2", "Upper-Intermediate", 30],
              ["C1", "Advanced", 35],
              ["C2", "Proficiency", 40],
            ].map(([level, label, minutes]) => (
              <div className="test-card active-test" key={level}>
                <div className="test-top">
                  <span className="test-level">{level}</span>
                  <span className="available">AVAILABLE</span>
                </div>
                <h2>{level} Grammar Test</h2>
                <p>50 {label.toLowerCase()} grammar questions.</p>
                <div className="test-info">
                  <span>◉ 50 Questions</span>
                  <span>◷ {minutes} Minutes</span>
                </div>
                <button
                  className="primary-btn full"
                  onClick={() => startTest(level)}
                >
                  Start {level} Test →
                </button>
              </div>
            ))}
          </section>

          <section className="quick-history">
            <div className="section-heading">
              <div>
                <p className="eyebrow">PROGRESS</p>
                <h2>Recent Result</h2>
              </div>
              <button className="text-btn" onClick={() => setScreen("profile")}>
                View all →
              </button>
            </div>

            {latest ? (
              <div className="recent-result">
                <div>
                  <strong>{latest.test}</strong>
                  <span>{latest.date}</span>
                </div>
                <div>
                  <strong>{latest.score}/{latest.total}</strong>
                  <span>{latest.level}</span>
                </div>
              </div>
            ) : (
              <div className="empty-dashboard">No completed tests yet.</div>
            )}
          </section>
        </main>
      </div>
    );
  }

  if (screen === "test") {
    const question = questions[questionIndex];
    const selected = answers[questionIndex];
    const progress = ((questionIndex + 1) / questions.length) * 100;

    return (
      <div className="quiz-page">
        <header className="quiz-header">
          <div className="logo">ENGLISH<span>LAB</span></div>
          <div className="quiz-timer">
            <span>{testType} TEST</span>
            <strong>{formatTime(timeLeft)}</strong>
          </div>
        </header>

        <main className="quiz-content">
          <div className="quiz-top">
            <span>QUESTION {questionIndex + 1} / {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="question-card">
            <div className="question-topic">{question.topic}</div>
            <h1>{question.question}</h1>

            <div className="options">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`option ${selected === index ? "selected" : ""}`}
                  onClick={() => selectAnswer(index)}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="quiz-navigation">
            <button
              className="secondary-btn"
              disabled={questionIndex === 0}
              onClick={previousQuestion}
            >
              ← Previous
            </button>

            <button className="primary-btn" onClick={nextQuestion}>
              {questionIndex === questions.length - 1 ? "Finish Test ✓" : "Next →"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (screen === "result") {
    const percentage = Math.round((testScore / questions.length) * 100);
    const level = testType || getLevel(testScore);

    return (
      <div className="result-page">
        <div className="result-card">
          <div className="result-logo">ENGLISH<span>LAB</span></div>
          <p className="eyebrow">{testType} TEST COMPLETED</p>
          <h1>Your Result</h1>

          <div className="score-circle">
            <strong>{testScore}</strong>
            <span>/ {questions.length}</span>
          </div>

          <div className="result-level">
            <span>Estimated Level</span>
            <strong>{level}</strong>
          </div>

          <div className="result-percentage">{percentage}% correct</div>

          <p className="result-note">
            This is a diagnostic estimate, not an official CEFR certificate.
          </p>

          <div className="result-buttons">
            <button className="primary-btn" onClick={() => setScreen("profile")}>
              View My Profile
            </button>
            <button className="secondary-btn" onClick={() => setScreen("dashboard")}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
