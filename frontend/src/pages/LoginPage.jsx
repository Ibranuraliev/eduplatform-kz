import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Star } from 'lucide-react';
import useMobile from '../hooks/useMobile';

const C = {
  violet:      '#7C3AED',
  violetDark:  '#5B21B6',
  violetSoft:  '#8B5CF6',
  violetPale:  '#F5F3FF',
  ink:         '#111827',
  gray:        '#6B7280',
  border:      '#E5E7EB',
  bg:          '#FFFFFF',
  surface:     '#F9FAFB',
  red:         '#DC2626',
  redBg:       '#FEF2F2',
};
const font = "'Inter', system-ui, -apple-system, sans-serif";

export default function LoginPage() {
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();
  const isMobile  = useMobile();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      navigate('/dashboard');
    } catch {
      setError('Неверный номер телефона или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes slideLeft { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:none} }
        @keyframes slideRight { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:none} }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .login-left  { animation: slideLeft  .7s cubic-bezier(.16,1,.3,1) both }
        .login-right { animation: slideRight .7s .1s cubic-bezier(.16,1,.3,1) both }
        .input-field:focus { border-color: ${C.violet} !important; box-shadow: 0 0 0 3px ${C.violet}18 !important; outline:none; }
        .submit-btn {
          background: linear-gradient(135deg, ${C.violet}, ${C.violetSoft});
          background-size: 200% 200%;
          transition: all .25s ease;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(124,58,237,.35);
          background-position: right center;
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .show-btn:hover { color: ${C.violet} !important; }
      `}</style>

      {/* Left decorative panel */}
      <div className="login-left" style={{
        width:'45%', display: isMobile ? 'none' : 'flex', flexDirection:'column', justifyContent:'center',
        padding:'60px 56px',
        background:`linear-gradient(150deg, ${C.violetDark} 0%, ${C.violet} 50%, ${C.violetSoft} 100%)`,
        backgroundSize:'200% 200%', animation:'gradShift 8s ease infinite, slideLeft .7s cubic-bezier(.16,1,.3,1) both',
        position:'relative', overflow:'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300, borderRadius:'50%', background:'rgba(255,255,255,.06)' }}/>
        <div style={{ position:'absolute', bottom:-60, left:-60, width:250, height:250, borderRadius:'50%', background:'rgba(255,255,255,.05)' }}/>
        <div style={{ position:'absolute', top:'40%', right:-30, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,.04)' }}/>

        {/* Dot grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize:'24px 24px', pointerEvents:'none' }}/>

        <div style={{ position:'relative' }}>
          <Link to="/" style={{ fontWeight:800, fontSize:22, textDecoration:'none', color:'#fff', letterSpacing:-0.5, display:'block', marginBottom:56 }}>
            EduPlatform
          </Link>

          <h2 style={{ fontWeight:800, fontSize:'clamp(28px,3vw,38px)', color:'#fff', lineHeight:1.2, marginBottom:20, letterSpacing:-1 }}>
            Добро<br/>пожаловать!
          </h2>
          <p style={{ color:'rgba(255,255,255,.7)', fontSize:16, lineHeight:1.75, marginBottom:48 }}>
            Войдите в личный кабинет и продолжайте подготовку к ЕНТ, IELTS или SAT.
          </p>

          {/* Stats cards */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              { val:'500+',  label:'Активных студентов', color:'rgba(255,255,255,.15)' },
              { val:'95%',   label:'Сдают с первого раза', color:'rgba(255,255,255,.1)' },
              { val:'4.9',  label:'Рейтинг платформы', color:'rgba(255,255,255,.08)', icon: true },
            ].map((s,i) => (
              <div key={i} style={{
                background:s.color, borderRadius:14, padding:'14px 18px',
                display:'flex', alignItems:'center', gap:14,
                border:'1px solid rgba(255,255,255,.12)',
                animation:`floatY ${3.5 + i*0.5}s ${i*0.3}s ease-in-out infinite`,
              }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#fff', minWidth:56, display:'flex', alignItems:'center', gap:4 }}>{s.val}{s.icon && <Star size={16} fill="#fff"/>}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,.7)', fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-right" style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        padding: isMobile ? '32px 20px' : '48px 56px', background:C.surface,
      }}>
        <div style={{ width:'100%', maxWidth:380 }}>

          {/* Back button */}
          <button onClick={() => navigate(-1)} style={{
            background:'none', border:`1.5px solid ${C.border}`, borderRadius:10,
            padding:'8px 14px', cursor:'pointer', fontSize:13, fontWeight:600,
            color:C.gray, fontFamily:font, display:'inline-flex', alignItems:'center', gap:6,
            marginBottom:28, transition:'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=C.violet; e.currentTarget.style.color=C.violet; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.gray; }}
          >← Назад</button>

          <div style={{ marginBottom:36 }}>
            <h1 style={{ fontSize:26, fontWeight:800, color:C.ink, letterSpacing:-0.8, marginBottom:8 }}>
              Вход в аккаунт
            </h1>
            <p style={{ fontSize:15, color:C.gray }}>
              Нет аккаунта?{' '}
              <Link to="/register" style={{ color:C.violet, fontWeight:600, textDecoration:'none' }}>Зарегистрироваться</Link>
            </p>
          </div>

          {error && (
            <div style={{
              background:C.redBg, color:C.red,
              border:`1px solid ${C.red}30`,
              borderRadius:10, padding:'12px 16px',
              fontSize:14, fontWeight:500, marginBottom:24,
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.ink, marginBottom:8 }}>
                Номер телефона
              </label>
              <input
                className="input-field"
                type="text" value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+77001234567" required
                style={{
                  width:'100%', border:`1.5px solid ${C.border}`,
                  borderRadius:10, padding:'12px 16px',
                  fontSize:15, fontFamily:font, color:C.ink,
                  background:C.bg, transition:'all .2s',
                }}
              />
            </div>

            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:C.ink, marginBottom:8 }}>
                Пароль
              </label>
              <div style={{ position:'relative' }}>
                <input
                  className="input-field"
                  type={showPass?'text':'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{
                    width:'100%', border:`1.5px solid ${C.border}`,
                    borderRadius:10, padding:'12px 80px 12px 16px',
                    fontSize:15, fontFamily:font, color:C.ink,
                    background:C.bg, transition:'all .2s',
                  }}
                />
                <button type="button" className="show-btn" onClick={() => setShowPass(!showPass)} style={{
                  position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer',
                  color:C.gray, fontSize:13, fontFamily:font, fontWeight:500,
                  transition:'color .15s', padding:0,
                }}>{showPass?'скрыть':'показать'}</button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="submit-btn" style={{
              color:'#fff', border:'none', borderRadius:12,
              padding:'13px', fontWeight:700, fontSize:16,
              fontFamily:font, marginTop:4,
            }}>
              {loading ? 'Входим…' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
