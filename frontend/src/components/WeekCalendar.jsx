import { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, Clock, Video, BarChart2, ClipboardList, CheckCircle, FileText, Mail, Link as LinkIcon, RotateCw, Check, XCircle, Circle, ChevronUp, ChevronDown, Hourglass, Save } from 'lucide-react';

const P = {
  violet:'#7C3AED', violetDark:'#5B21B6', violetSoft:'#8B5CF6',
  violetPale:'#F5F3FF', violetBorder:'rgba(124,58,237,0.18)',
  ink:'#0F0A1E', slate:'#475569', muted:'#94A3B8', border:'#E8E4F0',
  white:'#FFFFFF', surface:'#FAFAF9',
  green:'#059669', greenPale:'#F0FDF4',
  orange:'#D97706', orangePale:'#FFFBEB',
  red:'#DC2626', redPale:'#FEF2F2',
  blue:'#2563EB', bluePale:'#EFF6FF',
};
const font = "'Nunito','Segoe UI',system-ui,sans-serif";
const DAYS_MON  = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_S  = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

function sameDay(a,b){ return a.getDate()===b.getDate()&&a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear(); }

/* ─────────── Mini Calendar ─────────── */
function MiniCalendar({ sessions, selectedDate, onSelectDate }) {
  const [view, setView] = useState(new Date());
  const today = new Date();
  const year=view.getFullYear(), month=view.getMonth();
  const firstDay=new Date(year,month,1);
  const lastDay =new Date(year,month+1,0);
  const startOffset = firstDay.getDay()===0?6:firstDay.getDay()-1;
  const cells=[];
  for(let i=0;i<startOffset;i++) cells.push(null);
  for(let d=1;d<=lastDay.getDate();d++) cells.push(new Date(year,month,d));

  const hasSession=date=>date&&sessions.some(s=>sameDay(new Date(s.scheduled_at),date));

  return (
    <div style={{background:P.white,borderRadius:20,border:`1.5px solid ${P.border}`,padding:'20px 16px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <button onClick={()=>setView(new Date(year,month-1,1))} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:P.slate,padding:'2px 8px',borderRadius:8}}>‹</button>
        <div style={{fontWeight:900,fontSize:13,color:P.ink}}>{MONTHS_RU[month]} {year}</div>
        <button onClick={()=>setView(new Date(year,month+1,1))} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:P.slate,padding:'2px 8px',borderRadius:8}}>›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:4}}>
        {DAYS_MON.map(d=><div key={d} style={{textAlign:'center',fontSize:9,fontWeight:800,color:P.muted,paddingBottom:4,textTransform:'uppercase'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1}}>
        {cells.map((date,i)=>{
          if(!date) return <div key={`e${i}`}/>;
          const isTod=sameDay(date,today);
          const isSel=selectedDate&&sameDay(date,selectedDate);
          const hasSess=hasSession(date);
          return (
            <div key={date.toISOString()} onClick={()=>onSelectDate(isSel?null:date)}
              style={{textAlign:'center',padding:'5px 0',borderRadius:8,cursor:'pointer',position:'relative',
                background:isSel?P.violet:isTod?P.violetPale:'transparent',
                color:isSel?'#fff':isTod?P.violet:P.ink,
                fontWeight:isTod||isSel?900:600,fontSize:12,transition:'all .15s'}}>
              {date.getDate()}
              {hasSess&&<div style={{position:'absolute',bottom:2,left:'50%',transform:'translateX(-50%)',width:3,height:3,borderRadius:'50%',background:isSel?'#fff':P.violet}}/>}
            </div>
          );
        })}
      </div>
      <button onClick={()=>{setView(new Date());onSelectDate(today);}}
        style={{width:'100%',marginTop:12,background:P.violetPale,color:P.violet,border:`1.5px solid ${P.violetBorder}`,borderRadius:10,padding:'7px',fontWeight:800,fontSize:11,cursor:'pointer',fontFamily:font}}>
        <Calendar size={12} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/> Сегодня
      </button>
    </div>
  );
}

/* ─────────── Countdown hook ─────────── */
function useCountdown(target){
  const [diff,setDiff]=useState(0);
  useEffect(()=>{
    if(!target) return;
    const tick=()=>setDiff(new Date(target)-new Date());
    tick();
    const id=setInterval(tick,1000);
    return ()=>clearInterval(id);
  },[target]);
  return diff;
}

/* ─────────── Right Panel ─────────── */
function RightPanel({ sessions, selectedDate, homework }){
  const today=new Date();
  const upcoming=[...sessions].filter(s=>new Date(s.scheduled_at)>today&&s.status!=='cancelled').sort((a,b)=>new Date(a.scheduled_at)-new Date(b.scheduled_at))[0];
  const countdown=useCountdown(upcoming?.scheduled_at);

  const pendingHW=homework?homework.filter(h=>h.status==='not_submitted'):[];

  const [notes,setNotes]=useState(()=>{try{return JSON.parse(localStorage.getItem('scheduleNotes')||'{}')}catch{return{}}});
  const noteKey=selectedDate?selectedDate.toISOString().slice(0,10):null;
  const noteVal=noteKey?(notes[noteKey]||''):'';
  const saveNote=val=>{const u={...notes,[noteKey]:val};setNotes(u);localStorage.setItem('scheduleNotes',JSON.stringify(u));};

  // Week stats
  const mon=new Date(today);mon.setDate(today.getDate()-(today.getDay()===0?6:today.getDay()-1));mon.setHours(0,0,0,0);
  const sun=new Date(mon);sun.setDate(mon.getDate()+6);sun.setHours(23,59,59);
  const weekS=sessions.filter(s=>{const dt=new Date(s.scheduled_at);return dt>=mon&&dt<=sun;});
  const conducted=weekS.filter(s=>s.status==='conducted').length;
  const cancelled=weekS.filter(s=>s.status==='cancelled').length;
  const total=weekS.length;

  const fmt=ms=>{
    if(ms<=0)return{h:'00',m:'00',s:'00'};
    const t=Math.floor(ms/1000);
    return{h:String(Math.floor(t/3600)).padStart(2,'0'),m:String(Math.floor((t%3600)/60)).padStart(2,'0'),s:String(t%60).padStart(2,'0')};
  };
  const {h,m,s}=fmt(countdown);
  const daysLeft=upcoming?Math.floor(countdown/86400000):null;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* ⏰ Next lesson */}
      <div style={{background:`linear-gradient(135deg,${P.violet},${P.violetDark})`,borderRadius:20,padding:'20px',color:'#fff'}}>
        <div style={{fontSize:11,fontWeight:800,opacity:0.7,marginBottom:8,textTransform:'uppercase',letterSpacing:0.5,display:'flex',alignItems:'center',gap:4}}><Clock size={12}/> Следующий урок</div>
        {upcoming ? (
          <>
            <div style={{fontWeight:900,fontSize:14,marginBottom:3,lineHeight:1.3}}>{upcoming.group_name||upcoming.course_title||'Занятие'}</div>
            <div style={{fontSize:11,opacity:0.75,marginBottom:10}}>
              {new Date(upcoming.scheduled_at).toLocaleDateString('ru-RU',{weekday:'short',day:'numeric',month:'short'})}
              {' · '}{new Date(upcoming.scheduled_at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}
            </div>
            {daysLeft>0
              ? <div style={{fontSize:13,opacity:0.85,marginBottom:8}}>Через {daysLeft} дн.</div>
              : <div style={{display:'flex',gap:6,marginBottom:10}}>
                  {[{v:h,l:'ч'},{v:m,l:'м'},{v:s,l:'с'}].map(({v,l})=>(
                    <div key={l} style={{background:'rgba(255,255,255,.18)',borderRadius:10,padding:'8px 10px',textAlign:'center',flex:1}}>
                      <div style={{fontWeight:900,fontSize:22,lineHeight:1}}>{v}</div>
                      <div style={{fontSize:10,opacity:0.7,marginTop:2}}>{l}</div>
                    </div>
                  ))}
                </div>
            }
            {upcoming.meet_link&&(
              <a href={upcoming.meet_link} target="_blank" rel="noreferrer"
                style={{display:'block',background:'rgba(255,255,255,.2)',color:'#fff',borderRadius:10,padding:'8px',fontSize:12,fontWeight:800,textDecoration:'none',textAlign:'center'}}>
                <Video size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/> Войти в урок
              </a>
            )}
          </>
        ):<div style={{opacity:.7,fontSize:12}}>Нет ближайших занятий</div>}
      </div>

      {/* 📊 Week stats */}
      <div style={{background:P.white,borderRadius:20,border:`1.5px solid ${P.border}`,padding:'18px'}}>
        <div style={{fontWeight:800,fontSize:13,color:P.ink,marginBottom:12,display:'flex',alignItems:'center',gap:6}}><BarChart2 size={14}/> Эта неделя</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:10}}>
          {[{val:total,label:'Всего',color:P.violet},{val:conducted,label:'Прошло',color:P.green},{val:cancelled,label:'Отменено',color:P.red}].map(({val,label,color})=>(
            <div key={label} style={{background:P.surface,borderRadius:10,padding:'8px 4px',textAlign:'center'}}>
              <div style={{fontSize:18,fontWeight:900,color}}>{val}</div>
              <div style={{fontSize:9,color:P.slate,fontWeight:700,marginTop:1,textTransform:'uppercase',letterSpacing:0.3}}>{label}</div>
            </div>
          ))}
        </div>
        {total>0&&(
          <>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:P.slate,marginBottom:4}}>
              <span>Посещаемость</span>
              <span style={{fontWeight:900,color:P.violet}}>{Math.round((conducted/total)*100)}%</span>
            </div>
            <div style={{height:6,background:P.border,borderRadius:99}}>
              <div style={{height:'100%',borderRadius:99,background:`linear-gradient(90deg,${P.violet},${P.violetSoft})`,width:`${Math.round((conducted/total)*100)}%`,transition:'width .4s'}}/>
            </div>
          </>
        )}
      </div>

      {/* 📋 Homework */}
      <div style={{background:P.white,borderRadius:20,border:`1.5px solid ${P.border}`,padding:'18px'}}>
        <div style={{fontWeight:800,fontSize:13,color:P.ink,marginBottom:10}}>
          <ClipboardList size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/> Домашки
          {pendingHW.length>0&&<span style={{marginLeft:6,background:P.red,color:'#fff',borderRadius:100,padding:'1px 7px',fontSize:10,fontWeight:900}}>{pendingHW.length}</span>}
        </div>
        {pendingHW.length===0
          ? <div style={{textAlign:'center',padding:'10px 0',color:P.muted,fontSize:12}}><div style={{marginBottom:4,display:'flex',justifyContent:'center'}}><CheckCircle size={22} color={P.green}/></div>Все сдано!</div>
          : <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {pendingHW.slice(0,4).map(hw=>(
                <div key={hw.id} style={{background:P.orangePale,borderRadius:10,padding:'9px 12px'}}>
                  <div style={{fontWeight:800,fontSize:12,color:P.ink,marginBottom:2}}>{hw.title}</div>
                  <div style={{fontSize:10,color:P.orange,fontWeight:700}}>
                    До {hw.deadline?new Date(hw.deadline).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}):'—'}
                  </div>
                </div>
              ))}
              {pendingHW.length>4&&<div style={{fontSize:11,color:P.slate,textAlign:'center',fontWeight:700}}>+{pendingHW.length-4} ещё</div>}
            </div>
        }
      </div>

      {/* 📝 Notes */}
      {selectedDate&&(
        <div style={{background:P.white,borderRadius:20,border:`1.5px solid ${P.border}`,padding:'18px'}}>
          <div style={{fontWeight:800,fontSize:13,color:P.ink,marginBottom:8}}>
            <FileText size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/> {selectedDate.toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}
          </div>
          <textarea value={noteVal} onChange={e=>saveNote(e.target.value)} placeholder="Что повторить, вопросы для учителя..." rows={3}
            style={{width:'100%',border:`1.5px solid ${P.border}`,borderRadius:10,padding:'9px 11px',fontSize:12,fontFamily:font,outline:'none',color:P.ink,resize:'vertical',lineHeight:1.6,boxSizing:'border-box'}}/>
          {noteVal&&<div style={{fontSize:10,color:P.muted,marginTop:3,textAlign:'right'}}>{noteVal.length} симв.</div>}
        </div>
      )}
    </div>
  );
}

/* ─────────── Session Card ─────────── */
function SessionCard({ session, isTeacher, onCancel, onReschedule, onLinkUpdate }){
  const [expanded,setExpanded]=useState(false);
  const [linkInput,setLinkInput]=useState(session.meet_link||'');
  const [rescheduleInput,setRescheduleInput]=useState('');
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState('');

  const dt=new Date(session.scheduled_at);
  const timeStr=dt.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  const isCancelled=session.status==='cancelled';
  const isConducted=session.status==='conducted';
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(''),2500);};

  const stMap={
    scheduled:{label:'Запланирован',color:P.blue},
    live:{label:<span style={{display:'inline-flex',alignItems:'center',gap:4}}><Circle size={10} fill="#DC2626"/> Идёт</span>,color:P.red},
    conducted:{label:<span style={{display:'inline-flex',alignItems:'center',gap:4}}><CheckCircle size={12}/> Проведён</span>,color:P.green},
    rescheduled:{label:<span style={{display:'inline-flex',alignItems:'center',gap:4}}><RotateCw size={12}/> Перенесён</span>,color:P.orange},
    cancelled:{label:<span style={{display:'inline-flex',alignItems:'center',gap:4}}><XCircle size={12}/> Отменён</span>,color:P.red},
  };
  const st=stMap[session.status]||{label:session.status,color:P.muted};

  const handleCancel=async()=>{
    if(!window.confirm('Отменить этот урок?'))return;
    setSaving(true);
    try{await api.post(`/groups/sessions/${session.id}/cancel/`);onCancel(session.id);}
    catch{showToast('Ошибка');}finally{setSaving(false);}
  };
  const handleLink=async()=>{
    setSaving(true);
    try{await api.patch(`/groups/sessions/${session.id}/link/`,{meet_link:linkInput});onLinkUpdate(session.id,linkInput);showToast('Ссылка сохранена!');}
    catch{showToast('Ошибка');}finally{setSaving(false);}
  };
  const handleReschedule=async()=>{
    if(!rescheduleInput){showToast('Введи дату');return;}
    setSaving(true);
    try{
      await api.post(`/groups/sessions/${session.id}/reschedule/`,{new_datetime:new Date(rescheduleInput).toISOString(),meet_link:linkInput});
      onReschedule(session.id,rescheduleInput);showToast('Перенесён!');setExpanded(false);
    }catch{showToast('Ошибка');}finally{setSaving(false);}
  };

  return (
    <div style={{background:isCancelled?P.redPale:isConducted?P.greenPale:P.violetPale,border:`1.5px solid ${isCancelled?P.red+'44':isConducted?P.green+'44':P.violetBorder}`,borderRadius:14,padding:'14px 16px',opacity:isCancelled?.6:1,transition:'all .2s'}}>
      {toast&&<div style={{background:P.ink,color:'#fff',borderRadius:8,padding:'5px 10px',fontSize:11,fontWeight:700,marginBottom:8}}>{toast}</div>}

      <div onClick={()=>!isCancelled&&setExpanded(!expanded)} style={{cursor:isCancelled?'default':'pointer'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
          <div style={{fontWeight:900,fontSize:16,color:P.ink}}>{timeStr}</div>
          <span style={{background:st.color+'18',color:st.color,borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:800}}>{st.label}</span>
        </div>
        <div style={{fontWeight:800,fontSize:13,color:P.ink,marginBottom:3}}>{session.group_name||session.group}</div>
        {session.course_title&&<div style={{fontSize:12,color:P.slate,marginBottom:5,display:'flex',alignItems:'center',gap:4}}><ClipboardList size={12}/> {session.course_title}</div>}
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          {session.duration_minutes&&<span style={{fontSize:11,color:P.muted,display:'inline-flex',alignItems:'center',gap:3}}><Clock size={11}/> {session.duration_minutes} мин</span>}
          {session.meet_link&&!expanded&&(
            <a href={session.meet_link} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
              style={{fontSize:12,fontWeight:800,color:P.violet,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:4}}><Video size={12}/> Войти</a>
          )}
          {!isCancelled&&!isConducted&&<span style={{marginLeft:'auto',fontSize:11,color:P.muted}}>{expanded?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</span>}
        </div>
      </div>

      {expanded&&isTeacher&&!isCancelled&&!isConducted&&(
        <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${P.border}`,display:'flex',flexDirection:'column',gap:10}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:P.ink,marginBottom:4,display:'flex',alignItems:'center',gap:4}}><LinkIcon size={11}/> Ссылка на урок</div>
            <div style={{display:'flex',gap:6}}>
              <input value={linkInput} onChange={e=>setLinkInput(e.target.value)} placeholder="https://zoom.us/..."
                style={{flex:1,border:`1.5px solid ${P.border}`,borderRadius:8,padding:'7px 10px',fontSize:12,fontFamily:font,outline:'none',color:P.ink}}/>
              <button onClick={handleLink} disabled={saving}
                style={{background:P.violet,color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:font,display:'flex',alignItems:'center'}}><Save size={14}/></button>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:P.ink,marginBottom:4,display:'flex',alignItems:'center',gap:4}}><RotateCw size={11}/> Перенести на</div>
            <div style={{display:'flex',gap:6}}>
              <input type="datetime-local" value={rescheduleInput} onChange={e=>setRescheduleInput(e.target.value)}
                style={{flex:1,border:`1.5px solid ${P.border}`,borderRadius:8,padding:'7px 10px',fontSize:12,fontFamily:font,outline:'none',color:P.ink}}/>
              <button onClick={handleReschedule} disabled={saving}
                style={{background:P.orange,color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:font,display:'flex',alignItems:'center'}}><Check size={14}/></button>
            </div>
          </div>
          <button onClick={handleCancel} disabled={saving}
            style={{background:P.redPale,color:P.red,border:`1px solid ${P.red}33`,borderRadius:8,padding:'7px',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:font}}>
            <XCircle size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/> Отменить урок
          </button>
        </div>
      )}
      {expanded&&!isTeacher&&session.meet_link&&(
        <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${P.border}`}}>
          <a href={session.meet_link} target="_blank" rel="noreferrer"
            style={{display:'block',background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`,color:'#fff',borderRadius:10,padding:'10px',textAlign:'center',fontWeight:800,fontSize:13,textDecoration:'none'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,justifyContent:'center'}}><Video size={14}/> Войти в урок</span>
          </a>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════ */
export default function WeekCalendar({ mode='teacher', homework=[] }){
  const isTeacher=mode==='teacher';
  const [sessions,setSessions]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selectedDate,setSelectedDate]=useState(new Date());
  const today=new Date();

  useEffect(()=>{
    setLoading(true);
    api.get(isTeacher?'/groups/teacher-sessions/?days=60':'/groups/my-schedule/?include_past=true')
      .then(r=>{
        const data = Array.isArray(r.data)?r.data:r.data?.results||[];
        setSessions(data);
        // Auto-select the nearest upcoming session date for students
        if(!isTeacher && data.length>0){
          const upcoming = data.filter(s=>new Date(s.scheduled_at)>=new Date() && s.status!=='cancelled').sort((a,b)=>new Date(a.scheduled_at)-new Date(b.scheduled_at))[0];
          if(upcoming){ const d=new Date(upcoming.scheduled_at); d.setHours(0,0,0,0); setSelectedDate(d); }
        }
      })
      .catch(()=>setSessions([]))
      .finally(()=>setLoading(false));
  },[mode]);

  const handleCancel     =id   =>setSessions(p=>p.map(s=>s.id===id?{...s,status:'cancelled'}:s));
  const handleReschedule =(id,dt)=>setSessions(p=>p.map(s=>s.id===id?{...s,scheduled_at:new Date(dt).toISOString(),status:'rescheduled'}:s));
  const handleLinkUpdate =(id,lk)=>setSessions(p=>p.map(s=>s.id===id?{...s,meet_link:lk}:s));

  const daySessions=selectedDate
    ?sessions.filter(s=>sameDay(new Date(s.scheduled_at),selectedDate)).sort((a,b)=>new Date(a.scheduled_at)-new Date(b.scheduled_at))
    :[];

  const mon=new Date(today);mon.setDate(today.getDate()-(today.getDay()===0?6:today.getDay()-1));mon.setHours(0,0,0,0);

  return (
    <div style={{fontFamily:font}}>
      <div style={{fontWeight:900,fontSize:22,color:P.ink,letterSpacing:-0.5,marginBottom:20,display:'flex',alignItems:'center',gap:8}}><Calendar size={22}/> Расписание</div>

      {loading?(
        <div style={{textAlign:'center',padding:60,color:P.slate}}><div style={{marginBottom:12,display:'flex',justifyContent:'center'}}><Hourglass size={32}/></div>Загрузка...</div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'230px 1fr 250px',gap:16,alignItems:'start'}}>

          {/* LEFT: Mini Calendar */}
          <MiniCalendar sessions={sessions} selectedDate={selectedDate} onSelectDate={d=>setSelectedDate(d||today)}/>

          {/* CENTER: Day sessions */}
          <div style={{background:P.white,borderRadius:20,border:`1.5px solid ${P.border}`,padding:'20px',minHeight:400}}>
            {/* Day header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
              <div>
                <div style={{fontWeight:900,fontSize:16,color:P.ink,textTransform:'capitalize'}}>
                  {selectedDate.toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}
                </div>
                <div style={{fontSize:12,color:P.slate,marginTop:2}}>
                  {daySessions.length===0?'Нет занятий':`${daySessions.length} занятий`}
                </div>
              </div>
              
            </div>

            {/* Sessions */}
            {daySessions.length===0?(
              <div style={{textAlign:'center',padding:'48px 20px',color:P.muted}}>
                <div style={{marginBottom:12,display:'flex',justifyContent:'center',color:P.muted}}><Mail size={48}/></div>
                <div style={{fontWeight:700,fontSize:14,color:P.slate,marginBottom:6}}>Занятий нет</div>
                <div style={{fontSize:12}}>Выбери другой день в календаре слева</div>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {daySessions.map(s=>(
                  <SessionCard key={s.id} session={s} isTeacher={isTeacher}
                    onCancel={handleCancel} onReschedule={handleReschedule} onLinkUpdate={handleLinkUpdate}/>
                ))}
              </div>
            )}

            {/* Week mini strip */}
            <div style={{marginTop:24,paddingTop:16,borderTop:`1px solid ${P.border}`}}>
              <div style={{fontSize:10,fontWeight:800,color:P.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:0.5}}>Эта неделя</div>
              <div style={{display:'flex',gap:4}}>
                {Array.from({length:7},(_,i)=>{
                  const d=new Date(mon);d.setDate(mon.getDate()+i);d.setHours(0,0,0,0);
                  const count=sessions.filter(s=>sameDay(new Date(s.scheduled_at),d)).length;
                  const isSel=sameDay(d,selectedDate);
                  const isTod=sameDay(d,today);
                  return(
                    <div key={i} onClick={()=>setSelectedDate(new Date(d))}
                      style={{flex:1,textAlign:'center',cursor:'pointer',padding:'5px 2px',borderRadius:8,
                        background:isSel?P.violet:isTod?P.violetPale:'transparent',transition:'all .15s'}}>
                      <div style={{fontSize:8,fontWeight:800,color:isSel?'rgba(255,255,255,.7)':P.muted,textTransform:'uppercase'}}>{DAYS_MON[i]}</div>
                      <div style={{fontSize:12,fontWeight:900,color:isSel?'#fff':isTod?P.violet:P.ink,margin:'1px 0'}}>{d.getDate()}</div>
                      {count>0?<div style={{width:5,height:5,borderRadius:'50%',background:isSel?'#fff':P.violet,margin:'0 auto'}}/>:<div style={{height:5}}/>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Panel */}
          <RightPanel sessions={sessions} selectedDate={selectedDate} homework={homework}/>
        </div>
      )}
    </div>
  );
}