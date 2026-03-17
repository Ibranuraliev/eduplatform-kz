import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { coursesAPI, homeworkAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Hourglass, PartyPopper, BookOpen, Clock, Rocket, ClipboardList, Video, FileText, RotateCw, Frown, Film, Archive, Music, Image, ChevronLeft, Smartphone, MessageCircle, Home, Map } from 'lucide-react';

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
};
const font = "'Nunito','Segoe UI',system-ui,sans-serif";
const card = (e={}) => ({ background:P.white, borderRadius:20, border:`1.5px solid ${P.border}`, padding:'24px', ...e });
const btnP = (e={}) => ({ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:12, padding:'11px 26px', fontWeight:800, fontSize:14, fontFamily:font, cursor:'pointer', boxShadow:`0 4px 16px rgba(124,58,237,.25)`, transition:'all .2s', ...e });
const btnO = (e={}) => ({ background:P.violetPale, color:P.violet, border:`1.5px solid ${P.violetBorder}`, borderRadius:12, padding:'10px 22px', fontWeight:700, fontSize:14, fontFamily:font, cursor:'pointer', transition:'all .2s', ...e });
const inputS = { width:'100%', border:`1.5px solid ${P.border}`, borderRadius:12, padding:'11px 14px', fontSize:14, fontFamily:font, outline:'none', color:P.ink, background:P.white, boxSizing:'border-box' };

function Pill({ children, color=P.violet, size=12 }) {
  return <span style={{ display:'inline-flex', alignItems:'center', background:color+'18', color, borderRadius:100, padding:'3px 10px', fontSize:size, fontWeight:800, letterSpacing:0.5, textTransform:'uppercase', fontFamily:font, border:`1px solid ${color}22`, whiteSpace:'nowrap' }}>{children}</span>;
}

/* ── HW status badge ── */
function HwStatus({ status }) {
  const map = {
    accepted:          { label:'Принято',      Icon: CheckCircle, color:P.green,  bg:P.greenPale  },
    submitted:         { label:'На проверке',  Icon: Hourglass, color:P.orange, bg:P.orangePale },
    revision_required: { label:'На доработку', Icon: RotateCw, color:P.red,    bg:P.redPale    },
    overdue:           { label:'Просрочено',    Icon: Clock, color:P.red,    bg:P.redPale    },
    not_submitted:     { label:'Не сдано',      Icon: FileText, color:P.slate,  bg:P.surface    },
  };
  const s = map[status] || map.not_submitted;
  return <span style={{ background:s.bg, color:s.color, borderRadius:8, padding:'5px 14px', fontSize:13, fontWeight:700, fontFamily:font, display:'flex', alignItems:'center', gap:6 }}><s.Icon size={14} /> {s.label}</span>;
}

/* ── Test taking component ── */
function TestSection({ test, onComplete }) {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  const startTest = async () => {
    try {
      const { testsAPI } = await import('../api');
      const res = await testsAPI.start(test.id);
      setAttemptId(res.data.attempt_id);
      setAnswers({});
      setResult(null);
      setStarted(true);
      // Start countdown
      const secs = (test.time_limit_minutes || 20) * 60;
      setTimeLeft(secs);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); return 0; }
          return t - 1;
        });
      }, 1000);
    } catch(err) { alert(err.response?.data?.error || 'Ошибка при запуске теста'); }
  };

  const submitTest = async () => {
    if (!attemptId) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const { testsAPI } = await import('../api');
      const answersList = Object.entries(answers).map(([qId,aId]) => ({
        question_id: parseInt(qId),
        selected_answer_ids: Array.isArray(aId) ? aId : [aId],
      }));
      const res = await testsAPI.submit(attemptId, { answers: answersList });
      setResult(res.data);
      setStarted(false);
      onComplete && onComplete(res.data);
    } catch(err) { alert(err.response?.data?.error || 'Ошибка при отправке теста'); }
    finally { setSubmitting(false); }
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const answered = Object.keys(answers).length;
  const total = test.questions?.length || 0;

  /* Result screen */
  if (result) return (
    <div style={{ textAlign:'center', padding:'40px 24px' }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>{result.score>=70?<PartyPopper size={64} color={P.green} />:<BookOpen size={64} color={P.orange} />}</div>
      <div style={{ fontWeight:900, fontSize:22, color:P.ink, marginBottom:8 }}>Тест завершён!</div>
      <div style={{ fontSize:56, fontWeight:900, color:result.score>=70?P.green:P.orange, letterSpacing:-2, margin:'12px 0' }}>{result.score}%</div>
      <div style={{ color:P.slate, fontSize:15, marginBottom:28 }}>
        Правильных ответов: <strong style={{ color:P.ink }}>{result.earned_points}</strong> из <strong style={{ color:P.ink }}>{result.total_points}</strong>
      </div>
      <button onClick={()=>setResult(null)} style={btnO()}>Пройти ещё раз</button>
    </div>
  );

  /* Pre-start */
  if (!started) return (
    <div style={{ textAlign:'center', padding:'32px 24px' }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><ClipboardList size={52} color={P.violet} /></div>
      <div style={{ fontWeight:800, fontSize:18, color:P.ink, marginBottom:8 }}>{test.title}</div>
      <div style={{ color:P.slate, fontSize:14, marginBottom:24, lineHeight:1.7, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
        {total} вопросов · <Clock size={14} /> {test.time_limit_minutes} минут
      </div>
      <button onClick={startTest} style={{...btnP({padding:'14px 40px', fontSize:15}), display:'flex', alignItems:'center', justifyContent:'center', gap:8}}><Rocket size={16} /> Начать тест</button>
    </div>
  );

  /* Active test */
  return (
    <div>
      {/* Timer bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, padding:'12px 18px', background: timeLeft < 60 ? P.redPale : P.violetPale, borderRadius:14, border:`1.5px solid ${timeLeft<60?P.red+'44':P.violetBorder}` }}>
        <div style={{ fontWeight:700, fontSize:14, color:P.ink }}>
          Ответов: <strong style={{ color:P.violet }}>{answered}</strong> / {total}
        </div>
        <div style={{ fontWeight:900, fontSize:18, color:timeLeft<60?P.red:P.violet, fontVariantNumeric:'tabular-nums', display:'flex', alignItems:'center', gap:6 }}>
          <Clock size={18} /> {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:6, background:P.surface, borderRadius:3, overflow:'hidden', marginBottom:24 }}>
        <div style={{ height:'100%', width:`${total>0?(answered/total)*100:0}%`, background:`linear-gradient(90deg,${P.violet},${P.violetSoft})`, borderRadius:3, transition:'width .3s' }}/>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {test.questions?.map((q, qi) => (
          <div key={q.id} style={{ background:P.surface, borderRadius:16, padding:'20px 24px', border:`1.5px solid ${answers[q.id]?P.violet+'44':P.border}` }}>
            <div style={{ fontWeight:700, fontSize:16, color:P.ink, marginBottom:14 }}>{qi+1}. {q.question_text}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {q.answers?.map(a => {
                const sel = answers[q.id] === a.id;
                return (
                  <label key={a.id} style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer', padding:'11px 16px', borderRadius:12, background:sel?P.violetPale:P.white, border:`1.5px solid ${sel?P.violet:P.border}`, transition:'all .2s' }}>
                    <input type="radio" name={`q-${q.id}`} value={a.id}
                      onChange={()=>setAnswers(p=>({...p,[q.id]:a.id}))}
                      checked={sel}
                      style={{ width:16, height:16, accentColor:P.violet }}
                    />
                    <span style={{ fontSize:15, color:P.ink, fontWeight:sel?700:500 }}>{a.answer_text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button onClick={submitTest} disabled={submitting} style={{ ...btnP({width:'100%', padding:'15px', fontSize:16, marginTop:24, opacity:submitting?0.6:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8}) }}>
        {submitting ? <>Отправка...</> : <><CheckCircle size={16} /> Завершить тест</>}
      </button>
    </div>
  );
}

/* ══ Main LessonPage ══ */
export default function LessonPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('video');
  const [hwText, setHwText] = useState('');
  const [hwFile, setHwFile] = useState(null);
  const [hwSubmitting, setHwSubmitting] = useState(false);
  const [hwMessage, setHwMessage] = useState('');
  const [hwStatus, setHwStatus] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    coursesAPI.lessonDetail(id)
      .then(res => {
        setLesson(res.data);
        if (res.data.video_url) setActiveTab('video');
        else if (res.data.materials?.length > 0) setActiveTab('materials');
        else if (res.data.homework) setActiveTab('homework');
        else if (res.data.test) setActiveTab('test');
        if (res.data.homework?.my_submission) {
          setHwStatus(res.data.homework.my_submission.status);
        }
        // Check if already completed
        if (res.data.course_id) {
          coursesAPI.progress(res.data.course_id)
            .then(p => setIsCompleted(p.data.completed_lesson_ids?.includes(Number(id))))
            .catch(() => {});
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleMarkComplete = async () => {
    setMarkingDone(true);
    try {
      await coursesAPI.markComplete(id);
      setIsCompleted(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    } finally {
      setMarkingDone(false);
    }
  };

  const submitHomework = async () => {
    if (!lesson?.homework?.id) return;
    if (!hwText && !hwFile) { setHwMessage('error:Добавьте текст ответа или файл'); setHwSubmitting(false); return; }
    setHwSubmitting(true);
    setHwMessage('');
    try {
      const formData = new FormData();
      if (hwText) formData.append('text_answer', hwText);
      if (hwFile) formData.append('file', hwFile);
      await homeworkAPI.submit(lesson.homework.id, formData);
      setHwMessage('success');
      setHwStatus('submitted');
      setHwText('');
      setHwFile(null);
    } catch(err) {
      setHwMessage('error:' + (err.response?.data?.error || 'Ошибка при отправке'));
    } finally {
      setHwSubmitting(false);
    }
  };

  /* ── Tabs config ── */
  const tabs = [
    lesson?.video_url       && { id:'video',     icon: Video, label:'Видео',     show:true },
    lesson?.materials?.length>0 && { id:'materials',  icon: FileText, label:'Материалы', show:true },
    lesson?.homework        && { id:'homework',   icon: FileText, label:'Домашка',   show:true },
    lesson?.test            && { id:'test',       icon: CheckCircle, label:'Тест',      show:true },
  ].filter(Boolean);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8F6FF', fontFamily:font }}>
      <div style={{ textAlign:'center', color:P.slate }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><Hourglass size={44} color={P.slate} /></div>
        <div style={{ fontSize:18 }}>Загрузка урока...</div>
      </div>
    </div>
  );

  if (!lesson) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8F6FF', fontFamily:font }}>
      <div style={{ textAlign:'center', color:P.slate }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><Frown size={44} color={P.slate} /></div>
        <div style={{ fontSize:18, marginBottom:20 }}>Урок не найден</div>
        <button onClick={()=>navigate('/dashboard')} style={btnO()}>← Назад в кабинет</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6FF', fontFamily:font }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;} ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:${P.violetSoft};border-radius:2px;}`}</style>

      {/* NAVBAR */}
      <nav style={{ background:P.white, borderBottom:`1px solid ${P.border}`, padding:'0 40px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(124,58,237,.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={()=>navigate(-1)} style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:10, width:36, height:36, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronLeft size={18} /></button>
          <div onClick={()=>navigate('/')} style={{ fontWeight:900, fontSize:20, cursor:'pointer', color:P.ink }}>
            <span style={{ color:P.violet }}>Edu</span>Platform
            <span style={{ marginLeft:8, fontSize:11, background:P.violet, color:'#fff', borderRadius:6, padding:'2px 7px', fontWeight:800, verticalAlign:'middle' }}>KZ</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          {lesson.course_title && (
            <span style={{ color:P.slate, fontSize:13, fontWeight:600, maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6 }}>
              <BookOpen size={14} /> {lesson.course_title}
            </span>
          )}
          {isCompleted ? (
            <span style={{ color:P.green, fontWeight:800, fontSize:13, background:P.greenPale, border:`1px solid ${P.green}33`, borderRadius:10, padding:'8px 16px', display:'flex', alignItems:'center', gap:6 }}><CheckCircle size={14} /> Урок пройден</span>
          ) : (
            <button onClick={handleMarkComplete} disabled={markingDone} style={{ background:`linear-gradient(135deg,${P.green},#10b981)`, color:'#fff', border:'none', borderRadius:10, padding:'8px 18px', fontWeight:800, fontSize:13, fontFamily:font, cursor:'pointer', opacity:markingDone?0.6:1, display:'flex', alignItems:'center', gap:6 }}>
              {markingDone ? '...' : <><CheckCircle size={14} /> Отметить пройденным</>}
            </button>
          )}
          <button onClick={()=>navigate('/dashboard')} style={btnO({padding:'8px 18px', fontSize:13})}>Мой кабинет</button>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px', display:'grid', gridTemplateColumns:'1fr 320px', gap:24, alignItems:'start' }}>

        {/* ── MAIN CONTENT ── */}
        <div>
          {/* Lesson header */}
          <div style={{ marginBottom:24 }}>
            <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap' }}>
              {lesson.module_title && <Pill color={P.slate} size={11}>{lesson.module_title}</Pill>}
              {lesson.order && <Pill color={P.violet} size={11}>Урок {lesson.order}</Pill>}
            </div>
            <h1 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:900, color:P.ink, margin:'0 0 10px', letterSpacing:-0.5, lineHeight:1.15 }}>
              {lesson.title}
            </h1>
            {lesson.description && (
              <p style={{ color:P.slate, fontSize:15, lineHeight:1.75, margin:0 }}>{lesson.description}</p>
            )}
          </div>

          {/* Tabs */}
          {tabs.length > 0 && (
            <div style={{ display:'flex', gap:8, marginBottom:24, overflowX:'auto', paddingBottom:4 }}>
              {tabs.map(t => (
                <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ padding:'10px 20px', borderRadius:12, fontWeight:700, fontSize:14, fontFamily:font, cursor:'pointer', whiteSpace:'nowrap', transition:'all .2s', background:activeTab===t.id?`linear-gradient(135deg,${P.violet},${P.violetSoft})`:P.white, color:activeTab===t.id?'#fff':P.slate, border:`1.5px solid ${activeTab===t.id?'transparent':P.border}`, boxShadow:activeTab===t.id?`0 4px 16px rgba(124,58,237,.25)`:'none', display:'flex', alignItems:'center', gap:6 }}><t.icon size={16} />{t.label}</button>
              ))}
            </div>
          )}

          {/* ── VIDEO TAB ── */}
          {activeTab==='video' && (
            <div style={card({padding:0, overflow:'hidden'})}>
              {lesson.video_url ? (
                <>
                  {/* YouTube embed */}
                  {lesson.video_url.includes('youtube') || lesson.video_url.includes('youtu.be') ? (
                    <div style={{ position:'relative', paddingBottom:'56.25%', height:0 }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeId(lesson.video_url)}?rel=0&modestbranding=1`}
                        style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={lesson.title}
                      />
                    </div>
                  ) : (
                    <video
                      src={lesson.video_url}
                      controls
                      style={{ width:'100%', maxHeight:500, background:'#000' }}
                    />
                  )}
                  <div style={{ padding:'20px 24px' }}>
                    <div style={{ fontWeight:800, fontSize:16, color:P.ink, marginBottom:6 }}>{lesson.title}</div>
                    {lesson.description && <p style={{ color:P.slate, fontSize:14, lineHeight:1.7, margin:0 }}>{lesson.description}</p>}
                  </div>
                </>
              ) : (
                <div style={{ textAlign:'center', padding:60, color:P.slate }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}><Video size={48} color={P.slate} /></div>
                  <div style={{ fontSize:16 }}>Видео недоступно</div>
                </div>
              )}
            </div>
          )}

          {/* ── MATERIALS TAB ── */}
          {activeTab==='materials' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {lesson.materials?.length > 0 ? lesson.materials.map((m, i) => (
                <div key={m.id||i} style={card({display:'flex', alignItems:'center', gap:16})}>
                  <div style={{ width:52, height:52, borderRadius:14, background:P.violetPale, border:`1.5px solid ${P.violetBorder}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>
                    {getFileIcon(m.file_type || m.title)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:P.ink }}>{m.title || m.name || `Материал ${i+1}`}</div>
                    {m.description && <div style={{ color:P.slate, fontSize:13, marginTop:3 }}>{m.description}</div>}
                    {m.file_size && <div style={{ color:P.muted, fontSize:12, marginTop:3 }}>{formatFileSize(m.file_size)}</div>}
                  </div>
                  <a href={m.file_url || m.url} target="_blank" rel="noreferrer"
                    style={{ ...btnP({flexShrink:0, padding:'9px 20px', fontSize:13, display:'flex', alignItems:'center', gap:6}), textDecoration:'none' }}>
                    Скачать
                  </a>
                </div>
              )) : (
                <div style={card({textAlign:'center', padding:60})}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}><FileText size={48} color={P.slate} /></div>
                  <div style={{ color:P.slate, fontSize:16 }}>Нет материалов</div>
                </div>
              )}
            </div>
          )}

          {/* ── HOMEWORK TAB ── */}
          {activeTab==='homework' && (
            <div>
              {lesson.homework ? (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {/* Task description */}
                  <div style={card()}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:10 }}>
                      <div>
                        <div style={{ fontWeight:900, fontSize:18, color:P.ink, marginBottom:4 }}>{lesson.homework.title || 'Домашнее задание'}</div>
                        {lesson.homework.due_date && (
                          <div style={{ color:P.orange, fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                            <Clock size={14} /> Сдать до: {new Date(lesson.homework.due_date).toLocaleString('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}
                          </div>
                        )}
                      </div>
                      {hwStatus && <HwStatus status={hwStatus}/>}
                    </div>
                    {lesson.homework.description && (
                      <div style={{ background:P.surface, borderRadius:14, padding:'16px 20px', fontSize:15, color:P.ink, lineHeight:1.8, whiteSpace:'pre-wrap' }}>
                        {lesson.homework.description}
                      </div>
                    )}
                  </div>

                  {/* Teacher comment if exists */}
                  {lesson.homework.my_submission?.teacher_comment && (
                    <div style={{ background:P.violetPale, border:`1.5px solid ${P.violetBorder}`, borderRadius:18, padding:'18px 22px' }}>
                      <div style={{ fontSize:12, color:P.violet, fontWeight:700, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}><MessageCircle size={14} /> Комментарий преподавателя</div>
                      <div style={{ color:P.ink, fontSize:15, lineHeight:1.75 }}>{lesson.homework.my_submission.teacher_comment}</div>
                    </div>
                  )}

                  {/* Submit form */}
                  {(hwStatus==='not_submitted'||hwStatus==='revision_required'||!hwStatus) && (
                    <div style={card()}>
                      <div style={{ fontWeight:800, fontSize:15, color:P.ink, marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
                        {hwStatus==='revision_required' ? <><RotateCw size={16} /> Отправить на доработку</> : <><FileText size={16} /> Сдать задание</>}
                      </div>

                      <textarea
                        value={hwText}
                        onChange={e=>setHwText(e.target.value)}
                        placeholder="Введи ответ, решение или ссылку на выполненное задание..."
                        rows={5}
                        style={{ ...inputS, resize:'vertical', lineHeight:1.7, marginBottom:14 }}
                      />

                      {/* File upload */}
                      <div style={{ marginBottom:16 }}>
                        <input type="file" ref={fileRef} onChange={e=>setHwFile(e.target.files[0])} style={{ display:'none' }}/>
                        <button onClick={()=>fileRef.current?.click()} style={{...btnO({fontSize:13, padding:'9px 18px'}), display:'flex', alignItems:'center', gap:6}}>
                          {hwFile ? hwFile.name : 'Прикрепить файл'}
                        </button>
                        {hwFile && (
                          <button onClick={()=>setHwFile(null)} style={{ background:'none', border:'none', color:P.red, cursor:'pointer', fontSize:13, marginLeft:10, display:'flex', alignItems:'center', gap:4 }}>Убрать</button>
                        )}
                      </div>

                      {hwMessage==='success' && (
                        <div style={{ background:P.greenPale, color:P.green, border:`1.5px solid ${P.green}33`, borderRadius:12, padding:'12px 18px', fontWeight:700, fontSize:14, marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
                          <CheckCircle size={16} /> Задание отправлено! Ждите проверки.
                        </div>
                      )}
                      {hwMessage.startsWith('error:') && (
                        <div style={{ background:P.redPale, color:P.red, border:`1.5px solid ${P.red}33`, borderRadius:12, padding:'12px 18px', fontWeight:700, fontSize:14, marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
                          <FileText size={16} /> {hwMessage.slice(6)}
                        </div>
                      )}

                      <button onClick={submitHomework} disabled={hwSubmitting||(!hwText&&!hwFile)} style={{...btnP({width:'100%', padding:'14px', fontSize:15, opacity:(hwSubmitting||(!hwText&&!hwFile))?0.5:1}), display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
                        {hwSubmitting ? 'Отправка...' : <>Отправить</>}
                      </button>
                    </div>
                  )}

                  {/* Already submitted */}
                  {(hwStatus==='submitted'||hwStatus==='accepted') && (
                    <div style={card({textAlign:'center', padding:40})}>
                      <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>{hwStatus==='accepted'?<PartyPopper size={48} color={P.green} />:<Hourglass size={48} color={P.orange} />}</div>
                      <div style={{ fontWeight:800, fontSize:17, color:P.ink, marginBottom:6 }}>
                        {hwStatus==='accepted' ? 'Задание принято!' : 'Задание на проверке'}
                      </div>
                      <div style={{ color:P.slate, fontSize:14 }}>
                        {hwStatus==='accepted' ? 'Преподаватель принял вашу работу.' : 'Ожидайте комментарий преподавателя.'}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={card({textAlign:'center', padding:60})}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}><FileText size={48} color={P.slate} /></div>
                  <div style={{ color:P.slate, fontSize:16 }}>Нет домашнего задания для этого урока</div>
                </div>
              )}
            </div>
          )}

          {/* ── TEST TAB ── */}
          {activeTab==='test' && (
            <div style={card()}>
              {lesson.test ? (
                <TestSection test={lesson.test} />
              ) : (
                <div style={{ textAlign:'center', padding:60, color:P.slate }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}><CheckCircle size={48} color={P.slate} /></div>
                  <div style={{ fontSize:16 }}>Нет теста для этого урока</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Lesson info */}
          <div style={card()}>
            <div style={{ fontWeight:800, fontSize:15, color:P.ink, marginBottom:16, display:'flex', alignItems:'center', gap:6 }}><ClipboardList size={16} /> О занятии</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                lesson.video_url && { Icon: Video, label:'Видеоурок' },
                lesson.materials?.length>0 && { Icon: FileText, label:`${lesson.materials.length} материал(ов)` },
                lesson.homework && { Icon: FileText, label:'Домашнее задание' },
                lesson.test && { Icon: CheckCircle, label:`Тест: ${lesson.test.questions?.length||0} вопросов` },
              ].filter(Boolean).map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:P.surface, borderRadius:10 }}>
                  <item.Icon size={18} />
                  <span style={{ fontSize:14, color:P.ink, fontWeight:600 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Homework status card */}
          {lesson.homework && (
            <div style={card()}>
              <div style={{ fontWeight:800, fontSize:15, color:P.ink, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}><FileText size={16} /> Статус домашки</div>
              <HwStatus status={hwStatus||'not_submitted'}/>
              {lesson.homework.due_date && (
                <div style={{ color:P.orange, fontSize:12, fontWeight:700, marginTop:10, display:'flex', alignItems:'center', gap:4 }}>
                  <Clock size={12} /> До: {new Date(lesson.homework.due_date).toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}
                </div>
              )}
              {(hwStatus==='not_submitted'||!hwStatus) && (
                <button onClick={()=>setActiveTab('homework')} style={{ ...btnP({width:'100%', textAlign:'center', marginTop:14, padding:'10px'}), fontSize:13 }}>
                  Сдать задание →
                </button>
              )}
            </div>
          )}

          {/* Test status card */}
          {lesson.test && (
            <div style={card()}>
              <div style={{ fontWeight:800, fontSize:15, color:P.ink, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}><CheckCircle size={16} /> Тест</div>
              <div style={{ color:P.slate, fontSize:13, marginBottom:14 }}>
                {lesson.test.questions?.length||0} вопросов · {lesson.test.time_limit_minutes} мин
              </div>
              <button onClick={()=>setActiveTab('test')} style={{ ...btnO({width:'100%', textAlign:'center', fontSize:13}), padding:'10px' }}>
                Перейти к тесту →
              </button>
            </div>
          )}

          {/* Navigation: prev / next lesson */}
          <div style={card()}>
            <div style={{ fontWeight:800, fontSize:15, color:P.ink, marginBottom:14, display:'flex', alignItems:'center', gap:6 }}><Map size={16} /> Навигация</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {lesson.prev_lesson_id && (
                <button onClick={()=>navigate(`/lessons/${lesson.prev_lesson_id}`)}
                  style={{ ...btnO({width:'100%', fontSize:13, textAlign:'left'}), display:'flex', alignItems:'center', gap:8 }}>
                  <ChevronLeft size={14} /> Предыдущий урок
                </button>
              )}
              {lesson.next_lesson_id && (
                <button onClick={()=>navigate(`/lessons/${lesson.next_lesson_id}`)}
                  style={{ ...btnP({width:'100%', fontSize:13, textAlign:'left'}), display:'flex', alignItems:'center', gap:8 }}>
                  Следующий урок →
                </button>
              )}
              <button onClick={()=>navigate('/dashboard')} style={{ background:'none', border:`1px solid ${P.border}`, borderRadius:12, padding:'9px 16px', color:P.slate, cursor:'pointer', fontSize:13, fontFamily:font, fontWeight:600, width:'100%', display:'flex', alignItems:'center', gap:6 }}>
                <Home size={14} /> В кабинет
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function getYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length===11) ? match[2] : null;
}

function getFileIcon(name='') {
  const ext = name.toLowerCase();
  if (ext.includes('pdf')) return <BookOpen size={26} color={P.red} />;
  if (ext.includes('doc')) return <BookOpen size={26} color={P.violet} />;
  if (ext.includes('xls')) return <BookOpen size={26} color={P.green} />;
  if (ext.includes('ppt')) return <BookOpen size={26} color={P.orange} />;
  if (ext.includes('zip') || ext.includes('rar')) return <Archive size={26} color={P.slate} />;
  if (ext.includes('mp4') || ext.includes('mov')) return <Film size={26} color={P.violet} />;
  if (ext.includes('mp3') || ext.includes('wav')) return <Music size={26} color={P.violet} />;
  if (ext.includes('jpg') || ext.includes('png') || ext.includes('img')) return <Image size={26} color={P.violet} />;
  return <FileText size={26} color={P.slate} />;
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
}
