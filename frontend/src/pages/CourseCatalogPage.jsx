import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { coursesAPI } from "../api";
import { BookOpen } from "lucide-react";
import useMobile from "../hooks/useMobile";

/* ── Tokens ─────────────────────────────────────────── */
const C = {
  bg:         "#FFFFFF",
  surface:    "#F9FAFB",
  border:     "#E5E7EB",
  ink:        "#111827",
  gray:       "#6B7280",
  light:      "#9CA3AF",
  violet:     "#7C3AED",
  violetDark: "#5B21B6",
  violetSoft: "#8B5CF6",
  violetPale: "#F5F3FF",
  green:      "#059669",
  greenPale:  "#ECFDF5",
  amber:      "#D97706",
  amberPale:  "#FFFBEB",
  blue:       "#2563EB",
  bluePale:   "#EFF6FF",
};
const font = "'Inter', system-ui, -apple-system, sans-serif";

/* ── Subject emoji map ───────────────────────────────── */
const SUBJECT_EMOJI = {
  "математика":         "📐",
  "история казахстана": "📜",
  "история":            "📜",
  "грамотность чтения": "📖",
  "грамотность":        "📖",
  "биология":           "🌿",
  "химия":              "⚗️",
  "физика":             "⚡",
  "география":          "🌍",
  "английский":         "🇬🇧",
  "english":            "🇬🇧",
  "ielts":              "🎯",
  "sat":                "🏆",
  "информатика":        "💻",
  "литература":         "✍️",
  "казахский":          "🇰🇿",
  "русский":            "📝",
};
function getCourseEmoji(course) {
  const key = (course.subject || course.title || "").toLowerCase();
  for (const [k, v] of Object.entries(SUBJECT_EMOJI)) {
    if (key.includes(k)) return v;
  }
  if (course.course_type === "ielts") return "🎯";
  if (course.course_type === "sat")   return "🏆";
  return "📚";
}

/* ── Course Card ─────────────────────────────────────── */
function CourseCard({ course, navigate }) {
  const map = {
    ent:   { color: C.violet, bg: C.violetPale },
    ielts: { color: C.green,  bg: C.greenPale  },
    sat:   { color: C.amber,  bg: C.amberPale  },
  };
  const t = map[course.course_type] || map.ent;
  const emoji = getCourseEmoji(course);
  const lessonsCount = course.lessons_count ?? course.lessons ?? null;
  const duration     = course.duration ?? null;

  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${C.border}`,
      borderRadius: 16,
      padding: "20px 20px 16px",
      display: "flex", flexDirection: "column",
      boxShadow: "0 2px 8px rgba(0,0,0,.04)",
    }}>
      {/* Top row: title + emoji */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", gap: 12, marginBottom: 12,
      }}>
        <h3 style={{
          fontSize: 16, fontWeight: 700, color: C.ink,
          lineHeight: 1.3, margin: 0, flex: 1,
        }}>{course.title}</h3>
        <div style={{
          fontSize: 46, lineHeight: 1, flexShrink: 0,
          width: 56, height: 56,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: t.bg, borderRadius: 12,
          border: `1.5px solid ${t.color}18`,
        }}>{emoji}</div>
      </div>

      {/* Meta */}
      <div style={{ color: C.gray, fontSize: 13, lineHeight: 1.9, marginBottom: 16 }}>
        {duration && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: C.light }}>⏱</span> Длительность: {duration}
          </div>
        )}
        {lessonsCount != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <BookOpen size={12} color={C.light} />
            {lessonsCount} занятий
          </div>
        )}
        {!duration && lessonsCount == null && (
          <div style={{ color: C.light }}>Живые уроки · Домашки · Тесты</div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button
          onClick={() => navigate(`/courses/${course.id}`)}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 8,
            border: `1.5px solid ${C.border}`,
            background: "transparent",
            color: C.gray, fontWeight: 600, fontSize: 13,
            cursor: "pointer", fontFamily: font, transition: "all .18s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = t.color;
            e.currentTarget.style.color = t.color;
            e.currentTarget.style.background = t.bg;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.color = C.gray;
            e.currentTarget.style.background = "transparent";
          }}
        >Подробнее</button>
        <button
          onClick={() => navigate("/register")}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 8,
            border: "none",
            background: `linear-gradient(135deg, ${C.violet}, ${C.violetSoft})`,
            color: "#fff", fontWeight: 700, fontSize: 13,
            cursor: "pointer", fontFamily: font, transition: "opacity .18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >Оставить заявку</button>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function CourseCatalogPage() {
  const navigate   = useNavigate();
  const { user, logout } = useAuth();
  const isMobile   = useMobile();
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    coursesAPI.list()
      .then(r => setCourses(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const CATEGORY_META = {
    ent:   { label: "ПОДГОТОВКА К ЕНТ",   color: C.violet, bg: C.violetPale },
    ielts: { label: "ПОДГОТОВКА К IELTS",  color: C.green,  bg: C.greenPale  },
    sat:   { label: "ПОДГОТОВКА К SAT",    color: C.amber,  bg: C.amberPale  },
  };
  const ORDER = ["ent", "ielts", "sat"];

  const grouped = {};
  courses.forEach(c => {
    const k = c.course_type || "ent";
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(c);
  });
  const categories = ORDER.filter(k => grouped[k]?.length);
  Object.keys(grouped).forEach(k => { if (!ORDER.includes(k)) categories.push(k); });

  return (
    <div style={{ background: C.bg, color: C.ink, fontFamily: font, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav-link:hover { color: ${C.violet} !important; }
        .btn-primary { background: linear-gradient(135deg, ${C.violet}, ${C.violetSoft}); background-size: 200% 200%; transition: all .25s ease; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124,58,237,.3); }
        .btn-outline { transition: all .2s ease; }
        .btn-outline:hover { border-color: ${C.violet} !important; color: ${C.violet} !important; background: ${C.violetPale} !important; }
        @media (max-width: 768px) { .nav-links { display: none !important; } }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 64, display: "flex", alignItems: "center",
        padding: isMobile ? "0 16px" : "0 48px", justifyContent: "space-between",
        background: scrolled ? "rgba(255,255,255,.96)" : "rgba(255,255,255,.98)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
        transition: "all .3s",
      }}>
        <div onClick={() => navigate("/")}
          style={{ fontWeight: 800, fontSize: 20, cursor: "pointer", color: C.ink, letterSpacing: -0.5 }}>
          <span style={{ background: `linear-gradient(135deg, ${C.violet}, ${C.violetSoft})`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent", display: "inline-block" }}>Edu</span>
          <span>Platform</span>
        </div>

        <div className="nav-links" style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <span onClick={() => navigate("/")} className="nav-link" style={{ color: C.gray, fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "color .2s" }}>Главная</span>
          <a href="/apply-teacher" className="nav-link" style={{ color: C.gray, fontSize: 14, textDecoration: "none", fontWeight: 500, transition: "color .2s" }}>Вакансии</a>
        </div>

        {user ? (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => navigate("/dashboard")} className="btn-primary"
              style={{ color: "#fff", border: "none", borderRadius: 10, padding: "9px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font }}>
              Кабинет
            </button>
            <button onClick={logout} style={{ background: "none", border: "none", color: C.gray, cursor: "pointer", fontSize: 14, fontFamily: font }}>Выйти</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => navigate("/login")} className="btn-outline"
              style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "8px 20px", fontWeight: 600, fontSize: 14, color: C.ink, cursor: "pointer", fontFamily: font }}>
              Войти
            </button>
            <button onClick={() => navigate("/register")} className="btn-primary"
              style={{ color: "#fff", border: "none", borderRadius: 10, padding: "9px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font }}>
              Начать →
            </button>
          </div>
        )}
      </nav>

      {/* ── HEADER ── */}
      <section style={{
        paddingTop: 64,
        background: `linear-gradient(180deg, ${C.violetPale} 0%, ${C.bg} 100%)`,
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: isMobile ? "40px 20px 32px" : "56px 48px 40px",
        }}>
          {/* Back button */}
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none", border: `1.5px solid ${C.border}`,
              borderRadius: 10, padding: "7px 14px", cursor: "pointer",
              fontSize: 13, fontWeight: 600, color: C.gray,
              fontFamily: font, display: "inline-flex", alignItems: "center", gap: 6,
              marginBottom: 28, transition: "all .2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.violet; e.currentTarget.style.color = C.violet; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.gray; }}
          >← Назад</button>

          <span style={{
            fontSize: 12, fontWeight: 700, letterSpacing: 1.2,
            textTransform: "uppercase", color: C.violet,
            background: C.violetPale, borderRadius: 6, padding: "4px 12px",
            border: `1.5px solid ${C.violet}20`,
          }}>Программы</span>
          <h1 style={{
            fontSize: "clamp(28px,4vw,44px)", fontWeight: 800,
            letterSpacing: -1.2, color: C.ink, margin: "14px 0 10px",
          }}>Каталог курсов</h1>
          <p style={{ color: C.gray, fontSize: 15, lineHeight: 1.7 }}>
            Выберите предмет и начните подготовку уже сегодня
          </p>
        </div>
      </section>

      {/* ── COURSES ── */}
      <section style={{ padding: isMobile ? "32px 20px 80px" : "48px 48px 96px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 80, color: C.gray }}>Загрузка курсов…</div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: "center", padding: 80, color: C.gray }}>Курсы скоро появятся</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>
              {categories.map(key => {
                const meta = CATEGORY_META[key] || { label: key.toUpperCase(), color: C.violet, bg: C.violetPale };
                const list = grouped[key];
                const count = list.length;
                const plural = count === 1 ? "курс" : count < 5 ? "курса" : "курсов";
                return (
                  <div key={key}>
                    {/* Category header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, letterSpacing: 1.6,
                        textTransform: "uppercase", color: meta.color,
                        background: meta.bg, borderRadius: 8,
                        padding: "5px 14px", border: `1.5px solid ${meta.color}22`,
                        whiteSpace: "nowrap",
                      }}>{meta.label}</span>
                      <div style={{ flex: 1, height: 1, background: C.border }} />
                      <span style={{ fontSize: 12, color: C.light, whiteSpace: "nowrap" }}>
                        {count} {plural}
                      </span>
                    </div>

                    {/* Cards */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: 16,
                    }}>
                      {list.map(c => <CourseCard key={c.id} course={c} navigate={navigate} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <div style={{ textAlign: "center", marginTop: 64, padding: isMobile ? "32px 20px" : "40px 48px", background: C.surface, borderRadius: 20, border: `1.5px solid ${C.border}` }}>
            <p style={{ color: C.gray, marginBottom: 8, fontSize: 15, fontWeight: 500 }}>Не нашли нужный курс?</p>
            <p style={{ color: C.light, fontSize: 13, marginBottom: 20 }}>Напишите нам — поможем подобрать программу</p>
            <a href="https://t.me/eduplatform_kz" target="_blank" rel="noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#0088CC", color: "#fff",
              borderRadius: 12, padding: "12px 28px",
              fontWeight: 700, fontSize: 14, textDecoration: "none", fontFamily: font,
              transition: "opacity .2s",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >Написать в Telegram</a>
          </div>
        </div>
      </section>
    </div>
  );
}
