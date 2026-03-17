import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI, homeworkAPI, coursesAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import WeekCalendar from '../components/WeekCalendar';
import { Users, Calendar, FileText, CheckCircle, BarChart2, Paperclip, MessageCircle, User, LogOut, Hand, Loader, Plus, Eye, X, RotateCw, Gift, Clock, AlertTriangle, Download, Upload, Link, Home, ArrowLeft, BookOpen, Pencil, Banknote, Lock, Key, Image } from 'lucide-react';

/* ── Design tokens ── */
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
  blue:         '#2563EB',
  bluePale:     '#EFF6FF',
};
const font = "'Nunito','Segoe UI',system-ui,sans-serif";
const card = (e={}) => ({ background:P.white, borderRadius:20, border:`1.5px solid ${P.border}`, padding:'24px', ...e });
const btnP = (e={}) => ({ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:12, padding:'10px 22px', fontWeight:800, fontSize:14, fontFamily:font, cursor:'pointer', boxShadow:`0 4px 16px rgba(124,58,237,.25)`, transition:'opacity .2s', ...e });
const btnO = (e={}) => ({ background:P.violetPale, color:P.violet, border:`1.5px solid ${P.violetBorder}`, borderRadius:12, padding:'9px 20px', fontWeight:700, fontSize:14, fontFamily:font, cursor:'pointer', transition:'all .2s', ...e });
const btnG = (e={}) => ({ background:P.greenPale, color:P.green, border:`1.5px solid ${P.green}33`, borderRadius:10, padding:'8px 18px', fontWeight:700, fontSize:13, fontFamily:font, cursor:'pointer', ...e });
const btnR = (e={}) => ({ background:P.orangePale, color:P.orange, border:`1.5px solid ${P.orange}33`, borderRadius:10, padding:'8px 18px', fontWeight:700, fontSize:13, fontFamily:font, cursor:'pointer', ...e });
const inputS = { width:'100%', border:`1.5px solid ${P.border}`, borderRadius:12, padding:'10px 14px', fontSize:14, fontFamily:font, outline:'none', color:P.ink, background:P.white, boxSizing:'border-box' };

function Pill({ children, color=P.violet, size=12 }) {
  return <span style={{ display:'inline-flex', alignItems:'center', background:color+'18', color, borderRadius:100, padding:'3px 10px', fontSize:size, fontWeight:800, letterSpacing:0.5, textTransform:'uppercase', fontFamily:font, border:`1px solid ${color}22`, whiteSpace:'nowrap' }}>{children}</span>;
}

/* ── Attendance modal ── */
function AttendanceModal({ session, students, onClose, onSave }) {
  const [present, setPresent] = useState(() => {
    const init = {};
    students.forEach(s => { init[s.id] = true; });
    return init;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students.map(s => ({ student_id: s.id, session_id: session.id, is_present: present[s.id] }));
      await groupsAPI.markAttendance({ records });
      await groupsAPI.markConducted(session.id);
      onSave(session.id);
      onClose();
    } catch(err) {
      alert(err.response?.data?.error || 'Ошибка при сохранении посещаемости');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:P.white, borderRadius:24, padding:32, width:'100%', maxWidth:520, maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div style={{ fontWeight:900, fontSize:18, color:P.ink }}><span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle',marginRight:6}}><CheckCircle size={18}/></span>Отметить посещаемость</div>
            <div style={{ color:P.slate, fontSize:13, marginTop:3 }}>{new Date(session.scheduled_at).toLocaleString('ru-RU')}</div>
          </div>
          <button onClick={onClose} style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:10, width:36, height:36, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}><X size={18}/></button>
        </div>

        {/* Toggle all */}
        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          <button onClick={() => { const s={}; students.forEach(st=>{s[st.id]=true;}); setPresent(s); }} style={btnG()}><span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle',marginRight:6}}><CheckCircle size={14}/></span>Все присутствуют</button>
          <button onClick={() => { const s={}; students.forEach(st=>{s[st.id]=false;}); setPresent(s); }} style={btnR()}><span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle',marginRight:6}}><X size={14}/></span>Никого нет</button>
        </div>

        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
          {students.length === 0 ? (
            <div style={{ textAlign:'center', color:P.slate, padding:32 }}>Нет студентов в группе</div>
          ) : students.map(s => (
            <div key={s.id} onClick={() => setPresent(p => ({...p, [s.id]: !p[s.id]}))}
              style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderRadius:14, cursor:'pointer', border:`1.5px solid ${present[s.id] ? P.green+'44' : P.red+'44'}`, background:present[s.id] ? P.greenPale : P.redPale, transition:'all .2s' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:present[s.id]?P.green:P.red, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, flexShrink:0 }}>
                {s.first_name?.[0]||'?'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15, color:P.ink }}>{s.first_name} {s.last_name}</div>
                {s.phone && <div style={{ color:P.slate, fontSize:12 }}>{s.phone}</div>}
              </div>
              <div style={{ width:28, height:28, borderRadius:'50%', background:present[s.id]?P.green:'#fff', border:`2px solid ${present[s.id]?P.green:P.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:16, transition:'all .2s' }}>
                {present[s.id] ? <CheckCircle size={16}/> : ''}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:20, display:'flex', gap:12 }}>
          <button onClick={handleSave} disabled={saving} style={btnP({flex:1, padding:'13px', fontSize:15, opacity:saving?0.6:1})}>
            {saving ? <span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle',marginRight:6}}><Loader size={14}/></span> : <span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle',marginRight:6}}><CheckCircle size={14}/></span>}{saving ? 'Сохранение...' : 'Сохранить и отметить проведённым'}
          </button>
          <button onClick={onClose} style={btnO({flexShrink:0})}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

/* ── Student list modal ── */
function StudentsModal({ group, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:P.white, borderRadius:24, padding:32, width:'100%', maxWidth:480, maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div style={{ fontWeight:900, fontSize:18, color:P.ink }}><span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle',marginRight:6}}><Users size={18}/></span>Студенты группы</div>
            <div style={{ color:P.slate, fontSize:13, marginTop:3 }}>{group.name}</div>
          </div>
          <button onClick={onClose} style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:10, width:36, height:36, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}><X size={18}/></button>
        </div>
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
          {(!group.enrollments || group.enrollments.length===0) ? (
            <div style={{ textAlign:'center', color:P.slate, padding:32 }}>
              <div style={{ fontSize:40, marginBottom:12 }}><User size={40}/></div>
              Нет студентов в группе
            </div>
          ) : group.enrollments.map((enr, i) => (
            <div key={enr.id||i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderRadius:14, background:P.surface, border:`1px solid ${P.border}` }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:15, flexShrink:0 }}>
                {enr.student?.first_name?.[0] || '?'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15, color:P.ink }}>{enr.student?.first_name} {enr.student?.last_name}</div>
                {enr.student?.phone && <div style={{ color:P.slate, fontSize:12 }}>{enr.student.phone}</div>}
              </div>
              <Pill color={enr.status==='active'?P.green:P.orange} size={10}>{enr.status==='active'?'Активен':'Неактивен'}</Pill>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══ Main Component ══ */
export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('overview');
  const [schedule, setSchedule] = useState([]);
  const [pending, setPending] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});

  /* stats */
  const [stats, setStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  /* group creation */
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ name:'', course_id:'', max_students:15, schedule_days:'', schedule_time:'' });
  const [allCourses, setAllCourses] = useState([]);
  const [createGroupSaving, setCreateGroupSaving] = useState(false);

  /* materials */
  const [matLesson, setMatLesson] = useState(null);   // lesson being edited
  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState('link');
  const [matLink, setMatLink] = useState('');
  const [matFile, setMatFile] = useState(null);
  const [matSaving, setMatSaving] = useState(false);

  /* modals */
  const [attendanceModal, setAttendanceModal] = useState(null); // { session, students }
  const [studentsModal, setStudentsModal] = useState(null);     // group object

  /* profile */
  const [profileForm, setProfileForm] = useState(null);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwForm, setPwForm] = useState({ old_password:'', new_password:'', confirm_password:'' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState({ text:'', ok:true });

  useEffect(() => {
    Promise.all([
      groupsAPI.schedule(),
      homeworkAPI.pending(),
      groupsAPI.myGroupsSmart().catch(() => ({ data: [] })),
    ]).then(([s, p, g]) => {
      setSchedule(s.data);
      setPending(p.data);
      const gdata = Array.isArray(g.data) ? g.data : g.data?.results || [];
      setGroups(gdata);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleReview = async (submissionId, status) => {
    try {
      await homeworkAPI.review({ submission_id: submissionId, status, comment: comments[submissionId] || '' });
      setPending(p => p.filter(s => s.id !== submissionId));
      setComments(c => { const n={...c}; delete n[submissionId]; return n; });
    } catch(err) { alert(err.response?.data?.error || 'Ошибка'); }
  };

  const handleMarkConducted = async (sessionId) => {
    setSchedule(p => p.map(s => s.id===sessionId ? {...s, is_conducted:true} : s));
  };

  const openAttendance = (session) => {
    // Get students from the group that this session belongs to
    const group = groups.find(g => g.id === session.group);
    const students = group?.enrollments?.map(e => e.student).filter(Boolean) || [];
    setAttendanceModal({ session, students });
  };

  // Init profile form
  useEffect(() => {
    if (user && !profileForm) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name:  user.last_name  || '',
        phone:      user.phone      || '',
        city:       user.city       || '',
        telegram:   user.telegram   || '',
        subject:    user.subject    || '',
        about:      user.about      || '',
      });
    }
  }, [user]);

  const saveProfile = async () => {
    const errs = {};
    if (!profileForm.first_name.trim()) errs.first_name = 'Введи имя';
    if (!profileForm.last_name.trim())  errs.last_name  = 'Введи фамилию';
    setProfileErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setProfileSaving(true);
    try {
      await api.patch('/users/profile/', profileForm);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch(e) { alert(e.response?.data?.error || 'Ошибка сохранения'); }
    finally { setProfileSaving(false); }
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
      if (res.data.token) localStorage.setItem('authToken', res.data.token);
      setPwMsg({ text: <span><CheckCircle size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Пароль успешно изменён</span>, ok: true });
      setPwForm({ old_password:'', new_password:'', confirm_password:'' });
    } catch(e) {
      setPwMsg({ text: e.response?.data?.error || 'Неверный текущий пароль', ok: false });
    } finally {
      setPwLoading(false);
    }
  };

  const tabs = [
    { id:'overview',   label:<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><Home size={14} style={{marginRight:6}}/> Главная</span> },
    { id:'groups',     label:<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><Users size={14} style={{marginRight:6}}/> Группы{groups.length>0?` (${groups.length})`:''}</span>},
    { id:'schedule',   label:<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><Calendar size={14} style={{marginRight:6}}/> Расписание</span> },
    { id:'homework',   label:<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><FileText size={14} style={{marginRight:6}}/> На проверке{pending.length>0?` (${pending.length})`:''}</span>},
    { id:'stats',      label:<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><BarChart2 size={14} style={{marginRight:6}}/> Статистика</span> },
    { id:'materials',  label:<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><Paperclip size={14} style={{marginRight:6}}/> Материалы</span> },
    { id:'profile',    label:<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><User size={14} style={{marginRight:6}}/> Профиль</span> },
  ];

  const loadStats = () => {
    if (stats.length > 0) return;
    setStatsLoading(true);
    groupsAPI.studentStats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  };

  const openCreateGroup = () => {
    if (allCourses.length === 0) {
      coursesAPI.list().then(res => setAllCourses(Array.isArray(res.data) ? res.data : res.data?.results || []));
    }
    setNewGroup({ name:'', course_id:'', max_students:15, schedule_days:'', schedule_time:'' });
    setShowCreateGroup(true);
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) { alert('Введите название группы'); return; }
    if (!newGroup.course_id)   { alert('Выберите курс'); return; }
    setCreateGroupSaving(true);
    try {
      const res = await groupsAPI.createGroup({
        name:          newGroup.name.trim(),
        course_id:     Number(newGroup.course_id),
        max_students:  Number(newGroup.max_students) || 15,
        schedule_days: newGroup.schedule_days,
        schedule_time: newGroup.schedule_time,
      });
      // Add to groups list
      const g = await groupsAPI.myGroupsSmart().catch(() => ({ data: [] }));
      setGroups(Array.isArray(g.data) ? g.data : g.data?.results || []);
      setShowCreateGroup(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка при создании группы');
    } finally {
      setCreateGroupSaving(false);
    }
  };

  const handleAddMaterial = async (lessonId) => {
    if (!matTitle.trim()) { alert('Введите название'); return; }
    setMatSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', matTitle);
      fd.append('material_type', matType);
      if (matType === 'link') fd.append('link', matLink);
      else if (matFile) fd.append('file', matFile);
      await coursesAPI.addMaterial(lessonId, fd);
      // Refresh groups to get updated materials
      const g = await groupsAPI.myGroupsSmart().catch(() => ({ data: [] }));
      setGroups(Array.isArray(g.data) ? g.data : g.data?.results || []);
      setMatTitle(''); setMatLink(''); setMatFile(null); setMatType('link'); setMatLesson(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    } finally {
      setMatSaving(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Удалить материал?')) return;
    try {
      await coursesAPI.deleteMaterial(materialId);
      const g = await groupsAPI.myGroupsSmart().catch(() => ({ data: [] }));
      setGroups(Array.isArray(g.data) ? g.data : g.data?.results || []);
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6FF', fontFamily:font }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;} ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:${P.violetSoft};border-radius:2px;}`}</style>

      {/* NAVBAR */}
      <nav style={{ background:P.white, borderBottom:`1px solid ${P.border}`, padding:'0 40px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(124,58,237,.06)' }}>
        <div onClick={()=>navigate('/')} style={{ fontWeight:900, fontSize:20, cursor:'pointer', color:P.ink }}>
          <span style={{ color:P.violet }}>Edu</span>Platform
          <span style={{ marginLeft:8, fontSize:11, background:P.violet, color:'#fff', borderRadius:6, padding:'2px 7px', fontWeight:800, verticalAlign:'middle' }}>KZ</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <a href="https://t.me/eduplatform_kz" target="_blank" rel="noreferrer"
            style={{ background:'transparent',border:`1.5px solid ${P.border}`,borderRadius:12,width:42,height:42,display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none' }}
            title="Поддержка">
            <Hand size={18} color={P.slate} />
          </a>
          <button onClick={()=>navigate('/chat')} style={{ background:P.violetPale, border:`1.5px solid ${P.violetBorder}`, color:P.violet, borderRadius:12, padding:'8px 16px', cursor:'pointer', fontSize:14, fontWeight:700, fontFamily:font, display:'flex',alignItems:'center',gap:6 }}><MessageCircle size={16} /> Чат</button>
          <div style={{ display:'flex', alignItems:'center', gap:10, background:P.violetPale, border:`1.5px solid ${P.violetBorder}`, borderRadius:12, padding:'8px 16px' }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:13 }}>{user?.first_name?.[0]||'?'}</div>
            <span style={{ fontWeight:700, fontSize:14, color:P.ink }}>{user?.first_name} {user?.last_name}</span>
          </div>
          <button onClick={logout} style={{ background:'none', border:'none', color:P.slate, cursor:'pointer', fontSize:14, fontWeight:600, fontFamily:font, display:'flex',alignItems:'center',gap:6 }}><LogOut size={14}/>Выйти</button>
        </div>
      </nav>

      <div style={{ display:'flex', minHeight:'calc(100vh - 64px)' }}>

        {/* SIDEBAR */}
        <div style={{ width:240, flexShrink:0, background:P.white, borderRight:`1px solid ${P.border}`, padding:'24px 16px', display:'flex', flexDirection:'column', gap:4, position:'sticky', top:64, height:'calc(100vh - 64px)', overflowY:'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 16px', borderRadius:12, fontWeight:700, fontSize:14, fontFamily:font, cursor:'pointer', textAlign:'left', transition:'all .2s', background:tab===t.id?`linear-gradient(135deg,${P.violet},${P.violetSoft})`:'none', color:tab===t.id?'#fff':P.slate, border:'none', boxShadow:tab===t.id?`0 4px 16px rgba(124,58,237,.2)`:'none' }}>{t.label}</button>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex:1, padding:'32px 32px', overflowY:'auto', minWidth:0 }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:80, color:P.slate, fontSize:18 }}><div style={{ fontSize:40, marginBottom:16 }}><Clock size={40}/></div>Загрузка...</div>
        ) : (
          <>
            {/* ══ OVERVIEW ══ */}
            {tab==='overview' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                {/* Banner */}
                <div style={{ background:`linear-gradient(135deg,${P.violet},${P.violetDark})`, borderRadius:24, padding:'28px 32px', color:'#fff', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }}/>
                  <div style={{ position:'relative' }}>
                    <h2 style={{ fontSize:26, fontWeight:900, margin:'0 0 6px', letterSpacing:-0.5 }}>Привет, {user?.first_name}! <Hand size={20} style={{display:'inline-flex',verticalAlign:'middle'}}/></h2>
                    <p style={{ color:'rgba(255,255,255,.75)', margin:0, fontSize:15, fontWeight:500 }}>Панель преподавателя</p>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
                  {[
                    { val:groups.length,   label:'Групп',              icon:<Users size={28}/>, color:P.violet },
                    { val:schedule.filter(s=>!s.is_conducted).length, label:'Предстоящих уроков', icon:<Calendar size={28}/>, color:P.blue },
                    { val:pending.length,  label:'На проверке',        icon:<FileText size={28}/>, color:P.orange },
                    { val:schedule.filter(s=>s.is_conducted).length,  label:'Проведено уроков',  icon:<CheckCircle size={28}/>, color:P.green },
                  ].map((s,i) => (
                    <div key={i} style={card({textAlign:'center', padding:'20px 16px'})}>
                      <div style={{ fontSize:28, marginBottom:6 }}>{s.icon}</div>
                      <div style={{ fontSize:28, fontWeight:900, color:s.color, letterSpacing:-1 }}>{s.val}</div>
                      <div style={{ fontSize:12, color:P.slate, marginTop:3, fontWeight:600 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Next lesson */}
                {schedule.filter(s=>!s.is_conducted).length > 0 && (
                  <div style={card()}>
                    <div style={{ fontWeight:800, fontSize:15, color:P.ink, marginBottom:14 }}><span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle',marginRight:6}}><Calendar size={15}/></span>Ближайший урок</div>
                    {(() => {
                      const next = schedule.filter(s=>!s.is_conducted)[0];
                      return (
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
                          <div>
                            <div style={{ fontWeight:700, fontSize:17, color:P.ink }}>
                              {new Date(next.scheduled_at).toLocaleString('ru-RU',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}
                            </div>
                            <div style={{ color:P.slate, fontSize:13, marginTop:4 }}><span style={{display:'inline-flex',alignItems:'center',gap:4}}><Clock size={12}/>{next.duration_minutes} минут</span></div>
                          </div>
                          <div style={{ display:'flex', gap:10 }}>
                            {next.meet_link && (
                              <a href={next.meet_link} target="_blank" rel="noreferrer" style={{ ...btnP(), textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}><Link size={14}/>Войти в урок</a>
                            )}
                            <button onClick={()=>openAttendance(next)} style={btnO()}><CheckCircle size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Отметить посещаемость</button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Pending homework preview */}
                {pending.length > 0 && (
                  <div style={card()}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                      <div style={{ fontWeight:800, fontSize:15, color:P.ink }}><FileText size={15} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Ожидают проверки</div>
                      <button onClick={()=>setTab('homework')} style={btnO({padding:'6px 16px', fontSize:13})}>Смотреть все <ArrowLeft size={12} style={{display:'inline-flex',verticalAlign:'middle',marginLeft:4}}/></button>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {pending.slice(0,3).map(sub => (
                        <div key={sub.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:P.orangePale, borderRadius:12, border:`1px solid ${P.orange}33` }}>
                          <div>
                            <span style={{ fontWeight:700, fontSize:14, color:P.ink }}>Задание #{sub.homework}</span>
                            <span style={{ color:P.slate, fontSize:12, marginLeft:10 }}>
                              {sub.student ? `${sub.student.first_name} ${sub.student.last_name}` : `Студент #${sub.student || '—'}`}
                            </span>
                          </div>
                          <span style={{ fontSize:11, color:P.orange, fontWeight:700 }}>{new Date(sub.submitted_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ GROUPS ══ */}
            {tab==='groups' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <div style={{ fontWeight:900, fontSize:22, color:P.ink, letterSpacing:-0.5 }}>Мои группы</div>
                  <button onClick={openCreateGroup} style={btnP({padding:'10px 20px', fontSize:14})}><Plus size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Создать группу</button>
                </div>
                {groups.length===0 ? (
                  <div style={card({textAlign:'center', padding:60})}>
                    <div style={{ fontSize:48, marginBottom:14 }}><Users size={48}/></div>
                    <div style={{ color:P.slate, fontSize:16 }}>У вас пока нет групп</div>
                    <button onClick={openCreateGroup} style={{ ...btnP({padding:'12px 28px', fontSize:14}), marginTop:16 }}><Plus size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Создать первую группу</button>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:20 }}>
                    {groups.map(g => {
                      const studentCount = g.enrollments?.filter(e=>e.status==='active').length || 0;
                      const typeColor = { ent:P.violet, ielts:P.green, sat:P.red };
                      const col = typeColor[g.course?.course_type] || P.violet;
                      return (
                        <div key={g.id} style={card()}>
                          <div style={{ height:4, background:`linear-gradient(90deg,${col},${col}66)`, borderRadius:4, marginBottom:18, marginTop:-24, marginLeft:-24, marginRight:-24 }}/>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                            <Pill color={col} size={11}>{g.course?.course_type?.toUpperCase() || 'ГРУППА'}</Pill>
                            <Pill color={g.is_active?P.green:P.slate} size={10}>{g.is_active?'Активна':'Неактивна'}</Pill>
                          </div>
                          <h3 style={{ fontWeight:900, fontSize:18, margin:'0 0 6px', color:P.ink }}>{g.name}</h3>
                          {g.course?.title && <div style={{ color:P.slate, fontSize:13, marginBottom:16 }}><BookOpen size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>{g.course.title}</div>}

                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
                            <div style={{ background:P.violetPale, borderRadius:12, padding:'12px', textAlign:'center', border:`1px solid ${P.violetBorder}` }}>
                              <div style={{ fontWeight:900, fontSize:22, color:P.violet }}>{studentCount}</div>
                              <div style={{ fontSize:11, color:P.slate, fontWeight:600, marginTop:2 }}>Студентов</div>
                            </div>
                            <div style={{ background:P.surface, borderRadius:12, padding:'12px', textAlign:'center', border:`1px solid ${P.border}` }}>
                              <div style={{ fontWeight:900, fontSize:22, color:P.ink }}>{g.max_students||15}</div>
                              <div style={{ fontSize:11, color:P.slate, fontWeight:600, marginTop:2 }}>Макс. мест</div>
                            </div>
                          </div>

                          <div style={{ display:'flex', gap:10 }}>
                            <button onClick={()=>setStudentsModal(g)} style={btnO({flex:1, textAlign:'center'})}>
                              <Users size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Студенты
                            </button>
                            {g.teacher_profile?.meet_link && (
                              <a href={g.teacher_profile.meet_link} target="_blank" rel="noreferrer"
                                style={{ ...btnP({flexShrink:0}), textDecoration:'none' }}>
                                <Link size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Zoom
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab==='schedule' && (
                <WeekCalendar mode="teacher" />
              )}

            {/* ══ HOMEWORK REVIEW ══ */}
{/* ══ PROFILE ══ */}
            {tab==='profile' && profileForm && (
              <div style={{display:'flex',flexDirection:'column',gap:20}}>
                <div style={{fontWeight:900,fontSize:22,color:P.ink,letterSpacing:-0.5}}><User size={22} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Мой профиль</div>

                {/* Avatar + name */}
                <div style={{...card(),display:'flex',alignItems:'center',gap:20}}>
                  <div style={{width:72,height:72,borderRadius:'50%',background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:28,flexShrink:0}}>
                    {profileForm.first_name?.[0]?.toUpperCase()||'?'}
                  </div>
                  <div>
                    <div style={{fontWeight:900,fontSize:18,color:P.ink}}>{profileForm.first_name} {profileForm.last_name}</div>
                    <div style={{fontSize:13,color:P.slate,marginTop:2}}>{user?.email}</div>
                    <div style={{marginTop:6}}><Pill color={P.green}>Учитель</Pill></div>
                  </div>
                </div>

                {/* Form */}
                <div style={card()}>
                  <div style={{fontWeight:800,fontSize:15,color:P.ink,marginBottom:18}}><Pencil size={15} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Редактировать</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                    {[
                      {key:'first_name', label:'Имя',      placeholder:'Иван'},
                      {key:'last_name',  label:'Фамилия',  placeholder:'Иванов'},
                      {key:'phone',      label:'Телефон',  placeholder:'+7 700 000 00 00'},
                      {key:'city',       label:'Город',    placeholder:'Алматы'},
                      {key:'telegram',   label:'Telegram', placeholder:'@username'},
                      {key:'subject',    label:'Предмет',  placeholder:'Математика, Физика...'},
                    ].map(f=>(
                      <div key={f.key}>
                        <label style={{display:'block',fontSize:12,fontWeight:700,color:P.slate,marginBottom:6,textTransform:'uppercase',letterSpacing:0.5}}>{f.label}</label>
                        <input
                          value={profileForm[f.key]}
                          onChange={e=>setProfileForm(p=>({...p,[f.key]:e.target.value}))}
                          placeholder={f.placeholder}
                          style={{...inputS,borderColor:profileErrors[f.key]?P.red:P.border}}
                        />
                        {profileErrors[f.key]&&<div style={{color:P.red,fontSize:11,marginTop:3}}>{profileErrors[f.key]}</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:16}}>
                    <label style={{display:'block',fontSize:12,fontWeight:700,color:P.slate,marginBottom:6,textTransform:'uppercase',letterSpacing:0.5}}>О себе</label>
                    <textarea
                      value={profileForm.about}
                      onChange={e=>setProfileForm(p=>({...p,about:e.target.value}))}
                      placeholder="Расскажи о своём опыте и методике преподавания..."
                      rows={4}
                      style={{...inputS,resize:'vertical',lineHeight:1.6}}
                    />
                  </div>
                  <div style={{display:'flex',gap:12,marginTop:20,alignItems:'center'}}>
                    <button onClick={saveProfile} disabled={profileSaving} style={{...btnP(),opacity:profileSaving?.7:1}}>
                      {profileSaving?<span><Clock size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Сохраняем...</span>:<span><Banknote size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Сохранить</span>}
                    </button>
                    {profileSaved&&<div style={{color:P.green,fontWeight:700,fontSize:14}}><CheckCircle size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Сохранено!</div>}
                  </div>
                </div>

                {/* Change password */}
                <div style={card()}>
                  <div style={{fontWeight:800,fontSize:16,color:P.ink,marginBottom:20}}><Lock size={16} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Изменить пароль</div>
                  {pwMsg.text&&(
                    <div style={{background:pwMsg.ok?'#F0FDF4':'#FEF2F2',color:pwMsg.ok?P.green:P.red,border:`1px solid ${pwMsg.ok?P.green:P.red}22`,borderRadius:12,padding:'10px 14px',fontSize:13,fontWeight:600,marginBottom:16}}>
                      {pwMsg.text}
                    </div>
                  )}
                  <div style={{display:'flex',flexDirection:'column',gap:14,maxWidth:420}}>
                    {[
                      {key:'old_password',     label:'Текущий пароль',  placeholder:'••••••••'},
                      {key:'new_password',     label:'Новый пароль',    placeholder:'Минимум 6 символов'},
                      {key:'confirm_password', label:'Повтори пароль',  placeholder:'Повтори новый пароль'},
                    ].map(({key,label,placeholder})=>(
                      <div key={key}>
                        <label style={{display:'block',fontSize:12,fontWeight:700,color:P.ink,marginBottom:5}}>{label}</label>
                        <input
                          type='password'
                          value={pwForm[key]}
                          onChange={e=>{setPwForm(p=>({...p,[key]:e.target.value}));setPwMsg({text:'',ok:true});}}
                          placeholder={placeholder}
                          style={{...inputS,fontSize:14}}
                        />
                      </div>
                    ))}
                    <button onClick={changePassword} disabled={pwLoading} style={{...btnO({alignSelf:'flex-start',opacity:pwLoading?0.7:1})}}>
                      {pwLoading?<span><Clock size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Меняем...</span>:<span><Key size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Изменить пароль</span>}
                    </button>
                  </div>
                </div>


              </div>
            )}

            {tab==='homework' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <div style={{ fontWeight:900, fontSize:22, color:P.ink, letterSpacing:-0.5 }}>Домашние задания на проверке</div>
                  {pending.length > 0 && <Pill color={P.orange}>{pending.length} задани{pending.length===1?'е':'й'}</Pill>}
                </div>

                {pending.length===0 ? (
                  <div style={card({textAlign:'center', padding:60})}>
                    <div style={{ marginBottom:14, display:'flex', justifyContent:'center' }}><CheckCircle size={52} color="#059669"/></div>
                    <div style={{ fontWeight:800, fontSize:18, color:P.ink, marginBottom:8 }}>Всё проверено!</div>
                    <div style={{ color:P.slate, fontSize:15 }}>Нет заданий, ожидающих проверки</div>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    {pending.map(sub => (
                      <div key={sub.id} style={card()}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                          <div>
                            <div style={{ fontWeight:900, fontSize:16, color:P.ink }}><FileText size={16} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Задание #{sub.homework}</div>
                            <div style={{ color:P.slate, fontSize:13, marginTop:4 }}>
                              <User size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>{sub.student ? `${sub.student.first_name} ${sub.student.last_name}` : `Студент`}
                              {sub.student?.phone && ` · ${sub.student.phone}`}
                            </div>
                            <div style={{ color:'#94A3B8', fontSize:12, marginTop:2 }}>
                              Сдано: {new Date(sub.submitted_at).toLocaleString('ru-RU')}
                            </div>
                          </div>
                          <Pill color={P.orange} size={11}><Clock size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>На проверке</Pill>
                        </div>

                        {/* Student answer */}
                        {sub.text_answer && (
                          <div style={{ background:P.surface, border:`1.5px solid ${P.border}`, borderRadius:14, padding:'14px 18px', marginBottom:16 }}>
                            <div style={{ fontSize:12, color:P.slate, fontWeight:700, marginBottom:6 }}><MessageCircle size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Ответ студента</div>
                            <div style={{ color:P.ink, fontSize:14, lineHeight:1.7, whiteSpace:'pre-wrap' }}>{sub.text_answer}</div>
                          </div>
                        )}

                        {/* File attachment */}
                        {sub.file_url && (
                          <div style={{ marginBottom:16 }}>
                            <a href={sub.file_url} target="_blank" rel="noreferrer"
                              style={{ ...btnO({fontSize:13}), textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}>
                              <Download size={13}/>Скачать файл
                            </a>
                          </div>
                        )}

                        {/* Comment input */}
                        <div style={{ marginBottom:14 }}>
                          <textarea
                            value={comments[sub.id]||''}
                            onChange={e=>setComments(c=>({...c,[sub.id]:e.target.value}))}
                            placeholder="Комментарий для студента (необязательно)..."
                            rows={3}
                            style={{ ...inputS, resize:'vertical', lineHeight:1.6 }}
                          />
                        </div>

                        {/* Action buttons */}
                        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                          <button onClick={()=>handleReview(sub.id,'accepted')} style={btnG({flex:1, padding:'12px'})} >
                            <CheckCircle size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Принять
                          </button>
                          <button onClick={()=>handleReview(sub.id,'revision_required')} style={btnR({flex:1, padding:'12px'})}>
                            <RotateCw size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>На доработку
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── STATS tab ── */}
            {tab === 'stats' && (
              <div style={card()}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                  <div style={{ fontWeight:900, fontSize:18, color:P.ink }}><BarChart2 size={18} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Статистика по студентам</div>
                  <button onClick={loadStats} style={btnP({padding:'8px 20px', fontSize:13})}><RotateCw size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Загрузить</button>
                </div>
                {statsLoading ? (
                  <div style={{ textAlign:'center', padding:32, color:P.muted }}>Загрузка...</div>
                ) : stats.length === 0 ? (
                  <div style={{ textAlign:'center', padding:32, color:P.muted }}>
                    <div style={{ fontSize:36, marginBottom:12 }}><BarChart2 size={36}/></div>
                    <div>Нажмите «Загрузить» для просмотра статистики</div>
                  </div>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14, fontFamily:font }}>
                      <thead>
                        <tr style={{ background:P.violetPale, borderBottom:`2px solid ${P.border}` }}>
                          {['Студент','Телефон','Группа','Посещаемость','Д/З','Ср. тест'].map((h,i) => (
                            <th key={i} style={{ padding:'12px 14px', textAlign:'left', fontWeight:800, color:P.ink, fontSize:12, textTransform:'uppercase', letterSpacing:0.5, whiteSpace:'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.map((s, i) => (
                          <tr key={i} style={{ borderBottom:`1px solid ${P.border}`, background: i%2===0 ? P.white : P.surface }}>
                            <td style={{ padding:'11px 14px', fontWeight:700, color:P.ink }}>{s.student_name || '—'}</td>
                            <td style={{ padding:'11px 14px', color:P.slate, fontSize:13 }}>{s.student_phone}</td>
                            <td style={{ padding:'11px 14px', color:P.slate, fontSize:13 }}>{s.group_name}</td>
                            <td style={{ padding:'11px 14px' }}>
                              {s.attendance_percent !== null ? (
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <div style={{ flex:1, height:6, background:P.border, borderRadius:3, overflow:'hidden', minWidth:60 }}>
                                    <div style={{ height:'100%', width:`${s.attendance_percent}%`, background: s.attendance_percent>=75?P.green:s.attendance_percent>=50?P.orange:P.red, borderRadius:3 }} />
                                  </div>
                                  <span style={{ fontWeight:800, fontSize:13, color: s.attendance_percent>=75?P.green:s.attendance_percent>=50?P.orange:P.red }}>{s.attendance_percent}%</span>
                                </div>
                              ) : <span style={{ color:P.muted, fontSize:12 }}>—</span>}
                            </td>
                            <td style={{ padding:'11px 14px', textAlign:'center', fontWeight:800, color: s.hw_total>0?P.ink:P.muted }}>{s.hw_accepted}/{s.hw_total}</td>
                            <td style={{ padding:'11px 14px', textAlign:'center' }}>
                              {s.avg_test_score !== null
                                ? <span style={{ fontWeight:800, color: s.avg_test_score>=70?P.green:s.avg_test_score>=40?P.orange:P.red }}>{s.avg_test_score}%</span>
                                : <span style={{ color:P.muted, fontSize:12 }}>—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── MATERIALS tab ── */}
            {tab === 'materials' && (
              <div style={card()}>
                <div style={{ fontWeight:900, fontSize:18, color:P.ink, marginBottom:20 }}><Paperclip size={18} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Материалы к урокам</div>
                {groups.length === 0 ? (
                  <div style={{ textAlign:'center', padding:32, color:P.muted }}>Нет активных групп</div>
                ) : groups.map(group => {
                  const sessions = (group.sessions || []).filter(s => s.lesson);
                  if (!sessions.length) return null;
                  return (
                    <div key={group.id} style={{ marginBottom:24 }}>
                      <div style={{ fontWeight:800, fontSize:14, color:P.violet, marginBottom:12, padding:'8px 14px', background:P.violetPale, borderRadius:10, border:`1px solid ${P.violetBorder}` }}>
                        <Users size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>{group.name} — {group.course?.title}
                      </div>
                      {sessions.map(session => (
                        <div key={session.id} style={{ marginBottom:12, padding:14, background:P.surface, borderRadius:12, border:`1px solid ${P.border}` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                            <div style={{ fontWeight:700, fontSize:14, color:P.ink }}><BookOpen size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>{session.lesson_title || `Урок #${session.lesson}`}</div>
                            <button onClick={() => setMatLesson(matLesson===session.lesson?null:session.lesson)} style={btnO({padding:'5px 12px', fontSize:12})}>
                              {matLesson===session.lesson ? <span><X size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Отмена</span> : <span><Plus size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Добавить</span>}
                            </button>
                          </div>
                          {(session.lesson_materials||[]).map(m => (
                            <div key={m.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 12px', background:P.white, borderRadius:8, border:`1px solid ${P.border}`, marginBottom:4 }}>
                              <span style={{ fontSize:13, color:P.ink, fontWeight:600 }}>
                                {m.material_type==='link'?<Link size={13}/>:m.material_type==='pdf'?<Download size={13}/>:m.material_type==='image'?<Image size={13}/>:<Paperclip size={13}/>} {m.title}
                              </span>
                              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                                {m.link && <a href={m.link} target="_blank" rel="noreferrer" style={{ fontSize:12, color:P.violet, fontWeight:700, textDecoration:'none' }}>Открыть</a>}
                                <button onClick={()=>handleDeleteMaterial(m.id)} style={{ background:'none', border:'none', cursor:'pointer', color:P.red, fontSize:16, lineHeight:1 }}><X size={16}/></button>
                              </div>
                            </div>
                          ))}
                          {matLesson===session.lesson && (
                            <div style={{ padding:12, background:P.white, borderRadius:10, border:`1.5px solid ${P.violet}33`, marginTop:8 }}>
                              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                <input value={matTitle} onChange={e=>setMatTitle(e.target.value)} placeholder="Название" style={inputS} />
                                <select value={matType} onChange={e=>setMatType(e.target.value)} style={inputS}>
                                  <option value="link"><Link size={14}/>Ссылка</option>
                                  <option value="pdf"><Download size={14}/>PDF</option>
                                  <option value="docx"><FileText size={14}/>DOCX</option>
                                  <option value="pptx"><BarChart2 size={14}/>PPTX</option>
                                  <option value="image"><Image size={14}/>Изображение</option>
                                </select>
                                {matType==='link'
                                  ? <input value={matLink} onChange={e=>setMatLink(e.target.value)} placeholder="https://..." style={inputS} />
                                  : <input type="file" onChange={e=>setMatFile(e.target.files[0])} style={{ fontSize:13, fontFamily:font }} />
                                }
                                <button onClick={()=>handleAddMaterial(session.lesson)} disabled={matSaving} style={btnP({opacity:matSaving?0.6:1})}>
                                  {matSaving ? 'Сохранение...' : <span><CheckCircle size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Добавить</span>}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── CHAT tab ── */}
            {tab === 'chat' && (
              <div style={card({ textAlign:'center', padding:40 })}>
                <div style={{ fontSize:56, marginBottom:16 }}><MessageCircle size={56}/></div>
                <div style={{ fontWeight:900, fontSize:20, color:P.ink, marginBottom:8 }}>Чат со студентами</div>
                <div style={{ color:P.slate, fontSize:14, marginBottom:24 }}>Отвечайте на вопросы студентов в реальном времени</div>
                <button onClick={()=>navigate('/chat')} style={btnP({padding:'14px 36px', fontSize:15})}>Открыть чат <ArrowLeft size={14} style={{display:'inline-flex',verticalAlign:'middle',marginLeft:6}}/></button>
              </div>
            )}

          </>
        )}
        </div>
      </div>
      {/* ── Attendance Modal ── */}
      {attendanceModal && (
        <AttendanceModal
          session={attendanceModal.session}
          students={attendanceModal.students}
          onClose={()=>setAttendanceModal(null)}
          onSave={handleMarkConducted}
        />
      )}

      {/* ── Students Modal ── */}
      {studentsModal && (
        <StudentsModal
          group={studentsModal}
          onClose={()=>setStudentsModal(null)}
        />
      )}

      {/* ── Create Group Modal ── */}
      {showCreateGroup && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:P.white, borderRadius:24, padding:32, width:'100%', maxWidth:480 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div style={{ fontWeight:900, fontSize:20, color:P.ink }}><Users size={20} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Создать группу</div>
              <button onClick={()=>setShowCreateGroup(false)} style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:10, width:36, height:36, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}><X size={18}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:700, color:P.slate, display:'block', marginBottom:5 }}>Название группы *</label>
                <input value={newGroup.name} onChange={e=>setNewGroup(p=>({...p,name:e.target.value}))}
                  placeholder="Например: IELTS Утро А" style={inputS} />
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:700, color:P.slate, display:'block', marginBottom:5 }}>Курс *</label>
                <select value={newGroup.course_id} onChange={e=>setNewGroup(p=>({...p,course_id:e.target.value}))} style={inputS}>
                  <option value="">— Выберите курс —</option>
                  {allCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:700, color:P.slate, display:'block', marginBottom:5 }}>Макс. студентов</label>
                <input type="number" min="1" max="50" value={newGroup.max_students}
                  onChange={e=>setNewGroup(p=>({...p,max_students:e.target.value}))} style={inputS} />
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:700, color:P.slate, display:'block', marginBottom:5 }}>Дни занятий (пример: Пн, Ср, Пт)</label>
                <input value={newGroup.schedule_days} onChange={e=>setNewGroup(p=>({...p,schedule_days:e.target.value}))}
                  placeholder="Пн, Ср, Пт" style={inputS} />
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:700, color:P.slate, display:'block', marginBottom:5 }}>Время начала (HH:MM)</label>
                <input type="time" value={newGroup.schedule_time} onChange={e=>setNewGroup(p=>({...p,schedule_time:e.target.value}))} style={inputS} />
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button onClick={handleCreateGroup} disabled={createGroupSaving} style={btnP({flex:1, padding:'13px', fontSize:15, opacity:createGroupSaving?0.6:1})}>
                  {createGroupSaving ? 'Создание...' : <span><CheckCircle size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Создать группу</span>}
                </button>
                <button onClick={()=>setShowCreateGroup(false)} style={btnO({flexShrink:0})}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
