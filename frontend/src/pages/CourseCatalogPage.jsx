import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { coursesAPI } from "../api";
import { BookOpen, Clock } from "lucide-react";
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

/* ── Subject SVG illustrations ───────────────────────── */
function SubjectIllustration({ course, color }) {
  // Combine subject code + title so both "ENT_MATH" and "ЕНТ Математика" match
  const key = [course.subject, course.title].filter(Boolean).join(" ").toLowerCase();
  const type = course.course_type;
  const f = `${color}20`;   // faint fill

  /* МАТЕМАТИКА — parabola on axes */
  if (key.includes("математ") || key.includes("math")) return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <line x1="4" y1="27" x2="28" y2="27" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="16" y1="4"  x2="16" y2="27" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M25 24.5 L28 27 L25 29.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.5 6.5 L16 4 L18.5 6.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 26 Q16 9 26 26" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );

  /* ИСТОРИЯ — ancient scroll */
  if (key.includes("история") || key.includes("history")) return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <rect x="8" y="5" width="16" height="22" rx="2" stroke={color} strokeWidth="1.5" fill={f}/>
      <path d="M8 5 Q5 5 5 8 Q5 11 8 11" stroke={color} strokeWidth="1.5"/>
      <path d="M8 27 Q5 27 5 24 Q5 21 8 21" stroke={color} strokeWidth="1.5"/>
      <line x1="11" y1="13" x2="21" y2="13" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="11" y1="17" x2="21" y2="17" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="11" y1="21" x2="17" y2="21" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );

  /* ГРАМОТНОСТЬ ЧТЕНИЯ — open book */
  if (key.includes("грамотность") || key.includes("literacy") || key.includes("reading")) return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <path d="M16 8 L16 26" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 9 Q16 7 16 9 L16 26 Q4 25 4 27 Z" stroke={color} strokeWidth="1.5" fill={f}/>
      <path d="M28 9 Q16 7 16 9 L16 26 Q28 25 28 27 Z" stroke={color} strokeWidth="1.5" fill={f}/>
      <line x1="7" y1="14" x2="13" y2="14" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="7" y1="17" x2="13" y2="17" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="19" y1="14" x2="25" y2="14" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="19" y1="17" x2="25" y2="17" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );

  /* БИОЛОГИЯ — DNA double helix */
  if (key.includes("биолог") || key.includes("biology") || key.includes("bio")) return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <path d="M10 4 Q22 10 10 16 Q22 22 10 28" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 4 Q10 10 22 16 Q10 22 22 28" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="10" y1="10.5" x2="22" y2="10.5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="10" y1="16"   x2="22" y2="16"   stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="10" y1="21.5" x2="22" y2="21.5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );

  /* ХИМИЯ — Erlenmeyer flask */
  if (key.includes("хим") || key.includes("chem")) return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <path d="M13 4 L13 13 L5 25 Q4 28 7 28 L25 28 Q28 28 27 25 L19 13 L19 4 Z"
            stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={f}/>
      <line x1="11" y1="4" x2="21" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="22" r="2" fill={color}/>
      <circle cx="19" cy="20" r="1.5" fill={color}/>
      <circle cx="16" cy="24" r="1" fill={color}/>
    </svg>
  );

  /* ФИЗИКА — atom with three orbits */
  if (key.includes("физик") || key.includes("physics") || key.includes("phys")) return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <circle cx="16" cy="16" r="3" fill={color}/>
      <ellipse cx="16" cy="16" rx="13" ry="5" stroke={color} strokeWidth="1.5"/>
      <ellipse cx="16" cy="16" rx="13" ry="5" stroke={color} strokeWidth="1.5" transform="rotate(60 16 16)"/>
      <ellipse cx="16" cy="16" rx="13" ry="5" stroke={color} strokeWidth="1.5" transform="rotate(-60 16 16)"/>
    </svg>
  );

  /* ГЕОГРАФИЯ — globe with meridians */
  if (key.includes("географ") || key.includes("geograph")) return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="1.5" fill={f}/>
      <ellipse cx="16" cy="16" rx="6"  ry="12" stroke={color} strokeWidth="1.3"/>
      <line x1="4" y1="16" x2="28" y2="16" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M6 11 Q16 13 26 11" stroke={color} strokeWidth="1" strokeLinecap="round"/>
      <path d="M6 21 Q16 19 26 21" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );

  /* АНГЛИЙСКИЙ — speech bubble Aa */
  if ((key.includes("английск") || key.includes("english")) && !key.includes("ielts")) return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <rect x="3" y="4" width="23" height="17" rx="4" stroke={color} strokeWidth="1.5" fill={f}/>
      <path d="M8 21 L6 27 L13 21" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <text x="6" y="16" fontSize="10" fontWeight="800" fill={color} fontFamily="Arial,sans-serif">Aa</text>
    </svg>
  );

  /* IELTS — bullseye target (only if no more specific subject matched) */
  if (key.includes("ielts") || type === "ielts") return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="1.5"/>
      <circle cx="16" cy="16" r="7.5" stroke={color} strokeWidth="1.5"/>
      <circle cx="16" cy="16" r="3.5" fill={color}/>
      <line x1="22" y1="9"  x2="26" y2="5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="26" y1="5"  x2="28" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="22" y1="9"  x2="24" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );

  /* SAT — five-pointed star (only if no more specific subject matched) */
  if (type === "sat") return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <path d="M16 4 L19.5 13 L29 13 L21.5 18.5 L24.5 28 L16 22.5 L7.5 28 L10.5 18.5 L3 13 L12.5 13 Z"
            stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={f}/>
    </svg>
  );

  /* ИНФОРМАТИКА — code brackets </> */
  if (key.includes("информат") || key.includes("computer") || key.includes("coding") || key.includes("programming")) return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <path d="M11 10 L5 16 L11 22" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 10 L27 16 L21 22" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="18" y1="8" x2="14" y2="24" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );

  /* ЛИТЕРАТУРА — feather quill */
  if (key.includes("литерат") || key.includes("literature")) return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <path d="M7 26 Q13 19 17 13 Q23 5 29 4 Q27 10 21 17 Q17 21 12 26 Z"
            stroke={color} strokeWidth="1.5" fill={f} strokeLinejoin="round"/>
      <path d="M12 26 L6 29 L8 23" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 13 L12 18" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );

  /* КАЗАХСКИЙ — "Кк" */
  if (key.includes("казахск") || key.includes("kazakh") || key.includes("_kaz")) return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <text x="1" y="22" fontSize="17" fontWeight="800" fill={color} fontFamily="Arial,sans-serif">Кк</text>
    </svg>
  );

  /* РУССКИЙ ЯЗЫК — "Аа" */
  if (key.includes("русск") || key.includes("russian") || key.includes("_rus")) return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <text x="1" y="22" fontSize="17" fontWeight="800" fill={color} fontFamily="Arial,sans-serif">Аа</text>
    </svg>
  );

  /* DEFAULT — graduation cap */
  return (
    <svg viewBox="0 0 32 32" width={30} height={30} fill="none">
      <path d="M4 14 L16 8 L28 14 L16 20 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={f}/>
      <path d="M22 17 L22 24 Q16 28 10 24 L10 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="28" y1="14" x2="28" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="28" cy="23" r="1.5" fill={color}/>
    </svg>
  );
}

/* ── Course Card ─────────────────────────────────────── */
function CourseCard({ course, navigate }) {
  const map = {
    ent:   { color: C.violet, bg: C.violetPale },
    ielts: { color: C.green,  bg: C.greenPale  },
    sat:   { color: C.amber,  bg: C.amberPale  },
  };
  const t = map[course.course_type] || map.ent;
  const lessonsCount = course.lessons_count ?? course.lessons ?? null;
  const duration     = course.duration ?? null;
  const price        = course.price ? Number(course.price) : null;

  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${C.border}`,
      borderRadius: 16,
      padding: "20px 20px 16px",
      display: "flex", flexDirection: "column",
      boxShadow: "0 2px 8px rgba(0,0,0,.04)",
    }}>
      {/* Top row: title + illustration */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", gap: 12, marginBottom: 12,
      }}>
        <h3 style={{
          fontSize: 16, fontWeight: 700, color: C.ink,
          lineHeight: 1.3, margin: 0, flex: 1,
        }}>{course.title}</h3>
        <div style={{
          width: 52, height: 52, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: t.bg, borderRadius: 12,
          border: `1.5px solid ${t.color}20`,
        }}>
          <SubjectIllustration course={course} color={t.color} />
        </div>
      </div>

      {/* Meta */}
      <div style={{ color: C.gray, fontSize: 13, lineHeight: 1.9, marginBottom: 14 }}>
        {duration && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={12} color={C.light} strokeWidth={2} />
            Длительность: {duration}
          </div>
        )}
        {lessonsCount != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <BookOpen size={12} color={C.light} strokeWidth={2} />
            {lessonsCount} занятий
          </div>
        )}
        {!duration && lessonsCount == null && (
          <div style={{ color: C.light, fontSize: 12 }}>Живые уроки · Домашки · Тесты</div>
        )}
      </div>

      {/* Price */}
      {price != null && (
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: t.color }}>
            {price.toLocaleString("ru-KZ")} ₸
          </span>
          <span style={{ fontSize: 12, color: C.light, marginLeft: 4 }}>/ мес</span>
        </div>
      )}

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
          onClick={() => navigate(`/courses/${course.id}`)}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 8,
            border: "none",
            background: `linear-gradient(135deg, ${C.violet}, ${C.violetSoft})`,
            color: "#fff", fontWeight: 700, fontSize: 13,
            cursor: "pointer", fontFamily: font, transition: "opacity .18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >Купить</button>
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

          <h1 style={{
            fontSize: "clamp(28px,4vw,44px)", fontWeight: 800,
            letterSpacing: -1.2, color: C.ink, margin: "0 0 10px",
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
