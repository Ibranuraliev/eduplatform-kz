import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import useMobile from '../hooks/useMobile';
import { Target, BookOpen, CheckCircle, Zap, AlertTriangle, Clock, Calculator, Globe, FlaskConical, Leaf } from 'lucide-react';

const P = {
  violet:'#7C3AED', violetDark:'#5B21B6', violetSoft:'#8B5CF6',
  violetPale:'#F5F3FF', violetBorder:'rgba(124,58,237,0.18)',
  ink:'#0F0A1E', slate:'#475569', muted:'#94A3B8',
  border:'#E8E4F0', white:'#FFFFFF', surface:'#FAFAF9',
  green:'#059669', greenPale:'#F0FDF4', red:'#DC2626',
};
const font = "'Nunito','Segoe UI',system-ui,sans-serif";
const inputS = (err) => ({
  width:'100%', border:`1.5px solid ${err ? P.red : P.border}`,
  borderRadius:12, padding:'12px 16px', fontSize:15, fontFamily:font,
  outline:'none', color:P.ink, background:P.white, boxSizing:'border-box',
  transition:'border-color .2s',
});

const SUBJECTS = [
  { value:'ent_math',    label:'Математика', icon:Calculator },
  { value:'ent_kazakh',  label:'Казахский язык', iconText:'KZ' },
  { value:'ent_russian', label:'Русский язык', icon:BookOpen },
  { value:'ent_history', label:'История Казахстана', iconText:'История' },
  { value:'ielts',       label:'IELTS', icon:Globe },
  { value:'sat_math',    label:'SAT Математика', icon:Target },
  { value:'sat_english', label:'SAT Английский', icon:Target },
  { value:'physics',     label:'Физика', icon:Zap },
  { value:'chemistry',   label:'Химия', icon:FlaskConical },
  { value:'biology',     label:'Биология', icon:Leaf },
  { value:'other',       label:'Другой предмет', icon:BookOpen },
];

const TIMES = [
  'Утром (9:00–12:00)', 'Днём (12:00–15:00)',
  'Вечером (15:00–18:00)', 'Поздно вечером (18:00–21:00)',
  'В любое время',
];

const GRADES = ['9 класс','10 класс','11 класс','Выпускник','Другое'];

const STEPS = ['Контакты', 'Предмет', 'Детали', 'Готово'];

export default function TrialLessonPage() {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    grade: '',
    subject: searchParams.get('subject') || '',
    goal: '',
    convenient_time: '',
    comment: '',
  });

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const validateStep = () => {
    const errs = {};
    if (step === 0) {
      if (!form.full_name.trim()) errs.full_name = 'Введи имя';
      if (!form.phone.trim() || form.phone.replace(/\D/g,'').length < 10) errs.phone = 'Введи корректный номер';
      if (!form.grade) errs.grade = 'Укажи класс';
    }
    if (step === 1) {
      if (!form.subject) errs.subject = 'Выбери предмет';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      await api.post('/hr/trial/', form);
      setStep(3);
    } catch(e) {
      setErrors({ general: e.response?.data?.error || 'Ошибка отправки. Попробуй ещё раз.' });
    } finally {
      setLoading(false);
    }
  };

  const selectedSubject = SUBJECTS.find(s => s.value === form.subject);

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6FF', fontFamily:font }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;}`}</style>

      {/* Navbar */}
      <nav style={{ background:P.white, borderBottom:`1px solid ${P.border}`, padding:isMobile ? '0 16px' : '0 40px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(124,58,237,.06)' }}>
        <div onClick={() => navigate('/')} style={{ fontWeight:900, fontSize:20, cursor:'pointer', color:P.ink }}>
          <span style={{ color:P.violet }}>Edu</span>Platform
          <span style={{ marginLeft:8, fontSize:11, background:P.violet, color:'#fff', borderRadius:6, padding:'2px 7px', fontWeight:800, verticalAlign:'middle' }}>KZ</span>
        </div>
        <button onClick={() => navigate('/')} style={{ background:'none', border:'none', color:P.slate, cursor:'pointer', fontSize:14, fontWeight:600, fontFamily:font }}>
          ← На главную
        </button>
      </nav>

      <div style={{ maxWidth:600, margin:'0 auto', padding: isMobile ? '24px 16px' : '40px 24px' }}>

        {step < 3 ? (
          <>
            {/* Hero */}
            <div style={{ textAlign:'center', marginBottom:36 }}>
              <div style={{ fontSize:52, marginBottom:12, display:'flex', justifyContent:'center', alignItems:'center' }}>
                <Target size={52} color={P.violet} />
              </div>
              <h1 style={{ fontWeight:900, fontSize:28, color:P.ink, margin:'0 0 10px', letterSpacing:-0.5 }}>
                Запись на пробный урок
              </h1>
              <p style={{ color:P.slate, fontSize:15, lineHeight:1.7, margin:0 }}>
                Бесплатное занятие — познакомься с учителем и форматом обучения
              </p>
            </div>

            {/* Progress */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, marginBottom:36 }}>
              {STEPS.slice(0,3).map((label, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <div style={{
                      width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight:900, fontSize:14,
                      background: i < step ? P.green : i === step ? P.violet : P.surface,
                      color: i <= step ? '#fff' : P.muted,
                      border: `2px solid ${i < step ? P.green : i === step ? P.violet : P.border}`,
                      transition:'all .3s',
                    }}>
                      {i < step ? <CheckCircle size={18} color='#fff' strokeWidth={2.5} /> : i + 1}
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color: i === step ? P.violet : P.muted, whiteSpace:'nowrap' }}>
                      {label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div style={{ width:60, height:2, background: i < step ? P.green : P.border, margin:'0 4px 20px', transition:'background .3s' }}/>
                  )}
                </div>
              ))}
            </div>

            {/* Card */}
            <div style={{ background:P.white, borderRadius:24, border:`1.5px solid ${P.border}`, padding:isMobile ? '20px 16px' : '32px', boxShadow:'0 8px 40px rgba(124,58,237,.08)' }}>

              {errors.general && (
                <div style={{ background:'#FEF2F2', color:P.red, borderRadius:12, padding:'12px 16px', fontSize:13, fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
                  <AlertTriangle size={16} color={P.red} strokeWidth={2} />
                  {errors.general}
                </div>
              )}

              {/* STEP 0 — Contacts */}
              {step === 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div style={{ fontWeight:900, fontSize:20, color:P.ink, marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.ink} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </span>
                    Твои контакты
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:6 }}>Полное имя *</label>
                    <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
                      placeholder="Айгерим Сейткали" style={inputS(errors.full_name)} />
                    {errors.full_name && <div style={{ color:P.red, fontSize:12, marginTop:4, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}><AlertTriangle size={14} color={P.red} /> {errors.full_name}</div>}
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:6 }}>Номер телефона *</label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)}
                      placeholder="+7 (777) 123-45-67" style={inputS(errors.phone)} />
                    {errors.phone && <div style={{ color:P.red, fontSize:12, marginTop:4, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}><AlertTriangle size={14} color={P.red} /> {errors.phone}</div>}
                    <div style={{ fontSize:12, color:P.muted, marginTop:4 }}>Мы позвоним, чтобы подтвердить время</div>
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:8 }}>Класс *</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap: isMobile ? 6 : 8 }}>
                      {GRADES.map(g => (
                        <button key={g} onClick={() => set('grade', g)}
                          style={{ padding:isMobile ? '7px 12px' : '9px 18px', borderRadius:10, fontWeight:700, fontSize:isMobile ? 12 : 13, fontFamily:font, cursor:'pointer',
                            background: form.grade === g ? P.violet : P.surface,
                            color: form.grade === g ? '#fff' : P.slate,
                            border: `1.5px solid ${form.grade === g ? 'transparent' : P.border}`,
                            transition:'all .2s',
                          }}>
                          {g}
                        </button>
                      ))}
                    </div>
                    {errors.grade && <div style={{ color:P.red, fontSize:12, marginTop:6, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}><AlertTriangle size={14} color={P.red} /> {errors.grade}</div>}
                  </div>
                </div>
              )}

              {/* STEP 1 — Subject */}
              {step === 1 && (
                <div>
                  <div style={{ fontWeight:900, fontSize:20, color:P.ink, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                    <BookOpen size={20} color={P.ink} />
                    Выбери предмет
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(2,1fr)', gap:10 }}>
                    {SUBJECTS.map(s => {
                      const Icon = s.icon;
                      return (
                      <button key={s.value} onClick={() => set('subject', s.value)}
                        style={{
                          padding:'14px 16px', borderRadius:14, fontWeight:700, fontSize:13, fontFamily:font,
                          cursor:'pointer', textAlign:'left', transition:'all .2s',
                          background: form.subject === s.value ? P.violetPale : P.surface,
                          color: form.subject === s.value ? P.violet : P.slate,
                          border: `1.5px solid ${form.subject === s.value ? P.violet : P.border}`,
                          boxShadow: form.subject === s.value ? `0 4px 12px rgba(124,58,237,.15)` : 'none',
                          display:'flex', alignItems:'center', gap:8,
                        }}>
                        {s.icon ? <Icon size={16} /> : <span style={{fontSize:10,fontWeight:900,background:P.violet,color:'#fff',borderRadius:3,padding:'1px 4px'}}>{s.iconText}</span>}
                        {s.label}
                      </button>
                    );
                    })}
                  </div>
                  {errors.subject && <div style={{ color:P.red, fontSize:12, marginTop:10, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}><AlertTriangle size={14} color={P.red} /> {errors.subject}</div>}
                </div>
              )}

              {/* STEP 2 — Details */}
              {step === 2 && (
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div style={{ fontWeight:900, fontSize:20, color:P.ink, marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.ink} strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 20l-4 1 1-4L16.5 3.5z"/></svg>
                    Расскажи о себе
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:6 }}>
                      Твоя цель <span style={{ color:P.muted, fontWeight:600 }}>(необязательно)</span>
                    </label>
                    <input value={form.goal} onChange={e => set('goal', e.target.value)}
                      placeholder="Например: сдать ЕНТ на 120+, получить IELTS 7.0..."
                      style={inputS(false)} />
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:8 }}>
                      Удобное время <span style={{ color:P.muted, fontWeight:600 }}>(необязательно)</span>
                    </label>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {TIMES.map(t => (
                        <label key={t} style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer',
                          background: form.convenient_time === t ? P.violetPale : P.surface,
                          border: `1.5px solid ${form.convenient_time === t ? P.violetBorder : P.border}`,
                          borderRadius:12, padding:'12px 16px', transition:'all .2s' }}>
                          <input type="radio" name="time" value={t}
                            checked={form.convenient_time === t}
                            onChange={() => set('convenient_time', t)}
                            style={{ accentColor:P.violet, width:16, height:16 }} />
                          <span style={{ fontWeight:700, fontSize:13, color: form.convenient_time === t ? P.violet : P.slate }}>{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:6 }}>
                      Комментарий <span style={{ color:P.muted, fontWeight:600 }}>(необязательно)</span>
                    </label>
                    <textarea value={form.comment} onChange={e => set('comment', e.target.value)}
                      placeholder="Любые пожелания или вопросы..."
                      rows={3}
                      style={{ ...inputS(false), resize:'vertical', lineHeight:1.6 }} />
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:28, gap:12 }}>
                {step > 0 ? (
                  <button onClick={back}
                    style={{ background:P.surface, color:P.slate, border:`1.5px solid ${P.border}`, borderRadius:12, padding:'12px 24px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:font }}>
                    ← Назад
                  </button>
                ) : <div/>}

                {step < 2 ? (
                  <button onClick={next}
                    style={{ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:12, padding:'12px 32px', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:font, boxShadow:`0 4px 16px rgba(124,58,237,.3)` }}>
                    Далее →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading}
                    style={{ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:12, padding:'12px 32px', fontWeight:800, fontSize:15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:font, boxShadow:`0 4px 16px rgba(124,58,237,.3)`, opacity: loading ? 0.7 : 1, display:'flex', alignItems:'center', gap:8 }}>
                    {loading ? <><Clock size={16} />Отправляем...</> : <><Target size={16} />Записаться на пробный урок</>}
                  </button>
                )}
              </div>
            </div>

            {/* Benefits */}
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap:12, marginTop:24 }}>
              {[
                { icon:CheckCircle, title:'Бесплатно', text:'Без оплаты и обязательств' },
                { icon:Zap, title:'Быстро', text:'Позвоним в течение дня' },
                { icon:Target, title:'Персонально', text:'Подберём подходящего учителя' },
              ].map((b,i) => (
                <div key={i} style={{ background:P.white, borderRadius:16, border:`1.5px solid ${P.border}`, padding:'16px', textAlign:'center' }}>
                  <div style={{ fontSize:24, marginBottom:6, display:'flex', justifyContent:'center' }}>
                    <b.icon size={24} color={P.violet} />
                  </div>
                  <div style={{ fontWeight:800, fontSize:13, color:P.ink, marginBottom:3 }}>{b.title}</div>
                  <div style={{ fontSize:11, color:P.muted, lineHeight:1.5 }}>{b.text}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* SUCCESS SCREEN */
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ width:96, height:96, borderRadius:'50%', background:`linear-gradient(135deg,${P.green},#047857)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44, margin:'0 auto 28px' }}>
              <CheckCircle size={52} color='#fff' fill='#fff' strokeWidth={1.5} />
            </div>
            <h2 style={{ fontWeight:900, fontSize:26, color:P.ink, margin:'0 0 12px', letterSpacing:-0.5 }}>
              Заявка отправлена!
            </h2>
            <p style={{ color:P.slate, fontSize:15, lineHeight:1.8, marginBottom:28, maxWidth:400, margin:'0 auto 28px' }}>
              Мы получили твою заявку и свяжемся с тобой <strong>в течение дня</strong> для подтверждения времени пробного урока.
            </p>

            <div style={{ background:P.violetPale, border:`1.5px solid ${P.violetBorder}`, borderRadius:20, padding:'24px 28px', marginBottom:32, maxWidth:400, margin:'0 auto 32px', textAlign:'left' }}>
              <div style={{ fontWeight:800, fontSize:14, color:P.violet, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={P.violet} strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                Твоя заявка
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { label:'Имя', val: form.full_name },
                  { label:'Телефон', val: form.phone },
                  { label:'Класс', val: form.grade },
                  { label:'Предмет', val: selectedSubject?.label || form.subject },
                  form.goal && { label:'Цель', val: form.goal },
                  form.convenient_time && { label:'Время', val: form.convenient_time },
                ].filter(Boolean).map(({ label, val }) => (
                  <div key={label} style={{ display:'flex', gap:8, fontSize:13 }}>
                    <span style={{ color:P.muted, fontWeight:600, minWidth:70 }}>{label}:</span>
                    <span style={{ color:P.ink, fontWeight:700 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <button onClick={() => navigate('/')}
                style={{ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:12, padding:'12px 28px', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:font, boxShadow:`0 4px 16px rgba(124,58,237,.3)`, display:'flex', alignItems:'center', gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                На главную
              </button>
              <button onClick={() => { setStep(0); setForm({ full_name:'', phone:'', grade:'', subject:'', goal:'', convenient_time:'', comment:'' }); }}
                style={{ background:P.surface, color:P.slate, border:`1.5px solid ${P.border}`, borderRadius:12, padding:'12px 28px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:font, display:'flex', alignItems:'center', gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.slate} strokeWidth="2"><polyline points="23 6 13.46 15.88 8 10.33 1 17"/><polyline points="17 6 23 6 23 12"/></svg>
                Новая заявка
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
