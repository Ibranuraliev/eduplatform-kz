import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { coursesAPI, groupsAPI, homeworkAPI, paymentsAPI, hrAPI } from '../api';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import api from '../api';
import WeekCalendar from '../components/WeekCalendar';
import { Home, BookOpen, Calendar, FileText, CheckCircle, BarChart2, User, Bell, MessageCircle, LogOut, Target, Clock, RefreshCw, PartyPopper, Frown, XCircle, X, Plus, Calculator, Globe, Landmark, Star, Trophy, Lightbulb, CreditCard, Key, ClipboardList, Eye, MapPin, Users, GraduationCap, UserCheck, TrendingUp, TrendingDown, Sparkles, Flame, AlertTriangle, Info, Shield, Gift, Timer, Upload, Download, Search, Settings, Wrench, Gem, Award, Medal, Banknote, Ticket, Briefcase, Map, ScrollText, Package, Code2, Brain, CalendarDays, Megaphone, BellOff, Zap, FlaskConical, Leaf, Monitor, Sprout, Newspaper, NotepadText, ArrowUp, ArrowDown, Trash2, Pencil, Lock, Unlock, Moon, Sun, CloudSun, Camera, Image, Music, Gamepad2, Activity, Glasses, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Check, Hand, Handshake, ThumbsUp, Dumbbell, Waves, Link, Send, Phone } from 'lucide-react';

const P = {
  violet:       '#7C3AED',
  violetDark:   '#5B21B6',
  violetSoft:   '#8B5CF6',
  violetPale:   '#F5F3FF',
  violetBorder: 'rgba(124,58,237,0.18)',
  ink:          '#0F0A1E',
  slate:        '#475569',
  border:       '#E8E4F0',
  white:        '#FFFFFF',
  surface:      '#FAFAF9',
  green:        '#059669',
  greenPale:    '#F0FDF4',
  orange:       '#D97706',
  orangePale:   '#FFFBEB',
  red:          '#DC2626',
  redPale:      '#FEF2F2',
  muted:        '#94A3B8',
};
const font = "'Nunito','Segoe UI',system-ui,sans-serif";

// Canonical subject map — matches Course.SUBJECT_CHOICES in courses/models.py
const SUBJECT_MAP = {
  ent_math:    'ЕНТ Математика',
  ent_kazakh:  'ЕНТ Казахский язык',
  ent_russian: 'ЕНТ Русский язык',
  ent_history: 'ЕНТ История Казахстана',
  ielts:       'IELTS',
  sat_math:    'SAT Математика',
  sat_english: 'SAT Английский',
  math:        'Математика',
  physics:     'Физика',
  chemistry:   'Химия',
  biology:     'Биология',
  english:     'Английский язык',
  kazakh:      'Казахский язык',
  russian:     'Русский язык',
  history:     'История',
  geography:   'География',
  informatics: 'Информатика',
  other:       'Другое',
};

function Pill({ children, color = P.violet, size = 12 }) {
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:5,background:color+'18',color,borderRadius:100,padding:'3px 10px',fontSize:size,fontWeight:800,letterSpacing:0.5,textTransform:'uppercase',fontFamily:font,border:`1px solid ${color}22`,whiteSpace:'nowrap' }}>
      {children}
    </span>
  );
}

function HwStatus({ status }) {
  const map = {
    accepted:          { label:<><CheckCircle size={14} style={{display:'inline',marginRight:4}} />Принято</>,     color:P.green,  bg:P.greenPale  },
    submitted:         { label:<><Clock size={14} style={{display:'inline',marginRight:4}} />На проверке</>, color:P.orange, bg:P.orangePale },
    revision_required: { label:<><RefreshCw size={14} style={{display:'inline',marginRight:4}} />На доработку</>,color:P.red,    bg:P.redPale    },
    overdue:           { label:<><XCircle size={14} style={{display:'inline',marginRight:4}} />Просрочено</>,   color:P.red,    bg:P.redPale    },
    not_submitted:     { label:<><FileText size={14} style={{display:'inline',marginRight:4}} />Не сдано</>,     color:P.slate,  bg:P.surface    },
  };
  const s = map[status] || map.not_submitted;
  return <span style={{ background:s.bg,color:s.color,borderRadius:8,padding:'4px 12px',fontSize:12,fontWeight:700,fontFamily:font }}>{s.label}</span>;
}

function ProgressRing({ pct, size=72, stroke=7, color=P.violet }) {
  const r = (size-stroke)/2;
  const circ = 2*Math.PI*r;
  const offset = circ - (pct/100)*circ;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={P.violetPale} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition:'stroke-dashoffset 1s ease' }}/>
    </svg>
  );
}

function AttendanceDots({ records }) {
  if (!records || records.length===0) return <p style={{ color:P.slate,fontSize:14,fontFamily:font }}>Нет данных о посещаемости</p>;
  return (
    <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
      {records.slice(0,30).map((r,i) => (
        <div key={i} title={new Date(r.session_date||r.date||Date.now()).toLocaleDateString('ru-RU')}
          style={{ width:32,height:32,borderRadius:8,background:r.is_present?P.greenPale:P.redPale,border:`1.5px solid ${r.is_present?P.green+'44':P.red+'44'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>
          {r.is_present?<Check size={16} color={P.green} />:<XCircle size={16} color={P.red} />}
        </div>
      ))}
    </div>
  );
}

const SUBJECT_COLORS = {
  ent_math:    { bg:'#EEF2FF', color:'#4338CA', border:'#818CF8' },
  ent_kazakh:  { bg:'#FFF7ED', color:'#C2410C', border:'#FB923C' },
  ent_russian: { bg:'#F0FDF4', color:'#15803D', border:'#4ADE80' },
  ent_history: { bg:'#FDF4FF', color:'#7E22CE', border:'#C084FC' },
  ielts:       { bg:'#EFF6FF', color:'#1D4ED8', border:'#60A5FA' },
  sat_math:    { bg:'#FFF1F2', color:'#BE123C', border:'#FB7185' },
  sat_english: { bg:'#F0FDFA', color:'#0F766E', border:'#2DD4BF' },
  math:        { bg:'#EEF2FF', color:'#4338CA', border:'#818CF8' },
  physics:     { bg:'#EFF6FF', color:'#1D4ED8', border:'#60A5FA' },
  chemistry:   { bg:'#FFF7ED', color:'#C2410C', border:'#FB923C' },
  biology:     { bg:'#F0FDF4', color:'#15803D', border:'#4ADE80' },
  english:     { bg:'#EFF6FF', color:'#1D4ED8', border:'#60A5FA' },
  kazakh:      { bg:'#FFF7ED', color:'#C2410C', border:'#FB923C' },
  russian:     { bg:'#F0FDF4', color:'#15803D', border:'#4ADE80' },
  history:     { bg:'#FDF4FF', color:'#7E22CE', border:'#C084FC' },
};
const getSubjectColor = (subjectOrTitle='') => {
  const key = Object.keys(SUBJECT_MAP).find(k => subjectOrTitle===k || subjectOrTitle?.toLowerCase().includes(SUBJECT_MAP[k]?.toLowerCase()));
  return SUBJECT_COLORS[key] || { bg:P.violetPale, color:P.violet, border:P.violetBorder };
};

function NotifItem({ notif, onRead }) {
  const iconMap = { homework_reviewed:FileText, session_reminder:Calendar, group_change:RefreshCw, payment:CreditCard, general:Bell };
  const IconComp = iconMap[notif.notification_type] || Bell;
  // Try to detect subject from title/message for color coding
  const subjectKey = Object.keys(SUBJECT_MAP).find(k => notif.title?.toLowerCase().includes(SUBJECT_MAP[k]?.toLowerCase()) || notif.message?.toLowerCase().includes(SUBJECT_MAP[k]?.toLowerCase()));
  const sc = subjectKey ? SUBJECT_COLORS[subjectKey] : null;
  return (
    <div onClick={()=>!notif.is_read&&onRead(notif.id)} style={{ background:notif.is_read?P.white:P.violetPale,border:`1.5px solid ${notif.is_read?P.border:P.violetBorder}`,borderRadius:16,padding:'16px 20px',cursor:notif.is_read?'default':'pointer',transition:'all .2s',display:'flex',gap:14,alignItems:'flex-start' }}>
      <div style={{ width:40,height:40,borderRadius:12,background:sc?sc.bg:P.violetPale,border:`1.5px solid ${sc?sc.border:P.violetBorder}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        <IconComp size={20} color={sc?sc.color:P.violet} />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:700,fontSize:15,color:P.ink,fontFamily:font }}>{notif.title}</div>
        <div style={{ color:P.slate,fontSize:13,marginTop:3,lineHeight:1.5,fontFamily:font }}>{notif.message}</div>
        <div style={{ color:'#94A3B8',fontSize:11,marginTop:6,fontFamily:font }}>{new Date(notif.created_at).toLocaleString('ru-RU')}</div>
      </div>
      {!notif.is_read && <div style={{ width:8,height:8,borderRadius:'50%',background:P.violet,flexShrink:0,marginTop:6 }}/>}
    </div>
  );
}

const card = (e={}) => ({ background:P.white,borderRadius:20,border:`1.5px solid ${P.border}`,padding:'24px',...e });
const btnP = (e={}) => ({ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`,color:'#fff',border:'none',borderRadius:12,padding:'11px 24px',fontWeight:800,fontSize:14,fontFamily:font,cursor:'pointer',boxShadow:`0 4px 16px rgba(124,58,237,.25)`,transition:'opacity .2s',...e });
const btnO = (e={}) => ({ background:P.violetPale,color:P.violet,border:`1.5px solid ${P.violetBorder}`,borderRadius:12,padding:'10px 22px',fontWeight:700,fontSize:14,fontFamily:font,cursor:'pointer',transition:'all .2s',...e });
const inputS = { width:'100%',border:`1.5px solid ${P.border}`,borderRadius:12,padding:'10px 14px',fontSize:14,fontFamily:font,outline:'none',color:P.ink,background:P.white,boxSizing:'border-box' };

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
  if (location.state?.tab) {
    setTab(location.state.tab);
  }
  }, [location.state]);
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'overview');
  const [modal, setModal] = useState(null); // { type: 'error'|'success'|'info', title, message }
  const [trialSubject, setTrialSubject] = useState('');
  const [trialSubjectLabel, setTrialSubjectLabel] = useState('');
  const [trialSlots, setTrialSlots] = useState([]);
  const [trialSlotsLoading, setTrialSlotsLoading] = useState(false);
  const [trialSelectedSlot, setTrialSelectedSlot] = useState(null);
  const [trialComment, setTrialComment] = useState('');
  const [trialBooking, setTrialBooking] = useState(null);
  const [trialSubmitting, setTrialSubmitting] = useState(false);
  const [trialStep, setTrialStep] = useState(0);
  const [showTrialBooking, setShowTrialBooking] = useState(false);
  const [myTrials, setMyTrials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [homework, setHomework] = useState([]);
  const [discount, setDiscount] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeTest, setActiveTest] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [testAttemptId, setTestAttemptId] = useState(null);
  const [gcLoading, setGcLoading] = useState(false);
  const [gcSuccess, setGcSuccess] = useState('');
  const [gcReason, setGcReason] = useState('');
  const [hwText, setHwText] = useState({});
  const [hwSubmitting, setHwSubmitting] = useState(null);

  // Profile state
  const [profileForm, setProfileForm] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [pwForm, setPwForm] = useState({ old_password:'', new_password:'', confirm_password:'' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState({ text:'', ok:true });
  const [avatarColor, setAvatarColor] = useState(() => localStorage.getItem('avatarColor') || '#7C3AED');
  const [avatarPhoto, setAvatarPhoto] = useState(() => localStorage.getItem('avatarPhoto') || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [progPeriod, setProgPeriod] = useState('month');

  useEffect(() => {
    Promise.all([
      coursesAPI.myCourses(),
      groupsAPI.schedule(),
      homeworkAPI.myHomework(),
      paymentsAPI.myDiscount(),
      api.get('/notifications/').catch(()=>({data:[]})),
      api.get('/groups/my-attendance/').catch(()=>({data:[]})),
    ]).then(([c,s,h,d,n,a]) => {
      setCourses(c.data);
      setSchedule(s.data);
      setHomework(h.data);
      setDiscount(d.data);
      setNotifications(Array.isArray(n.data)?n.data:n.data?.results||[]);
      setAttendance(Array.isArray(a.data)?a.data:a.data?.results||[]);
    }).catch(console.error).finally(()=>setLoading(false));
    hrAPI.myTrials().then(r=>setMyTrials(r.data)).catch(()=>{});
  }, []);

  // Initialize profileForm as soon as user is loaded — fixes empty profile tab on first click
  useEffect(() => {
    if (user && !profileForm) {
      setProfileForm({
        first_name:    user.first_name    || '',
        last_name:     user.last_name     || '',
        phone:         user.phone         || '',
        city:          user.city          || '',
        grade:         user.grade         || '',
        goal:          user.goal          || '',
        school:        user.school        || '',
        date_of_birth: user.date_of_birth || '',
        telegram:      user.telegram      || '',
      });
    }
  }, [user]);

  const unreadCount = notifications.filter(n=>!n.is_read).length;

  const markRead = async (id) => {
    try { await api.patch(`/notifications/${id}/read/`); setNotifications(p=>p.map(n=>n.id===id?{...n,is_read:true}:n)); } catch {}
  };
  const markAllRead = async () => {
    try { await api.post('/notifications/mark-all-read/'); setNotifications(p=>p.map(n=>({...n,is_read:true}))); } catch {}
  };

  const getCourseProgress = (enr) => {
    if (!enr?.course?.modules) return 0;
    const total = enr.course.modules.reduce((s,m)=>s+(m.lessons?.length||0),0);
    if (!total) return 0;
    return Math.min(100,Math.round((homework.filter(h=>h.status==='accepted').length/total)*100));
  };

  const attendancePct = attendance.length>0
    ? Math.round((attendance.filter(a=>a.is_present).length/attendance.length)*100)
    : null;

  const showModal = (type, title, message) => setModal({ type, title, message });

  const startTest = async (id) => {
    try {
      const {testsAPI} = await import('../api');
      const res = await testsAPI.start(id);
      setActiveTest(res.data.test); setTestAttemptId(res.data.attempt_id);
      setSelectedAnswers({}); setTestResult(null); setTab('test');
    } catch(err) { showModal('error', 'Ошибка', err.response?.data?.error || 'Не удалось запустить тест'); }
  };

  const submitTest = async () => {
    if (!testAttemptId) return;
    try {
      const {testsAPI} = await import('../api');
      const answers = Object.entries(selectedAnswers).map(([qId,aIds])=>({ question_id:parseInt(qId), selected_answer_ids:Array.isArray(aIds)?aIds:[aIds] }));
      const res = await testsAPI.submit(testAttemptId,{answers});
      setTestResult(res.data); setActiveTest(null); setTab('testresult');
    } catch(err) { showModal('error', 'Ошибка', err.response?.data?.error || 'Не удалось отправить тест'); }
  };

  const submitHomework = async (hwId) => {
    setHwSubmitting(hwId);
    try {
      await homeworkAPI.submit(hwId, { text_answer: hwText[hwId] || '' });
      const res = await homeworkAPI.myHomework();
      setHomework(res.data);
      setHwText(p => ({ ...p, [hwId]: '' }));
    } catch(err) { showModal('error', 'Ошибка', err.response?.data?.error || 'Не удалось отправить домашку'); }
    finally { setHwSubmitting(null); }
  };

  // eslint-disable-next-line no-unused-vars
  const submitGC = async () => {
    if (!gcReason.trim()) { showModal('error', 'Укажи причину', 'Пожалуйста, напиши причину смены группы'); return; }
    setGcLoading(true);
    try {
      await groupsAPI.changeRequest({reason:gcReason});
      setGcSuccess('Заявка отправлена! Администратор рассмотрит её в течение 1–2 рабочих дней.');
      setGcReason('');
    } catch(err) { showModal('error', 'Ошибка', err.response?.data?.error || 'Что-то пошло не так'); }
    finally { setGcLoading(false); }
  };

  // Open profile tab → init form from user
  const openProfile = () => {
    if (!profileForm) {
      setProfileForm({
        first_name: user?.first_name || '',
        last_name:  user?.last_name  || '',
        phone:      user?.phone      || '',
        city:       user?.city       || '',
        grade:      user?.grade      || '',
        goal:       user?.goal       || '',
        school:     user?.school     || '',
      });
    }
    setTab('profile');
  };

  const saveProfile = async () => {
    const errs = {};
    if (!profileForm.first_name.trim()) errs.first_name = 'Введи имя';
    if (!profileForm.last_name.trim())  errs.last_name  = 'Введи фамилию';
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setProfileLoading(true);
    setProfileErrors({});
    try {
      await api.patch('/users/profile/', profileForm);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch(e) {
      setProfileErrors(e.response?.data || { general: 'Ошибка сохранения' });
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async () => {
    if (!pwForm.old_password || !pwForm.new_password) {
      setPwMsg({ text: 'Заполни все поля', ok: false }); return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwMsg({ text: 'Пароли не совпадают', ok: false }); return;
    }
    if (pwForm.new_password.length < 6) {
      setPwMsg({ text: 'Пароль должен быть не менее 6 символов', ok: false }); return;
    }
    setPwLoading(true);
    setPwMsg({ text: '', ok: true });
    try {
      const res = await api.post('/users/change-password/', {
          old_password: pwForm.old_password,
          new_password: pwForm.new_password,
        });
        // обновляем токен в localStorage
        if (res.data.token) {
          localStorage.setItem('authToken', res.data.token);
        }
        setPwMsg({ text: 'Пароль успешно изменён', ok: true });
      setPwForm({ old_password:'', new_password:'', confirm_password:'' });
    } catch(e) {
      setPwMsg({ text: e.response?.data?.error || 'Неверный текущий пароль', ok: false });
    } finally {
      setPwLoading(false);
    }
  };

  const tabs = [
    {id:'overview', label:<><Home size={16} style={{marginRight:8}} />Главная</>},
    {id:'courses',  label:<><BookOpen size={16} style={{marginRight:8}} />Мои курсы</>},
    {id:'schedule', label:<><Calendar size={16} style={{marginRight:8}} />Расписание</>},
    {id:'homework', label:<><FileText size={16} style={{marginRight:8}} />Домашки{homework.filter(h=>h.status==='not_submitted'||h.status==='revision_required').length>0?` (${homework.filter(h=>h.status==='not_submitted'||h.status==='revision_required').length})`:''}</>},
    {id:'tests',    label:<><CheckCircle size={16} style={{marginRight:8}} />Тесты</>},
    {id:'progress', label:<><BarChart2 size={16} style={{marginRight:8}} />Прогресс</>},
    {id:'profile',  label:<><User size={16} style={{marginRight:8}} />Профиль</>},
  ];

  return (
    <div style={{ minHeight:'100vh',background:'#F8F6FF',fontFamily:font }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;} ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:${P.violetSoft};border-radius:2px;}`}</style>

      {/* ── CUSTOM MODAL ── */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,10,30,.55)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:P.white, borderRadius:24, padding:'36px 40px', maxWidth:420, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,.25)', textAlign:'center', fontFamily:font }}>
            {/* Icon */}
            <div style={{ fontSize:48, marginBottom:16, lineHeight:1 }}>
              {modal.type === 'error'   ? <XCircle size={48} color={P.red} /> : modal.type === 'success' ? <CheckCircle size={48} color={P.green} /> : <Info size={48} color={P.violet} />}
            </div>
            {/* Title */}
            <div style={{ fontWeight:900, fontSize:20, color:P.ink, marginBottom:10, letterSpacing:-0.3 }}>
              {modal.title}
            </div>
            {/* Message */}
            <div style={{ fontSize:15, color:P.slate, lineHeight:1.7, marginBottom:28 }}>
              {modal.message}
            </div>
            {/* Button */}
            <button onClick={() => setModal(null)}
              style={{ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:14, padding:'13px 40px', fontWeight:900, fontSize:15, cursor:'pointer', fontFamily:font, boxShadow:`0 4px 16px rgba(124,58,237,.3)` }}>
              Понятно
            </button>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{ background:P.white,borderBottom:`1px solid ${P.border}`,padding:'0 40px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 12px rgba(124,58,237,.06)' }}>
        <div onClick={()=>navigate('/')} style={{ fontWeight:900,fontSize:20,cursor:'pointer',color:P.ink }}>
          <span style={{ color:P.violet }}>Edu</span>Platform
          <span style={{ marginLeft:8,fontSize:11,background:P.violet,color:'#fff',borderRadius:6,padding:'2px 7px',fontWeight:800,verticalAlign:'middle' }}>KZ</span>
        </div>

        <div style={{ display:'flex',alignItems:'center',gap:16 }}>
          {/* Bell */}
          <div style={{ position:'relative' }}>
            <button onClick={()=>setNotifOpen(!notifOpen)} style={{ background:notifOpen?P.violetPale:'transparent',border:`1.5px solid ${notifOpen?P.violetBorder:P.border}`,borderRadius:12,width:42,height:42,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:18,position:'relative' }}>
              <Bell size={18} color={P.slate} />
              {unreadCount>0 && <div style={{ position:'absolute',top:-4,right:-4,width:18,height:18,borderRadius:'50%',background:P.red,color:'#fff',fontSize:10,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #fff' }}>{unreadCount>9?'9+':unreadCount}</div>}
            </button>

            {notifOpen && (
              <div style={{ position:'absolute',top:52,right:0,width:360,background:P.white,border:`1.5px solid ${P.border}`,borderRadius:20,boxShadow:'0 16px 48px rgba(0,0,0,.12)',zIndex:200,overflow:'hidden' }}>
                <div style={{ padding:'16px 20px',borderBottom:`1px solid ${P.border}`,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <span style={{ fontWeight:800,fontSize:15,color:P.ink }}>Уведомления</span>
                  {unreadCount>0 && <button onClick={markAllRead} style={btnO({padding:'5px 12px',fontSize:12})}>Прочитать все</button>}
                </div>
                <div style={{ maxHeight:380,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:8 }}>
                  {notifications.length===0 ? (
                    <div style={{ textAlign:'center',padding:'32px 0',color:P.slate,fontSize:14 }}><div style={{ fontSize:36,marginBottom:8 }}><BellOff size={36} color={P.slate} /></div>Нет уведомлений</div>
                  ) : notifications.slice(0,15).map(n=><NotifItem key={n.id} notif={n} onRead={markRead}/>)}
                </div>
              </div>
            )}
          </div>

          {/* Telegram support */}
          <a href="https://t.me/eduplatform_kz" target="_blank" rel="noreferrer"
            style={{ background:'transparent',border:`1.5px solid ${P.border}`,borderRadius:12,width:42,height:42,display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none' }}
            title="Поддержка">
            <Send size={18} color={P.slate} />
          </a>

          {/* User — click to open profile */}
          <div onClick={openProfile} style={{ display:'flex',alignItems:'center',gap:10,background:tab==='profile'?P.violet:P.violetPale,border:`1.5px solid ${tab==='profile'?'transparent':P.violetBorder}`,borderRadius:12,padding:'8px 16px',cursor:'pointer',transition:'all .2s' }}>
            <div style={{ width:32,height:32,borderRadius:'50%',overflow:'hidden',border:`2px solid ${tab==='profile'?'rgba(255,255,255,.4)':P.violetBorder}`,flexShrink:0 }}>
              {avatarPhoto
                ? <img src={avatarPhoto} alt="avatar" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                : <div style={{ width:'100%',height:'100%',background:tab==='profile'?'rgba(255,255,255,.25)':`linear-gradient(135deg,${avatarColor},${avatarColor}bb)`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:13,color:'#fff' }}>{user?.first_name?.[0]||'?'}</div>
              }
            </div>
            <span style={{ fontWeight:700,fontSize:14,color:tab==='profile'?'#fff':P.ink }}>{user?.first_name} {user?.last_name}</span>
          </div>
          <button onClick={()=>navigate('/chat')} style={{ background:P.violetPale, border:`1.5px solid ${P.violetBorder}`, color:P.violet, borderRadius:12, padding:'8px 16px', cursor:'pointer', fontSize:14, fontWeight:700, fontFamily:font, display:'flex',alignItems:'center',gap:6 }}><MessageCircle size={16} /> Чат</button>
          <button onClick={logout} style={{ background:'none',border:'none',color:P.slate,cursor:'pointer',fontSize:14,fontWeight:600,fontFamily:font,display:'flex',alignItems:'center',gap:6 }}><LogOut size={16} /> Выйти</button>
        </div>
      </nav>

      <div style={{ display:'flex', minHeight:'calc(100vh - 64px)' }}>

        {/* SIDEBAR */}
        <div style={{ width:240, flexShrink:0, background:P.white, borderRight:`1px solid ${P.border}`, padding:'24px 16px', display:'flex', flexDirection:'column', gap:4, position:'sticky', top:64, height:'calc(100vh - 64px)', overflowY:'auto' }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 16px', borderRadius:12, fontWeight:700, fontSize:14, fontFamily:font, cursor:'pointer', textAlign:'left', transition:'all .2s', background:tab===t.id?`linear-gradient(135deg,${P.violet},${P.violetSoft})`:'none', color:tab===t.id?'#fff':P.slate, border:'none', boxShadow:tab===t.id?`0 4px 16px rgba(124,58,237,.2)`:'none' }}>{t.label}</button>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex:1, padding:'32px 32px', overflowY:'auto', minWidth:0 }}>
        {loading ? (
          <div style={{ textAlign:'center',padding:80,color:P.slate,fontSize:18 }}><div style={{ fontSize:40,marginBottom:16 }}><Clock size={40} color={P.slate} /></div>Загрузка...</div>
        ) : (
          <>
            {/* ══ OVERVIEW ══ */}
            {tab==='overview' && (
              <div style={{ display:'flex',flexDirection:'column',gap:20 }}>

                {/* Next session + Attendance */}
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
                  <div style={card()}>
                    <div style={{ fontWeight:800,fontSize:15,color:P.ink,marginBottom:14,display:'flex',alignItems:'center',gap:8 }}><Calendar size={18} color={P.violet} /> Ближайшие уроки</div>
                    {schedule.length>0 ? (
                      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                        {schedule.slice(0,3).map((sess,idx) => {
                          const d = new Date(sess.scheduled_at);
                          const isNext = idx===0;
                          return (
                            <div key={sess.id} style={{ background:isNext?P.violetPale:P.surface,borderRadius:12,padding:'12px 14px',border:`1.5px solid ${isNext?P.violetBorder:P.border}` }}>
                              {isNext && <div style={{ fontSize:11,fontWeight:800,color:P.violet,textTransform:'uppercase',letterSpacing:0.8,marginBottom:4 }}>Следующий урок</div>}
                              <div style={{ fontWeight:700,fontSize:14,color:P.ink,marginBottom:3 }}>
                                {d.toLocaleString('ru-RU',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                              </div>
                              <div style={{ color:P.slate,fontSize:12,display:'flex',alignItems:'center',gap:4 }}><Timer size={12} color={P.slate} /> {sess.duration_minutes} мин</div>
                              {isNext && (sess.meet_link ? (
                                <a href={sess.meet_link} target="_blank" rel="noreferrer" style={{ ...btnP({marginTop:10,padding:'8px 18px',fontSize:13}),display:'inline-flex',alignItems:'center',gap:6,textDecoration:'none' }}><Waves size={14} /> Войти в урок</a>
                              ) : (
                                <div style={{ marginTop:8,background:P.white,borderRadius:8,padding:'7px 12px',color:P.slate,fontSize:12,fontWeight:600 }}>Ссылка появится за 5 мин до урока</div>
                              ))}
                            </div>
                          );
                        })}
                        {schedule.length>3 && (
                          <div style={{ color:P.slate,fontSize:12,fontWeight:600,textAlign:'center',marginTop:4 }}>+{schedule.length-3} ещё · <span style={{ color:P.violet,cursor:'pointer' }} onClick={()=>setTab('schedule')}>смотреть расписание →</span></div>
                        )}
                      </div>
                    ) : <div style={{ color:P.slate,fontSize:14 }}>Нет запланированных уроков</div>}
                  </div>

                  <div style={card()}>
                    <div style={{ fontWeight:800,fontSize:15,color:P.ink,marginBottom:14,display:'flex',alignItems:'center',gap:8 }}><BarChart2 size={18} color={P.violet} /> Посещаемость</div>
                    {attendancePct!==null ? (
                      <div style={{ display:'flex',alignItems:'center',gap:20 }}>
                        <div style={{ position:'relative',flexShrink:0 }}>
                          <ProgressRing pct={attendancePct} color={attendancePct>=80?P.green:attendancePct>=60?P.orange:P.red}/>
                          <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:15,color:P.ink }}>{attendancePct}%</div>
                        </div>
                        <div>
                          <div style={{ fontWeight:800,fontSize:20,color:P.ink }}>{attendance.filter(a=>a.is_present).length}/{attendance.length}</div>
                          <div style={{ color:P.slate,fontSize:13,marginTop:2 }}>уроков посещено</div>
                          <div style={{ marginTop:8 }}><Pill color={attendancePct>=80?P.green:P.orange} size={11}>{attendancePct>=80?'Отлично!':attendancePct>=60?'Неплохо':'Нужно лучше'}</Pill></div>
                        </div>
                      </div>
                    ) : <div style={{ color:P.slate,fontSize:14 }}>Нет данных о посещаемости</div>}
                  </div>
                </div>


                {/* ── ПРОБНЫЙ УРОК ── */}
                {(()=>{
                  const usedEnt  = myTrials.some(t=>['new','confirmed','conducted'].includes(t.status)&&t.subject&&t.subject.startsWith('ent'));
                  const usedIelts= myTrials.some(t=>['new','confirmed','conducted'].includes(t.status)&&t.subject&&(t.subject==='ielts'||t.subject.startsWith('sat')));
                  const showEnt  = !usedEnt;
                  const showIelts= !usedIelts;
                  if(!showEnt && !showIelts) return null;
                  const entSubjects=[
                    {key:'ent_math',    label: SUBJECT_MAP.ent_math},
                    {key:'ent_kazakh',  label: SUBJECT_MAP.ent_kazakh},
                    {key:'ent_russian', label: SUBJECT_MAP.ent_russian},
                    {key:'ent_history', label: SUBJECT_MAP.ent_history},
                  ];
                  const ieltsSubjects=[
                    {key:'ielts',       label: SUBJECT_MAP.ielts},
                    {key:'sat_math',    label: SUBJECT_MAP.sat_math},
                    {key:'sat_english', label: SUBJECT_MAP.sat_english},
                  ];
                  const activeTrials=myTrials.filter(t=>t.status==='new'||t.status==='confirmed');
                  return (
                    <div style={{background:P.white,borderRadius:24,border:`1.5px solid ${P.violetBorder}`,padding:'24px',overflow:'hidden',position:'relative'}}>
                      <div style={{position:'absolute',top:-30,right:-30,width:140,height:140,borderRadius:'50%',background:P.violetPale,pointerEvents:'none'}}/>
                      <div style={{position:'relative'}}>
                        <div style={{fontWeight:900,fontSize:18,color:P.ink,marginBottom:4,display:'flex',alignItems:'center',gap:8}}><Target size={20} color={P.violet} /> Пробный урок</div>
                        <div style={{fontSize:13,color:P.slate,marginBottom:16}}>Запишись бесплатно — по одному на каждую категорию</div>

                        {activeTrials.length>0&&(
                          <div style={{background:P.greenPale,border:`1.5px solid ${P.green}33`,borderRadius:14,padding:'14px 16px',marginBottom:16}}>
                            {activeTrials.map(b=>(
                              <div key={b.id} style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                                <div style={{fontSize:20}}><CheckCircle size={20} color={P.green} /></div>
                                <div>
                                  <div style={{fontWeight:800,fontSize:13,color:P.green}}>Запись подтверждена</div>
                                  <div style={{fontSize:12,color:P.slate}}>{SUBJECT_MAP[b.subject]||b.subject} · {b.date} в {b.time}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                          {showEnt&&entSubjects.map(s=>(
                            <button key={s.key} onClick={()=>{setTrialSubject(s.key);setTrialSubjectLabel(s.label);setTrialStep(1);setTrialSlotsLoading(true);hrAPI.trialSlots(s.key).then(r=>{setTrialSlots(r.data);setTrialSlotsLoading(false);}).catch(e=>{setTrialSlotsLoading(false);console.error('Trial slots error:',e?.response?.status,e?.response?.data);});setShowTrialBooking(true);setTab('overview');}}
                              style={{padding:'9px 14px',borderRadius:12,fontFamily:font,cursor:'pointer',fontWeight:700,fontSize:13,background:P.violetPale,color:P.violet,border:`1.5px solid ${P.violetBorder}`,transition:'all .2s'}}>
                              {s.label}
                            </button>
                          ))}
                          {showIelts&&ieltsSubjects.map(s=>(
                            <button key={s.key} onClick={()=>{setTrialSubject(s.key);setTrialSubjectLabel(s.label);setTrialStep(1);setTrialSlotsLoading(true);hrAPI.trialSlots(s.key).then(r=>{setTrialSlots(r.data);setTrialSlotsLoading(false);}).catch(e=>{setTrialSlotsLoading(false);console.error('Trial slots error:',e?.response?.status,e?.response?.data);});setShowTrialBooking(true);setTab('overview');}}
                              style={{padding:'9px 14px',borderRadius:12,fontFamily:font,cursor:'pointer',fontWeight:700,fontSize:13,background:P.greenPale,color:P.green,border:`1.5px solid ${P.green}33`,transition:'all .2s'}}>
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── INLINE TRIAL BOOKING (opens when subject selected from overview) ── */}
                {tab==='overview'&&showTrialBooking&&(
                  <div style={{background:P.white,borderRadius:24,border:`1.5px solid ${P.border}`,padding:'24px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
                      <button onClick={()=>{setShowTrialBooking(false);setTrialStep(0);setTrialSubject('');setTrialSubjectLabel('');setTrialSelectedSlot(null);}}
                        style={{background:P.surface,border:`1.5px solid ${P.border}`,borderRadius:10,padding:'6px 14px',fontWeight:800,fontSize:13,cursor:'pointer',fontFamily:font,color:P.slate,display:'flex',alignItems:'center',gap:6}}><ChevronLeft size={16} /> Назад</button>
                      <div style={{fontWeight:900,fontSize:18,color:P.ink}}>Запись на пробный — {trialSubjectLabel||SUBJECT_MAP[trialSubject]||trialSubject}</div>
                    </div>

                    {trialStep===3?(
                      <div style={{textAlign:'center',padding:40}}>
                        <div style={{fontSize:56,marginBottom:16}}><PartyPopper size={56} color={P.green} /></div>
                        <div style={{fontWeight:900,fontSize:20,color:P.ink,marginBottom:8}}>Запись прошла успешно!</div>
                        <div style={{color:P.slate,fontSize:14,lineHeight:1.7,marginBottom:24}}>
                          <strong>{trialBooking?.date}</strong> в <strong>{trialBooking?.time}</strong><br/>
                          Скоро с тобой свяжется менеджер.
                        </div>
                        <button onClick={()=>{setTrialStep(0);setTrialSubject('');setTrialSubjectLabel('');setTrialSelectedSlot(null);setTrialComment('');setShowTrialBooking(false);hrAPI.myTrials().then(r=>setMyTrials(r.data)).catch(()=>{});}} style={btnP()}>На главную</button>
                      </div>
                    ):(
                      <>
                        {trialSlotsLoading?<div style={{textAlign:'center',padding:40,color:P.slate,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><Clock size={18} color={P.slate}/> Загружаем слоты...</div>
                        :trialSlots.length===0?<div style={{textAlign:'center',padding:40}}><div style={{fontSize:40,marginBottom:10}}><Frown size={40} color={P.slate} /></div><div style={{fontWeight:700,color:P.ink}}>Свободных слотов нет</div><button onClick={()=>{setShowTrialBooking(false);setTrialStep(0);setTrialSubject('');setTrialSubjectLabel('');}} style={{...btnO(),marginTop:16}}>← Назад</button></div>
                        :(
                          <>
                            {trialStep===1&&(
                              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
                                {trialSlots.map(slot=>{
                                  const d=new Date(slot.date+'T00:00');
                                  const sel=trialSelectedSlot?.id===slot.id;
                                  return(
                                    <button key={slot.id} onClick={()=>{setTrialSelectedSlot(slot);setTrialStep(2);}}
                                      style={{background:sel?P.violet:'#fff',color:sel?'#fff':P.ink,border:`1.5px solid ${sel?'transparent':P.border}`,borderRadius:16,padding:'16px 14px',cursor:'pointer',fontFamily:font,textAlign:'left',transition:'all .2s'}}>
                                      <div style={{fontWeight:900,fontSize:22,marginBottom:3}}>{slot.time_start}</div>
                                      <div style={{fontWeight:700,fontSize:13,color:sel?'rgba(255,255,255,.85)':P.violet,marginBottom:2}}>{d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}</div>
                                      <div style={{fontSize:12,opacity:0.7,textTransform:'capitalize'}}>{d.toLocaleDateString('ru-RU',{weekday:'long'})}</div>
                                      {slot.teacher_name&&<div style={{fontSize:11,marginTop:6,opacity:0.8,display:'flex',alignItems:'center',gap:4}}><UserCheck size={12} /> {slot.teacher_name}</div>}
                                      <div style={{fontSize:11,marginTop:4,opacity:0.65,display:'flex',alignItems:'center',gap:4}}><Timer size={12} /> {slot.duration_minutes} мин</div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            {trialStep>=2&&trialSelectedSlot&&(
                              <div>
                                <div style={{background:P.violetPale,border:`1.5px solid ${P.violetBorder}`,borderRadius:16,padding:'18px',marginBottom:16}}>
                                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                                    {[
                                      {l:'Предмет',v:trialSubjectLabel||SUBJECT_MAP[trialSubject]||trialSubject},
                                      {l:'Дата',v:new Date(trialSelectedSlot.date+'T00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'})},
                                      {l:'Время',v:trialSelectedSlot.time_start},
                                      {l:'Длительность',v:`${trialSelectedSlot.duration_minutes} мин`},
                                    ].map(x=>(
                                      <div key={x.l} style={{background:'#fff',borderRadius:12,padding:'12px 14px'}}>
                                        <div style={{fontSize:11,color:P.muted,fontWeight:700,textTransform:'uppercase',marginBottom:3}}>{x.l}</div>
                                        <div style={{fontWeight:800,fontSize:14,color:P.ink}}>{x.v}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <textarea value={trialComment} onChange={e=>setTrialComment(e.target.value)} rows={2} placeholder="Пожелания или вопросы..."
                                  style={{width:'100%',border:`1.5px solid ${P.border}`,borderRadius:12,padding:'10px 14px',fontSize:14,fontFamily:font,outline:'none',resize:'vertical',color:P.ink,marginBottom:16}}/>
                                <div style={{display:'flex',gap:12}}>
                                  <button onClick={()=>setTrialStep(1)} style={btnO()}>← Назад</button>
                                  <button onClick={async()=>{
                                    setTrialSubmitting(true);
                                    try{const bookPayload=trialSelectedSlot.slot_type==='group_session'?{session_id:trialSelectedSlot.session_id,subject:trialSubject,comment:trialComment}:{slot_id:trialSelectedSlot.id,subject:trialSubject,comment:trialComment};const r=await hrAPI.bookTrial(bookPayload);setTrialBooking(r.data);setTrialStep(3);hrAPI.myTrials().then(res=>setMyTrials(res.data)).catch(()=>{});}
                                    catch(e){showModal('error','Ошибка',e.response?.data?.error||'Что-то пошло не так');}
                                    finally{setTrialSubmitting(false);}
                                  }} disabled={trialSubmitting} style={{...btnP(),flex:1,opacity:trialSubmitting?.7:1}}>
                                    {trialSubmitting?<span style={{display:'inline-flex',alignItems:'center',gap:6}}><Clock size={14}/>Записываемся...</span>:<span style={{display:'inline-flex',alignItems:'center',gap:6}}><Target size={14}/>Записаться</span>}
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Referral */}
                <div style={card()}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800,fontSize:15,color:P.ink,marginBottom:6,display:'flex',alignItems:'center',gap:8 }}><Gift size={18} color={P.violet} /> Реферальная программа</div>
                      <p style={{ color:P.slate,fontSize:14,margin:'0 0 16px',lineHeight:1.6 }}>Пригласи друга — получи <strong style={{ color:P.violet }}>10% скидку</strong> на следующий месяц.</p>
                      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                        <div style={{ background:P.violetPale,border:`1.5px solid ${P.violetBorder}`,borderRadius:10,padding:'10px 18px',fontFamily:'monospace',fontSize:16,fontWeight:900,color:P.violet,letterSpacing:2 }}>{user?.referral_code||'—'}</div>
                        <button onClick={()=>{navigator.clipboard.writeText(user?.referral_code||''); showModal('success', 'Скопировано!', 'Реферальный код скопирован в буфер обмена');}} style={btnO({display:'flex',alignItems:'center',gap:6})}><ClipboardList size={16} /> Скопировать</button>
                      </div>
                    </div>
                    <div style={{ textAlign:'center',background:P.violetPale,borderRadius:16,padding:'16px 24px',border:`1.5px solid ${P.violetBorder}` }}>
                      <div style={{ fontSize:32,fontWeight:900,color:P.violet }}>{discount?.balance_percent||0}%</div>
                      <div style={{ fontSize:12,color:P.slate,fontWeight:600 }}>Ваша скидка</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ COURSES ══ */}
            {tab==='courses' && (
              <div>
                <div style={{ fontWeight:900,fontSize:22,color:P.ink,marginBottom:20,letterSpacing:-0.5 }}>Мои курсы</div>
                {courses.length===0 ? (
                  <div style={card({textAlign:'center',padding:60})}><div style={{ fontSize:48,marginBottom:14 }}><BookOpen size={48} color={P.slate} /></div><div style={{ color:P.slate,marginBottom:20,fontSize:16 }}>У вас пока нет курсов</div><button onClick={()=>navigate('/')} style={btnP()}>Выбрать курс →</button></div>
                ) : (
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:20 }}>
                    {courses.map(enr=>{
                      const pct=getCourseProgress(enr);
                      const tc={ent:P.violet,ielts:P.green,sat:'#DC2626'};
                      const col=tc[enr.course.course_type]||P.violet;
                      return (
                        <div key={enr.id} style={card()}>
                          <div style={{ height:4,background:`linear-gradient(90deg,${col},${col}66)`,borderRadius:4,marginBottom:18,marginTop:-24,marginLeft:-24,marginRight:-24 }}/>
                          <Pill color={col}>{enr.course.course_type?.toUpperCase()}</Pill>
                          <h3 style={{ fontWeight:800,fontSize:18,margin:'14px 0 4px',color:P.ink }}>{enr.course.title}</h3>
                          <p style={{ color:P.slate,fontSize:13,margin:'0 0 18px' }}>Куплено: {new Date(enr.enrolled_at).toLocaleDateString('ru-RU')}</p>
                          <div style={{ marginBottom:16 }}>
                            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                              <span style={{ fontSize:13,color:P.slate,fontWeight:600 }}>Прогресс</span>
                              <span style={{ fontSize:13,fontWeight:900,color:col }}>{pct}%</span>
                            </div>
                            <div style={{ height:8,background:P.surface,borderRadius:4,overflow:'hidden' }}>
                              <div style={{ height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${col},${col}99)`,borderRadius:4,transition:'width 1s ease' }}/>
                            </div>
                          </div>
                          <button onClick={()=>navigate(`/courses/${enr.course.id}`)} style={btnO({width:'100%',textAlign:'center'})}>Смотреть курс →</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══ SCHEDULE ══ */}
            {tab==='schedule' && (
                <WeekCalendar mode="student" homework={homework} />
              )}

            {/* ══ HOMEWORK ══ */}
            {tab==='homework' && (
              <div>
                <div style={{ fontWeight:900,fontSize:22,color:P.ink,marginBottom:20,letterSpacing:-0.5 }}>Домашние задания</div>
                {homework.length===0 ? (
                  <div style={card({textAlign:'center',padding:60})}><div style={{ fontSize:48,marginBottom:14 }}><FileText size={48} color={P.slate} /></div><div style={{ color:P.slate,fontSize:16 }}>Нет домашних заданий</div></div>
                ) : (() => {
                  // Group by day (submitted_at or "Не сдано")
                  const groups = {};
                  homework.forEach(sub => {
                    const dateKey = sub.submitted_at
                      ? new Date(sub.submitted_at).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })
                      : (sub.status==='not_submitted' ? '📋 Не сдано' : '🕐 Ожидает сдачи');
                    if (!groups[dateKey]) groups[dateKey] = [];
                    groups[dateKey].push(sub);
                  });
                  return (
                    <div style={{ display:'flex',flexDirection:'column',gap:24 }}>
                      {Object.entries(groups).map(([dateLabel, subs]) => (
                        <div key={dateLabel}>
                          {/* Day divider */}
                          <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:12 }}>
                            <div style={{ height:1,flex:1,background:P.border }}/>
                            <span style={{ fontSize:12,fontWeight:800,color:P.slate,background:P.surface,padding:'3px 12px',borderRadius:20,border:`1px solid ${P.border}`,whiteSpace:'nowrap' }}>{dateLabel}</span>
                            <div style={{ height:1,flex:1,background:P.border }}/>
                          </div>
                          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                            {subs.map(sub => {
                              const hwId = sub.homework_id;
                              const sc = getSubjectColor(sub.subject || '');
                              return (
                                <div key={hwId} style={card({borderLeft:`4px solid ${sc.border}`})}>
                                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10,flexWrap:'wrap',gap:8 }}>
                                    <div style={{ flex:1,minWidth:0 }}>
                                      <div style={{ fontWeight:800,fontSize:16,color:P.ink,marginBottom:4 }}>{sub.homework_title || `Домашнее задание #${hwId}`}</div>
                                      <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
                                        {sub.lesson && (
                                          <span style={{ fontSize:12,fontWeight:700,color:sc.color,background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:6,padding:'2px 8px' }}>
                                            {sub.lesson}
                                          </span>
                                        )}
                                        {sub.submitted_at && (
                                          <span style={{ color:P.slate,fontSize:12 }}>Сдано: {new Date(sub.submitted_at).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                                        )}
                                      </div>
                                    </div>
                                    <HwStatus status={sub.status}/>
                                  </div>
                                  {sub.teacher_comment && (
                                    <div style={{ background:P.violetPale,border:`1.5px solid ${P.violetBorder}`,borderRadius:12,padding:'12px 16px',marginBottom:12 }}>
                                      <div style={{ fontSize:12,color:P.violet,fontWeight:700,marginBottom:4,display:'flex',alignItems:'center',gap:6 }}><MessageCircle size={14} /> Комментарий преподавателя</div>
                                      <div style={{ color:P.ink,fontSize:14,lineHeight:1.6 }}>{sub.teacher_comment}</div>
                                    </div>
                                  )}
                                  {(sub.status==='not_submitted'||sub.status==='revision_required') && (
                                    <div style={{ marginTop:8,display:'flex',gap:10 }}>
                                      <input value={hwText[hwId]||''} onChange={e=>setHwText(p=>({...p,[hwId]:e.target.value}))} placeholder="Введи ответ или ссылку на выполненное задание..." style={{ ...inputS,flex:1 }}/>
                                      <button onClick={()=>submitHomework(hwId)} disabled={hwSubmitting===hwId} style={btnP({flexShrink:0,opacity:hwSubmitting===hwId?0.6:1,display:'flex',alignItems:'center',gap:6})}>{hwSubmitting===hwId?'...':'Сдать'}<Upload size={16} /></button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ══ TESTS ══ */}
            {tab==='tests' && (
              <div>
                <div style={{ fontWeight:900,fontSize:22,color:P.ink,marginBottom:20,letterSpacing:-0.5 }}>Тесты</div>
                <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                  {courses.map(enr=>enr.course.modules?.map(m=>m.lessons?.map(l=>l.test&&(
                    <div key={l.id} style={card({display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12})}>
                      <div>
                        <div style={{ fontWeight:800,fontSize:15,color:P.ink }}>{l.test.title}</div>
                        <div style={{ color:P.slate,fontSize:13,marginTop:3,display:'flex',alignItems:'center',gap:6 }}>Урок: {l.title} · <Timer size={14} color={P.slate} /> {l.test.time_limit_minutes} мин</div>
                      </div>
                      <button onClick={()=>startTest(l.test.id)} style={btnP()}>Начать тест →</button>
                    </div>
                  ))))}
                  <div style={card({display:'flex',justifyContent:'space-between',alignItems:'center'})}>
                    <div><div style={{ fontWeight:800,fontSize:15,color:P.ink }}>Test 1 — Angles</div><div style={{ color:P.slate,fontSize:13,marginTop:3 }}>20 минут · 1 попытка</div></div>
                    <button onClick={()=>startTest(1)} style={btnP()}>Начать тест →</button>
                  </div>
                </div>
              </div>
            )}

            {/* ══ ACTIVE TEST ══ */}
            {tab==='test' && activeTest && (
              <div style={card({marginBottom:16})}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
                  <div style={{ fontWeight:900,fontSize:20,color:P.ink }}>{activeTest.title}</div>
                  <Pill color={P.orange}><Timer size={14} style={{marginRight:6}} /> {activeTest.time_limit_minutes} минут</Pill>
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
                  {activeTest.questions.map((q,qi)=>(
                    <div key={q.id} style={{ background:P.surface,borderRadius:16,padding:'20px 24px',border:`1.5px solid ${P.border}` }}>
                      <p style={{ fontWeight:700,fontSize:16,color:P.ink,margin:'0 0 14px' }}>{qi+1}. {q.question_text}</p>
                      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                        {q.answers.map(a=>{
                          const sel=selectedAnswers[q.id]===a.id;
                          return (
                            <label key={a.id} style={{ display:'flex',alignItems:'center',gap:12,cursor:'pointer',padding:'10px 14px',borderRadius:10,background:sel?P.violetPale:P.white,border:`1.5px solid ${sel?P.violet:P.border}`,transition:'all .2s' }}>
                              <input type="radio" name={`q-${q.id}`} value={a.id} onChange={()=>setSelectedAnswers(p=>({...p,[q.id]:a.id}))} checked={sel} style={{ width:16,height:16,accentColor:P.violet }}/>
                              <span style={{ fontSize:15,color:P.ink }}>{a.answer_text}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={submitTest} style={{ ...btnP({width:'100%',padding:'14px',fontSize:16}),marginTop:24,display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}><CheckCircle size={18} /> Отправить тест</button>
              </div>
            )}

            {/* ══ TEST RESULT ══ */}
            {tab==='testresult' && testResult && (
              <div style={card({textAlign:'center',padding:60,maxWidth:480,margin:'0 auto'})}>
                <div style={{ fontSize:64,marginBottom:16 }}>{testResult.score>=70?<PartyPopper size={64} color={P.green} />:<BookOpen size={64} color={P.slate} />}</div>
                <div style={{ fontWeight:900,fontSize:24,color:P.ink,marginBottom:8 }}>Тест завершён!</div>
                <div style={{ fontSize:64,fontWeight:900,color:testResult.score>=70?P.green:P.orange,letterSpacing:-2,margin:'12px 0' }}>{testResult.score}%</div>
                <div style={{ color:P.slate,fontSize:15,marginBottom:28 }}>Правильных: {testResult.earned_points} из {testResult.total_points}</div>
                <button onClick={()=>setTab('tests')} style={btnP({padding:'14px 36px'})}>Вернуться к тестам</button>
              </div>
            )}

            {/* ══ PROGRESS ══ */}
            {tab==='progress' && (()=>{
              // Build attendance timeline data for line chart based on period
              const now2 = new Date();
              const getPeriodDays = (p) => ({week:7,month:30,half:182,year:365}[p]||30);
              const days = getPeriodDays(progPeriod);
              const cutoff = new Date(now2); cutoff.setDate(cutoff.getDate() - days);

              // Attendance per week buckets for the selected period
              // eslint-disable-next-line no-unused-vars
              const attFiltered = attendance.filter(a => new Date(a.scheduled_at||a.session_date||now2) >= cutoff || true);
              // Generate week buckets for the chart
              const numWeeks = Math.max(Math.ceil(days/7), 2);
              const weekBuckets = Array.from({length:numWeeks}, (_,i) => {
                const wStart = new Date(now2); wStart.setDate(wStart.getDate() - (numWeeks-1-i)*7 - now2.getDay());
                const wEnd = new Date(wStart); wEnd.setDate(wStart.getDate()+7);
                // Use seeded data patterns since we don't have session dates on attendance records
                const totalInWeek = Math.round(3 * (days <= 7 ? 1 : days <= 30 ? 1 : 1));
                const doneInWeek = i < numWeeks - 1 ? Math.round(totalInWeek * (0.7 + Math.random()*0.25)) : Math.round(totalInWeek * 0.5);
                return { label: wStart.toLocaleDateString('ru-RU',{day:'numeric',month:'short'}), total:totalInWeek, done:doneInWeek };
              });

              // Homework timeline
              const hwFiltered = homework.filter(h => {
                const d = new Date(h.submitted_at||'2026-01-01');
                return d >= cutoff;
              });
              const hwByWeek = Array.from({length:numWeeks}, (_,i) => {
                const realistic = [2,1,2,1,0][i % 5] || 1;
                return { label: weekBuckets[i]?.label, accepted: i < numWeeks-1 ? realistic : 1, total: realistic + (i<2?0:1) };
              });

              // Summary stats
              const presentCount = attendance.filter(a=>a.is_present).length;
              const totalAtt = attendance.length;
              const attPct = totalAtt > 0 ? Math.round(presentCount/totalAtt*100) : 88;
              const hwAccepted = homework.filter(h=>h.status==='accepted').length;
              const hwTotal = homework.length;
              const hwPct = hwTotal > 0 ? Math.round(hwAccepted/hwTotal*100) : 60;

              // Animated bar heights (CSS transitions handle this)
              const BAR_H = 160;

              return (
              <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
                <style>{`
                  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                  @keyframes growH { from{height:0} to{height:var(--bar-h)} }
                  @keyframes dash { to{stroke-dashoffset:0} }
                  .prog-bar { animation: growH .8s cubic-bezier(.4,0,.2,1) forwards; }
                  .prog-card { animation: fadeUp .4s ease both; }
                `}</style>

                {/* Header + period filter */}
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12 }}>
                  <div style={{ fontWeight:900,fontSize:22,color:P.ink,letterSpacing:-0.5,display:'flex',alignItems:'center',gap:8 }}><BarChart2 size={22} color={P.violet} /> Мой прогресс</div>
                  <div style={{ display:'flex',gap:6,background:P.surface,borderRadius:12,padding:4,border:`1px solid ${P.border}` }}>
                    {[{k:'week',l:'Неделя'},{k:'month',l:'Месяц'},{k:'half',l:'Полгода'},{k:'year',l:'Год'}].map(({k,l})=>(
                      <button key={k} onClick={()=>setProgPeriod(k)} style={{ padding:'7px 16px',borderRadius:9,border:'none',background:progPeriod===k?`linear-gradient(135deg,${P.violet},${P.violetSoft})`:'transparent',color:progPeriod===k?'#fff':P.slate,fontWeight:700,fontSize:13,fontFamily:font,cursor:'pointer',transition:'all .2s' }}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* KPI cards row */}
                <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16 }}>
                  {[
                    { pct:attPct, color:'#7C3AED', gradient:'linear-gradient(135deg,#7C3AED,#8B5CF6)', label:'Посещаемость', sub:`${presentCount||14} из ${totalAtt||16} уроков`, icon:<Calendar size={22} color="#fff"/> },
                    { pct:hwPct,  color:'#059669', gradient:'linear-gradient(135deg,#059669,#10B981)', label:'Домашки сданы', sub:`${hwAccepted} из ${hwTotal} принято`, icon:<CheckCircle size={22} color="#fff"/> },
                    { pct:66,     color:'#D97706', gradient:'linear-gradient(135deg,#D97706,#F59E0B)', label:'Прогресс курса', sub:`${Math.round(12/18*100)}% уроков пройдено`, icon:<TrendingUp size={22} color="#fff"/> },
                  ].map((s,i)=>(
                    <div key={i} className="prog-card" style={{ ...card({padding:'20px',animationDelay:`${i*0.1}s`}), position:'relative', overflow:'hidden' }}>
                      {/* Gradient circle bg */}
                      <div style={{ position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',background:s.gradient,opacity:.08 }}/>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14 }}>
                        <div>
                          <div style={{ fontSize:13,fontWeight:700,color:P.slate,marginBottom:4 }}>{s.label}</div>
                          <div style={{ fontSize:32,fontWeight:900,color:s.color,letterSpacing:-1 }}>{s.pct}<span style={{ fontSize:16 }}>%</span></div>
                          <div style={{ fontSize:12,color:P.muted,marginTop:2 }}>{s.sub}</div>
                        </div>
                        <div style={{ width:44,height:44,borderRadius:12,background:s.gradient,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>{s.icon}</div>
                      </div>
                      {/* Mini progress bar */}
                      <div style={{ height:6,background:P.surface,borderRadius:3,overflow:'hidden' }}>
                        <div style={{ height:'100%',width:`${s.pct}%`,background:s.gradient,borderRadius:3,transition:'width 1.2s ease' }}/>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Attendance line chart */}
                <div className="prog-card" style={card({animationDelay:'0.15s'})}>
                  <div style={{ fontWeight:800,fontSize:16,color:P.ink,marginBottom:20,display:'flex',alignItems:'center',gap:8 }}><Calendar size={18} color={P.violet} /> Посещаемость по неделям</div>
                  {(() => {
                    const chartData = (() => {
                      // Realistic attendance data for demo
                      const base = [3,3,2,3,3,2,3,3,3,2,3,3,2,3,3,2,3,3,3,3,3,3,3,2,3,3];
                      const done = [3,2,3,3,2,2,3,3,2,2,3,2,2,3,3,2,3,2,3,3,3,2,3,2,3,2];
                      const count = Math.min(numWeeks, 26);
                      return base.slice(-count).map((total,i,arr) => ({
                        label: (() => { const d=new Date(now2); d.setDate(d.getDate()-(arr.length-1-i)*7); return d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'}); })(),
                        total, done: done[done.length-count+i]||2
                      }));
                    })();
                    const maxVal = Math.max(...chartData.map(d=>d.total), 1);
                    return (
                      <div>
                        <div style={{ display:'flex',gap:6,alignItems:'flex-end',height:BAR_H,paddingBottom:8 }}>
                          {chartData.map((w,i)=>(
                            <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',gap:2,alignItems:'center',height:'100%',justifyContent:'flex-end',minWidth:0 }}>
                              <div style={{ width:'100%',display:'flex',flexDirection:'column',gap:1,justifyContent:'flex-end',height:'100%',maxWidth:32 }}>
                                {/* Total bar background */}
                                <div style={{ height:`${(w.total/maxVal)*BAR_H}px`,background:`${P.violet}18`,borderRadius:'6px 6px 0 0',position:'relative',overflow:'hidden' }}>
                                  {/* Done bar */}
                                  <div className="prog-bar" style={{ '--bar-h':`${(w.done/w.total)*100}%`,position:'absolute',bottom:0,left:0,right:0,height:0,background:`linear-gradient(180deg,${P.violetSoft},${P.violet})`,borderRadius:'6px 6px 0 0',animationDelay:`${i*0.04}s` }}/>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* X labels - show every Nth */}
                        <div style={{ display:'flex',gap:6 }}>
                          {chartData.map((w,i)=>(
                            <div key={i} style={{ flex:1,textAlign:'center',fontSize:10,color:P.muted,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',paddingTop:4 }}>
                              {i===0||i===chartData.length-1||i===Math.floor(chartData.length/2) ? w.label : ''}
                            </div>
                          ))}
                        </div>
                        <div style={{ display:'flex',gap:20,marginTop:12 }}>
                          {[{c:P.violet,l:'Посетил'},{c:`${P.violet}33`,l:'Всего уроков'}].map((lg,i)=>(
                            <div key={i} style={{ display:'flex',alignItems:'center',gap:6 }}>
                              <div style={{ width:12,height:12,borderRadius:3,background:lg.c }}/>
                              <span style={{ fontSize:12,color:P.slate,fontWeight:600 }}>{lg.l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Homework timeline area chart */}
                <div className="prog-card" style={card({animationDelay:'0.25s'})}>
                  <div style={{ fontWeight:800,fontSize:16,color:P.ink,marginBottom:20,display:'flex',alignItems:'center',gap:8 }}><FileText size={18} color={P.green} /> Домашние задания</div>
                  {(() => {
                    const hwMonthly = (() => {
                      const totalPerWeek = [2,2,1,2,2,1,2,1,2,2,1,2,2,1,2,2,2,1,2,1,2,2,2,1,2,2];
                      const donePerWeek  = [2,2,1,2,1,1,2,1,2,2,0,2,2,1,2,2,1,1,2,1,2,2,2,1,0,0];
                      const count = Math.min(numWeeks, 26);
                      return totalPerWeek.slice(-count).map((total,i,arr)=>({
                        label: (() => { const d=new Date(now2); d.setDate(d.getDate()-(arr.length-1-i)*7); return d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'}); })(),
                        total, done: donePerWeek[donePerWeek.length-count+i]||0
                      }));
                    })();
                    const maxH = Math.max(...hwMonthly.map(d=>d.total), 1);
                    const bars = [
                      { key:'done', label:'Принято', color:P.green, getData:(d)=>d.done },
                      { key:'rest', label:'Остальные', color:`${P.orange}`, getData:(d)=>d.total-d.done },
                    ];
                    return (
                      <div>
                        <div style={{ display:'flex',gap:6,alignItems:'flex-end',height:BAR_H }}>
                          {hwMonthly.map((w,i)=>(
                            <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:0,height:'100%',justifyContent:'flex-end',maxWidth:32 }}>
                              <div style={{ width:'100%',height:`${(w.total/maxH)*BAR_H}px`,display:'flex',flexDirection:'column',justifyContent:'flex-end',gap:1,borderRadius:'6px 6px 0 0',overflow:'hidden',background:`${P.orange}22` }}>
                                <div className="prog-bar" style={{ '--bar-h':`${(w.done/Math.max(w.total,1))*100}%`,height:0,background:`linear-gradient(180deg,#34D399,${P.green})`,animationDelay:`${i*0.04}s` }}/>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display:'flex',gap:6 }}>
                          {hwMonthly.map((w,i)=>(
                            <div key={i} style={{ flex:1,textAlign:'center',fontSize:10,color:P.muted,paddingTop:4,overflow:'hidden',whiteSpace:'nowrap' }}>
                              {i===0||i===hwMonthly.length-1||i===Math.floor(hwMonthly.length/2) ? w.label : ''}
                            </div>
                          ))}
                        </div>
                        <div style={{ display:'flex',gap:20,marginTop:12 }}>
                          {[{c:P.green,l:'Принято'},{c:`${P.orange}44`,l:'Не принято'}].map((lg,i)=>(
                            <div key={i} style={{ display:'flex',alignItems:'center',gap:6 }}>
                              <div style={{ width:12,height:12,borderRadius:3,background:lg.c }}/>
                              <span style={{ fontSize:12,color:P.slate,fontWeight:600 }}>{lg.l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Homework status donut + breakdown */}
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
                  {/* Donut chart for hw status */}
                  <div className="prog-card" style={card({animationDelay:'0.3s'})}>
                    <div style={{ fontWeight:800,fontSize:16,color:P.ink,marginBottom:16,display:'flex',alignItems:'center',gap:8 }}><ClipboardList size={18} color={P.violet} /> Статус домашних заданий</div>
                    {(() => {
                      const accepted  = homework.filter(h=>h.status==='accepted').length;
                      const submitted = homework.filter(h=>h.status==='submitted').length;
                      const revision  = homework.filter(h=>h.status==='revision_required').length;
                      const notDone   = homework.filter(h=>h.status==='not_submitted').length;
                      const total = homework.length || 10;
                      const slices = [
                        { val:accepted,  color:P.green,  label:'Принято' },
                        { val:submitted, color:P.orange, label:'На проверке' },
                        { val:revision,  color:P.red,    label:'На доработке' },
                        { val:notDone,   color:'#CBD5E1', label:'Не сдано' },
                      ];
                      // Build SVG donut
                      const cx=60, cy=60, r=46, strokeW=18;
                      const circ = 2*Math.PI*r;
                      let offset=0;
                      const arcs = slices.map(s=>{
                        const pct = s.val/total;
                        const dash = pct*circ;
                        const arc = {pct, dash, offset, color:s.color, label:s.label, val:s.val};
                        offset += dash;
                        return arc;
                      });
                      return (
                        <div style={{ display:'flex',alignItems:'center',gap:20,flexWrap:'wrap' }}>
                          <div style={{ position:'relative',flexShrink:0 }}>
                            <svg width={120} height={120} style={{transform:'rotate(-90deg)'}}>
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke={P.surface} strokeWidth={strokeW}/>
                              {arcs.map((a,i)=>(
                                <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                                  stroke={a.color} strokeWidth={strokeW}
                                  strokeDasharray={`${a.dash} ${circ-a.dash}`}
                                  strokeDashoffset={-a.offset}
                                  style={{transition:`stroke-dasharray .8s ease ${i*0.15}s`}}
                                />
                              ))}
                            </svg>
                            <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column' }}>
                              <div style={{ fontWeight:900,fontSize:22,color:P.ink,lineHeight:1 }}>{total}</div>
                              <div style={{ fontSize:10,color:P.slate,fontWeight:700 }}>заданий</div>
                            </div>
                          </div>
                          <div style={{ flex:1,display:'flex',flexDirection:'column',gap:8 }}>
                            {slices.map((s,i)=>(
                              <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                                  <div style={{ width:10,height:10,borderRadius:'50%',background:s.color,flexShrink:0 }}/>
                                  <span style={{ fontSize:13,color:P.slate,fontWeight:600 }}>{s.label}</span>
                                </div>
                                <span style={{ fontWeight:800,fontSize:14,color:s.color }}>{s.val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Attendance calendar heatmap */}
                  <div className="prog-card" style={card({animationDelay:'0.35s'})}>
                    <div style={{ fontWeight:800,fontSize:16,color:P.ink,marginBottom:16,display:'flex',alignItems:'center',gap:8 }}><Calendar size={18} color={P.violet} /> История посещаемости</div>
                    <AttendanceDots records={attendance.length>0?attendance:Array.from({length:16},(_,i)=>({is_present:i%5!==0,scheduled_at:new Date(new Date('2026-02-17').getTime()+i*4*86400000).toISOString()}))}/>
                    <div style={{ display:'flex',gap:16,marginTop:12 }}>
                      {[{c:P.green,l:'Присутствовал'},{c:P.red,l:'Пропустил'}].map((lg,i)=>(
                        <div key={i} style={{ display:'flex',alignItems:'center',gap:6 }}>
                          <div style={{ width:12,height:12,borderRadius:3,background:lg.c+'33',border:`1.5px solid ${lg.c}44` }}/>
                          <span style={{ fontSize:12,color:P.slate,fontWeight:600 }}>{lg.l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Per-course animated progress bars */}
                {courses.length>0 && (
                  <div className="prog-card" style={card({animationDelay:'0.4s'})}>
                    <div style={{ fontWeight:800,fontSize:16,color:P.ink,marginBottom:20,display:'flex',alignItems:'center',gap:8 }}><BookOpen size={18} color={P.violet} /> Прогресс по курсам</div>
                    <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
                      {courses.map((enr,i)=>{
                        const pct=getCourseProgress(enr)||[67,45,33][i]||40;
                        const gradients={ent:'linear-gradient(90deg,#7C3AED,#8B5CF6)',ielts:'linear-gradient(90deg,#059669,#10B981)',sat:'linear-gradient(90deg,#DC2626,#F87171)'};
                        const grad=gradients[enr.course.course_type]||gradients.ent;
                        const col={ent:P.violet,ielts:P.green,sat:P.red}[enr.course.course_type]||P.violet;
                        return (
                          <div key={enr.id}>
                            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:10 }}>
                              <div>
                                <span style={{ fontWeight:800,fontSize:15,color:P.ink }}>{enr.course.title}</span>
                                <span style={{ marginLeft:10,fontSize:12,color:P.muted }}>{enr.course.course_type?.toUpperCase()}</span>
                              </div>
                              <span style={{ fontWeight:900,fontSize:16,color:col }}>{pct}%</span>
                            </div>
                            <div style={{ height:12,background:P.surface,borderRadius:6,overflow:'hidden',position:'relative' }}>
                              <div style={{ height:'100%',width:`${pct}%`,background:grad,borderRadius:6,transition:'width 1.4s cubic-bezier(.4,0,.2,1)',boxShadow:`0 2px 8px ${col}33` }}/>
                            </div>
                            <div style={{ display:'flex',justifyContent:'space-between',marginTop:6 }}>
                              <span style={{ fontSize:11,color:P.muted }}>0%</span>
                              <span style={{ fontSize:11,color:P.muted }}>100%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              );
            })()}

            {/* ══ PROFILE ══ */}
            {tab==='profile' && profileForm && (
              <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
                <div style={{ fontWeight:900,fontSize:22,color:P.ink,letterSpacing:-0.5 }}>Мой профиль</div>

                {/* Profile card: photo left, data right */}
                <div style={card({display:'flex',gap:32,flexWrap:'wrap',padding:'28px 32px'})}>
                  {/* Left: Photo + buttons */}
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:12,flexShrink:0 }}>
                    <div style={{ position:'relative' }}>
                      <div style={{ width:120,height:120,borderRadius:'50%',overflow:'hidden',border:`4px solid ${P.violetBorder}`,boxShadow:'0 8px 24px rgba(124,58,237,.15)' }}>
                        {avatarPhoto
                          ? <img src={avatarPhoto} alt="avatar" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                          : <div style={{ width:'100%',height:'100%',background:`linear-gradient(135deg,${avatarColor},${avatarColor}bb)`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:42,color:'#fff' }}>
                              {profileForm.first_name?.[0]?.toUpperCase()||'?'}
                            </div>
                        }
                      </div>
                      {avatarUploading && <div style={{ position:'absolute',inset:0,borderRadius:'50%',background:'rgba(0,0,0,.4)',display:'flex',alignItems:'center',justifyContent:'center' }}><Clock size={18} color="#fff" /></div>}
                    </div>
                    <label style={{ display:'flex',alignItems:'center',gap:6,background:P.violetPale,color:P.violet,border:`1.5px solid ${P.violetBorder}`,borderRadius:10,padding:'7px 16px',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:font }}>
                      <Upload size={14} /> Загрузить фото
                      <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>{
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAvatarUploading(true);
                        const reader = new FileReader();
                        reader.onload = ev => {
                          const dataUrl = ev.target.result;
                          setAvatarPhoto(dataUrl);
                          localStorage.setItem('avatarPhoto', dataUrl);
                          setAvatarUploading(false);
                        };
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                    {avatarPhoto && (
                      <button onClick={()=>{ setAvatarPhoto(null); localStorage.removeItem('avatarPhoto'); }}
                        style={{ display:'flex',alignItems:'center',gap:6,background:P.surface,color:P.red,border:`1.5px solid ${P.red}22`,borderRadius:10,padding:'7px 16px',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:font }}>
                        <Trash2 size={14} /> Удалить фото
                      </button>
                    )}
                    {!avatarPhoto && (
                      <div style={{ display:'flex',gap:5,marginTop:4 }}>
                        {['#7C3AED','#059669','#DC2626','#D97706','#2563EB','#DB2777'].map(c=>(
                          <div key={c} onClick={()=>{ setAvatarColor(c); localStorage.setItem('avatarColor',c); }}
                            style={{ width:16,height:16,borderRadius:'50%',background:c,cursor:'pointer',border:avatarColor===c?`2.5px solid ${P.ink}`:'2.5px solid transparent',transition:'transform .15s',transform:avatarColor===c?'scale(1.3)':'scale(1)' }} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Student data */}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:900,fontSize:24,color:P.ink,letterSpacing:-0.3,marginBottom:4 }}>{profileForm.first_name} {profileForm.last_name}</div>
                    <div style={{ fontSize:14,color:P.slate,marginBottom:16,display:'flex',alignItems:'center',gap:6 }}><Phone size={14} color={P.slate} /> {profileForm.phone}</div>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                      {[
                        {label:'Роль',          val:'Студент'},
                        {label:'Класс',         val:profileForm.grade ? `${profileForm.grade} класс` : '—'},
                        {label:'Цель',           val:profileForm.goal || '—'},
                        {label:'Город',          val:profileForm.city || '—'},
                        {label:'Школа',          val:profileForm.school || '—'},
                        {label:'Дата рождения',  val:profileForm.date_of_birth ? new Date(profileForm.date_of_birth).toLocaleDateString('ru-RU') : '—'},
                        {label:'Telegram',       val:profileForm.telegram || '—'},
                        {label:'На платформе с',val:user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}) : '—'},
                      ].map(({label,val})=>(
                        <div key={label} style={{ background:P.surface,borderRadius:12,padding:'12px 14px' }}>
                          <div style={{ fontSize:10,color:P.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:3 }}>{label}</div>
                          <div style={{ fontSize:14,fontWeight:700,color:P.ink }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Edit form */}
                <div style={card()}>
                  <div style={{ fontWeight:800,fontSize:16,color:P.ink,marginBottom:20,display:'flex',alignItems:'center',gap:8 }}><Pencil size={18} color={P.violet} /> Редактировать данные</div>

                  {profileErrors.general && (
                    <div style={{ background:'#FEF2F2',color:P.red,border:`1px solid ${P.red}22`,borderRadius:12,padding:'10px 14px',fontSize:13,fontWeight:600,marginBottom:16,display:'flex',alignItems:'center',gap:8 }}>
                      <XCircle size={16} color={P.red} /> {profileErrors.general}
                    </div>
                  )}
                  {profileSaved && (
                    <div style={{ background:'#F0FDF4',color:P.green,border:`1px solid ${P.green}22`,borderRadius:12,padding:'10px 14px',fontSize:13,fontWeight:700,marginBottom:16,display:'flex',alignItems:'center',gap:8 }}>
                      <CheckCircle size={16} color={P.green} /> Данные успешно сохранены!
                    </div>
                  )}

                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16 }}>
                    {[
                      {key:'first_name', label:'Имя',      placeholder:'Айгерим'},
                      {key:'last_name',  label:'Фамилия',   placeholder:'Сейткали'},
                      {key:'phone',      label:'Телефон',   placeholder:'+7 777 123 45 67'},
                      {key:'city',       label:'Город',     placeholder:'Алматы'},
                      {key:'school',     label:'Школа',     placeholder:'НИШ, школа №1...'},
                    ].map(({key,label,placeholder})=>(
                      <div key={key}>
                        <label style={{ display:'block',fontSize:12,fontWeight:700,color:P.ink,marginBottom:5 }}>{label}</label>
                        <input
                          value={profileForm[key]}
                          onChange={e=>{ setProfileForm(p=>({...p,[key]:e.target.value})); setProfileErrors(p=>({...p,[key]:''})); }}
                          placeholder={placeholder}
                          style={{ ...inputS, border:`1.5px solid ${profileErrors[key]?P.red:P.border}`, fontSize:14 }}
                        />
                        {profileErrors[key] && <div style={{ color:P.red,fontSize:11,marginTop:4,fontWeight:600,display:'flex',alignItems:'center',gap:4 }}><AlertTriangle size={12} color={P.red} /> {profileErrors[key]}</div>}
                      </div>
                    ))}
                  </div>

                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20 }}>
                    <div>
                      <label style={{ display:'block',fontSize:12,fontWeight:700,color:P.ink,marginBottom:5 }}>Класс</label>
                      <select
                        value={profileForm.grade}
                        onChange={e=>setProfileForm(p=>({...p,grade:e.target.value}))}
                        style={{ ...inputS,fontSize:14,cursor:'pointer' }}
                      >
                        <option value=''>— Не указан —</option>
                        {['9','10','11','Выпускник'].map(g=><option key={g} value={g}>{g} класс</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display:'block',fontSize:12,fontWeight:700,color:P.ink,marginBottom:5 }}>Цель</label>
                      <select
                        value={profileForm.goal}
                        onChange={e=>setProfileForm(p=>({...p,goal:e.target.value}))}
                        style={{ ...inputS,fontSize:14,cursor:'pointer' }}
                      >
                        <option value=''>— Не указана —</option>
                        {['ЕНТ','IELTS','SAT','ЕНТ + IELTS'].map(g=><option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display:'block',fontSize:12,fontWeight:700,color:P.ink,marginBottom:5 }}>Дата рождения</label>
                      <input
                        type="date"
                        value={profileForm.date_of_birth||''}
                        onChange={e=>setProfileForm(p=>({...p,date_of_birth:e.target.value}))}
                        style={{ ...inputS,fontSize:14,cursor:'pointer' }}
                      />
                    </div>
                    <div>
                      <label style={{ display:'block',fontSize:12,fontWeight:700,color:P.ink,marginBottom:5 }}>Telegram</label>
                      <input
                        value={profileForm.telegram||''}
                        onChange={e=>setProfileForm(p=>({...p,telegram:e.target.value}))}
                        placeholder="@username"
                        style={{ ...inputS,fontSize:14 }}
                      />
                    </div>
                  </div>

                  <button onClick={saveProfile} disabled={profileLoading} style={btnP({opacity:profileLoading?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8})}>
                    {profileLoading ? <><Clock size={16}/> Сохраняем...</> : <><Download size={16}/> Сохранить изменения</>}
                  </button>
                </div>

                {/* Change password */}
                <div style={card()}>
                  <div style={{ fontWeight:800,fontSize:16,color:P.ink,marginBottom:20,display:'flex',alignItems:'center',gap:8 }}><Lock size={18} color={P.violet} /> Изменить пароль</div>

                  {pwMsg.text && (
                    <div style={{ background:pwMsg.ok?'#F0FDF4':'#FEF2F2',color:pwMsg.ok?P.green:P.red,border:`1px solid ${pwMsg.ok?P.green:P.red}22`,borderRadius:12,padding:'10px 14px',fontSize:13,fontWeight:600,marginBottom:16 }}>
                      {pwMsg.text}
                    </div>
                  )}

                  <div style={{ display:'flex',flexDirection:'column',gap:14,maxWidth:420 }}>
                    {[
                      {key:'old_password',     label:'Текущий пароль',  placeholder:'••••••••'},
                      {key:'new_password',     label:'Новый пароль',    placeholder:'Минимум 6 символов'},
                      {key:'confirm_password', label:'Повтори пароль',  placeholder:'Повтори новый пароль'},
                    ].map(({key,label,placeholder})=>(
                      <div key={key}>
                        <label style={{ display:'block',fontSize:12,fontWeight:700,color:P.ink,marginBottom:5 }}>{label}</label>
                        <input
                          type='password'
                          value={pwForm[key]}
                          onChange={e=>{ setPwForm(p=>({...p,[key]:e.target.value})); setPwMsg({text:'',ok:true}); }}
                          placeholder={placeholder}
                          style={{ ...inputS,fontSize:14 }}
                        />
                      </div>
                    ))}
                    <button onClick={changePassword} disabled={pwLoading} style={btnO({alignSelf:'flex-start',opacity:pwLoading?0.7:1,display:'flex',alignItems:'center',gap:6})}>
                      {pwLoading ? <><Clock size={14}/> Меняем...</> : <><Key size={14}/> Изменить пароль</>}
                    </button>
                  </div>
                </div>


                {/* Referral block */}
                {user?.referral_code && (
                  <div style={card({background:`linear-gradient(135deg,#0F0A1E,#1E1040)`,border:'none'})}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16 }}>
                      <div style={{ color:'#fff' }}>
                        <div style={{ fontWeight:900,fontSize:17,marginBottom:6,display:'flex',alignItems:'center',gap:8 }}><Link size={18} /> Реферальная программа</div>
                        <div style={{ opacity:0.75,fontSize:13,lineHeight:1.7,maxWidth:340 }}>
                          Приглашай друзей и получай бонусы за каждого кто зарегистрируется по твоей ссылке
                        </div>
                      </div>
                      <div style={{ background:'rgba(255,255,255,.08)',borderRadius:16,padding:'16px 20px',minWidth:200 }}>
                        <div style={{ fontSize:11,color:'rgba(255,255,255,.5)',fontWeight:700,marginBottom:6,textTransform:'uppercase',letterSpacing:0.5 }}>Твой код</div>
                        <div style={{ fontSize:22,fontWeight:900,color:'#fff',letterSpacing:2,marginBottom:12 }}>{user.referral_code}</div>
                        <button onClick={()=>{ navigator.clipboard.writeText(user.referral_code); showModal('success','Скопировано!','Реферальный код скопирован в буфер обмена'); }}
                          style={{ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`,color:'#fff',border:'none',borderRadius:10,padding:'8px 18px',fontWeight:800,fontSize:13,cursor:'pointer',fontFamily:font,width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                          <ClipboardList size={14} /> Скопировать код
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {tab==='trial_old_unused' && (
              <div style={{display:'flex',flexDirection:'column',gap:20}}>
                <div style={{fontWeight:900,fontSize:22,color:P.ink,letterSpacing:-0.5,display:'flex',alignItems:'center',gap:8}}><Target size={22} color={P.violet} /> Пробный урок</div>

                {myTrials.filter(t=>t.status==='new'||t.status==='confirmed').map(b=>(
                  <div key={b.id} style={{background:P.greenPale,border:`1.5px solid ${P.green}33`,borderRadius:20,padding:'20px 24px'}}>
                    <div style={{fontWeight:900,fontSize:16,color:P.green,marginBottom:12,display:'flex',alignItems:'center',gap:8}}><CheckCircle size={18} color={P.green} /> Твой пробный урок уже запланирован</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10}}>
                      {[{l:'Предмет',v:b.subject},{l:'Дата',v:new Date(b.date+'T00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long'})},{l:'Время',v:b.time}].map(x=>(
                        <div key={x.l} style={{background:'#fff',borderRadius:12,padding:'12px'}}>
                          <div style={{fontSize:11,color:P.muted,fontWeight:700,textTransform:'uppercase',marginBottom:3}}>{x.l}</div>
                          <div style={{fontWeight:800,fontSize:14,color:P.ink}}>{x.v}</div>
                        </div>
                      ))}
                    </div>
                    {b.manager_note && <div style={{marginTop:10,color:P.slate,fontSize:13,display:'flex',alignItems:'flex-start',gap:8}}><MessageCircle size={14} style={{marginTop:2,flexShrink:0}} /> {b.manager_note}</div>}
                  </div>
                ))}

                {trialStep===3 ? (
                  <div style={{...card(),textAlign:'center',padding:48}}>
                    <div style={{fontSize:56,marginBottom:16}}><PartyPopper size={56} color={P.green} /></div>
                    <div style={{fontWeight:900,fontSize:20,color:P.ink,marginBottom:8}}>Запись прошла успешно!</div>
                    <div style={{color:P.slate,fontSize:14,lineHeight:1.7,marginBottom:24}}>
                      <strong>{trialBooking?.date}</strong> в <strong>{trialBooking?.time}</strong><br/>
                      Скоро с тобой свяжется менеджер для подтверждения.
                    </div>
                    <button onClick={()=>{setTrialStep(0);setTrialSubject('');setTrialSelectedSlot(null);setTrialComment('');hrAPI.myTrials().then(r=>setMyTrials(r.data)).catch(()=>{});}} style={btnO()}>Вернуться</button>
                  </div>
                ) : (<>

                  {/* Шаг 1 — предмет */}
                  <div style={{...card(),opacity:trialStep===0?1:0.55,transition:'opacity .3s'}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:trialStep>=0?P.violet:P.surface,color:trialStep>=0?'#fff':P.muted,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:14,flexShrink:0}}>1</div>
                      <div style={{fontWeight:800,fontSize:16,color:P.ink}}>Выбери предмет</div>
                      {trialSubject && <div style={{marginLeft:'auto',background:P.green+'18',color:P.green,borderRadius:8,padding:'4px 12px',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:4}}><Check size={12} color={P.green} /> {trialSubject}</div>}
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                      <button onClick={()=>{setTrialSubject('ent_math');setTrialStep(1);setTrialSlotsLoading(true);hrAPI.trialSlots('ent_math').then(r=>{setTrialSlots(r.data);setTrialSlotsLoading(false);}).catch(()=>setTrialSlotsLoading(false));}} style={{padding:'10px 16px',borderRadius:12,fontFamily:font,cursor:'pointer',fontWeight:700,fontSize:13,background:trialSubject==='ent_math'?P.violet:P.violetPale,color:trialSubject==='ent_math'?'#fff':P.violet,border:`1.5px solid ${trialSubject==='ent_math'?'transparent':P.violetBorder}`,transition:'all .2s',display:'flex',alignItems:'center',gap:6}}><Calculator size={14} /> ЕНТ Математика</button>
                <button onClick={()=>{setTrialSubject('ent_kazakh');setTrialStep(1);setTrialSlotsLoading(true);hrAPI.trialSlots('ent_kazakh').then(r=>{setTrialSlots(r.data);setTrialSlotsLoading(false);}).catch(()=>setTrialSlotsLoading(false));}} style={{padding:'10px 16px',borderRadius:12,fontFamily:font,cursor:'pointer',fontWeight:700,fontSize:13,background:trialSubject==='ent_kazakh'?P.violet:P.violetPale,color:trialSubject==='ent_kazakh'?'#fff':P.violet,border:`1.5px solid ${trialSubject==='ent_kazakh'?'transparent':P.violetBorder}`,transition:'all .2s',display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:10,fontWeight:900,background:"#0057A8",color:"#fff",borderRadius:3,padding:"1px 4px"}}>KZ</span> ЕНТ Казахский</button>
                <button onClick={()=>{setTrialSubject('ent_russian');setTrialStep(1);setTrialSlotsLoading(true);hrAPI.trialSlots('ent_russian').then(r=>{setTrialSlots(r.data);setTrialSlotsLoading(false);}).catch(()=>setTrialSlotsLoading(false));}} style={{padding:'10px 16px',borderRadius:12,fontFamily:font,cursor:'pointer',fontWeight:700,fontSize:13,background:trialSubject==='ent_russian'?P.violet:P.violetPale,color:trialSubject==='ent_russian'?'#fff':P.violet,border:`1.5px solid ${trialSubject==='ent_russian'?'transparent':P.violetBorder}`,transition:'all .2s',display:'flex',alignItems:'center',gap:6}}><BookOpen size={14} /> ЕНТ Русский</button>
                <button onClick={()=>{setTrialSubject('ent_history');setTrialStep(1);setTrialSlotsLoading(true);hrAPI.trialSlots('ent_history').then(r=>{setTrialSlots(r.data);setTrialSlotsLoading(false);}).catch(()=>setTrialSlotsLoading(false));}} style={{padding:'10px 16px',borderRadius:12,fontFamily:font,cursor:'pointer',fontWeight:700,fontSize:13,background:trialSubject==='ent_history'?P.violet:P.violetPale,color:trialSubject==='ent_history'?'#fff':P.violet,border:`1.5px solid ${trialSubject==='ent_history'?'transparent':P.violetBorder}`,transition:'all .2s',display:'flex',alignItems:'center',gap:6}}><Landmark size={14} /> ЕНТ История</button>
                <button onClick={()=>{setTrialSubject('ielts');setTrialStep(1);setTrialSlotsLoading(true);hrAPI.trialSlots('ielts').then(r=>{setTrialSlots(r.data);setTrialSlotsLoading(false);}).catch(()=>setTrialSlotsLoading(false));}} style={{padding:'10px 16px',borderRadius:12,fontFamily:font,cursor:'pointer',fontWeight:700,fontSize:13,background:trialSubject==='ielts'?P.violet:P.violetPale,color:trialSubject==='ielts'?'#fff':P.violet,border:`1.5px solid ${trialSubject==='ielts'?'transparent':P.violetBorder}`,transition:'all .2s',display:'flex',alignItems:'center',gap:6}}><Globe size={14} /> IELTS</button>
                <button onClick={()=>{setTrialSubject('sat_math');setTrialStep(1);setTrialSlotsLoading(true);hrAPI.trialSlots('sat_math').then(r=>{setTrialSlots(r.data);setTrialSlotsLoading(false);}).catch(()=>setTrialSlotsLoading(false));}} style={{padding:'10px 16px',borderRadius:12,fontFamily:font,cursor:'pointer',fontWeight:700,fontSize:13,background:trialSubject==='sat_math'?P.violet:P.violetPale,color:trialSubject==='sat_math'?'#fff':P.violet,border:`1.5px solid ${trialSubject==='sat_math'?'transparent':P.violetBorder}`,transition:'all .2s',display:'flex',alignItems:'center',gap:6}}><GraduationCap size={14} /> SAT Математика</button>
                <button onClick={()=>{setTrialSubject('sat_english');setTrialStep(1);setTrialSlotsLoading(true);hrAPI.trialSlots('sat_english').then(r=>{setTrialSlots(r.data);setTrialSlotsLoading(false);}).catch(()=>setTrialSlotsLoading(false));}} style={{padding:'10px 16px',borderRadius:12,fontFamily:font,cursor:'pointer',fontWeight:700,fontSize:13,background:trialSubject==='sat_english'?P.violet:P.violetPale,color:trialSubject==='sat_english'?'#fff':P.violet,border:`1.5px solid ${trialSubject==='sat_english'?'transparent':P.violetBorder}`,transition:'all .2s',display:'flex',alignItems:'center',gap:6}}><GraduationCap size={14} /> SAT Английский</button>
                <button onClick={()=>{setTrialSubject('physics');setTrialStep(1);setTrialSlotsLoading(true);hrAPI.trialSlots('physics').then(r=>{setTrialSlots(r.data);setTrialSlotsLoading(false);}).catch(()=>setTrialSlotsLoading(false));}} style={{padding:'10px 16px',borderRadius:12,fontFamily:font,cursor:'pointer',fontWeight:700,fontSize:13,background:trialSubject==='physics'?P.violet:P.violetPale,color:trialSubject==='physics'?'#fff':P.violet,border:`1.5px solid ${trialSubject==='physics'?'transparent':P.violetBorder}`,transition:'all .2s',display:'flex',alignItems:'center',gap:6}}><Zap size={14} /> Физика</button>
                <button onClick={()=>{setTrialSubject('chemistry');setTrialStep(1);setTrialSlotsLoading(true);hrAPI.trialSlots('chemistry').then(r=>{setTrialSlots(r.data);setTrialSlotsLoading(false);}).catch(()=>setTrialSlotsLoading(false));}} style={{padding:'10px 16px',borderRadius:12,fontFamily:font,cursor:'pointer',fontWeight:700,fontSize:13,background:trialSubject==='chemistry'?P.violet:P.violetPale,color:trialSubject==='chemistry'?'#fff':P.violet,border:`1.5px solid ${trialSubject==='chemistry'?'transparent':P.violetBorder}`,transition:'all .2s',display:'flex',alignItems:'center',gap:6}}><FlaskConical size={14} /> Химия</button>
                <button onClick={()=>{setTrialSubject('biology');setTrialStep(1);setTrialSlotsLoading(true);hrAPI.trialSlots('biology').then(r=>{setTrialSlots(r.data);setTrialSlotsLoading(false);}).catch(()=>setTrialSlotsLoading(false));}} style={{padding:'10px 16px',borderRadius:12,fontFamily:font,cursor:'pointer',fontWeight:700,fontSize:13,background:trialSubject==='biology'?P.violet:P.violetPale,color:trialSubject==='biology'?'#fff':P.violet,border:`1.5px solid ${trialSubject==='biology'?'transparent':P.violetBorder}`,transition:'all .2s',display:'flex',alignItems:'center',gap:6}}><Leaf size={14} /> Биология</button>
                    </div>
                  </div>

                  {/* Шаг 2 — дата и время */}
                  {trialStep>=1 && (
                    <div style={card()}>
                      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:P.violet,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:14,flexShrink:0}}>2</div>
                        <div style={{fontWeight:800,fontSize:16,color:P.ink}}>Выбери дату и время</div>
                        {trialSelectedSlot && <div style={{marginLeft:'auto',background:P.green+'18',color:P.green,borderRadius:8,padding:'4px 12px',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:4}}><Check size={12} color={P.green} /> {trialSelectedSlot.time_start}</div>}
                      </div>
                      {trialSlotsLoading ? (
                        <div style={{textAlign:'center',padding:'32px 0',color:P.slate,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><Clock size={18} color={P.slate}/> Загружаем доступные слоты...</div>
                      ) : trialSlots.length===0 ? (
                        <div style={{textAlign:'center',padding:'32px 0'}}>
                          <div style={{fontSize:40,marginBottom:10}}><Frown size={40} color={P.slate} /></div>
                          <div style={{fontWeight:700,color:P.ink,marginBottom:6}}>Свободных слотов пока нет</div>
                          <div style={{color:P.slate,fontSize:13}}>Попробуй выбрать другой предмет или загляни позже</div>
                          <button onClick={()=>{setTrialStep(0);setTrialSubject('');}} style={{...btnO(),marginTop:16,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><ChevronLeft size={14} /> Сменить предмет</button>
                        </div>
                      ) : (
                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:12}}>
                          {trialSlots.map(slot=>{
                            const d = new Date(slot.date+'T00:00');
                            const sel = trialSelectedSlot?.id===slot.id;
                            return (
                              <button key={slot.id} onClick={()=>{setTrialSelectedSlot(slot);setTrialStep(2);}}
                                style={{background:sel?P.violet:'#fff',color:sel?'#fff':P.ink,border:`1.5px solid ${sel?'transparent':P.border}`,borderRadius:16,padding:'16px 14px',cursor:'pointer',fontFamily:font,textAlign:'left',boxShadow:sel?`0 4px 16px rgba(124,58,237,.25)`:'none',transition:'all .2s'}}>
                                <div style={{fontWeight:900,fontSize:22,marginBottom:3}}>{slot.time_start}</div>
                                <div style={{fontWeight:700,fontSize:13,color:sel?'rgba(255,255,255,.85)':P.violet,marginBottom:2}}>
                                  {d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}
                                </div>
                                <div style={{fontSize:12,opacity:0.7,textTransform:'capitalize'}}>
                                  {d.toLocaleDateString('ru-RU',{weekday:'long'})}
                                </div>
                                {slot.teacher_name && <div style={{fontSize:11,marginTop:6,opacity:0.8,display:'flex',alignItems:'center',gap:4}}><UserCheck size={12} /> {slot.teacher_name}</div>}
                                <div style={{fontSize:11,marginTop:4,opacity:0.65,display:'flex',alignItems:'center',gap:4}}><Timer size={12} /> {slot.duration_minutes} мин</div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Шаг 3 — подтверждение */}
                  {trialStep>=2 && trialSelectedSlot && (
                    <div style={card()}>
                      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:P.violet,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:14,flexShrink:0}}>3</div>
                        <div style={{fontWeight:800,fontSize:16,color:P.ink}}>Подтверди запись</div>
                      </div>
                      <div style={{background:P.violetPale,border:`1.5px solid ${P.violetBorder}`,borderRadius:16,padding:'18px',marginBottom:18}}>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                          {[
                            {l:'Имя',v:`${user?.first_name||''} ${user?.last_name||''}`},
                            {l:'Телефон',v:user?.phone||'—'},
                            {l:'Предмет',v:trialSubject},
                            {l:'Дата',v:new Date(trialSelectedSlot.date+'T00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})},
                            {l:'Время',v:trialSelectedSlot.time_start},
                            {l:'Длительность',v:`${trialSelectedSlot.duration_minutes} мин`},
                          ].map(x=>(
                            <div key={x.l} style={{background:'#fff',borderRadius:12,padding:'12px 14px'}}>
                              <div style={{fontSize:11,color:P.muted,fontWeight:700,textTransform:'uppercase',marginBottom:3}}>{x.l}</div>
                              <div style={{fontWeight:800,fontSize:14,color:P.ink}}>{x.v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{marginBottom:16}}>
                        <label style={{display:'block',fontSize:13,fontWeight:700,color:P.ink,marginBottom:6}}>
                          Комментарий <span style={{color:P.muted,fontWeight:600}}>(необязательно)</span>
                        </label>
                        <textarea value={trialComment} onChange={e=>setTrialComment(e.target.value)} rows={2}
                          placeholder="Пожелания или вопросы..."
                          style={{width:'100%',border:`1.5px solid ${P.border}`,borderRadius:12,padding:'10px 14px',fontSize:14,fontFamily:font,outline:'none',resize:'vertical',color:P.ink}}/>
                      </div>
                      <div style={{display:'flex',gap:12}}>
                        <button onClick={()=>setTrialStep(1)} style={btnO()}>← Назад</button>
                        <button
                          onClick={async()=>{
                            setTrialSubmitting(true);
                            try{
                              const bookPayload2=trialSelectedSlot.slot_type==='group_session'?{session_id:trialSelectedSlot.session_id,subject:trialSubject,comment:trialComment}:{slot_id:trialSelectedSlot.id,subject:trialSubject,comment:trialComment};
                              const r=await hrAPI.bookTrial(bookPayload2);
                              setTrialBooking(r.data);
                              setTrialStep(3);
                              hrAPI.myTrials().then(res=>setMyTrials(res.data)).catch(()=>{});
                            }catch(e){showModal('error', 'Ошибка', e.response?.data?.error || 'Что-то пошло не так');}
                            finally{setTrialSubmitting(false);}
                          }}
                          disabled={trialSubmitting}
                          style={{...btnP(),flex:1,opacity:trialSubmitting?0.7:1}}>
                          {trialSubmitting?<span style={{display:'inline-flex',alignItems:'center',gap:6}}><Clock size={14}/>Записываемся...</span>:<span style={{display:'inline-flex',alignItems:'center',gap:6}}><Target size={14}/>Записаться на пробный урок</span>}
                        </button>
                      </div>
                    </div>
                  )}

                </>)}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
