import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check } from 'lucide-react';
import api from '../api';
import useMobile from '../hooks/useMobile';

const C = {
  violet:      '#7C3AED',
  violetDark:  '#5B21B6',
  violetSoft:  '#8B5CF6',
  violetPale:  '#F5F3FF',
  green:       '#059669',
  greenPale:   '#ECFDF5',
  ink:         '#111827',
  gray:        '#6B7280',
  light:       '#9CA3AF',
  border:      '#E5E7EB',
  bg:          '#FFFFFF',
  surface:     '#F9FAFB',
  red:         '#DC2626',
  redBg:       '#FEF2F2',
};
const font = "'Inter', system-ui, -apple-system, sans-serif";

const inp = {
  width:'100%', border:`1.5px solid #E5E7EB`,
  borderRadius:10, padding:'11px 14px',
  fontSize:14, fontFamily:font,
  color:'#111827', background:'#FFFFFF',
  transition:'all .2s', outline:'none',
};

const CITIES = ['Алматы','Астана','Шымкент','Караганда','Актобе','Тараз','Павлодар','Усть-Каменогорск','Семей','Атырау','Костанай','Кызылорда','Уральск','Петропавловск','Актау'];
const GRADES  = ['9','10','11','Выпускник'];
const GOALS   = ['ЕНТ 120+','ЕНТ 100+','ЕНТ 80+','IELTS 7.0+','IELTS 6.0+','SAT 1400+','Просто учусь'];

export default function RegisterPage() {
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState({
    first_name:'', last_name:'', phone:'', password:'', confirm_password:'',
    email:'', city:'', grade:'', goal:'',
    consent_personal_data:false, consent_privacy_policy:false,
  });
  const [showPass, setShowPass]           = useState(false);
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [verifyCode, setVerifyCode]       = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg]         = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const validateStep1 = () => {
    if (!form.first_name.trim())  return 'Введите имя';
    if (!form.last_name.trim())   return 'Введите фамилию';
    if (!form.phone.trim())       return 'Введите номер телефона';
    if (form.password.length < 6) return 'Пароль минимум 6 символов';
    if (form.password !== form.confirm_password) return 'Пароли не совпадают';
    return '';
  };

  const nextStep = () => {
    setError('');
    const err = validateStep1();
    if (err) { setError(err); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.consent_personal_data || !form.consent_privacy_policy) { setError('Пожалуйста, примите все условия'); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Некорректный email'); return; }
    setLoading(true);
    try {
      const { confirm_password, ...data } = form;
      await register(data);
      if (form.email.trim()) {
        await api.post('/users/send-verification-email/', { email: form.email.trim() });
        setStep(3);
      } else { setStep(4); }
    } catch (err) {
      setError(err.response?.data?.phone?.[0] || err.response?.data?.error || 'Ошибка регистрации. Попробуйте снова.');
    } finally { setLoading(false); }
  };

  const handleVerify = async () => {
    setError('');
    if (verifyCode.length !== 6) { setError('Введи 6-значный код'); return; }
    setLoading(true);
    try {
      await api.post('/users/verify-email/', { email: form.email.trim(), code: verifyCode });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный или истёкший код');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResendLoading(true); setResendMsg('');
    try { await api.post('/users/send-verification-email/', { email: form.email.trim() }); setResendMsg('Новый код отправлен!'); }
    catch { setResendMsg('Ошибка. Попробуй снова.'); }
    finally { setResendLoading(false); }
  };

  const sharedStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
    @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    .input-field:focus { border-color: #7C3AED !important; box-shadow: 0 0 0 3px rgba(124,58,237,.12) !important; }
    .btn-primary {
      background: linear-gradient(135deg, #7C3AED, #8B5CF6);
      background-size: 200% 200%;
      transition: all .25s ease;
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(124,58,237,.35); background-position: right; }
    .btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
    .tag-btn { transition: all .2s ease; }
    .tag-btn:hover { border-color: #7C3AED !important; color: #7C3AED !important; }
  `;

  /* ── Success ── */
  if (step === 4) return (
    <div style={{ minHeight:'100vh', background:C.surface, fontFamily:font, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{sharedStyles}</style>
      <div style={{ background:C.bg, borderRadius:20, padding:'48px 40px', textAlign:'center', maxWidth:400, width:'100%', boxShadow:'0 8px 40px rgba(0,0,0,.08)', border:`1px solid ${C.border}`, animation:'slideUp .6s cubic-bezier(.16,1,.3,1) both' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:C.greenPale, border:`2px solid ${C.green}30`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <Check size={28} color={C.green} strokeWidth={2.5} />
        </div>
        <h2 style={{ fontWeight:800, fontSize:24, color:C.ink, marginBottom:10, letterSpacing:-0.5 }}>Аккаунт создан!</h2>
        <p style={{ color:C.gray, fontSize:15, lineHeight:1.7, marginBottom:28 }}>
          Добро пожаловать, <strong style={{ color:C.ink }}>{form.first_name}</strong>!<br/>Теперь войдите в систему.
        </p>
        <button onClick={() => navigate('/login')} className="btn-primary"
          style={{ color:'#fff', border:'none', borderRadius:12, padding:'13px 32px', fontWeight:700, fontSize:15, fontFamily:font, cursor:'pointer', width:'100%' }}>
          Войти →
        </button>
      </div>
    </div>
  );

  /* ── Email verify ── */
  if (step === 3) return (
    <div style={{ minHeight:'100vh', background:C.surface, fontFamily:font, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{sharedStyles}</style>
      <div style={{ background:C.bg, borderRadius:20, padding:'48px 40px', textAlign:'center', maxWidth:420, width:'100%', boxShadow:'0 8px 40px rgba(0,0,0,.08)', border:`1px solid ${C.border}`, animation:'slideUp .6s cubic-bezier(.16,1,.3,1) both' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#EFF6FF', border:'2px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>
        </div>
        <h2 style={{ fontWeight:800, fontSize:22, color:C.ink, marginBottom:10 }}>Проверь email</h2>
        <p style={{ color:C.gray, fontSize:14, lineHeight:1.7, marginBottom:28 }}>
          Мы отправили 6-значный код на<br/>
          <strong style={{ color:C.violet }}>{form.email}</strong>
        </p>
        {error && <div style={{ background:C.redBg, color:C.red, border:`1px solid ${C.red}30`, borderRadius:10, padding:'11px 14px', fontSize:14, marginBottom:20 }}>{error}</div>}
        <input className="input-field"
          value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g,'').slice(0,6))}
          placeholder="000000" maxLength={6}
          style={{ ...inp, textAlign:'center', fontSize:32, fontWeight:800, letterSpacing:10, padding:'14px', marginBottom:16 }}
        />
        <button onClick={handleVerify} disabled={loading || verifyCode.length !== 6} className="btn-primary"
          style={{ color:'#fff', border:'none', borderRadius:12, padding:'12px', fontWeight:700, fontSize:15, fontFamily:font, cursor:'pointer', width:'100%', marginBottom:12 }}>
          {loading ? 'Проверяем…' : 'Подтвердить'}
        </button>
        <button onClick={() => setStep(4)} style={{ background:'none', border:'none', color:C.gray, fontSize:14, cursor:'pointer', fontFamily:font, marginBottom:16 }}>
          Пропустить →
        </button>
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
          {resendMsg && <div style={{ color:C.green, fontSize:13, marginBottom:8, fontWeight:500 }}>{resendMsg}</div>}
          <button onClick={handleResend} disabled={resendLoading}
            style={{ background:'none', border:'none', color:C.violet, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:font }}>
            {resendLoading ? 'Отправляем…' : 'Отправить код повторно'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:font }}>
      <style>{sharedStyles}</style>

      {/* Left panel */}
      <div style={{
        width:'42%', display: isMobile ? 'none' : 'flex', flexDirection:'column', justifyContent:'center',
        padding:'60px 52px',
        background:`linear-gradient(150deg, ${C.violetDark} 0%, ${C.violet} 55%, ${C.violetSoft} 100%)`,
        backgroundSize:'200% 200%', animation:'gradShift 8s ease infinite',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300, borderRadius:'50%', background:'rgba(255,255,255,.06)' }}/>
        <div style={{ position:'absolute', bottom:-60, left:-40, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,.05)' }}/>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px)', backgroundSize:'22px 22px', pointerEvents:'none' }}/>

        <div style={{ position:'relative' }}>
          <Link to="/" style={{ fontWeight:800, fontSize:20, textDecoration:'none', color:'#fff', letterSpacing:-0.5, display:'block', marginBottom:52 }}>
            EduPlatform
          </Link>
          <h2 style={{ fontWeight:800, fontSize:'clamp(26px,2.5vw,36px)', color:'#fff', lineHeight:1.2, marginBottom:16, letterSpacing:-1 }}>
            Создай аккаунт<br/>и начни учиться
          </h2>
          <p style={{ color:'rgba(255,255,255,.65)', fontSize:15, lineHeight:1.75, marginBottom:44 }}>
            Живые уроки, проверка домашек и тесты — всё в одном месте.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { label:'Живые уроки в Zoom',         sub:'Каждый день по расписанию'   },
              { label:'Проверка домашек',             sub:'Преподаватель, не бот'        },
              { label:'Тесты после каждой темы',     sub:'Отслеживай свой прогресс'     },
            ].map((item,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,.1)', borderRadius:12, padding:'12px 16px', border:'1px solid rgba(255,255,255,.12)' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Check size={14} color="#fff" strokeWidth={3} />
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color:'#fff' }}>{item.label}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,.55)', marginTop:1 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding: isMobile ? '24px 16px' : '48px 52px', background:C.surface, overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:420 }}>

          {/* Step indicator */}
          <div style={{ marginBottom:32 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              {[1,2].map((n,i) => (
                <div key={n} style={{ display:'flex', alignItems:'center', gap:8, flex: i===0 ? 'none' : 1 }}>
                  <div style={{
                    width:30, height:30, borderRadius:'50%', flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, fontWeight:700, fontFamily:font,
                    background: step > n
                      ? `linear-gradient(135deg, ${C.green}, #34D399)`
                      : step === n
                        ? `linear-gradient(135deg, ${C.violet}, ${C.violetSoft})`
                        : C.border,
                    color: step >= n ? '#fff' : C.light,
                    transition:'all .3s', boxShadow: step===n ? `0 4px 14px rgba(124,58,237,.35)` : 'none',
                  }}>
                    {step > n
                      ? <Check size={12} color="#fff" strokeWidth={3} />
                      : n}
                  </div>
                  {i < 1 && (
                    <div style={{ flex:1, height:2, borderRadius:2, background: step > 1 ? `linear-gradient(90deg, ${C.violet}, ${C.violetSoft})` : C.border, transition:'background .4s' }}/>
                  )}
                </div>
              ))}
            </div>
            <h1 style={{ fontSize:22, fontWeight:800, color:C.ink, letterSpacing:-0.5 }}>
              {step === 1 ? 'Личные данные' : 'О себе'}
            </h1>
            <p style={{ fontSize:14, color:C.gray, marginTop:4 }}>Шаг {step} из 2</p>
          </div>

          {error && (
            <div style={{ background:C.redBg, color:C.red, border:`1px solid ${C.red}30`, borderRadius:10, padding:'11px 14px', fontSize:14, marginBottom:20 }}>
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:18, animation:'slideUp .5s cubic-bezier(.16,1,.3,1) both' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[['first_name','Имя','Айдана'],['last_name','Фамилия','Сейткали']].map(([field,label,ph]) => (
                  <div key={field}>
                    <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.ink, marginBottom:7 }}>{label} *</label>
                    <input className="input-field" value={form[field]} onChange={e => set(field, e.target.value)} placeholder={ph} style={inp}/>
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.ink, marginBottom:7 }}>Номер телефона *</label>
                <input className="input-field" value={form.phone} onChange={e => set('phone',e.target.value)} placeholder="+77001234567" style={inp}/>
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.ink, marginBottom:7 }}>Пароль *</label>
                <div style={{ position:'relative' }}>
                  <input className="input-field"
                    type={showPass?'text':'password'} value={form.password}
                    onChange={e => set('password',e.target.value)} placeholder="Минимум 6 символов"
                    style={{ ...inp, paddingRight:80 }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:C.light,
                    fontSize:13, fontFamily:font, fontWeight:500, padding:0, transition:'color .15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color=C.violet}
                    onMouseLeave={e => e.currentTarget.style.color=C.light}
                  >{showPass?'скрыть':'показать'}</button>
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.ink, marginBottom:7 }}>Повторите пароль *</label>
                <input className="input-field"
                  type="password" value={form.confirm_password}
                  onChange={e => set('confirm_password',e.target.value)} placeholder="••••••••"
                  style={{ ...inp, borderColor: form.confirm_password && form.confirm_password!==form.password ? C.red : C.border }}
                />
                {form.confirm_password && form.confirm_password!==form.password && (
                  <div style={{ color:C.red, fontSize:12, marginTop:5, fontWeight:500 }}>Пароли не совпадают</div>
                )}
              </div>

              <button onClick={nextStep} className="btn-primary"
                style={{ color:'#fff', border:'none', borderRadius:12, padding:'13px', fontWeight:700, fontSize:15, fontFamily:font, cursor:'pointer', marginTop:4 }}>
                Далее →
              </button>

              <p style={{ textAlign:'center', color:C.gray, fontSize:14 }}>
                Уже есть аккаунт?{' '}
                <Link to="/login" style={{ color:C.violet, fontWeight:600, textDecoration:'none' }}>Войти</Link>
              </p>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:18, animation:'slideUp .5s cubic-bezier(.16,1,.3,1) both' }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.ink, marginBottom:7 }}>
                  Email <span style={{ color:C.light, fontWeight:400 }}>(необязательно)</span>
                </label>
                <input className="input-field" type="email" value={form.email} onChange={e => set('email',e.target.value)} placeholder="example@gmail.com" style={inp}/>
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.ink, marginBottom:7 }}>Город</label>
                <select value={form.city} onChange={e => set('city',e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                  <option value="">Выберите город</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.ink, marginBottom:10 }}>Класс</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {GRADES.map(g => (
                    <button key={g} type="button" className="tag-btn" onClick={() => set('grade',g)} style={{
                      padding:'8px 18px', borderRadius:8, fontWeight:600, fontSize:13,
                      fontFamily:font, cursor:'pointer',
                      border:`1.5px solid ${form.grade===g ? C.violet : C.border}`,
                      background:form.grade===g ? C.violetPale : C.bg,
                      color:form.grade===g ? C.violet : C.gray,
                      boxShadow:form.grade===g ? `0 0 0 2px ${C.violet}20` : 'none',
                    }}>
                      {g==='Выпускник' ? g : `${g} класс`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.ink, marginBottom:10 }}>Цель</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {GOALS.map(g => (
                    <button key={g} type="button" className="tag-btn" onClick={() => set('goal',g)} style={{
                      padding:'7px 14px', borderRadius:8, fontWeight:600, fontSize:12,
                      fontFamily:font, cursor:'pointer',
                      border:`1.5px solid ${form.goal===g ? C.violet : C.border}`,
                      background:form.goal===g ? C.violetPale : C.bg,
                      color:form.goal===g ? C.violet : C.gray,
                      boxShadow:form.goal===g ? `0 0 0 2px ${C.violet}20` : 'none',
                    }}>{g}</button>
                  ))}
                </div>
              </div>

              <div style={{ background:C.violetPale, borderRadius:14, padding:16, display:'flex', flexDirection:'column', gap:12, border:`1px solid ${C.violet}20` }}>
                {[
                  { field:'consent_personal_data',  label:'Согласен на обработку персональных данных' },
                  { field:'consent_privacy_policy',  label:'Принимаю политику конфиденциальности' },
                ].map(c => (
                  <label key={c.field} onClick={() => set(c.field,!form[c.field])} style={{ display:'flex', gap:10, alignItems:'flex-start', cursor:'pointer' }}>
                    <div style={{
                      width:20, height:20, borderRadius:6, marginTop:1, flexShrink:0,
                      border:`2px solid ${form[c.field] ? C.violet : C.border}`,
                      background:form[c.field] ? C.violet : C.bg,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      pointerEvents:'none', transition:'all .2s',
                    }}>
                      {form[c.field] && <Check size={10} color="#fff" strokeWidth={3.5} />}
                    </div>
                    <span style={{ fontSize:13, color:C.gray, lineHeight:1.5 }}>{c.label}</span>
                  </label>
                ))}
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => { setError(''); setStep(1); }} style={{
                  flex:1, background:C.bg, color:C.ink,
                  border:`1.5px solid ${C.border}`, borderRadius:12,
                  padding:'12px', fontWeight:600, fontSize:14,
                  fontFamily:font, cursor:'pointer', transition:'border-color .2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor=C.violet}
                  onMouseLeave={e => e.currentTarget.style.borderColor=C.border}
                >← Назад</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{
                  flex:2, color:'#fff', border:'none', borderRadius:12,
                  padding:'12px', fontWeight:700, fontSize:15, fontFamily:font, cursor:'pointer',
                }}>{loading ? 'Регистрация…' : 'Зарегистрироваться'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
