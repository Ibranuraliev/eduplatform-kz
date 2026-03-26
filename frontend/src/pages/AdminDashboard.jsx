import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import useMobile from '../hooks/useMobile';
import { Home, Users, BookOpen, CreditCard, RotateCw, ClipboardList, Bell, Settings, BarChart2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, X, Clock, Search, Phone, Trophy, Gift } from 'lucide-react';

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
  orange:       '#D97706',
  orangePale:   '#FFFBEB',
  red:          '#DC2626',
  redPale:      '#FEF2F2',
  blue:         '#2563EB',
  bluePale:     '#EFF6FF',
};
const font = "'Nunito','Segoe UI',system-ui,sans-serif";
const card = (e={}) => ({ background:P.white, borderRadius:20, border:`1.5px solid ${P.border}`, padding:'24px', ...e });
const btnP = (e={}) => ({ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:12, padding:'10px 22px', fontWeight:800, fontSize:14, fontFamily:font, cursor:'pointer', boxShadow:`0 4px 16px rgba(124,58,237,.25)`, transition:'all .2s', ...e });
const btnO = (e={}) => ({ background:P.violetPale, color:P.violet, border:`1.5px solid ${P.violetBorder}`, borderRadius:12, padding:'9px 20px', fontWeight:700, fontSize:14, fontFamily:font, cursor:'pointer', ...e });
const btnR = (e={}) => ({ background:P.redPale, color:P.red, border:`1.5px solid ${P.red}33`, borderRadius:10, padding:'7px 16px', fontWeight:700, fontSize:13, fontFamily:font, cursor:'pointer', ...e });
const btnG = (e={}) => ({ background:P.greenPale, color:P.green, border:`1.5px solid ${P.green}33`, borderRadius:10, padding:'7px 16px', fontWeight:700, fontSize:13, fontFamily:font, cursor:'pointer', ...e });
const inputS = { width:'100%', border:`1.5px solid ${P.border}`, borderRadius:12, padding:'10px 14px', fontSize:14, fontFamily:font, outline:'none', color:P.ink, background:P.white, boxSizing:'border-box' };

function Pill({ children, color=P.violet, size=12 }) {
  return <span style={{ display:'inline-flex', alignItems:'center', background:color+'18', color, borderRadius:100, padding:'3px 10px', fontSize:size, fontWeight:800, letterSpacing:0.3, fontFamily:font, border:`1px solid ${color}22`, whiteSpace:'nowrap' }}>{children}</span>;
}

/* ── Quick stats card ── */
function StatCard({ icon, value, label, color, sub }) {
  return (
    <div style={card({ textAlign:'center', padding:'22px 16px' })}>
      <div style={{ fontSize:30, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:30, fontWeight:900, color, letterSpacing:-1, lineHeight:1 }}>{value ?? '—'}</div>
      <div style={{ fontSize:12, color:P.slate, marginTop:5, fontWeight:700 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:P.muted, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

/* ── Table wrapper ── */
function Table({ cols, rows, emptyMsg='Нет данных' }) {
  if (!rows.length) return (
    <div style={{ textAlign:'center', padding:'48px 0', color:P.slate, fontSize:15 }}>
      <div style={{ fontSize:40, marginBottom:12 }}><AlertTriangle size={40}/></div>{emptyMsg}
    </div>
  );
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14, fontFamily:font }}>
        <thead>
          <tr style={{ background:P.violetPale, borderBottom:`2px solid ${P.border}` }}>
            {cols.map((c,i) => (
              <th key={i} style={{ padding:'12px 16px', textAlign:'left', fontWeight:800, color:P.ink, fontSize:12, textTransform:'uppercase', letterSpacing:0.5, whiteSpace:'nowrap' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom:`1px solid ${P.border}`, background: ri%2===0 ? P.white : P.surface, transition:'background .15s' }}>
              {row.map((cell,ci) => (
                <td key={ci} style={{ padding:'13px 16px', color:P.ink, verticalAlign:'middle' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Role badge ── */
function RoleBadge({ role }) {
  const map = { student:{ label:'Студент', color:P.violet }, teacher:{ label:'Учитель', color:P.green }, admin:{ label:'Админ', color:P.red }, hr:{ label:'HR', color:P.orange } };
  const r = map[role] || { label:role, color:P.slate };
  return <Pill color={r.color} size={11}>{r.label}</Pill>;
}

/* ── Payment status badge ── */
function PayStatus({ status }) {
  const map = { pending:{ label:<span><Clock size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Ожидает</span>, color:P.orange }, paid:{ label:<span><CheckCircle size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Оплачено</span>, color:P.green }, cancelled:{ label:<span><X size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Отменён</span>, color:P.red }, refunded:{ label:<span><RotateCw size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Возврат</span>, color:P.blue } };
  const s = map[status] || { label:status, color:P.slate };
  return <Pill color={s.color} size={11}>{s.label}</Pill>;
}

/* ═══════════════════════════════════════════════ */
export default function AdminDashboard() {
  const isMobile = useMobile();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  /* data */
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [hrApps, setHrApps] = useState([]);
  const [groupChanges, setGroupChanges] = useState([]);

  /* search/filter */
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('all');
  const [paySearch, setPaySearch] = useState('');

  /* actions */
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetches = [
      api.get('/admin-panel/stats/').catch(()=>({data:{}})),
      api.get('/admin-panel/users/').catch(()=>api.get('/users/list/').catch(()=>({data:[]}))),
      api.get('/admin-panel/groups/').catch(()=>api.get('/groups/').catch(()=>({data:[]}))),
      api.get('/admin-panel/payments/').catch(()=>api.get('/payments/orders/').catch(()=>({data:[]}))),
      api.get('/admin-panel/refunds/').catch(()=>api.get('/payments/refunds/').catch(()=>({data:[]}))),
      api.get('/admin-panel/hr-applications/').catch(()=>api.get('/hr/applications/').catch(()=>({data:[]}))),
      api.get('/admin-panel/group-change-requests/').catch(()=>({data:[]})),
    ];
    Promise.all(fetches).then(([st,u,g,p,r,hr,gc]) => {
      setStats(st.data || {});
      setUsers(Array.isArray(u.data)?u.data:u.data?.results||[]);
      setGroups(Array.isArray(g.data)?g.data:g.data?.results||[]);
      setPayments(Array.isArray(p.data)?p.data:p.data?.results||[]);
      setRefunds(Array.isArray(r.data)?r.data:r.data?.results||[]);
      setHrApps(Array.isArray(hr.data)?hr.data:hr.data?.results||[]);
      setGroupChanges(Array.isArray(gc.data)?gc.data:gc.data?.results||[]);
    }).catch(console.error).finally(()=>setLoading(false));
  }, []);

  /* Refund action */
  const handleRefund = async (id, action) => {
    setProcessingId(id);
    try {
      await api.post(`/payments/refunds/${id}/${action}/`);
      setRefunds(p => p.map(r => r.id===id ? {...r, status:action==='approve'?'approved':'rejected'} : r));
    } catch(err) { alert(err.response?.data?.error||'Ошибка'); }
    finally { setProcessingId(null); }
  };

  /* HR application action */
  const handleHR = async (id, action) => {
    setProcessingId(id);
    try {
      await api.post('/hr/applications/review/', { application_id:id, action });
      setHrApps(p => p.map(a => a.id===id ? {...a, status:action} : a));
    } catch(err) { alert(err.response?.data?.error||'Ошибка'); }
    finally { setProcessingId(null); }
  };

  /* Group change action */
  const handleGC = async (id, action) => {
    setProcessingId(id);
    try {
      await api.post(`/admin-panel/group-change-requests/${id}/${action}/`);
      setGroupChanges(p => p.map(r => r.id===id ? {...r, status:action} : r));
    } catch(err) { alert(err.response?.data?.error||'Ошибка'); }
    finally { setProcessingId(null); }
  };

  /* Mark payment as paid */
  const handleMarkPaid = async (id) => {
    setProcessingId(id);
    try {
      await api.post(`/payments/orders/${id}/mark-paid/`);
      setPayments(p => p.map(o => o.id===id ? {...o, status:'paid'} : o));
    } catch(err) { alert(err.response?.data?.error||'Ошибка'); }
    finally { setProcessingId(null); }
  };

  /* Derived counts */
  const pendingRefunds = refunds.filter(r=>r.status==='pending').length;
  const pendingHR = hrApps.filter(a=>a.status==='pending').length;
  const pendingGC = groupChanges.filter(r=>r.status==='pending').length;
  const totalPending = pendingRefunds + pendingHR + pendingGC;

  const tabs = [
    { id:'overview',  label:<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><Home size={14} style={{marginRight:6}}/>Главная</span> },
    { id:'users',     label:<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><Users size={14} style={{marginRight:6}}/>Пользователи{users.length?` (${users.length})`:''}</span>},
    { id:'groups',    label:<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><BookOpen size={14} style={{marginRight:6}}/>Группы{groups.length?` (${groups.length})`:''}</span>},
    { id:'payments',  label:<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><CreditCard size={14} style={{marginRight:6}}/>Платежи</span> },
    { id:'refunds',   label:<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><RotateCw size={14} style={{marginRight:6}}/>Возвраты{pendingRefunds?` (${pendingRefunds})`:''}</span>},
    { id:'hr',        label:<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><ClipboardList size={14} style={{marginRight:6}}/>HR{pendingHR?` (${pendingHR})`:''}</span>},
    { id:'requests',  label:<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}><Bell size={14} style={{marginRight:6}}/>Заявки{pendingGC?` (${pendingGC})`:''}</span>},
  ];

  /* filtered users */
  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    const matchSearch = !q || `${u.first_name} ${u.last_name} ${u.phone} ${u.email}`.toLowerCase().includes(q);
    const matchRole = userRole==='all' || u.role===userRole;
    return matchSearch && matchRole;
  });

  /* filtered payments */
  const filteredPayments = payments.filter(p => {
    const q = paySearch.toLowerCase();
    return !q || `${p.student_name||''} ${p.course_title||''}`.toLowerCase().includes(q);
  });

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6FF', fontFamily:font }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;} ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:${P.violetSoft};border-radius:2px;}`}</style>

      {/* NAVBAR */}
      <nav style={{ background:P.white, borderBottom:`1px solid ${P.border}`, padding: isMobile ? '0 16px' : '0 40px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(124,58,237,.06)' }}>
        <div onClick={()=>navigate('/')} style={{ fontWeight:900, fontSize:20, cursor:'pointer', color:P.ink }}>
          <span style={{ color:P.violet }}>Edu</span>Platform
          <span style={{ marginLeft:8, fontSize:11, background:P.violet, color:'#fff', borderRadius:6, padding:'2px 7px', fontWeight:800, verticalAlign:'middle' }}>KZ</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          {totalPending > 0 && (
            <div style={{ background:P.redPale, color:P.red, borderRadius:10, padding:'6px 14px', fontSize:13, fontWeight:800, border:`1px solid ${P.red}33` }}>
              <Bell size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>{totalPending} новых заявок
            </div>
          )}
          <Pill color={P.red} size={11}><Settings size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Администратор</Pill>
          <div style={{ display:'flex', alignItems:'center', gap:10, background:P.violetPale, border:`1.5px solid ${P.violetBorder}`, borderRadius:12, padding:'8px 16px' }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:13 }}>{user?.first_name?.[0]||'A'}</div>
            <span style={{ fontWeight:700, fontSize:14, color:P.ink }}>{user?.first_name} {user?.last_name}</span>
          </div>
          <button onClick={logout} style={{ background:'none', border:'none', color:P.slate, cursor:'pointer', fontSize:14, fontWeight:600, fontFamily:font }}>Выйти</button>
        </div>
      </nav>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>

        {/* TABS */}
        <div style={{ display:'flex', gap:8, marginBottom:28, overflowX:'auto', paddingBottom:4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'10px 18px', borderRadius:12, fontWeight:700, fontSize:13, fontFamily:font, cursor:'pointer', whiteSpace:'nowrap', transition:'all .2s', background:tab===t.id?`linear-gradient(135deg,${P.violet},${P.violetSoft})`:P.white, color:tab===t.id?'#fff':P.slate, border:`1.5px solid ${tab===t.id?'transparent':P.border}`, boxShadow:tab===t.id?`0 4px 16px rgba(124,58,237,.25)`:'none' }}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:80, color:P.slate }}><div style={{ fontSize:40, marginBottom:16 }}><Clock size={40}/></div>Загрузка...</div>
        ) : (
          <>
            {/* ══ OVERVIEW ══ */}
            {tab==='overview' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                {/* Banner */}
                <div style={{ background:`linear-gradient(135deg,${P.violet},${P.violetDark})`, borderRadius:24, padding:'28px 32px', color:'#fff', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }}/>
                  <div style={{ position:'relative' }}>
                    <h2 style={{ fontSize:26, fontWeight:900, margin:'0 0 6px', letterSpacing:-0.5 }}>Панель администратора <Settings size={26} style={{display:'inline-flex',verticalAlign:'middle'}}/></h2>
                    <p style={{ color:'rgba(255,255,255,.75)', margin:0, fontSize:15 }}>Управление платформой EduPlatform KZ</p>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:16 }}>
                  <StatCard icon={<Users size={30}/>} value={stats.total_students ?? users.filter(u=>u.role==='student').length} label="Студентов" color={P.violet}/>
                  <StatCard icon={<Users size={30}/>} value={stats.total_teachers ?? users.filter(u=>u.role==='teacher').length} label="Преподавателей" color={P.green}/>
                  <StatCard icon={<BookOpen size={30}/>} value={stats.total_groups ?? groups.length} label="Групп" color={P.orange}/>
                  <StatCard icon={<CreditCard size={30}/>} value={stats.total_revenue ? `${Number(stats.total_revenue).toLocaleString()}₸` : `${payments.filter(p=>p.status==='paid').length} опл.`} label="Выручка / Оплат" color={P.blue}/>
                </div>

                <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:16 }}>
                  <StatCard icon={<Clock size={30}/>} value={payments.filter(p=>p.status==='pending').length} label="Ожид. оплат" color={P.orange} sub="требуют подтверждения"/>
                  <StatCard icon={<RotateCw size={30}/>} value={pendingRefunds} label="Заявок на возврат" color={P.red} sub="ожидают решения"/>
                  <StatCard icon={<ClipboardList size={30}/>} value={pendingHR} label="Заявок учителей" color={P.blue} sub="ожидают рассмотрения"/>
                  <StatCard icon={<Bell size={30}/>} value={pendingGC} label="Смен групп" color={P.violet} sub="ожидают одобрения"/>
                </div>

                {/* Quick links to Django admin */}
                <div style={card()}>
                  <div style={{ fontWeight:800, fontSize:15, color:P.ink, marginBottom:16 }}><Settings size={15} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Быстрые ссылки (Django Admin)</div>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
                    {[
                      { icon:<Users size={16}/>, label:'Пользователи', url:'/admin/users/user/' },
                      { icon:<BookOpen size={16}/>, label:'Курсы', url:'/admin/courses/course/' },
                      { icon:<Users size={16}/>, label:'Группы', url:'/admin/groups/group/' },
                      { icon:<CreditCard size={16}/>, label:'Платежи', url:'/admin/payments/order/' },
                      { icon:<RotateCw size={16}/>, label:'Возвраты', url:'/admin/payments/refundrequest/' },
                      { icon:<ClipboardList size={16}/>, label:'Заявки учителей', url:'/admin/hr/teacherapplication/' },
                      { icon:<BarChart2 size={16}/>, label:'Посещаемость', url:'/admin/groups/attendance/' },
                      { icon:<ClipboardList size={16}/>, label:'Домашние задания', url:'/admin/homework/' },
                    ].map((l,i) => (
                      <a key={i} href={`http://127.0.0.1:8000${l.url}`} target="_blank" rel="noreferrer"
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', background:P.surface, borderRadius:12, border:`1px solid ${P.border}`, textDecoration:'none', color:P.ink, fontWeight:600, fontSize:14, transition:'all .2s' }}>
                        <span style={{ fontSize:20 }}>{l.icon}</span>{l.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ USERS ══ */}
            {tab==='users' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                  <div style={{ fontWeight:900, fontSize:22, color:P.ink, letterSpacing:-0.5 }}>Пользователи</div>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Поиск по имени, телефону..." style={{ ...inputS, width:260 }}/>
                    <select value={userRole} onChange={e=>setUserRole(e.target.value)} style={{ ...inputS, width:140 }}>
                      <option value="all">Все роли</option>
                      <option value="student">Студенты</option>
                      <option value="teacher">Учителя</option>
                      <option value="admin">Админы</option>
                    </select>
                  </div>
                </div>
                <div style={card({padding:0, overflow:'hidden'})}>
                  <Table
                    cols={['#', 'Имя', 'Телефон', 'Роль', 'Город', 'Класс', 'Дата регистрации']}
                    emptyMsg="Пользователи не найдены"
                    rows={filteredUsers.map((u,i) => [
                      <span style={{ color:P.muted, fontSize:12 }}>{i+1}</span>,
                      <div>
                        <div style={{ fontWeight:700 }}>{u.first_name} {u.last_name}</div>
                        {u.email && <div style={{ fontSize:12, color:P.slate }}>{u.email}</div>}
                      </div>,
                      <span style={{ fontFamily:'monospace', fontSize:13 }}>{u.phone || '—'}</span>,
                      <RoleBadge role={u.role}/>,
                      u.city || '—',
                      u.grade ? `${u.grade} класс` : '—',
                      new Date(u.date_joined||u.created_at||Date.now()).toLocaleDateString('ru-RU'),
                    ])}
                  />
                </div>
                <div style={{ marginTop:12, color:P.slate, fontSize:13 }}>
                  Показано: <strong>{filteredUsers.length}</strong> из {users.length}
                </div>
              </div>
            )}

            {/* ══ GROUPS ══ */}
            {tab==='groups' && (
              <div>
                <div style={{ fontWeight:900, fontSize:22, color:P.ink, marginBottom:20, letterSpacing:-0.5 }}>Группы</div>
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
                  {groups.length===0 ? (
                    <div style={card({textAlign:'center',padding:60,gridColumn:'1/-1'})}><div style={{fontSize:48,marginBottom:14}}><BookOpen size={48}/></div><div style={{color:P.slate}}>Нет групп</div></div>
                  ) : groups.map(g => {
                    const studentCount = g.enrollments?.filter(e=>e.status==='active').length ?? g.student_count ?? 0;
                    const tc = { ent:P.violet, ielts:P.green, sat:P.red };
                    const col = tc[g.course?.course_type] || P.violet;
                    return (
                      <div key={g.id} style={card()}>
                        <div style={{ height:4, background:`linear-gradient(90deg,${col},${col}66)`, borderRadius:4, marginBottom:18, marginTop:-24, marginLeft:-24, marginRight:-24 }}/>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                          <Pill color={col} size={11}>{g.course?.course_type?.toUpperCase()||'ГРУППА'}</Pill>
                          <Pill color={g.is_active?P.green:P.slate} size={10}>{g.is_active?'Активна':'Неактивна'}</Pill>
                        </div>
                        <div style={{ fontWeight:900, fontSize:16, color:P.ink, marginBottom:4 }}>{g.name}</div>
                        {g.course?.title && <div style={{ color:P.slate, fontSize:13, marginBottom:12 }}><BookOpen size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>{g.course.title}</div>}
                        {g.teacher && <div style={{ color:P.slate, fontSize:13, marginBottom:12 }}><Users size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>{g.teacher.first_name} {g.teacher.last_name}</div>}
                        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:8 }}>
                          <div style={{ background:P.violetPale, borderRadius:10, padding:'10px', textAlign:'center', border:`1px solid ${P.violetBorder}` }}>
                            <div style={{ fontWeight:900, fontSize:20, color:P.violet }}>{studentCount}</div>
                            <div style={{ fontSize:11, color:P.slate, fontWeight:600 }}>Студентов</div>
                          </div>
                          <div style={{ background:P.surface, borderRadius:10, padding:'10px', textAlign:'center', border:`1px solid ${P.border}` }}>
                            <div style={{ fontWeight:900, fontSize:20, color:P.ink }}>{g.max_students||15}</div>
                            <div style={{ fontSize:11, color:P.slate, fontWeight:600 }}>Макс. мест</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ PAYMENTS ══ */}
            {tab==='payments' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                  <div style={{ fontWeight:900, fontSize:22, color:P.ink, letterSpacing:-0.5 }}>Платежи</div>
                  <input value={paySearch} onChange={e=>setPaySearch(e.target.value)} placeholder="Поиск по студенту, курсу..." style={{ ...inputS, width:300 }}/>
                </div>

                {/* Summary */}
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                  {[
                    { label:'Всего',     val:payments.length,                              color:P.ink    },
                    { label:'Оплачено',  val:payments.filter(p=>p.status==='paid').length, color:P.green  },
                    { label:'Ожидает',   val:payments.filter(p=>p.status==='pending').length, color:P.orange },
                    { label:'Отменено',  val:payments.filter(p=>p.status==='cancelled').length, color:P.red },
                  ].map((s,i) => (
                    <div key={i} style={{ ...card({padding:'16px 20px'}), textAlign:'center' }}>
                      <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.val}</div>
                      <div style={{ fontSize:12, color:P.slate, marginTop:3, fontWeight:600 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={card({padding:0, overflow:'hidden'})}>
                  <Table
                    cols={['#', 'Студент', 'Курс', 'Сумма', 'Статус', 'Дата', 'Действие']}
                    emptyMsg="Платежи не найдены"
                    rows={filteredPayments.map((p,i) => [
                      <span style={{ color:P.muted, fontSize:12 }}>{i+1}</span>,
                      <div style={{ fontWeight:700, fontSize:14 }}>{p.student_name||'—'}</div>,
                      <div style={{ fontSize:13, color:P.slate }}>{p.course_title||'—'}</div>,
                      <div style={{ fontWeight:800, color:P.violet }}>{Number(p.final_amount||p.amount||0).toLocaleString()}₸</div>,
                      <PayStatus status={p.status}/>,
                      <span style={{ fontSize:12, color:P.muted }}>{new Date(p.created_at||Date.now()).toLocaleDateString('ru-RU')}</span>,
                      p.status==='created' ? (
                        <button onClick={()=>handleMarkPaid(p.id)} disabled={processingId===p.id} style={btnG({opacity:processingId===p.id?0.5:1})}>
                          {processingId===p.id?'...':<span><CheckCircle size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Подтвердить</span>}
                        </button>
                      ) : <span style={{ color:P.muted, fontSize:12 }}>—</span>,
                    ])}
                  />
                </div>
              </div>
            )}

            {/* ══ REFUNDS ══ */}
            {tab==='refunds' && (
              <div>
                <div style={{ fontWeight:900, fontSize:22, color:P.ink, marginBottom:20, letterSpacing:-0.5 }}>
                  Заявки на возврат {pendingRefunds>0 && <Pill color={P.red}>{pendingRefunds} ожидают</Pill>}
                </div>
                {refunds.length===0 ? (
                  <div style={card({textAlign:'center',padding:60})}><div style={{fontSize:48,marginBottom:14}}><Gift size={48}/></div><div style={{color:P.slate,fontSize:16}}>Нет заявок на возврат</div></div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {refunds.map(r => (
                      <div key={r.id} style={card({border:`1.5px solid ${r.status==='pending'?P.orange+'55':P.border}`, background:r.status==='pending'?P.orangePale:P.white})}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:12 }}>
                          <div>
                            <div style={{ fontWeight:800, fontSize:16, color:P.ink }}>
                              {r.student_name||'Студент'}
                            </div>
                            <div style={{ color:P.slate, fontSize:13, marginTop:3 }}>
                             <BookOpen size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>{r.course_title||'—'} · {Number(r.order_amount||r.refund_amount||0).toLocaleString()}₸
                            </div>
                            <div style={{ color:P.muted, fontSize:12, marginTop:3 }}>{new Date(r.created_at||Date.now()).toLocaleString('ru-RU')}</div>
                          </div>
                          <Pill color={r.status==='pending'?P.orange:r.status==='approved'?P.green:P.red} size={11}>
                            {r.status==='pending'?<span><Clock size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Ожидает</span>:r.status==='approved'?<span><CheckCircle size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Одобрен</span>:<span><X size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Отклонён</span>}
                          </Pill>
                        </div>
                        {r.reason && (
                          <div style={{ background:P.white, borderRadius:12, padding:'12px 16px', marginBottom:12, color:P.ink, fontSize:14, border:`1px solid ${P.border}` }}>
                            <strong style={{ color:P.slate, fontSize:12 }}>Причина:</strong><br/>{r.reason}
                          </div>
                        )}
                        {r.status==='pending' && (
                          <div style={{ display:'flex', gap:10 }}>
                            <button onClick={()=>handleRefund(r.id,'approve')} disabled={processingId===r.id} style={btnG({flex:1, padding:'10px', opacity:processingId===r.id?0.5:1})}>
                              <CheckCircle size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Одобрить возврат
                            </button>
                            <button onClick={()=>handleRefund(r.id,'reject')} disabled={processingId===r.id} style={btnR({flex:1, padding:'10px', opacity:processingId===r.id?0.5:1})}>
                              <X size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Отклонить
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ HR APPLICATIONS ══ */}
            {tab==='hr' && (
              <div>
                <div style={{ fontWeight:900, fontSize:22, color:P.ink, marginBottom:20, letterSpacing:-0.5 }}>
                  Заявки преподавателей {pendingHR>0 && <Pill color={P.blue}>{pendingHR} ожидают</Pill>}
                </div>
                {hrApps.length===0 ? (
                  <div style={card({textAlign:'center',padding:60})}><div style={{fontSize:48,marginBottom:14}}><ClipboardList size={48}/></div><div style={{color:P.slate,fontSize:16}}>Нет заявок</div></div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {hrApps.map(a => (
                      <div key={a.id} style={card({border:`1.5px solid ${a.status==='pending'?P.blue+'44':P.border}`, background:a.status==='pending'?P.bluePale:P.white})}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:14 }}>
                          <div>
                            <div style={{ fontWeight:800, fontSize:17, color:P.ink }}>{a.first_name||a.applicant?.first_name||'—'} {a.last_name||a.applicant?.last_name||''}</div>
                            <div style={{ color:P.slate, fontSize:13, marginTop:3 }}><span style={{display:'inline-flex',alignItems:'center',gap:4}}><Phone size={12}/>{a.phone||a.applicant?.phone||'—'}</span></div>
                            {a.subject && <div style={{ color:P.slate, fontSize:13 }}><BookOpen size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Предмет: {a.subject}</div>}
                            {a.experience_years !== undefined && <div style={{ color:P.slate, fontSize:13 }}><span style={{display:'inline-flex',alignItems:'center',gap:4}}><Trophy size={12}/>Опыт: {a.experience_years} лет</span></div>}
                            <div style={{ color:P.muted, fontSize:12, marginTop:3 }}>{new Date(a.created_at||Date.now()).toLocaleDateString('ru-RU')}</div>
                          </div>
                          <Pill color={a.status==='pending'?P.blue:a.status==='approved'?P.green:P.red} size={11}>
                            {a.status==='pending'?<span><Clock size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>На рассмотрении</span>:a.status==='approved'?<span><CheckCircle size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Принят</span>:<span><X size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Отклонён</span>}
                          </Pill>
                        </div>
                        {a.cover_letter && (
                          <div style={{ background:P.white, borderRadius:12, padding:'12px 16px', marginBottom:14, color:P.ink, fontSize:14, lineHeight:1.7, border:`1px solid ${P.border}` }}>
                            {a.cover_letter}
                          </div>
                        )}
                        {a.status==='pending' && (
                          <div style={{ display:'flex', gap:10 }}>
                            <button onClick={()=>handleHR(a.id,'approved')} disabled={processingId===a.id} style={btnG({flex:1, padding:'10px', opacity:processingId===a.id?0.5:1})}>
                              <CheckCircle size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Принять
                            </button>
                            <button onClick={()=>handleHR(a.id,'rejected')} disabled={processingId===a.id} style={btnR({flex:1, padding:'10px', opacity:processingId===a.id?0.5:1})}>
                              <X size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Отклонить
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ GROUP CHANGE REQUESTS ══ */}
            {tab==='requests' && (
              <div>
                <div style={{ fontWeight:900, fontSize:22, color:P.ink, marginBottom:20, letterSpacing:-0.5 }}>
                  Заявки на смену группы {pendingGC>0 && <Pill color={P.violet}>{pendingGC} ожидают</Pill>}
                </div>
                {groupChanges.length===0 ? (
                  <div style={card({textAlign:'center',padding:60})}><div style={{fontSize:48,marginBottom:14}}><Bell size={48}/></div><div style={{color:P.slate,fontSize:16}}>Нет заявок на смену группы</div></div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {groupChanges.map(r => (
                      <div key={r.id} style={card({border:`1.5px solid ${r.status==='pending'?P.violetBorder:P.border}`, background:r.status==='pending'?P.violetPale:P.white})}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:12 }}>
                          <div>
                            <div style={{ fontWeight:800, fontSize:16, color:P.ink }}>
                              {r.student_name||'Студент'}
                            </div>
                            {r.current_group && <div style={{ color:P.slate, fontSize:13, marginTop:3 }}><BookOpen size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Текущая группа: {r.current_group?.name||r.current_group}</div>}
                            <div style={{ color:P.muted, fontSize:12, marginTop:3 }}>{new Date(r.created_at||Date.now()).toLocaleString('ru-RU')}</div>
                          </div>
                          <Pill color={r.status==='pending'?P.violet:r.status==='approved'?P.green:P.red} size={11}>
                            {r.status==='pending'?<span><Clock size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Ожидает</span>:r.status==='approved'?<span><CheckCircle size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Одобрено</span>:<span><X size={11} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Отклонено</span>}
                          </Pill>
                        </div>
                        {r.reason && (
                          <div style={{ background:P.white, borderRadius:12, padding:'12px 16px', marginBottom:12, color:P.ink, fontSize:14, border:`1px solid ${P.border}` }}>
                            <strong style={{ color:P.slate, fontSize:12 }}>Причина:</strong><br/>{r.reason}
                          </div>
                        )}
                        {r.status==='pending' && (
                          <div style={{ display:'flex', gap:10 }}>
                            <button onClick={()=>handleGC(r.id,'approved')} disabled={processingId===r.id} style={btnG({flex:1, padding:'10px', opacity:processingId===r.id?0.5:1})}>
                              <CheckCircle size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Одобрить
                            </button>
                            <button onClick={()=>handleGC(r.id,'rejected')} disabled={processingId===r.id} style={btnR({flex:1, padding:'10px', opacity:processingId===r.id?0.5:1})}>
                              <X size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:2}}/>Отклонить
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
