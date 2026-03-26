import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import useMobile from '../hooks/useMobile';
import VacancyManager from '../components/VacancyManager';
import { FileText, Phone, BookOpen, Calendar, Mail, CheckCircle, X, Eye, Briefcase, Clock, Download, AlertTriangle, BarChart2, LogOut, Home, Users, CreditCard, Settings, Wrench } from 'lucide-react';

/* ── Design tokens (same style as rest of app) ── */
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
  orange:       '#D97706',
  orangePale:   '#FFFBEB',
  red:          '#DC2626',
  redPale:      '#FEF2F2',
  blue:         '#2563EB',
  bluePale:     '#EFF6FF',
};
const font = "'Nunito','Segoe UI',system-ui,sans-serif";
const card  = (e={}) => ({ background:P.white, borderRadius:20, border:`1.5px solid ${P.border}`, padding:'24px', ...e });
const btnP  = (e={}) => ({ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:12, padding:'10px 22px', fontWeight:800, fontSize:14, fontFamily:font, cursor:'pointer', boxShadow:`0 4px 16px rgba(124,58,237,.25)`, transition:'opacity .2s', ...e });
const btnO  = (e={}) => ({ background:P.violetPale, color:P.violet, border:`1.5px solid ${P.violetBorder}`, borderRadius:12, padding:'9px 20px', fontWeight:700, fontSize:14, fontFamily:font, cursor:'pointer', ...e });
const btnG  = (e={}) => ({ background:P.greenPale, color:P.green, border:`1.5px solid ${P.green}33`, borderRadius:10, padding:'8px 18px', fontWeight:700, fontSize:13, fontFamily:font, cursor:'pointer', ...e });
const btnR  = (e={}) => ({ background:P.redPale, color:P.red, border:`1.5px solid ${P.red}33`, borderRadius:10, padding:'8px 18px', fontWeight:700, fontSize:13, fontFamily:font, cursor:'pointer', ...e });
const inputS = { width:'100%', border:`1.5px solid ${P.border}`, borderRadius:12, padding:'10px 14px', fontSize:14, fontFamily:font, outline:'none', color:P.ink, background:P.white, boxSizing:'border-box' };

/* ── Status badge ── */
function StatusBadge({ status }) {
  const map = {
    new:         { label:<span><AlertTriangle size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Новая</span>,         color:P.blue,   bg:P.bluePale   },
    in_review:   { label:<span><Eye size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>На рассмотрении</span>,color:P.orange, bg:P.orangePale },
    approved:    { label:<span><CheckCircle size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Одобрено</span>,        color:P.green,  bg:P.greenPale  },
    rejected:    { label:<span><X size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Отклонено</span>,       color:P.red,    bg:P.redPale    },
    created:     { label:<span><FileText size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Создан</span>,          color:P.blue,   bg:P.bluePale   },
    refunded:    { label:<span><BarChart2 size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Возвращено</span>,      color:P.green,  bg:P.greenPale  },
  };
  const s = map[status] || { label: status, color: P.slate, bg: P.surface };
  return (
    <span style={{ background:s.bg, color:s.color, borderRadius:8, padding:'4px 12px', fontSize:12, fontWeight:700, fontFamily:font, whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  );
}

/* ── Teacher Application Card ── */
function ApplicationCard({ app, onAction }) {
  const [note, setNote]       = useState('');
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);

  const canAct = app.status === 'new' || app.status === 'in_review';

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await onAction(app.id, action, note);
      setNote('');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={card({ marginBottom:14 })}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        {/* Left info */}
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18, flexShrink:0 }}>
              {app.full_name?.[0] || '?'}
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:P.ink }}>{app.full_name}</div>
              <div style={{ color:P.slate, fontSize:13 }}><Phone size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>{app.phone}</div>
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
            <span style={{ background:P.violetPale, color:P.violet, borderRadius:8, padding:'3px 10px', fontSize:12, fontWeight:700 }}>
              <BookOpen size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>{app.subjects}
            </span>
            <span style={{ background:P.surface, color:P.slate, borderRadius:8, padding:'3px 10px', fontSize:12, fontWeight:600 }}>
              <BookOpen size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Опыт: {app.experience_years} лет
            </span>
            <span style={{ background:P.surface, color:P.muted, borderRadius:8, padding:'3px 10px', fontSize:12 }}>
              <Calendar size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>{new Date(app.created_at).toLocaleDateString('ru-RU')}
            </span>
          </div>
          {app.hr_note && (
            <div style={{ background:P.orangePale, border:`1px solid ${P.orange}33`, borderRadius:10, padding:'8px 12px', fontSize:13, color:P.orange, fontWeight:600 }}>
              <Mail size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>{app.hr_note}
            </div>
          )}
        </div>

        {/* Right: status + files + actions */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10 }}>
          <StatusBadge status={app.status} />
          <div style={{ display:'flex', gap:8 }}>
            {app.resume && (
              <a href={app.resume} target="_blank" rel="noreferrer" style={{ ...btnO({ padding:'6px 14px', fontSize:12 }), textDecoration:'none' }}>
                <FileText size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Резюме
              </a>
            )}
            {app.diploma && (
              <a href={app.diploma} target="_blank" rel="noreferrer" style={{ ...btnO({ padding:'6px 14px', fontSize:12 }), textDecoration:'none' }}>
                <FileText size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Диплом
              </a>
            )}
          </div>
          {canAct && (
            <button onClick={() => setOpen(!open)} style={btnO({ fontSize:12, padding:'6px 14px' })}>
              {open ? <span><Eye size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Скрыть</span> : <span><Eye size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Действие</span>}
            </button>
          )}
        </div>
      </div>

      {/* Action panel */}
      {open && canAct && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:`1.5px solid ${P.border}` }}>
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:12, fontWeight:700, color:P.ink, display:'block', marginBottom:5 }}>Комментарий (необязательно)</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Напиши причину или заметку..."
              style={{ ...inputS, fontSize:13 }}
            />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button
              onClick={() => handleAction('approved')}
              disabled={loading}
              style={btnG({ opacity: loading ? 0.6 : 1 })}
            >
              <CheckCircle size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Одобрить
            </button>
            <button
              onClick={() => handleAction('in_review')}
              disabled={loading}
              style={{ ...btnO({ fontSize:13, padding:'8px 16px' }), opacity: loading ? 0.6 : 1 }}
            >
              <Eye size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>На рассмотрение
            </button>
            <button
              onClick={() => handleAction('rejected')}
              disabled={loading}
              style={btnR({ opacity: loading ? 0.6 : 1 })}
            >
              <X size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Отклонить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Refund Request Card ── */
function RefundCard({ refund, onAction }) {
  const [open, setOpen]           = useState(false);
  const [note, setNote]           = useState('');
  const [amount, setAmount]       = useState(refund.refund_amount || refund.order_amount || '');
  const [loading, setLoading]     = useState(false);

  const canAct = refund.status === 'created' || refund.status === 'in_review' || refund.status === 'approved';

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await onAction(refund.id, action, note, amount);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={card({ marginBottom:14 })}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        {/* Left info */}
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg,${P.red},#EF4444)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18, flexShrink:0 }}>
              {refund.student_name?.[0] || '?'}
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:P.ink }}>{refund.student_name}</div>
              <div style={{ color:P.slate, fontSize:13 }}><Phone size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>{refund.student_phone}</div>
            </div>
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
            <span style={{ background:P.violetPale, color:P.violet, borderRadius:8, padding:'3px 10px', fontSize:12, fontWeight:700 }}>
              <BookOpen size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>{refund.course_title}
            </span>
            <span style={{ background:P.surface, color:P.slate, borderRadius:8, padding:'3px 10px', fontSize:12, fontWeight:600 }}>
              <CreditCard size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Оплачено: {Number(refund.order_amount).toLocaleString('ru-KZ')} ₸
            </span>
            <span style={{ background:P.surface, color:P.muted, borderRadius:8, padding:'3px 10px', fontSize:12 }}>
              <Calendar size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>{new Date(refund.created_at).toLocaleDateString('ru-RU')}
            </span>
          </div>

          <div style={{ background:P.surface, borderRadius:12, padding:'10px 14px', marginBottom:8 }}>
            <div style={{ fontSize:12, color:P.muted, fontWeight:700, marginBottom:3 }}>Причина:</div>
            <div style={{ fontSize:13, color:P.ink, lineHeight:1.5 }}>{refund.reason}</div>
          </div>

          <div style={{ background:P.surface, borderRadius:12, padding:'10px 14px', marginBottom:8 }}>
            <div style={{ fontSize:12, color:P.muted, fontWeight:700, marginBottom:3 }}>Реквизиты для возврата:</div>
            <div style={{ fontSize:13, color:P.ink, lineHeight:1.5 }}>{refund.payment_details}</div>
          </div>

          {refund.finance_note && (
            <div style={{ background:P.orangePale, border:`1px solid ${P.orange}33`, borderRadius:10, padding:'8px 12px', fontSize:13, color:P.orange, fontWeight:600 }}>
              <Mail size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>{refund.finance_note}
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10 }}>
          <StatusBadge status={refund.status} />
          {refund.refund_amount && (
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:P.muted, fontWeight:600 }}>Сумма возврата</div>
              <div style={{ fontSize:18, fontWeight:900, color:P.green }}>{Number(refund.refund_amount).toLocaleString('ru-KZ')} ₸</div>
            </div>
          )}
          {refund.statement_file && (
            <a href={refund.statement_file} target="_blank" rel="noreferrer" style={{ ...btnO({ padding:'6px 14px', fontSize:12 }), textDecoration:'none' }}>
              <Download size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Заявление
            </a>
          )}
          {canAct && (
            <button onClick={() => setOpen(!open)} style={btnO({ fontSize:12, padding:'6px 14px' })}>
              {open ? <span><Eye size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Скрыть</span> : <span><Eye size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Действие</span>}
            </button>
          )}
        </div>
      </div>

      {/* Action panel */}
      {open && canAct && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:`1.5px solid ${P.border}` }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:P.ink, display:'block', marginBottom:5 }}>Сумма возврата (₸)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Например: 15000"
                style={{ ...inputS, fontSize:13 }}
              />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:P.ink, display:'block', marginBottom:5 }}>Комментарий</label>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Причина решения..."
                style={{ ...inputS, fontSize:13 }}
              />
            </div>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {refund.status === 'created' && (
              <button onClick={() => handleAction('approve')} disabled={loading} style={btnG({ opacity: loading ? 0.6 : 1 })}>
                <CheckCircle size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Одобрить
              </button>
            )}
            {refund.status === 'approved' && (
              <button onClick={() => handleAction('refunded')} disabled={loading} style={{ ...btnG(), background:'#D1FAE5', color:'#065F46', borderColor:'#6EE7B7', opacity: loading ? 0.6 : 1 }}>
                <BarChart2 size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Отметить «Возвращено»
              </button>
            )}
            <button onClick={() => handleAction('reject')} disabled={loading} style={btnR({ opacity: loading ? 0.6 : 1 })}>
              <X size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Отклонить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */
export default function ManagerDashboard() {
  const isMobile = useMobile();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]                   = useState('applications');
  const [applications, setApplications] = useState([]);
  const [refunds, setRefunds]           = useState([]);
  const [appFilter, setAppFilter]       = useState('');
  const [refFilter, setRefFilter]       = useState('');
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [appRes, refRes] = await Promise.all([
        api.get('/hr/applications/').catch(() => ({ data: [] })),
        api.get('/payments/refunds/all/').catch(() => ({ data: [] })),
      ]);
      setApplications(Array.isArray(appRes.data) ? appRes.data : appRes.data?.results || []);
      setRefunds(Array.isArray(refRes.data) ? refRes.data : refRes.data?.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* Handle teacher application action */
  const handleAppAction = async (appId, action, note) => {
    try {
      await api.post('/hr/applications/review/', { application_id: appId, status: action, note });
      showToast(action === 'approved' ? <span><CheckCircle size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Учитель одобрен — аккаунт создан!</span> : action === 'rejected' ? <span><X size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Заявка отклонена</span> : <span><Eye size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Статус обновлён</span>);
      await loadData();
    } catch (e) {
      showToast(<span><X size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Ошибка: {e.response?.data?.error || 'Попробуй ещё раз'}</span>);
    }
  };

  /* Handle refund action */
  const handleRefundAction = async (refundId, action, note, amount) => {
    try {
      await api.post('/payments/refunds/review/', { refund_id: refundId, action, note, refund_amount: amount });
      showToast(action === 'refunded' ? <span><BarChart2 size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Возврат выполнен!</span> : action === 'approve' ? <span><CheckCircle size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Возврат одобрен</span> : <span><X size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Возврат отклонён</span>);
      await loadData();
    } catch (e) {
      showToast(<span><X size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Ошибка: {e.response?.data?.error || 'Попробуй ещё раз'}</span>);
    }
  };

  /* Filtered lists */
  const filteredApps    = appFilter ? applications.filter(a => a.status === appFilter) : applications;
  const filteredRefunds = refFilter ? refunds.filter(r => r.status === refFilter)      : refunds;

  /* Counts for tab badges */
  const newAppsCount    = applications.filter(a => a.status === 'new').length;
  const pendingRefCount = refunds.filter(r => r.status === 'created' || r.status === 'in_review').length;

  const tabs = [
    { id: 'applications', label: <span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><Users size={14} style={{marginRight:6}}/>Заявки учителей{newAppsCount > 0 ? ` (${newAppsCount})` : ''}</span> },
    { id: 'refunds',      label: <span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><BarChart2 size={14} style={{marginRight:6}}/>Возвраты{pendingRefCount > 0 ? ` (${pendingRefCount})` : ''}</span> },
    { id: 'vacancies',    label: <span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><Briefcase size={14} style={{marginRight:6}}/>Вакансии</span> },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6FF', fontFamily:font }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:24, right:24, background:P.ink, color:'#fff', borderRadius:14, padding:'14px 22px', fontWeight:700, fontSize:14, fontFamily:font, zIndex:999, boxShadow:'0 8px 32px rgba(0,0,0,.2)', animation:'slideIn .3s ease' }}>
          {toast}
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{ background:P.white, borderBottom:`1px solid ${P.border}`, padding: isMobile ? '0 16px' : '0 40px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(124,58,237,.06)' }}>
        <div onClick={() => navigate('/')} style={{ fontWeight:900, fontSize:20, cursor:'pointer', color:P.ink }}>
          <span style={{ color:P.violet }}>Edu</span>Platform
          <span style={{ marginLeft:8, fontSize:11, background:P.violet, color:'#fff', borderRadius:6, padding:'2px 7px', fontWeight:800, verticalAlign:'middle' }}>KZ</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* Role badge */}
          <div style={{ background:P.orangePale, color:P.orange, border:`1.5px solid ${P.orange}33`, borderRadius:10, padding:'5px 14px', fontSize:12, fontWeight:800 }}>
            {user?.role === 'hr' ? <span><Users size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>HR / Менеджер</span> : user?.role === 'finance' ? <span><CreditCard size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Финанс-менеджер</span> : <span><Settings size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Менеджер</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, background:P.violetPale, border:`1.5px solid ${P.violetBorder}`, borderRadius:12, padding:'8px 16px' }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:13 }}>
              {user?.first_name?.[0] || '?'}
            </div>
            <span style={{ fontWeight:700, fontSize:14, color:P.ink }}>{user?.first_name} {user?.last_name}</span>
          </div>
          <button onClick={logout} style={{ background:'none', border:'none', color:P.slate, cursor:'pointer', fontSize:14, fontWeight:600, fontFamily:font }}><LogOut size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Выйти</button>
        </div>
      </nav>

      <div style={{ display:'flex', minHeight:'calc(100vh - 64px)' }}>

        {/* SIDEBAR */}
        <div style={{ width:240, flexShrink:0, background:'#fff', borderRight:'1px solid #E8E4F0', padding:'24px 16px', display:'flex', flexDirection:'column', gap:4, position:'sticky', top:64, height:'calc(100vh - 64px)', overflowY:'auto' }}>
          {/* Stats mini */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
            {[
              { val: applications.length, label:'Заявок', color:'#7C3AED' },
              { val: refunds.filter(r => r.status === 'created' || r.status === 'in_review').length, label:'Возвратов', color:'#D97706' },
            ].map((s,i) => (
              <div key={i} style={{ background:'#F5F3FF', borderRadius:12, padding:'10px 8px', textAlign:'center' }}>
                <div style={{ fontSize:18 }}>{s.icon}</div>
                <div style={{ fontSize:20, fontWeight:900, color:s.color }}>{s.val}</div>
                <div style={{ fontSize:10, color:'#475569', fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ height:1, background:'#E8E4F0', margin:'4px 0 12px' }} />
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 16px', borderRadius:12, fontWeight:700, fontSize:14, fontFamily:font, cursor:'pointer', textAlign:'left', transition:'all .2s', background:tab===t.id?`linear-gradient(135deg,#7C3AED,#8B5CF6)`:'none', color:tab===t.id?'#fff':'#475569', border:'none', boxShadow:tab===t.id?`0 4px 16px rgba(124,58,237,.2)`:'none' }}>{t.label}</button>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex:1, padding:'32px 32px', overflowY:'auto', minWidth:0 }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:80, color:'#475569', fontSize:18 }}>
            <div style={{ fontSize:40, marginBottom:16 }}><Clock size={40}/></div>Загрузка...
          </div>
        ) : (
          <>
            {/* ── APPLICATIONS TAB ── */}
            {tab === 'applications' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                  <div style={{ fontWeight:900, fontSize:20, color:P.ink }}>Заявки учителей</div>
                  {/* Filter */}
                  <div style={{ display:'flex', gap:8 }}>
                    {[['', 'Все'], ['new', 'Новые'], ['in_review', 'На рассмотрении'], ['approved', 'Одобренные'], ['rejected', 'Отклонённые']].map(([v, l]) => (
                      <button key={v} onClick={() => setAppFilter(v)} style={{ padding:'7px 14px', borderRadius:10, fontSize:12, fontWeight:700, fontFamily:font, cursor:'pointer', background: appFilter === v ? P.violet : P.white, color: appFilter === v ? '#fff' : P.slate, border:`1.5px solid ${appFilter === v ? 'transparent' : P.border}` }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredApps.length === 0 ? (
                  <div style={card({ textAlign:'center', padding:60 })}>
                    <div style={{ fontSize:48, marginBottom:14 }}><AlertTriangle size={48}/></div>
                    <div style={{ color:P.slate, fontSize:16 }}>
                      {appFilter ? 'Нет заявок с таким статусом' : 'Заявок пока нет'}
                    </div>
                  </div>
                ) : (
                  filteredApps.map(app => (
                    <ApplicationCard key={app.id} app={app} onAction={handleAppAction} />
                  ))
                )}
              </div>
            )}

            {/* ── REFUNDS TAB ── */}
            {tab === 'refunds' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                  <div style={{ fontWeight:900, fontSize:20, color:P.ink }}>Запросы на возврат</div>
                  {/* Filter */}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {[['', 'Все'], ['created', 'Новые'], ['in_review', 'На рассмотрении'], ['approved', 'Одобрено'], ['rejected', 'Отклонено'], ['refunded', 'Возвращено']].map(([v, l]) => (
                      <button key={v} onClick={() => setRefFilter(v)} style={{ padding:'7px 14px', borderRadius:10, fontSize:12, fontWeight:700, fontFamily:font, cursor:'pointer', background: refFilter === v ? P.violet : P.white, color: refFilter === v ? '#fff' : P.slate, border:`1.5px solid ${refFilter === v ? 'transparent' : P.border}` }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredRefunds.length === 0 ? (
                  <div style={card({ textAlign:'center', padding:60 })}>
                    <div style={{ fontSize:48, marginBottom:14 }}><BarChart2 size={48}/></div>
                    <div style={{ color:P.slate, fontSize:16 }}>
                      {refFilter ? 'Нет запросов с таким статусом' : 'Запросов на возврат пока нет'}
                    </div>
                  </div>
                ) : (
                  filteredRefunds.map(ref => (
                    <RefundCard key={ref.id} refund={ref} onAction={handleRefundAction} />
                  ))
                )}
              </div>
            )}
            {tab === 'vacancies' && (
              <VacancyManager />
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
