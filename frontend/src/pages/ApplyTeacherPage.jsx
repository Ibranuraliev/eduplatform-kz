import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, Check, Paperclip, Send, PartyPopper, ClipboardList, Phone, CheckCircle, GraduationCap, Banknote, Clock, BookOpen, Loader, Rocket, User } from 'lucide-react';
import api from '../api';

/* ── Design tokens ── */
const P = {
  violet:       '#7C3AED',
  violetDark:   '#5B21B6',
  violetSoft:   '#8B5CF6',
  violetPale:   '#F5F3FF',
  violetBorder: 'rgba(124,58,237,0.18)',
  ink:          '#0F0A1E',
  slate:        '#475569',
  muted:        '#94A3B8',
  border:       '#E8E4F0',
  white:        '#FFFFFF',
  surface:      '#FAFAF9',
  green:        '#059669',
  greenPale:    '#F0FDF4',
  red:          '#DC2626',
  redPale:      '#FEF2F2',
  orange:       '#D97706',
  orangePale:   '#FFFBEB',
};
const font = "'Nunito','Segoe UI',system-ui,sans-serif";

const inputS = (err) => ({
  width: '100%',
  border: `1.5px solid ${err ? P.red : P.border}`,
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: 15,
  fontFamily: font,
  outline: 'none',
  color: P.ink,
  background: P.white,
  boxSizing: 'border-box',
  transition: 'border-color .2s',
});

const SUBJECTS = [
  'Математика', 'Физика', 'Химия', 'Биология', 'История Казахстана',
  'Всемирная история', 'География', 'Английский язык', 'Русский язык',
  'Казахский язык', 'Информатика', 'IELTS', 'SAT',
];

/* ── File upload zone ── */
function FileUpload({ label, hint, accept, file, onChange, error }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onChange(f);
  };

  return (
    <div>
      <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:6 }}>
        {label} <span style={{ color:P.red }}>*</span>
      </label>
      <div
        onClick={() => ref.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${error ? P.red : drag ? P.violet : file ? P.green : P.border}`,
          borderRadius: 14,
          padding: '22px',
          textAlign: 'center',
          cursor: 'pointer',
          background: drag ? P.violetPale : file ? P.greenPale : P.surface,
          transition: 'all .2s',
        }}
      >
        <input ref={ref} type="file" accept={accept} style={{ display:'none' }} onChange={e => onChange(e.target.files[0])} />
        {file ? (
          <div>
            <Check size={28} color={P.green} style={{ marginBottom: 6, display: 'inline-block' }} />
            <div style={{ fontWeight: 800, fontSize: 14, color: P.green }}>{file.name}</div>
            <div style={{ fontSize: 12, color: P.muted, marginTop: 3 }}>
              {(file.size / 1024 / 1024).toFixed(2)} МБ · Нажми чтобы заменить
            </div>
          </div>
        ) : (
          <div>
            <Paperclip size={32} color={P.slate} style={{ marginBottom: 8, display: 'inline-block' }} />
            <div style={{ fontWeight: 700, fontSize: 14, color: P.slate }}>
              Перетащи файл или <span style={{ color: P.violet }}>нажми для выбора</span>
            </div>
            <div style={{ fontSize: 12, color: P.muted, marginTop: 4 }}>{hint}</div>
          </div>
        )}
      </div>
      {error && <div style={{ color: P.red, fontSize: 12, marginTop: 5, fontWeight: 600 }}><AlertTriangle size={14} style={{ display: 'inline-block', marginRight: 4 }} />{error}</div>}
    </div>
  );
}

/* ── Subject checkbox grid ── */
function SubjectPicker({ selected, onChange, error }) {
  const toggle = (s) => {
    if (selected.includes(s)) onChange(selected.filter(x => x !== s));
    else onChange([...selected, s]);
  };
  return (
    <div>
      <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:8 }}>
        Предметы <span style={{ color:P.red }}>*</span>
      </label>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {SUBJECTS.map(s => {
          const on = selected.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              style={{
                padding: '7px 16px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: font,
                cursor: 'pointer',
                border: `1.5px solid ${on ? P.violet : P.border}`,
                background: on ? P.violetPale : P.white,
                color: on ? P.violet : P.slate,
                transition: 'all .2s',
              }}
            >
              {on && <Check size={14} style={{ display: 'inline-block', marginRight: 4 }} />}{s}
            </button>
          );
        })}
      </div>
      {error && <div style={{ color: P.red, fontSize: 12, marginTop: 6, fontWeight: 600 }}><AlertTriangle size={14} style={{ display: 'inline-block', marginRight: 4 }} />{error}</div>}
    </div>
  );
}

/* ── Step indicator ── */
function Steps({ current }) {
  const steps = ['Личные данные', 'Опыт и предметы', 'Документы'];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:36 }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: done ? P.green : active ? P.violet : P.surface,
                border: `2px solid ${done ? P.green : active ? P.violet : P.border}`,
                color: done || active ? '#fff' : P.muted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 900,
                transition: 'all .3s',
              }}>
                {done ? <Check size={14} color="#fff" strokeWidth={3} /> : i + 1}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: active ? P.violet : done ? P.green : P.muted, whiteSpace:'nowrap' }}>
                {s}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? P.green : P.border, margin: '0 8px', marginBottom: 22, transition: 'background .3s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Component ── */
export default function ApplyTeacherPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    email: '',
  });
  const [experience, setExperience] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [about, setAbout] = useState('');
  const [resume, setResume] = useState(null);
  const [diploma, setDiploma] = useState(null);
  const [errors, setErrors] = useState({});
  const [scrolled, setScrolled] = useState(false);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  /* Validate each step */
  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.full_name.trim()) e.full_name = 'Введи ФИО';
      if (!form.phone.trim()) e.phone = 'Введи телефон';
      else if (!/^\+?\d{10,15}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Некорректный формат. Пример: +77001234567';
    }
    if (s === 1) {
      if (!experience || isNaN(experience) || Number(experience) < 0) e.experience = 'Укажи опыт (число лет)';
      if (subjects.length === 0) e.subjects = 'Выбери хотя бы один предмет';
    }
    if (s === 2) {
      if (!resume)  e.resume  = 'Прикрепи резюме';
      if (!diploma) e.diploma = 'Прикрепи диплом или сертификат';
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setErrors({});
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    const e = validate(2);
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('full_name', form.full_name.trim());
      fd.append('phone', form.phone.trim());
      fd.append('experience_years', Number(experience));
      fd.append('subjects', subjects.join(', '));
      fd.append('resume', resume);
      fd.append('diploma', diploma);
      if (about.trim()) fd.append('bio', about.trim());

      await api.post('/hr/apply/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setErrors(data);
      } else {
        setErrors({ general: 'Ошибка отправки. Попробуй ещё раз.' });
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div style={{ minHeight:'100vh', background:'#F8F6FF', fontFamily:font, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;}`}</style>
        <div style={{ background:P.white, borderRadius:28, padding:'56px 48px', maxWidth:480, width:'100%', textAlign:'center', boxShadow:'0 16px 56px rgba(124,58,237,.12)', border:`1.5px solid ${P.violetBorder}` }}>
          <div style={{ fontSize:72, marginBottom:20, display:'flex', justifyContent:'center' }}><PartyPopper size={72} color="#7C3AED"/></div>
          <h2 style={{ fontSize:26, fontWeight:900, color:P.ink, margin:'0 0 12px', letterSpacing:-0.5 }}>Заявка отправлена!</h2>
          <p style={{ color:P.slate, fontSize:15, lineHeight:1.7, margin:'0 0 32px' }}>
            Мы получили твою заявку и рассмотрим её в течение <strong>1–3 рабочих дней</strong>. Результат сообщим на телефон <strong>{form.phone}</strong>.
          </p>
          <div style={{ background:P.violetPale, border:`1.5px solid ${P.violetBorder}`, borderRadius:16, padding:'18px 22px', marginBottom:32, textAlign:'left' }}>
            <div style={{ fontSize:13, fontWeight:700, color:P.violet, marginBottom:10 }}>Что дальше?</div>
            {[
              [<ClipboardList size={14} style={{flexShrink:0}}/>, 'HR проверит твои документы'],
              [<Phone size={14} style={{flexShrink:0}}/>, 'Мы свяжемся с тобой для собеседования'],
              [<CheckCircle size={14} style={{flexShrink:0}}/>, 'После одобрения получишь доступ к кабинету учителя'],
            ].map((t, i) => (
              <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom: i < 2 ? 8 : 0 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:14, lineHeight:1.6, color:P.slate }}>{t[0]}{t[1]}</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => navigate('/')} style={{ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:14, padding:'13px 28px', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:font }}>
              На главную
            </button>
            <a href="https://t.me/eduplatform_kz" target="_blank" rel="noreferrer" style={{ background:'#0088CC', color:'#fff', border:'none', borderRadius:14, padding:'13px 28px', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:font, textDecoration:'none', display:'inline-block' }}>
              <Send size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/> Telegram
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6FF', fontFamily:font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { border-color: ${P.violet} !important; box-shadow: 0 0 0 3px rgba(124,58,237,.12); }
      `}</style>

      {/* Navbar */}
      <nav style={{ background:P.white, borderBottom:`1px solid ${P.border}`, padding:'0 40px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(124,58,237,.06)' }}>
        <Link to="/" style={{ fontWeight:900, fontSize:20, textDecoration:'none', color:P.ink }}>
          <span style={{ color:P.violet }}>Edu</span>Platform
          <span style={{ marginLeft:8, fontSize:11, background:P.violet, color:'#fff', borderRadius:6, padding:'2px 7px', fontWeight:800, verticalAlign:'middle' }}>KZ</span>
        </Link>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <Link to="/login"    style={{ color:P.slate, fontSize:14, fontWeight:700, textDecoration:'none' }}>Войти</Link>
          <Link to="/register" style={{ background:P.violet, color:'#fff', borderRadius:12, padding:'9px 22px', fontWeight:800, fontSize:14, textDecoration:'none' }}>Регистрация</Link>
        </div>
      </nav>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'48px 24px 80px' }}>

        {/* Page header */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:P.violetPale, border:`1.5px solid ${P.violetBorder}`, borderRadius:100, padding:'6px 18px', marginBottom:18 }}>
            <User size={16} color="#7C3AED"/>
            <span style={{ fontSize:13, fontWeight:700, color:P.violet }}>Стать преподавателем</span>
          </div>
          <h1 style={{ fontSize:'clamp(28px,5vw,42px)', fontWeight:900, color:P.ink, margin:'0 0 14px', letterSpacing:-1, lineHeight:1.1 }}>
            Преподавай на <span style={{ color:P.violet }}>EduPlatform</span>
          </h1>
          <p style={{ color:P.slate, fontSize:16, lineHeight:1.7, margin:'0 auto', maxWidth:480 }}>
            Веди живые уроки в Zoom, проверяй домашки и помогай студентам сдавать ЕНТ, IELTS и SAT.
          </p>
        </div>

        {/* Benefits row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:40 }}>
          {[
            { icon:<Banknote size={28}/>, title:'Стабильный доход',   desc:'Оплата за каждый проведённый урок' },
            { icon:<Clock size={28}/>,    title:'Удобный график',      desc:'Выбирай время сам, работай из дома' },
            { icon:<GraduationCap size={28}/>, title:'Поддержка',     desc:'Материалы и методическая помощь' },
          ].map((b, i) => (
            <div key={i} style={{ background:P.white, border:`1.5px solid ${P.border}`, borderRadius:16, padding:'18px 16px', textAlign:'center' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:8, color:P.violet }}>{b.icon}</div>
              <div style={{ fontWeight:800, fontSize:13, color:P.ink, marginBottom:4 }}>{b.title}</div>
              <div style={{ fontSize:12, color:P.slate, lineHeight:1.5 }}>{b.desc}</div>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div style={{ background:P.white, borderRadius:24, border:`1.5px solid ${P.border}`, padding:'36px 40px', boxShadow:'0 8px 40px rgba(124,58,237,.08)' }}>

          <Steps current={step} />

          {errors.general && (
            <div style={{ background:P.redPale, color:P.red, border:`1px solid ${P.red}33`, borderRadius:12, padding:'12px 16px', fontSize:14, fontWeight:600, marginBottom:24 }}>
              <AlertTriangle size={16} style={{ display: 'inline-block', marginRight: 8 }} /> {errors.general}
            </div>
          )}

          {/* ── STEP 0: Personal info ── */}
          {step === 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div style={{ fontWeight:900, fontSize:20, color:P.ink, marginBottom:4 }}>Личные данные</div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:6 }}>
                  ФИО <span style={{ color:P.red }}>*</span>
                </label>
                <input
                  value={form.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  style={inputS(errors.full_name)}
                />
                {errors.full_name && <div style={{ color:P.red, fontSize:12, marginTop:5, fontWeight:600 }}><AlertTriangle size={14} style={{ display: 'inline-block', marginRight: 4 }} />{errors.full_name}</div>}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:6 }}>
                    Телефон <span style={{ color:P.red }}>*</span>
                  </label>
                  <input
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+77001234567"
                    style={inputS(errors.phone)}
                  />
                  {errors.phone && <div style={{ color:P.red, fontSize:12, marginTop:5, fontWeight:600 }}><AlertTriangle size={14} style={{ display: 'inline-block', marginRight: 4 }} />{errors.phone}</div>}
                </div>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:6 }}>Город</label>
                  <input
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    placeholder="Алматы"
                    style={inputS(false)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:6 }}>Email (необязательно)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="teacher@example.com"
                  style={inputS(false)}
                />
              </div>
            </div>
          )}

          {/* ── STEP 1: Experience & subjects ── */}
          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
              <div style={{ fontWeight:900, fontSize:20, color:P.ink, marginBottom:4 }}>Опыт и предметы</div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:6 }}>
                  Опыт преподавания (лет) <span style={{ color:P.red }}>*</span>
                </label>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  {['0', '1', '2', '3', '4', '5+'].map(v => {
                    const val = v === '5+' ? '5' : v;
                    const active = experience === val;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => { setExperience(val); if (errors.experience) setErrors(p => ({ ...p, experience: '' })); }}
                        style={{
                          width: 60, height: 60, borderRadius: 14,
                          fontWeight: 900, fontSize: 18, fontFamily: font,
                          cursor: 'pointer', transition: 'all .2s',
                          background: active ? P.violet : P.surface,
                          color: active ? '#fff' : P.slate,
                          border: `2px solid ${active ? P.violet : P.border}`,
                          boxShadow: active ? `0 4px 16px rgba(124,58,237,.3)` : 'none',
                        }}
                      >{v}</button>
                    );
                  })}
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={experience}
                    onChange={e => { setExperience(e.target.value); if (errors.experience) setErrors(p => ({ ...p, experience: '' })); }}
                    placeholder="или введи"
                    style={{ ...inputS(errors.experience), width:110, display:'inline-block' }}
                  />
                </div>
                {errors.experience && <div style={{ color:P.red, fontSize:12, marginTop:6, fontWeight:600 }}><AlertTriangle size={14} style={{ display: 'inline-block', marginRight: 4 }} />{errors.experience}</div>}
              </div>

              <SubjectPicker selected={subjects} onChange={setSubjects} error={errors.subjects} />

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:6 }}>О себе (необязательно)</label>
                <textarea
                  value={about}
                  onChange={e => setAbout(e.target.value)}
                  placeholder="Расскажи о своём подходе к обучению, достижениях студентов, методиках..."
                  rows={4}
                  style={{ ...inputS(false), resize:'vertical', lineHeight:1.6 }}
                />
              </div>
            </div>
          )}

          {/* ── STEP 2: Documents ── */}
          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
              <div>
                <div style={{ fontWeight:900, fontSize:20, color:P.ink, marginBottom:4 }}>Документы</div>
                <p style={{ color:P.slate, fontSize:14, margin:'0 0 20px', lineHeight:1.6 }}>
                  Загрузи резюме и диплом (или сертификат). Допустимые форматы: PDF, DOCX, JPG, PNG. Максимум 10 МБ.
                </p>
              </div>

              <FileUpload
                label="Резюме"
                hint="PDF, DOCX или изображение · до 10 МБ"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                file={resume}
                onChange={(f) => { setResume(f); if (errors.resume) setErrors(p => ({ ...p, resume: '' })); }}
                error={errors.resume}
              />

              <FileUpload
                label="Диплом или сертификат"
                hint="PDF или изображение · до 10 МБ"
                accept=".pdf,.jpg,.jpeg,.png"
                file={diploma}
                onChange={(f) => { setDiploma(f); if (errors.diploma) setErrors(p => ({ ...p, diploma: '' })); }}
                error={errors.diploma}
              />

              {/* Summary */}
              <div style={{ background:P.violetPale, border:`1.5px solid ${P.violetBorder}`, borderRadius:16, padding:'18px 20px' }}>
                <div style={{ fontWeight:800, fontSize:13, color:P.violet, marginBottom:10 }}><ClipboardList size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Проверь данные заявки</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    ['ФИО', form.full_name],
                    ['Телефон', form.phone],
                    ['Город', form.city || '—'],
                    ['Опыт', experience ? `${experience} лет` : '—'],
                    ['Предметы', subjects.length > 0 ? subjects.join(', ') : '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize:11, color:P.muted, fontWeight:600 }}>{k}</div>
                      <div style={{ fontSize:13, color:P.ink, fontWeight:700, marginTop:1 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:32, paddingTop:24, borderTop:`1.5px solid ${P.border}` }}>
            {step > 0 ? (
              <button onClick={back} style={{ background:P.surface, color:P.slate, border:`1.5px solid ${P.border}`, borderRadius:12, padding:'12px 24px', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:font }}>
                ← Назад
              </button>
            ) : (
              <Link to="/" style={{ color:P.slate, fontSize:14, fontWeight:600, textDecoration:'none' }}>← На главную</Link>
            )}

            {step < 2 ? (
              <button onClick={next} style={{ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:14, padding:'13px 32px', fontWeight:900, fontSize:15, cursor:'pointer', fontFamily:font, boxShadow:`0 6px 20px rgba(124,58,237,.3)` }}>
                Далее →
              </button>
            ) : (
              <button onClick={submit} disabled={loading} style={{ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:14, padding:'13px 32px', fontWeight:900, fontSize:15, cursor:'pointer', fontFamily:font, boxShadow:`0 6px 20px rgba(124,58,237,.3)`, opacity: loading ? 0.7 : 1 }}>
                {loading ? <span style={{display:'inline-flex',alignItems:'center',gap:6}}><Loader size={14}/>Отправляем...</span> : <span style={{display:'inline-flex',alignItems:'center',gap:6}}><Rocket size={14}/>Отправить заявку</span>}
              </button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p style={{ textAlign:'center', color:P.muted, fontSize:13, marginTop:24, lineHeight:1.7 }}>
          Уже работаешь с нами?{' '}
          <Link to="/login" style={{ color:P.violet, fontWeight:700, textDecoration:'none' }}>Войти в кабинет</Link>
          {' '}· Вопросы?{' '}
          <a href="https://t.me/eduplatform_kz" target="_blank" rel="noreferrer" style={{ color:P.violet, fontWeight:700, textDecoration:'none' }}>✈️ Telegram</a>
        </p>
      </div>
    </div>
  );
}
