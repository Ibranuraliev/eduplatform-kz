import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { coursesAPI, paymentsAPI } from '../api';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Lock, Play, Video, FileText, CheckCircle, Unlock, Hourglass, Mail, Circle, Flame, User, Users, Calendar, Clock, Lightbulb, X, Frown, Check, ClipboardList, BookOpen, Target, Star, MapPin, Globe, GraduationCap, Banknote, ShoppingCart, Key, CreditCard, Film, Plane, MessageCircle, Link as LinkIcon, Plus } from 'lucide-react';

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
  red:          '#DC2626',
};
const font = "'Nunito','Segoe UI',system-ui,sans-serif";
const btnP = (e={}) => ({ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:14, padding:'14px 28px', fontWeight:800, fontSize:15, fontFamily:font, cursor:'pointer', boxShadow:`0 6px 20px rgba(124,58,237,.3)`, transition:'all .2s', width:'100%', ...e });
const btnO = (e={}) => ({ background:P.violetPale, color:P.violet, border:`1.5px solid ${P.violetBorder}`, borderRadius:12, padding:'11px 22px', fontWeight:700, fontSize:14, fontFamily:font, cursor:'pointer', transition:'all .2s', ...e });

function Pill({ children, color=P.violet, size=12 }) {
  return <span style={{ display:'inline-flex', alignItems:'center', background:color+'18', color, borderRadius:100, padding:'4px 12px', fontSize:size, fontWeight:800, letterSpacing:0.4, fontFamily:font, border:`1px solid ${color}22`, whiteSpace:'nowrap' }}>{children}</span>;
}

/* ── Module accordion item ── */
function ModuleItem({ module, isEnrolled, index }) {
  const [open, setOpen] = useState(index === 0);
  const lessonCount = module.lessons?.length || 0;

  return (
    <div style={{ border:`1.5px solid ${open ? P.violetBorder : P.border}`, borderRadius:16, overflow:'hidden', transition:'border-color .2s', background: open ? P.violetPale : P.white }}>
      {/* Header */}
      <div onClick={() => setOpen(!open)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 22px', cursor:'pointer', userSelect:'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:36, height:36, borderRadius:10, background: open ? P.violet : P.surface, color: open ? '#fff' : P.slate, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, flexShrink:0, border:`1.5px solid ${open?'transparent':P.border}`, transition:'all .2s' }}>
            {String(index+1).padStart(2,'0')}
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:P.ink }}>{module.title}</div>
            <div style={{ fontSize:12, color:P.muted, marginTop:2 }}>{lessonCount} {lessonCount===1?'урок':lessonCount<5?'урока':'уроков'}</div>
          </div>
        </div>
        <div style={{ fontSize:20, color:P.violet, transform:`rotate(${open?'180deg':'0deg'})`, transition:'transform .3s', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronDown size={20} /></div>
      </div>

      {/* Lessons list */}
      {open && lessonCount > 0 && (
        <div style={{ borderTop:`1px solid ${P.violetBorder}`, padding:'8px 0' }}>
          {module.lessons.map((lesson) => (
            <div key={lesson.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 22px', opacity: isEnrolled ? 1 : 0.7 }}>
              {/* Icon */}
              <div style={{ width:30, height:30, borderRadius:8, background: isEnrolled ? P.violetPale : P.surface, border:`1.5px solid ${isEnrolled ? P.violetBorder : P.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                {isEnrolled ? <Play size={16} color={P.violet} fill={P.violet} /> : <Lock size={16} color={P.slate} />}
              </div>

              {/* Info */}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color: isEnrolled ? P.ink : P.slate }}>
                  {isEnrolled ? lesson.title : lesson.title}
                </div>
                <div style={{ display:'flex', gap:8, marginTop:3, flexWrap:'wrap' }}>
                  {lesson.has_video    && <span style={{ fontSize:11, color:P.muted, display:'flex', alignItems:'center', gap:4 }}><Video size={12} />Видео</span>}
                  {lesson.has_homework && <span style={{ fontSize:11, color:P.muted, display:'flex', alignItems:'center', gap:4 }}><FileText size={12} />Домашка</span>}
                  {lesson.has_test     && <span style={{ fontSize:11, color:P.muted, display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={12} />Тест</span>}
                  {lesson.has_materials && <span style={{ fontSize:11, color:P.muted, display:'flex', alignItems:'center', gap:4 }}><FileText size={12} />Материалы</span>}
                </div>
              </div>

              {/* Action */}
              {isEnrolled ? (
                <Link to={`/lessons/${lesson.id}`}
                  style={{ fontSize:12, color:P.violet, fontWeight:800, textDecoration:'none', background:P.white, border:`1.5px solid ${P.violetBorder}`, borderRadius:10, padding:'6px 14px', whiteSpace:'nowrap' }}>
                  Открыть →
                </Link>
              ) : (
                <span style={{ fontSize:11, color:P.muted, background:P.surface, border:`1px solid ${P.border}`, borderRadius:8, padding:'4px 10px', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
                  <Lock size={12} /> Закрыто
                </span>
              )}
            </div>
          ))}

          {/* Lock banner for non-enrolled */}
          {!isEnrolled && (
            <div style={{ margin:'8px 16px 12px', background:`linear-gradient(135deg,${P.violet}11,${P.violetSoft}11)`, border:`1.5px solid ${P.violetBorder}`, borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
              <Unlock size={20} color={P.violet} />
              <span style={{ fontSize:13, color:P.violet, fontWeight:700 }}>Купи курс — получи полный доступ ко всем урокам</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════ GROUP PICKER MODAL ════════════════════ */
function GroupPickerModal({ courseId, groups, loading, alreadyInGroup, onClose, onJoined }) {
  const P2 = {
    violet:'#7C3AED', violetSoft:'#8B5CF6', violetPale:'#F5F3FF',
    violetBorder:'rgba(124,58,237,0.18)', ink:'#0F0A1E', slate:'#475569',
    muted:'#94A3B8', border:'#E8E4F0', white:'#FFFFFF', surface:'#FAFAF9',
    green:'#059669', greenPale:'#F0FDF4', orange:'#D97706', orangePale:'#FFFBEB',
    red:'#DC2626',
  };
  const font2 = "'Nunito','Segoe UI',system-ui,sans-serif";
  const [joiningId, setJoiningId] = useState(null);
  const [msgs, setMsgs] = useState({});

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { weekday:'short', month:'short', day:'numeric' })
      + ' ' + d.toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });
  };

  const spotsLeft = (g) => g.max_students - g.student_count;

  const handleJoin = async (groupId, isFull) => {
    setJoiningId(groupId);
    try {
      await api.post(`/groups/${groupId}/join/`);
      setMsgs(p => ({ ...p, [groupId]: { ok: true, text: isFull ? 'Добавлен в лист ожидания!' : 'Ты в группе!' } }));
      setTimeout(() => onJoined(), 1500);
    } catch(e) {
      setMsgs(p => ({ ...p, [groupId]: { ok: false, text: e.response?.data?.error || 'Ошибка' } }));
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,10,30,.6)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24, backdropFilter:'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:P2.white, borderRadius:28, width:'100%', maxWidth:680, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 24px 80px rgba(124,58,237,.25)' }}>

        {/* Header */}
        <div style={{ padding:'28px 32px 20px', borderBottom:`1.5px solid ${P2.border}`, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontWeight:900, fontSize:22, color:P2.ink, fontFamily:font2, letterSpacing:-0.5, display:'flex', alignItems:'center', gap:8 }}>
              {alreadyInGroup ? <><CheckCircle size={24} /> Ты уже в группе</> : <><Calendar size={24} /> Выбери группу</>}
            </div>
            <div style={{ color:P2.slate, fontSize:14, marginTop:4, fontFamily:font2 }}>
              {alreadyInGroup
                ? 'Ты уже записан в группу для этого курса'
                : 'Выбери удобное время — занятия проходят в Zoom'}
            </div>
          </div>
          <button onClick={onClose} style={{ background:P2.surface, border:`1.5px solid ${P2.border}`, borderRadius:10, width:36, height:36, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><X size={18} /></button>
        </div>

        {/* Content */}
        <div style={{ overflowY:'auto', padding:'20px 32px 28px', flex:1 }}>

          {/* Already enrolled banner */}
          {alreadyInGroup && (
            <div style={{ background:P2.greenPale, border:`1.5px solid ${P2.green}33`, borderRadius:16, padding:'18px 22px', marginBottom:20 }}>
              <div style={{ fontWeight:800, fontSize:15, color:P2.green, marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
                <Users size={18} /> {alreadyInGroup.group?.name || 'Группа'}
              </div>
              <div style={{ color:'#065F46', fontSize:13, lineHeight:1.6 }}>
                Ты уже записан в эту группу. Перейди в кабинет чтобы увидеть расписание.
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:P2.slate, fontFamily:font2 }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}><Hourglass size={36} color={P2.slate} /></div>
              Загружаем группы...
            </div>
          ) : groups.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', fontFamily:font2 }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><Mail size={48} color={P2.slate} /></div>
              <div style={{ fontWeight:700, fontSize:16, color:P2.ink, marginBottom:8 }}>Групп пока нет</div>
              <div style={{ color:P2.slate, fontSize:14, lineHeight:1.6, maxWidth:360, margin:'0 auto' }}>
                Менеджер свяжется с тобой в ближайшее время для записи в группу.
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {groups.map(g => {
                const full = g.is_full;
                const spots = spotsLeft(g);
                const msg = msgs[g.id];
                const isJoining = joiningId === g.id;
                const isWl = g.is_waitlisted;

                return (
                  <div key={g.id} style={{
                    border: `1.5px solid ${full ? P2.border : isWl ? P2.orange+'55' : P2.violetBorder}`,
                    borderRadius: 18,
                    padding: '20px 22px',
                    background: full ? P2.surface : P2.white,
                    opacity: (alreadyInGroup || isWl) ? 0.85 : 1,
                    transition: 'all .2s',
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                      {/* Left info */}
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                          <div style={{ fontWeight:900, fontSize:16, color:P2.ink, fontFamily:font2 }}>{g.name}</div>
                          {full ? (
                            <span style={{ background:'#FEF2F2', color:P2.red, borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', gap:4 }}><Circle size={10} /> Мест нет</span>
                          ) : spots <= 3 ? (
                            <span style={{ background:P2.orangePale, color:P2.orange, borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', gap:4 }}><Flame size={10} /> {spots} места</span>
                          ) : (
                            <span style={{ background:P2.greenPale, color:P2.green, borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={10} /> {spots} мест</span>
                          )}
                          {isWl && (
                            <span style={{ background:P2.orangePale, color:P2.orange, borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', gap:4 }}><Hourglass size={10} /> В очереди</span>
                          )}
                        </div>

                        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:g.upcoming_sessions?.length ? 12 : 0 }}>
                          <div style={{ fontSize:13, color:P2.slate, display:'flex', alignItems:'center', gap:5 }}>
                            <User size={14} /> <strong>{g.teacher_name}</strong>
                          </div>
                          <div style={{ fontSize:13, color:P2.slate, display:'flex', alignItems:'center', gap:5 }}>
                            <Users size={14} /> {g.student_count}/{g.max_students} студентов
                          </div>
                          {g.schedule_days && (
                            <div style={{ fontSize:13, color:P2.slate, display:'flex', alignItems:'center', gap:5 }}><Calendar size={14} /> {g.schedule_days}</div>
                          )}
                          {g.schedule_time && (
                            <div style={{ fontSize:13, color:P2.slate, display:'flex', alignItems:'center', gap:5 }}><Clock size={14} /> {g.schedule_time}</div>
                          )}
                        </div>

                        {/* Capacity bar */}
                        <div style={{ height:6, background:P2.border, borderRadius:3, marginBottom:12, overflow:'hidden' }}>
                          <div style={{
                            height:'100%',
                            width:`${(g.student_count/g.max_students)*100}%`,
                            background: full ? P2.red : spots <= 3 ? P2.orange : P2.green,
                            borderRadius:3, transition:'width .6s ease'
                          }}/>
                        </div>

                        {/* Upcoming sessions */}
                        {g.upcoming_sessions?.length > 0 && (
                          <div>
                            <div style={{ fontSize:11, fontWeight:700, color:P2.muted, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>
                              Ближайшие занятия
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                              {g.upcoming_sessions.map(s => (
                                <div key={s.id} style={{ fontSize:12, color:P2.slate, display:'flex', alignItems:'center', gap:8 }}>
                                  <Play size={10} color={P2.violet} fill={P2.violet} />
                                  {formatTime(s.scheduled_at)}
                                  {s.lesson_title && <span style={{ color:P2.muted }}>· {s.lesson_title}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Join button */}
                      {!alreadyInGroup && (
                        <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                          {msg ? (
                            <div style={{ background: msg.ok ? P2.greenPale : '#FEF2F2', color: msg.ok ? P2.green : P2.red, borderRadius:10, padding:'8px 14px', fontSize:13, fontWeight:700, fontFamily:font2 }}>
                              {msg.text}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleJoin(g.id, full)}
                              disabled={isJoining || isWl}
                              style={{
                                background: isWl ? P2.orangePale : full ? '#FEF2F2' : `linear-gradient(135deg,${P2.violet},${P2.violetSoft})`,
                                color: isWl ? P2.orange : full ? P2.red : '#fff',
                                border: `1.5px solid ${isWl ? P2.orange+'55' : full ? P2.red+'33' : 'transparent'}`,
                                borderRadius: 12,
                                padding: '10px 20px',
                                fontWeight: 800,
                                fontSize: 13,
                                fontFamily: font2,
                                cursor: (isJoining || isWl) ? 'not-allowed' : 'pointer',
                                opacity: isJoining ? 0.7 : 1,
                                whiteSpace: 'nowrap',
                                boxShadow: (!full && !isWl) ? '0 4px 14px rgba(124,58,237,.25)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              {isJoining ? <><Hourglass size={14} />...</> : isWl ? <><Hourglass size={14} /> В очереди</> : full ? <><ClipboardList size={14} /> В лист ожидания</> : <><CheckCircle size={14} /> Выбрать группу</>}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 32px', borderTop:`1.5px solid ${P2.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:P2.surface }}>
          <div style={{ fontSize:12, color:P2.muted, fontFamily:font2, display:'flex', alignItems:'center', gap:6 }}>
            <Lightbulb size={14} /> Можно сменить группу позже через кабинет
          </div>
          <button onClick={onClose} style={{ background:P2.white, color:P2.slate, border:`1.5px solid ${P2.border}`, borderRadius:12, padding:'9px 22px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:font2 }}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ MAIN ════════════════════════ */
export default function CoursePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying]   = useState(false);
  const [message, setMessage] = useState(''); // 'success' | 'error:...'
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Group picker state
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [groupMsg, setGroupMsg] = useState({});
  const [alreadyInGroup, setAlreadyInGroup] = useState(null);


  useEffect(() => {
    coursesAPI.detail(id)
      .then(res => {
        setCourse(res.data);
        setIsEnrolled(!!res.data.is_enrolled);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuy = async () => {
  if (!user) { navigate('/login'); return; }
  
  setBuying(true);
  setMessage('');
  
  try {
    const res = await paymentsAPI.createOrder({ course_id: parseInt(id) });
    setMessage('success');
    window._lastOrder = res.data;

    // Вместо горы кода просто вызываем общую функцию
    await openGroupPicker(); 

  } catch (err) {
    setMessage('error:' + (err.response?.data?.error || 'Ошибка при создании заказа'));
  } finally {
    setBuying(false);
  }
};

  /* ── helpers ── */
  const totalLessons = course?.modules?.reduce((s,m) => s + (m.lessons?.length||0), 0) || 0;
  const typeColor = { ent:P.violet, ielts:P.green, sat:P.red };
  const accentColor = course ? (typeColor[course.course_type] || P.violet) : P.violet;

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8F6FF', fontFamily:font }}>
      <div style={{ textAlign:'center', color:P.slate }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}><Hourglass size={44} color={P.slate} /></div>
        <div style={{ fontSize:18 }}>Загрузка курса...</div>
      </div>
    </div>
  );

  if (!course) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8F6FF', fontFamily:font }}>
      <div style={{ textAlign:'center', color:P.slate }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}><Frown size={44} color={P.slate} /></div>
        <div style={{ fontSize:18, marginBottom:20 }}>Курс не найден</div>
        <button onClick={() => navigate('/')} style={btnO()}>← На главную</button>
      </div>
    </div>
  );
const openGroupPicker = async () => {
  setGroupsLoading(true);
  try {
    const gr = await api.get(`/groups/for-course/${id}/`);
    setGroups(gr.data.groups || []);
    setAlreadyInGroup(gr.data.already_enrolled || null);
    setShowGroupPicker(true);
  } catch(e) { console.error(e); }
  finally { setGroupsLoading(false); }
};
  return (
    <div style={{ minHeight:'100vh', background:'#F8F6FF', fontFamily:font }}>
      {showGroupPicker && <GroupPickerModal courseId={id} groups={groups} loading={groupsLoading} alreadyInGroup={alreadyInGroup} onClose={()=>setShowGroupPicker(false)} onJoined={()=>{setShowGroupPicker(false);setIsEnrolled(true);}} />}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;} ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:${P.violetSoft};border-radius:2px;}`}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ background:P.white, borderBottom:`1px solid ${P.border}`, padding:'0 40px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(124,58,237,.06)' }}>
        <Link to="/" style={{ fontWeight:900, fontSize:20, textDecoration:'none', color:P.ink }}>
          <span style={{ color:P.violet }}>Edu</span>Platform
          <span style={{ marginLeft:8, fontSize:11, background:P.violet, color:'#fff', borderRadius:6, padding:'2px 7px', fontWeight:800, verticalAlign:'middle' }}>KZ</span>
        </Link>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          {user ? (
            <button onClick={() => navigate('/dashboard')} style={btnO({padding:'9px 20px', fontSize:13})}>Мой кабинет</button>
          ) : (
            <>
              <Link to="/login" style={{ color:P.slate, fontWeight:700, fontSize:14, textDecoration:'none' }}>Войти</Link>
              <Link to="/register" style={{ ...btnP({width:'auto', padding:'9px 20px', fontSize:13}), textDecoration:'none' }}>Регистрация</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ background:`linear-gradient(135deg, ${accentColor} 0%, ${P.violetDark} 100%)`, padding:'56px 40px 80px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:300, height:300, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-40, left:'30%', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }}/>
        <div style={{ maxWidth:1100, margin:'0 auto', position:'relative' }}>
          {/* Breadcrumb */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, fontSize:13, color:'rgba(255,255,255,.6)', fontWeight:600 }}>
            <Link to="/" style={{ color:'rgba(255,255,255,.6)', textDecoration:'none' }}>Главная</Link>
            <span>›</span>
            <span style={{ color:'rgba(255,255,255,.9)' }}>{course.title}</span>
          </div>

          <div style={{ display:'flex', gap:14, marginBottom:16, flexWrap:'wrap' }}>
            <Pill color="#fff" size={12}>{course.course_type?.toUpperCase()}</Pill>
            {course.subject && <Pill color="rgba(255,255,255,.7)" size={12}>{course.subject}</Pill>}
            {course.is_new && <Pill color={P.green} size={12}>🆕 Новый</Pill>}
          </div>

          <h1 style={{ fontSize:'clamp(24px,3.5vw,42px)', fontWeight:900, color:'#fff', margin:'0 0 16px', letterSpacing:-1, lineHeight:1.1, maxWidth:700 }}>
            {course.title}
          </h1>
          <p style={{ color:'rgba(255,255,255,.8)', fontSize:17, lineHeight:1.7, maxWidth:620, margin:'0 0 28px' }}>
            {course.description}
          </p>

          {/* Meta row */}
          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            {[
              { Icon: BookOpen, label:`${course.modules?.length||0} модулей` },
              { Icon: Film, label:`${totalLessons} уроков` },
              { Icon: Users, label:`${course.student_count||'500'}+ студентов` },
              { Icon: Star, label:'4.9 рейтинг' },
            ].map((m,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, color:'rgba(255,255,255,.85)', fontSize:14, fontWeight:600 }}>
                <m.Icon size={18} />{m.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ maxWidth:1100, margin:'40px auto 0', padding:'0 24px 60px', display:'grid', gridTemplateColumns:'1fr 340px', gap:28, alignItems:'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

          {/* Enrolled banner */}
          {isEnrolled && (
            <div style={{ background:`linear-gradient(135deg,${P.green},#047857)`, borderRadius:20, padding:'20px 28px', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
              <div>
                <div style={{ fontWeight:900, fontSize:17, marginBottom:4, display:'flex', alignItems:'center', gap:8 }}><CheckCircle size={20} /> Вы записаны на этот курс!</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,.8)' }}>Все уроки, материалы и задания доступны</div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={openGroupPicker} style={{ background:'rgba(255,255,255,.15)', color:'#fff', border:'2px solid rgba(255,255,255,.5)', borderRadius:12, padding:'10px 22px', fontWeight:800, fontSize:14, fontFamily:font, cursor:'pointer', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:8 }}>
                  <Calendar size={16} /> Выбрать группу
                </button>
                <button onClick={()=>navigate('/dashboard')} style={{ background:'rgba(255,255,255,.2)', color:'#fff', border:'2px solid rgba(255,255,255,.5)', borderRadius:12, padding:'10px 22px', fontWeight:800, fontSize:14, fontFamily:font, cursor:'pointer', whiteSpace:'nowrap' }}>
                  Мой кабинет →
                </button>
              </div>
            </div>
          )}
          {course.what_you_learn?.length > 0 && (
            <div style={{ background:P.white, borderRadius:20, border:`1.5px solid ${P.border}`, padding:'28px 32px' }}>
              <h2 style={{ fontWeight:900, fontSize:20, color:P.ink, margin:'0 0 20px', letterSpacing:-0.3, display:'flex', alignItems:'center', gap:8 }}><Target size={24} /> Чему вы научитесь</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {course.what_you_learn.map((item, i) => (
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <Check size={16} color={P.green} style={{ flexShrink:0, marginTop:1 }} />
                    <span style={{ fontSize:14, color:P.ink, lineHeight:1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Course content / modules */}
          {course.modules?.length > 0 && (
            <div style={{ background:P.white, borderRadius:20, border:`1.5px solid ${P.border}`, padding:'28px 32px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <h2 style={{ fontWeight:900, fontSize:20, color:P.ink, margin:0, letterSpacing:-0.3, display:'flex', alignItems:'center', gap:8 }}><ClipboardList size={24} /> Программа курса</h2>
                <div style={{ color:P.muted, fontSize:13, fontWeight:600 }}>
                  {course.modules.length} модулей · {totalLessons} уроков
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {course.modules.map((m, i) => (
                  <ModuleItem key={m.id} module={m} isEnrolled={isEnrolled} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Teacher */}
          {course.teacher && (
            <div style={{ background:P.white, borderRadius:20, border:`1.5px solid ${P.border}`, padding:'28px 32px' }}>
              <h2 style={{ fontWeight:900, fontSize:20, color:P.ink, margin:'0 0 20px', letterSpacing:-0.3, display:'flex', alignItems:'center', gap:8 }}><User size={24} /> Преподаватель</h2>
              <div style={{ display:'flex', gap:18, alignItems:'flex-start' }}>
                <div style={{ width:64, height:64, borderRadius:'50%', background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:24, flexShrink:0 }}>
                  {course.teacher.first_name?.[0] || '?'}
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:17, color:P.ink }}>{course.teacher.first_name} {course.teacher.last_name}</div>
                  {course.teacher.subjects && <div style={{ color:P.slate, fontSize:14, marginTop:3, display:'flex', alignItems:'center', gap:4 }}><BookOpen size={14} /> {course.teacher.subjects}</div>}
                  {course.teacher.experience_years && <div style={{ color:P.slate, fontSize:14, marginTop:2, display:'flex', alignItems:'center', gap:4 }}><Star size={14} /> Опыт: {course.teacher.experience_years} лет</div>}
                  {course.teacher.bio && <p style={{ color:P.slate, fontSize:14, lineHeight:1.7, margin:'10px 0 0' }}>{course.teacher.bio}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Requirements */}
          {course.requirements?.length > 0 && (
            <div style={{ background:P.white, borderRadius:20, border:`1.5px solid ${P.border}`, padding:'28px 32px' }}>
              <h2 style={{ fontWeight:900, fontSize:20, color:P.ink, margin:'0 0 16px', letterSpacing:-0.3, display:'flex', alignItems:'center', gap:8 }}><MapPin size={24} /> Требования</h2>
              <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:8 }}>
                {course.requirements.map((r,i) => (
                  <li key={i} style={{ display:'flex', gap:10, fontSize:14, color:P.slate, lineHeight:1.5 }}>
                    <span style={{ color:P.violet, flexShrink:0 }}>•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ position:'sticky', top:80, display:'flex', flexDirection:'column', gap:16 }}>

          {/* Pricing card */}
          <div style={{ background:P.white, borderRadius:24, border:`1.5px solid ${P.border}`, overflow:'hidden', boxShadow:'0 8px 40px rgba(124,58,237,.10)' }}>
            {/* Course thumbnail */}
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} style={{ width:'100%', height:180, objectFit:'cover', display:'block' }}/>
            ) : (
              <div style={{ width:'100%', height:160, background:`linear-gradient(135deg,${accentColor},${P.violetDark})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:52 }}>
                {course.course_type==='ielts'?<Globe size={52} color='#fff' />:course.course_type==='sat'?<GraduationCap size={52} color='#fff' />:<BookOpen size={52} color='#fff' />}
              </div>
            )}

            <div style={{ padding: isEnrolled ? '0' : '24px' }}>
              {!isEnrolled && (
                <>
                  {/* Price */}
                  <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:6 }}>
                    <span style={{ fontSize:36, fontWeight:900, color:accentColor, letterSpacing:-1 }}>
                      {Number(course.price).toLocaleString()}₸
                    </span>
                    {course.old_price && (
                      <span style={{ fontSize:18, color:P.muted, textDecoration:'line-through' }}>
                        {Number(course.old_price).toLocaleString()}₸
                      </span>
                    )}
                  </div>
                  {course.old_price && (
                    <div style={{ marginBottom:16 }}>
                      <Pill color={P.green} size={12}>
                        <Flame size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>Скидка {Math.round((1 - course.price/course.old_price)*100)}%
                      </Pill>
                    </div>
                  )}

                  {message==='success' ? (
                    <div style={{ background:P.greenPale, border:`1.5px solid ${P.green}44`, borderRadius:14, padding:'16px', textAlign:'center', marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}><CheckCircle size={28} color={P.green} /></div>
                      <div style={{ fontWeight:800, fontSize:15, color:P.green, marginBottom:4 }}>Заказ создан!</div>
                      <div style={{ color:P.slate, fontSize:13, lineHeight:1.6 }}>
                        Сумма: <strong>{Number(window._lastOrder?.final_amount||course.price).toLocaleString()}₸</strong><br/>
                        Оплатите через Kaspi и ожидайте подтверждения.
                      </div>
                    </div>
                  ) : (
                    <button onClick={handleBuy} disabled={buying} style={{...btnP({opacity:buying?0.7:1}), display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
                      {buying ? <><Hourglass size={16} /> Обработка...</> : user ? <><ShoppingCart size={16} /> Купить курс</> : <><Key size={16} /> Войти для покупки</>}
                    </button>
                  )}

                  {message.startsWith('error:') && (
                    <div style={{ marginTop:12, background:'#FEF2F2', color:P.red, borderRadius:10, padding:'10px 14px', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                      <X size={16} /> {message.slice(6)}
                    </div>
                  )}

                  {!message && (
                    <div style={{ textAlign:'center', color:P.muted, fontSize:12, marginTop:12, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      <CreditCard size={14} /> Оплата через Kaspi Gold
                    </div>
                  )}

                  <div style={{ marginTop:22, display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ fontWeight:800, fontSize:13, color:P.ink, marginBottom:4 }}>В курс входит:</div>
                    {[
                      { Icon: Film, text:`${totalLessons} видеоуроков` },
                      { Icon: FileText, text:'Домашние задания' },
                      { Icon: CheckCircle, text:'Тесты и проверки знаний' },
                      { Icon: User, text:'Живые занятия с учителем' },
                      { Icon: MessageCircle, text:'Уведомления и напоминания' },
                      { Icon: ShoppingCart, text:'Доступ с любого устройства' },
                    ].map((item,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:P.slate }}>
                        <item.Icon size={16} />
                        <span style={{ fontWeight:600 }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Kaspi info */}
              {!isEnrolled && !message && (
                <div style={{ textAlign:'center', color:P.muted, fontSize:12, marginTop:12, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <CreditCard size={14} /> Оплата через Kaspi Gold
                </div>
              )}

             {/* Includes list — only for non-enrolled */}
{!isEnrolled && (
  <div style={{ marginTop:22, display:'flex', flexDirection:'column', gap:10 }}>
    <div style={{ fontWeight:800, fontSize:13, color:P.ink, marginBottom:4 }}>В курс входит:</div>
    {[
      { Icon: Film, text:`${totalLessons} видеоуроков` },
      { Icon: FileText, text:'Домашние задания' },
      { Icon: CheckCircle, text:'Тесты и проверки знаний' },
      { Icon: User, text:'Живые занятия с учителем' },
      { Icon: MessageCircle, text:'Уведомления и напоминания' },
      { Icon: ShoppingCart, text:'Доступ с любого устройства' },
    ].map((item,i) => (
      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:P.slate }}>
        <item.Icon size={16} />
        <span style={{ fontWeight:600 }}>{item.text}</span>
      </div>
    ))}
  </div>
)}
            </div>
          </div>

          {/* Share */}
          <div style={{ background:P.white, borderRadius:18, border:`1.5px solid ${P.border}`, padding:'18px 20px' }}>
            <div style={{ fontWeight:700, fontSize:13, color:P.ink, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}><FileText size={16} /> Поделиться курсом</div>
            <div style={{ display:'flex', gap:8 }}>
              {[
                { label:'Telegram', color:'#2CA5E0', Icon: Plane },
                { label:'WhatsApp', color:'#25D366', Icon: MessageCircle },
                { label:'Скопировать', color:P.violet, Icon: LinkIcon },
              ].map((s,i) => (
                <button key={i}
                  onClick={() => {
                    if (s.label==='Скопировать') { navigator.clipboard.writeText(window.location.href); alert('Ссылка скопирована!'); }
                    else if (s.label==='Telegram') window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(course.title)}`, '_blank');
                    else if (s.label==='WhatsApp') window.open(`https://wa.me/?text=${encodeURIComponent(course.title+' '+window.location.href)}`, '_blank');
                  }}
                  style={{ flex:1, background:s.color+'18', color:s.color, border:`1px solid ${s.color}33`, borderRadius:10, padding:'8px 6px', fontSize:11, fontWeight:700, fontFamily:font, cursor:'pointer', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <s.Icon size={14} />{s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}