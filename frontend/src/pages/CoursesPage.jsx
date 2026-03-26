import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { coursesAPI } from "../api";
import { Star, CheckCircle, TrendingUp, Radio, BookOpen, CreditCard, Users, Rocket, Video, ClipboardCheck, BarChart2, UserCheck, Gift, LayoutDashboard } from 'lucide-react';
import useMobile from "../hooks/useMobile";

/* ── Tokens ─────────────────────────────────────────── */
const C = {
  bg:           "#FFFFFF",
  surface:      "#F9FAFB",
  border:       "#E5E7EB",
  ink:          "#111827",
  gray:         "#6B7280",
  light:        "#9CA3AF",
  violet:       "#7C3AED",
  violetDark:   "#5B21B6",
  violetSoft:   "#8B5CF6",
  violetPale:   "#F5F3FF",
  green:        "#059669",
  greenPale:    "#ECFDF5",
  amber:        "#D97706",
  amberPale:    "#FFFBEB",
  red:          "#DC2626",
  redPale:      "#FEF2F2",
  blue:         "#2563EB",
  bluePale:     "#EFF6FF",
  // Dark theme tokens
  dark:         "#060611",
  darkSurf:     "#0D0D1F",
  darkCard:     "#12122A",
  darkBorder:   "rgba(139,92,246,.18)",
  darkBorderFaint: "rgba(255,255,255,.07)",
  darkText:     "#F1F0FF",
  darkMuted:    "rgba(241,240,255,.65)",
  darkFaint:    "rgba(241,240,255,.35)",
};
const font = "'Inter', system-ui, -apple-system, sans-serif";

/* ── Animated counter ───────────────────────────────── */
function Counter({ end, suffix = "" }) {
  const [n, setN] = useState(0);
  const ref  = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min((now - t0) / 1400, 1);
          setN(Math.round((1 - Math.pow(1 - p, 3)) * end));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [end]);
  return <span ref={ref}>{n}{suffix}</span>;
}

/* ── Course Card ─────────────────────────────────────── */
function CourseCard({ course, navigate }) {
  const [hover, setHover] = useState(false);
  const map = {
    ent:   { color: C.violet, bg: C.violetPale, label: "ЕНТ",   grad: `linear-gradient(135deg, ${C.violet}, ${C.violetSoft})` },
    ielts: { color: C.green,  bg: C.greenPale,  label: "IELTS",  grad: `linear-gradient(135deg, ${C.green}, #34D399)` },
    sat:   { color: C.amber,  bg: C.amberPale,  label: "SAT",    grad: `linear-gradient(135deg, ${C.amber}, #F59E0B)` },
  };
  const t = map[course.course_type] || map.ent;

  return (
    <div
      onClick={() => navigate(`/courses/${course.id}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? C.bg : `${C.bg}CC`,
        border: `1.5px solid ${hover ? t.color + "60" : C.border}`,
        borderRadius: 20, padding: "28px 24px",
        cursor: "pointer", position: "relative", overflow: "hidden",
        transition: "all 0.3s cubic-bezier(.34,1.56,.64,1)",
        transform: hover ? "translateY(-6px)" : "none",
        boxShadow: hover ? `0 20px 48px ${t.color}30` : "0 2px 12px rgba(0,0,0,.3)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 4,
        background: t.grad,
        transform: hover ? "scaleX(1)" : "scaleX(0.3)",
        transformOrigin: "left",
        transition: "transform 0.3s ease",
        borderRadius: "20px 20px 0 0",
      }} />

      <div style={{ marginBottom: 14 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
          textTransform: "uppercase", color: t.color,
          background: `${t.color}20`, borderRadius: 6, padding: "4px 10px",
        }}>{t.label}{course.subject ? ` · ${course.subject}` : ""}</span>
      </div>

      <h3 style={{
        fontSize: 18, fontWeight: 700, margin: "0 0 10px",
        color: C.ink, lineHeight: 1.3,
      }}>{course.title}</h3>

      <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.75, margin: "0 0 24px" }}>
        {course.description
          ? (course.description.length > 100 ? course.description.slice(0, 100) + "…" : course.description)
          : "Живые уроки, домашки с проверкой, тесты после каждой темы."}
      </p>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingTop: 18, borderTop: `1px solid ${hover ? t.color + "35" : C.border}`,
        transition: "border-color 0.3s",
      }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: t.color }}>
            {Number(course.price).toLocaleString("ru-KZ")} ₸
          </div>
          <div style={{ fontSize: 12, color: C.light, marginTop: 2 }}>в месяц</div>
        </div>
        <div style={{
          background: hover ? t.grad : `${t.color}20`,
          color: hover ? "#fff" : t.color,
          borderRadius: 10, padding: "9px 20px",
          fontWeight: 700, fontSize: 13,
          transition: "all 0.25s",
        }}>Подробнее →</div>
      </div>
    </div>
  );
}

/* ── FAQ Item ─────────────────────────────────────────── */
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{
      borderBottom: `1px solid ${C.border}`, padding: "22px 0",
      cursor: "pointer",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: open ? "#A78BFA" : C.ink, transition: "color .2s" }}>{q}</span>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: open ? C.violet : "rgba(139,92,246,.18)",
          color: open ? "#fff" : "#A78BFA",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, transition: "all .25s",
          transform: open ? "rotate(45deg)" : "none",
        }}>+</div>
      </div>
      {open && (
        <p style={{ margin: "14px 0 0", color: C.gray, fontSize: 14, lineHeight: 1.8 }}>{a}</p>
      )}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function CoursesPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useMobile();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);

  useEffect(() => {
    coursesAPI.list().then(r => setCourses(r.data)).catch(() => {}).finally(() => setLoading(false));
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const reviews = [
    { name: "Айгерим С.", tag: "ЕНТ · 120 баллов", text: "Сдала с первого раза на 120! Живые уроки и быстрая проверка домашек — лучший формат.", av: "А", color: C.violet },
    { name: "Данияр К.",  tag: "IELTS · 7.5",      text: "За 3 месяца с нуля до 7.5. Тесты после каждого урока реально систематизируют знания.",  av: "Д", color: C.green  },
    { name: "Малика Т.",  tag: "ЕНТ · 115 баллов", text: "Маленькие группы, живой контакт с преподавателем. Как офлайн, только удобнее.",           av: "М", color: C.blue   },
    { name: "Арман Б.",   tag: "SAT · 1420",        text: "Позвал двух друзей — получил скидку 20%. Реферальная программа отличная!",                av: "А", color: C.amber  },
  ];

  const faqs = [
    { q: "Как проходят занятия?",            a: "Прямые трансляции в Zoom. Группы до 15 человек. Ссылка появляется за 5 минут до урока." },
    { q: "Можно ли попробовать бесплатно?",  a: "Да — первое занятие бесплатно. Напишите в Telegram и мы запишем на пробный урок." },
    { q: "Как работает реферальная скидка?", a: "Делишься кодом → друг оплачивает → ты получаешь 10%. Скидки суммируются до 100%." },
    { q: "Можно вернуть деньги?",            a: "Да. Вычитаем стоимость проведённых уроков, остаток возвращаем за 5 рабочих дней." },
    { q: "Что если пропустил урок?",         a: "Материалы и задания доступны в личном кабинете до следующего занятия." },
  ];

  const features = [
    { title: "Живые уроки",        desc: "Только прямые трансляции — никаких записей. Задавай вопросы преподавателю вживую.",          color: C.violet, bg: C.violetPale, Icon: Video },
    { title: "Проверка домашек",   desc: "Каждое задание проверяет преподаватель с подробным комментарием — не автоматически.",         color: C.green,  bg: C.greenPale,  Icon: ClipboardCheck },
    { title: "Тест после урока",   desc: "После каждой темы — тест. Видишь прогресс и сразу знаешь, что повторить.",                    color: C.blue,   bg: C.bluePale,   Icon: BarChart2 },
    { title: "До 15 человек",      desc: "Маленькие группы — много внимания каждому. Преподаватель знает тебя по имени.",               color: C.amber,  bg: C.amberPale,  Icon: UserCheck },
    { title: "Реферальная скидка", desc: "Зови друзей — получай по 10% скидки за каждого. Накапливается до 100%.",                      color: C.violet, bg: C.violetPale, Icon: Gift },
    { title: "Всё в кабинете",     desc: "Расписание, домашки, тесты, Zoom-ссылки — в одном личном кабинете.",                          color: C.green,  bg: C.greenPale,  Icon: LayoutDashboard },
  ];

  return (
    <div style={{ background: C.bg, color: C.ink, fontFamily: font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${C.violetSoft}; border-radius: 4px; }

        @keyframes slideUp   { from { opacity:0; transform:translateY(32px) } to { opacity:1; transform:none } }
        @keyframes fadeIn    { from { opacity:0 } to { opacity:1 } }
        @keyframes floatY    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes gridMove  { from{background-position:0 0,0 0,0 0,0 0,0 0,0 0,0 0} to{background-position:0 0,0 0,0 0,60px 60px,60px 60px,20px 20px,20px 20px} }
        @keyframes heroBlobA { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.08)} }
        @keyframes heroBlobB { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,25px) scale(1.05)} }

        .hero-text  { animation: slideUp .9s cubic-bezier(.16,1,.3,1) both }
        .hero-cards { animation: slideUp .9s .15s cubic-bezier(.16,1,.3,1) both }
        .fade-in    { animation: fadeIn .6s ease both }

        .nav-link:hover { color: ${C.violet} !important; }

        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,.08); }

        .feature-card { transition: all .25s ease; cursor: default; }
        .feature-card:hover { transform: translateY(-4px); }

        .review-card { transition: all .25s ease; }
        .review-card:hover { transform: translateY(-4px); }

        .btn-primary {
          background: linear-gradient(135deg, ${C.violet}, ${C.violetSoft});
          background-size: 200% 200%;
          transition: all .25s ease;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(124,58,237,.35);
          background-position: right center;
        }
        .btn-outline { transition: all .2s ease; }
        .btn-outline:hover { border-color: ${C.violet} !important; color: ${C.violet} !important; background: ${C.violetPale} !important; }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 64, display: "flex", alignItems: "center",
        padding: isMobile ? "0 16px" : "0 48px", justifyContent: "space-between",
        background: scrolled ? "rgba(255,255,255,.96)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "none",
        transition: "all .3s",
      }}>
        <div onClick={() => window.scrollTo({ top:0, behavior:"smooth" })}
          style={{ fontWeight: 800, fontSize: 20, cursor: "pointer", color: C.ink, letterSpacing: -0.5 }}>
          <span style={{ background:`linear-gradient(135deg, ${C.violet}, ${C.violetSoft})`, WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent", color:"transparent", display:"inline-block" }}>Edu</span>
          <span>Platform</span>
        </div>

        <div className="nav-links" style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {[["Курсы","#courses"],["Как учиться","#how"],["Отзывы","#reviews"],["FAQ","#faq"]].map(([l,h],i) => (
            <a key={i} href={h} className="nav-link" style={{ color: C.gray, fontSize: 14, textDecoration: "none", fontWeight: 500, transition: "color .2s" }}>{l}</a>
          ))}
          <a href="/apply-teacher" className="nav-link" style={{ color: C.gray, fontSize: 14, textDecoration: "none", fontWeight: 500, transition: "color .2s" }}>Вакансии</a>
        </div>

        {user ? (
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => navigate("/dashboard")} className="btn-primary"
              style={{ color:"#fff", border:"none", borderRadius:10, padding:"9px 22px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:font }}>
              Кабинет
            </button>
            <button onClick={logout} style={{ background:"none", border:"none", color: scrolled ? C.gray : "rgba(255,255,255,.75)", cursor:"pointer", fontSize:14, fontFamily:font }}>Выйти</button>
          </div>
        ) : (
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => navigate("/login")} className="btn-outline"
                style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:10, padding:"8px 20px", fontWeight:600, fontSize:14, color:C.ink, cursor:"pointer", fontFamily:font }}>
              Войти
            </button>
            <button onClick={() => navigate("/register")} className="btn-primary"
              style={{ color:"#fff", border:"none", borderRadius:10, padding:"9px 22px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:font }}>
              Начать →
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        padding: isMobile ? "96px 20px 48px" : "80px 48px 80px",
        background: `radial-gradient(ellipse 90% 70% at 60% 30%, ${C.violetPale} 0%, ${C.bg} 60%)`,
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{ position:"absolute", top:-200, right:-100, width:600, height:600, borderRadius:"50%", background:`radial-gradient(circle, ${C.violet}10 0%, transparent 65%)`, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-150, left:"35%", width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle, ${C.blue}07 0%, transparent 65%)`, pointerEvents:"none" }}/>
        <div style={{ maxWidth: 1100, margin: "0 auto", width:"100%", display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr", gap: isMobile ? 0 : 64, alignItems:"center" }}>

          {/* Left */}
          <div className="hero-text">
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              background:"#fff", border:`1.5px solid ${C.border}`,
              borderRadius:100, padding:"6px 16px 6px 10px", marginBottom:28,
              boxShadow:"0 4px 16px rgba(0,0,0,.06)",
            }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#22C55E", display:"inline-block", animation:"pulse 2s infinite" }}/>
              <span style={{ fontSize:13, fontWeight:600, color:C.gray }}>Живые уроки каждый день</span>
            </div>

            <h1 style={{
              fontSize:"clamp(44px,6vw,70px)", fontWeight:800, lineHeight:1.08,
              letterSpacing:-2, color:C.ink, marginBottom:22,
            }}>
              Сдай{" "}
              <span style={{
                background:`linear-gradient(135deg, #A78BFA 0%, #C084FC 40%, #60A5FA 100%)`,
                WebkitBackgroundClip:"text", backgroundClip:"text",
                WebkitTextFillColor:"transparent", color:"transparent",
                display:"inline-block",
              }}>ЕНТ, IELTS</span>
              <br/>или SAT<br/>
              <span style={{ color:C.violet, fontStyle:"italic" }}>с первого раза</span>
            </h1>

            <p style={{ fontSize:17, color:C.gray, lineHeight:1.8, marginBottom:36, maxWidth:460, fontWeight:400 }}>
              Живые онлайн-уроки в Zoom, домашки с проверкой преподавателя и тесты после каждой темы — всё в одном кабинете.
            </p>

            <div style={{ display:"flex", gap:14, marginBottom:44, flexWrap:"wrap" }}>
              <button onClick={() => navigate("/register")} className="btn-primary"
                style={{ color:"#fff", border:"none", borderRadius:14, padding:"14px 36px", fontWeight:800, fontSize:16, cursor:"pointer", fontFamily:font }}>
                Начать бесплатно
              </button>
              <button onClick={() => document.getElementById("courses")?.scrollIntoView({ behavior:"smooth" })}
                className="btn-outline"
                style={{ background:"#fff", color:C.ink, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"13px 28px", fontWeight:600, fontSize:15, cursor:"pointer", fontFamily:font }}>
                Смотреть курсы
              </button>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ display:"flex" }}>
                {["А","Д","М","Б","К"].map((l,i) => (
                  <div key={i} style={{
                    width:36, height:36, borderRadius:"50%",
                    background:[C.violet,C.green,C.blue,C.amber,C.violetSoft][i],
                    color:"#fff", fontSize:13, fontWeight:700,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    marginLeft:i>0?-10:0, border:"2.5px solid #fff",
                  }}>{l}</div>
                ))}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:C.ink }}>500+ студентов</div>
                <div style={{ fontSize:13, color:C.gray, marginTop:2, display: "flex", alignItems: "center", gap: 4 }}><Star size={13} fill={C.gray} stroke={C.gray}/> 4.9 рейтинг платформы</div>
              </div>
            </div>
          </div>

          {/* Right — cards */}
          <div className="hero-cards" style={{ display: isMobile ? "none" : "flex", flexDirection:"column", gap:14 }}>
            {/* Live card */}
            <div style={{
              background:"#fff", borderRadius:20, padding:24,
              boxShadow:`0 8px 40px rgba(124,58,237,.12)`,
              border:`1.5px solid rgba(124,58,237,.15)`,
              animation:"floatY 4s ease-in-out infinite",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ fontWeight:700, fontSize:15, color:C.ink }}>Идёт урок</div>
                <div style={{ background:"#22C55E", color:"#fff", borderRadius:20, padding:"3px 12px", fontSize:11, fontWeight:800, display:"inline-flex", alignItems:"center", gap:5 }}><Radio size={11} strokeWidth={2.5}/> LIVE</div>
              </div>
              <div style={{ color:C.gray, fontSize:13, marginBottom:14, fontWeight:500 }}>ЕНТ Математика · Тригонометрия</div>
              <div style={{ background:C.violetPale, borderRadius:10, padding:"12px 14px", borderLeft:`3px solid ${C.violet}` }}>
                <div style={{ fontSize:12, color:C.violet, fontWeight:700, marginBottom:4 }}>Преподаватель:</div>
                <div style={{ fontSize:13, color:C.ink, lineHeight:1.5 }}>«sin²x + cos²x = 1 — эта формула нужна в каждом задании!»</div>
              </div>
            </div>

            {/* Score mini cards */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{ background:C.violetPale, borderRadius:16, padding:20, animation:"floatY 4s .5s ease-in-out infinite", border:`1px solid ${C.violet}20` }}>
                <div style={{ fontSize:38, fontWeight:800, color:C.violet, letterSpacing:-1 }}>120</div>
                <div style={{ fontSize:12, color:C.gray, marginTop:3, fontWeight:500 }}>Средний балл ЕНТ</div>
                <div style={{ marginTop:8, fontSize:11, color:"#22C55E", fontWeight:700 }}><TrendingUp size={11} style={{display:'inline',marginRight:3}}/> +12 за месяц</div>
              </div>
              <div style={{ background:C.greenPale, borderRadius:16, padding:20, animation:"floatY 4s 1s ease-in-out infinite", border:`1px solid ${C.green}20` }}>
                <div style={{ fontSize:38, fontWeight:800, color:C.green, letterSpacing:-1 }}>7.5</div>
                <div style={{ fontSize:12, color:C.gray, marginTop:3, fontWeight:500 }}>Средний IELTS</div>
                <div style={{ marginTop:8, fontSize:11, color:"#22C55E", fontWeight:700 }}><TrendingUp size={11} style={{display:'inline',marginRight:3}}/> +0.5 за курс</div>
              </div>
            </div>

            {/* Homework */}
            <div style={{
              background:"#fff", borderRadius:16, padding:"16px 18px",
              border:`1.5px solid ${C.border}`,
              display:"flex", alignItems:"center", gap:14,
              animation:"floatY 4s 1.5s ease-in-out infinite",
            }}>
              <div style={{ width:42, height:42, borderRadius:12, background:C.greenPale, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <CheckCircle size={20} color={C.green} strokeWidth={2.5} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:C.ink }}>Домашка принята!</div>
                <div style={{ color:C.gray, fontSize:12, marginTop:2 }}>«Все 10 задач верны. Отличная работа!»</div>
              </div>
              <div style={{ background:C.violetPale, color:C.violet, borderRadius:8, padding:"4px 10px", fontSize:12, fontWeight:700, flexShrink:0, display:"inline-flex", alignItems:"center", gap:4 }}>+10 <Star size={12} fill={C.violet} stroke={C.violet} /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background:`linear-gradient(135deg, ${C.violet} 0%, ${C.violetDark} 100%)`, padding: isMobile ? "40px 20px" : "52px 48px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap:24, textAlign:"center" }}>
          {[
            { end:500, suffix:"+", label:"Студентов" },
            { end:95,  suffix:"%", label:"Сдают с первого раза" },
            { end:50,  suffix:"+", label:"Уроков в месяц" },
            { end:3,   suffix:" года", label:"На рынке" },
          ].map((s,i) => (
            <div key={i} className="stat-card" style={{
              borderRight: (!isMobile && i<3) ? "1px solid rgba(255,255,255,.15)" : "none",
              paddingRight: (!isMobile && i<3) ? 24 : 0, transition:"all .25s",
            }}>
              <div style={{ fontSize:48, fontWeight:800, color:"#fff", letterSpacing:-1.5 }}>
                <Counter end={s.end} suffix={s.suffix}/>
              </div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,.65)", marginTop:6, fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: isMobile ? "60px 20px" : "96px 48px", background:C.surface }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:60 }}>
            <span style={{
              fontSize:12, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase",
              color:C.violet, background:C.violetPale, borderRadius:6, padding:"4px 12px",
            }}>Почему мы</span>
            <h2 style={{ fontSize:"clamp(30px,4vw,46px)", fontWeight:800, margin:"18px 0 0", letterSpacing:-1.2, color:C.ink }}>
              Всё для успешной сдачи
            </h2>
          </div>

          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap:20 }}>
            {features.map((f,i) => {
              const Icon = f.Icon;
              return (
                <div key={i} className="feature-card" style={{
                  background:C.bg, borderRadius:18, padding:"28px 24px",
                  border:`1.5px solid ${C.border}`,
                  boxShadow:"0 2px 12px rgba(0,0,0,.04)",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = f.color+"55"; e.currentTarget.style.boxShadow = `0 16px 40px ${f.color}20`; e.currentTarget.style.transform="translateY(-4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.04)"; e.currentTarget.style.transform="translateY(0)"; }}
                >
                  <div style={{
                    width:52, height:52, borderRadius:14,
                    background:f.bg, display:"flex", alignItems:"center", justifyContent:"center",
                    marginBottom:18, border:`1.5px solid ${f.color}22`, boxShadow:`0 4px 12px ${f.color}15`,
                  }}>
                    <Icon size={26} color={f.color} />
                  </div>
                  <h3 style={{ fontWeight:700, fontSize:17, margin:"0 0 10px", color:C.ink }}>{f.title}</h3>
                  <p style={{ color:C.gray, fontSize:14, lineHeight:1.75, margin:0 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COURSES ── */}
      <section id="courses" style={{ padding: isMobile ? "60px 20px" : "96px 48px", background:C.bg }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"flex", flexDirection: isMobile ? "column" : "row", justifyContent:"space-between", alignItems: isMobile ? "flex-start" : "flex-end", gap:12, marginBottom:52 }}>
            <div>
              <span style={{ fontSize:12, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:C.violet, background:C.violetPale, borderRadius:6, padding:"4px 12px" }}>Программы</span>
              <h2 style={{ fontSize:"clamp(30px,4vw,46px)", fontWeight:800, margin:"16px 0 0", letterSpacing:-1.2, color:C.ink }}>Выбери свой курс</h2>
            </div>
            <p style={{ color:C.gray, fontSize:14, maxWidth:240, textAlign:"right", lineHeight:1.7 }}>
              Подготовка к ЕНТ, IELTS и SAT с нуля до результата
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign:"center", padding:80, color:C.gray }}>Загрузка курсов…</div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign:"center", padding:80, color:C.gray }}>Курсы скоро появятся</div>
          ) : (
            <>
              <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(320px,1fr))", gap:20 }}>
                {(showAllCourses ? courses : courses.slice(0,6)).map(c => <CourseCard key={c.id} course={c} navigate={navigate}/>)}
              </div>
              {courses.length > 6 && (
                <div style={{ textAlign:"center", marginTop:32 }}>
                  <button onClick={() => setShowAllCourses(v => !v)} style={{
                    background: showAllCourses ? C.surface : `linear-gradient(135deg,${C.violet},${C.violetSoft})`,
                    color: showAllCourses ? C.violet : "#fff",
                    border: `1.5px solid ${showAllCourses ? C.violet : "transparent"}`,
                    borderRadius:14, padding:"13px 36px", fontWeight:800, fontSize:15,
                    cursor:"pointer", fontFamily:font, transition:"all .2s",
                    boxShadow: showAllCourses ? "none" : `0 8px 24px rgba(124,58,237,.25)`,
                  }}>
                    {showAllCourses ? `Скрыть ↑` : `Показать все ${courses.length} курсов ↓`}
                  </button>
                </div>
              )}
            </>
          )}

          <div style={{ textAlign:"center", marginTop:52 }}>
            <p style={{ color:C.gray, marginBottom:14, fontSize:14 }}>Не нашёл нужный курс?</p>
            <a href="https://t.me/eduplatform_kz" target="_blank" rel="noreferrer" style={{
              display:"inline-flex", alignItems:"center", gap:8,
              background:"#0088CC", color:"#fff",
              borderRadius:12, padding:"12px 28px",
              fontWeight:700, fontSize:14, textDecoration:"none", fontFamily:font,
              transition:"opacity .2s",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity="1"}
            >Написать в Telegram</a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: isMobile ? "60px 20px" : "96px 48px", background:C.surface }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:72 }}>
            <span style={{ fontSize:12, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:C.violet, background:C.violetPale, borderRadius:6, padding:"4px 12px" }}>Как учиться</span>
            <h2 style={{ fontSize:"clamp(30px,4vw,46px)", fontWeight:800, margin:"18px 0 0", letterSpacing:-1.2, color:C.ink }}>Начать просто</h2>
            <p style={{ color:C.gray, fontSize:16, marginTop:14, lineHeight:1.7 }}>4 шага до первого результата</p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap:20, position:"relative" }}>
            <div style={{ position:"absolute", top:44, left:"12%", right:"12%", height:2, background:`linear-gradient(90deg, ${C.violet}60, rgba(139,92,246,.15))`, zIndex:0, borderRadius:2 }}/>
            {[
              { n:"01", icon:BookOpen,  color:C.violet,  bg:C.violetPale, title:"Выбери курс",  desc:"Просмотри ЕНТ, IELTS и SAT программы — найди свой предмет." },
              { n:"02", icon:CreditCard,color:C.green,   bg:C.greenPale,  title:"Оплати",       desc:"Kaspi Pay — оплата за 1 минуту, никаких лишних шагов." },
              { n:"03", icon:Users,     color:C.amber,   bg:C.amberPale,  title:"Попади в группу", desc:"Тебя добавят в группу, получишь расписание и ссылку." },
              { n:"04", icon:Rocket,    color:"#DC2626",  bg:"#FEF2F2",   title:"Учись",        desc:"Уроки онлайн, домашки, тесты и обратная связь — поехали!" },
            ].map((s,i) => {
              const Icon = s.icon;
              return (
                <div key={i} style={{ textAlign:"center", padding:"28px 16px 24px", position:"relative", zIndex:1, background:C.bg, borderRadius:20, border:`1.5px solid ${C.border}`, boxShadow:"0 2px 12px rgba(0,0,0,.04)", transition:"transform .2s, box-shadow .2s", cursor:"default" }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-6px)";e.currentTarget.style.boxShadow=`0 16px 40px rgba(124,58,237,.12)`;e.currentTarget.style.borderColor=s.color+"44";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.04)";e.currentTarget.style.borderColor=C.border;}}>
                  {/* Step number badge */}
                  <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:`linear-gradient(135deg,${s.color},${s.color}bb)`, color:"#fff", borderRadius:20, padding:"3px 12px", fontSize:11, fontWeight:800, letterSpacing:1, boxShadow:`0 4px 12px ${s.color}44` }}>{s.n}</div>
                  <div style={{ width:72, height:72, borderRadius:"50%", background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:`0 6px 20px ${s.color}20` }}>
                    <Icon size={32} color={s.color} />
                  </div>
                  <h3 style={{ fontWeight:800, fontSize:17, margin:"0 0 10px", color:C.ink }}>{s.title}</h3>
                  <p style={{ color:C.gray, fontSize:13, lineHeight:1.75, margin:0 }}>{s.desc}</p>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign:"center", marginTop:60 }}>
            <button onClick={() => navigate("/register")} className="btn-primary"
              style={{ color:"#fff", border:"none", borderRadius:14, padding:"14px 44px", fontWeight:800, fontSize:16, cursor:"pointer", fontFamily:font }}>
              Начать бесплатно →
            </button>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section id="reviews" style={{ padding: isMobile ? "60px 20px" : "96px 48px", background:C.bg }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <span style={{ fontSize:12, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:C.violet, background:C.violetPale, borderRadius:6, padding:"4px 12px" }}>Отзывы</span>
            <h2 style={{ fontSize:"clamp(30px,4vw,46px)", fontWeight:800, margin:"18px 0 0", letterSpacing:-1.2, color:C.ink }}>Студенты говорят</h2>
          </div>

          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap:20 }}>
            {reviews.map((r,i) => (
              <div key={i} className="review-card" style={{
                background:C.bg, borderRadius:20, padding:32,
                border:`1.5px solid ${C.border}`,
                boxShadow:"0 2px 12px rgba(0,0,0,.3)",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = r.color+"50"; e.currentTarget.style.boxShadow = `0 12px 36px ${r.color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.3)"; }}
              >
                <div style={{ color:"#F59E0B", fontSize:15, marginBottom:14, letterSpacing:2, display: "flex", gap: 2 }}><Star size={16} fill="#F59E0B" stroke="#F59E0B"/><Star size={16} fill="#F59E0B" stroke="#F59E0B"/><Star size={16} fill="#F59E0B" stroke="#F59E0B"/><Star size={16} fill="#F59E0B" stroke="#F59E0B"/><Star size={16} fill="#F59E0B" stroke="#F59E0B"/></div>
                <p style={{ fontSize:15, lineHeight:1.8, color:C.ink, margin:"0 0 24px" }}>"{r.text}"</p>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{
                    width:44, height:44, borderRadius:"50%",
                    background:r.color, color:"#fff",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontWeight:700, fontSize:16, flexShrink:0,
                  }}>{r.av}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:C.ink }}>{r.name}</div>
                    <div style={{ fontSize:12, color:r.color, fontWeight:600, marginTop:2 }}>{r.tag}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: isMobile ? "60px 20px" : "96px 48px", background:C.surface }}>
        <div style={{ maxWidth:700, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <span style={{ fontSize:12, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:C.violet, background:C.violetPale, borderRadius:6, padding:"4px 12px" }}>FAQ</span>
            <h2 style={{ fontSize:"clamp(30px,4vw,46px)", fontWeight:800, margin:"18px 0 0", letterSpacing:-1.2, color:C.ink }}>Частые вопросы</h2>
          </div>
          <div style={{ borderTop:`1px solid ${C.border}` }}>
            {faqs.map((f,i) => <FAQItem key={i} q={f.q} a={f.a}/>)}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: isMobile ? "60px 20px" : "100px 48px", textAlign:"center",
        background:`linear-gradient(135deg, ${C.violet} 0%, ${C.violetDark} 100%)`,
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", top:-100, right:-100, width:400, height:400, borderRadius:"50%", background:"rgba(255,255,255,.06)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-80, left:-60, width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,.04)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize:"28px 28px", pointerEvents:"none" }}/>
        <div style={{ position:"relative", maxWidth:560, margin:"0 auto" }}>
          <h2 style={{ fontSize:"clamp(34px,5vw,58px)", fontWeight:800, color:"#fff", marginBottom:16, letterSpacing:-2, lineHeight:1.08 }}>
            Готов к результату?
          </h2>
          <p style={{ color:"rgba(255,255,255,.7)", fontSize:17, marginBottom:40, lineHeight:1.7 }}>
            Зарегистрируйся и попади на первый урок бесплатно
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={() => navigate("/register")} style={{
              background:"#fff", color:C.violet, border:"none",
              borderRadius:14, padding:"14px 40px",
              fontWeight:800, fontSize:16, cursor:"pointer", fontFamily:font,
              boxShadow:"0 8px 32px rgba(0,0,0,.2)",
              transition:"transform .2s, box-shadow .2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 14px 40px rgba(0,0,0,.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,.2)"; }}
            >Зарегистрироваться →</button>
            <a href="https://t.me/eduplatform_kz" target="_blank" rel="noreferrer" style={{
              background:"rgba(255,255,255,.12)", color:"#fff",
              border:"1.5px solid rgba(255,255,255,.25)",
              borderRadius:14, padding:"13px 32px",
              fontWeight:700, fontSize:16, textDecoration:"none",
              display:"inline-block", fontFamily:font,
              transition:"background .2s",
            }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.2)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,.12)"}
            >Telegram</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:C.ink, padding: isMobile ? "40px 20px 32px" : "64px 48px 40px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr", gap: isMobile ? 24 : 48, marginBottom:48, paddingBottom:48, borderBottom:"1px solid rgba(255,255,255,.08)" }}>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:"#fff", marginBottom:14, letterSpacing:-0.5 }}>
                <span style={{ background:`linear-gradient(135deg,${C.violetSoft},#A78BFA)`, WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent", color:"transparent", display:"inline-block" }}>Edu</span>Platform
              </div>
              <p style={{ fontSize:14, lineHeight:1.8, maxWidth:240, color:"rgba(255,255,255,.35)", marginBottom:20 }}>
                Онлайн-подготовка к ЕНТ, IELTS и SAT в Казахстане. Живые уроки. Реальный результат.
              </p>
              <a href="https://t.me/eduplatform_kz" target="_blank" rel="noreferrer"
                style={{ color:C.violetSoft, textDecoration:"none", fontSize:14, fontWeight:600 }}>
                @eduplatform_kz
              </a>
            </div>
            {[
              { title:"Курсы",     links:[["ЕНТ","#courses"],["IELTS","#courses"],["SAT","#courses"]] },
              { title:"Компания",  links:[["О нас","#"],["Вакансии","/apply-teacher"],["Контакты","#"]] },
              { title:"Поддержка", links:[["FAQ","#faq"],["Возврат","#"],["Правила","#"]] },
            ].map((col,i) => (
              <div key={i}>
                <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.25)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:16 }}>{col.title}</div>
                {col.links.map(([l,href],j) => (
                  <div key={j} style={{ marginBottom:10 }}>
                    <a href={href} style={{ color:"rgba(255,255,255,.4)", textDecoration:"none", fontSize:14, transition:"color .2s" }}
                      onMouseEnter={e => e.target.style.color="#fff"}
                      onMouseLeave={e => e.target.style.color="rgba(255,255,255,.4)"}
                    >{l}</a>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"rgba(255,255,255,.2)", flexWrap:"wrap", gap:8 }}>
            <span>© 2026 EduPlatform. Все права защищены.</span>
            <span>Казахстан</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
