import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { chatAPI, groupsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import useMobile from '../hooks/useMobile';
import { MessageCircle, GraduationCap, User, Hand, Check, Send } from 'lucide-react';

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
};
const font = "'Nunito','Segoe UI',system-ui,sans-serif";

function formatTime(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export default function ChatPage() {
  const isMobile = useMobile();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);   // for student
  const [students, setStudents] = useState([]);    // for teacher
  const [showContactList, setShowContactList] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  // Load conversations
  useEffect(() => {
    chatAPI.list().then(res => {
      setConversations(res.data);
      setLoading(false);
      // Auto-open if teacher_id in URL
      const tid = searchParams.get('teacher');
      if (tid && user.role === 'student') {
        openWithTeacher(Number(tid), res.data);
      } else if (res.data.length > 0) {
        openConversation(res.data[0]);
      }
    }).catch(() => setLoading(false));

    // Load contact lists
    if (user.role === 'student') {
      // Student: load their teachers from enrolled groups
      groupsAPI.myGroupsSmart().catch(() => ({ data: [] })).then(res => {
        const enrollments = Array.isArray(res.data) ? res.data : res.data?.results || [];
        const seen = new Set();
        const ts = [];
        enrollments.forEach(enr => {
          // GroupEnrollmentSerializer: {id, group: {teacher: <int>, teacher_name: "..."}, ...}
          const grp = enr.group || enr;
          const teacherId = grp.teacher;
          const teacherName = (grp.teacher_name || '').trim();
          if (teacherId && !seen.has(teacherId)) {
            seen.add(teacherId);
            const spaceIdx = teacherName.indexOf(' ');
            ts.push({
              id: teacherId,
              first_name: spaceIdx >= 0 ? teacherName.slice(0, spaceIdx) : teacherName,
              last_name: spaceIdx >= 0 ? teacherName.slice(spaceIdx + 1) : '',
            });
          }
        });
        setTeachers(ts);
      });
    } else if (user.role === 'teacher') {
      // Teacher: load all their enrolled students
      chatAPI.students().catch(() => ({ data: [] })).then(res => {
        setStudents(Array.isArray(res.data) ? res.data : []);
      });
    }
  }, []);

  const openWithTeacher = async (teacherId, existingConvs) => {
    const existing = existingConvs.find(c => c.teacher?.id === teacherId);
    if (existing) { openConversation(existing); return; }
    try {
      const res = await chatAPI.start(teacherId);
      const updated = await chatAPI.list();
      setConversations(updated.data);
      const conv = updated.data.find(c => c.id === res.data.conversation_id);
      if (conv) openConversation(conv);
    } catch {}
  };

  const openConversation = (conv) => {
    setActiveConv(conv);
    loadMessages(conv.id);
    if (isMobile) setShowChat(true);
    // Mark as read in sidebar
    setConversations(prev => prev.map(c =>
      c.id === conv.id ? { ...c, unread_count: 0 } : c
    ));
  };

  const loadMessages = (convId) => {
    chatAPI.messages(convId).then(res => {
      setMessages(res.data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
  };

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!activeConv) return;
    pollRef.current = setInterval(() => {
      chatAPI.messages(activeConv.id).then(res => {
        setMessages(res.data);
      }).catch(() => {});
      chatAPI.list().then(res => {
        setConversations(res.data.map(c =>
          c.id === activeConv.id ? { ...c, unread_count: 0 } : c
        ));
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const res = await chatAPI.send(activeConv.id, text);
      setMessages(prev => [...prev, res.data]);
      setText('');
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  const handleStartNew = async (teacher) => {
    try {
      const res = await chatAPI.start(teacher.id);
      const updated = await chatAPI.list();
      setConversations(updated.data);
      const conv = updated.data.find(c => c.id === res.data.conversation_id);
      if (conv) { openConversation(conv); setShowContactList(false); }
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    }
  };

  const handleStartWithStudent = async (student) => {
    try {
      const res = await chatAPI.startWithStudent(student.id);
      const updated = await chatAPI.list();
      setConversations(updated.data);
      const conv = updated.data.find(c => c.id === res.data.conversation_id);
      if (conv) { openConversation(conv); setShowContactList(false); }
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    }
  };

  const getOtherPerson = (conv) => {
    if (!conv) return null;
    return user.role === 'student' ? conv.teacher : conv.student;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8F6FF', fontFamily: font, display: 'flex', flexDirection: 'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;}`}</style>

      {/* Navbar */}
      <nav style={{ background: P.white, borderBottom: `1px solid ${P.border}`, padding: isMobile ? '0 12px' : '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 18 }}>←</button>
          <div onClick={() => navigate('/')} style={{ fontWeight: 900, fontSize: isMobile ? 16 : 20, cursor: 'pointer', color: P.ink }}>
            <span style={{ color: P.violet }}>Edu</span>Platform
            <span style={{ marginLeft: 4, fontSize: 10, background: P.violet, color: '#fff', borderRadius: 4, padding: '1px 5px', fontWeight: 800, verticalAlign: 'middle', display: isMobile ? 'none' : 'inline-block' }}>KZ</span>
          </div>
          <span style={{ marginLeft: isMobile ? 4 : 8, fontWeight: 800, fontSize: isMobile ? 13 : 16, color: P.ink, display:'inline-flex', alignItems:'center', gap: isMobile ? 4 : 6 }}><MessageCircle size={isMobile ? 14 : 16}/>Чат</span>
        </div>
        <button onClick={() => navigate('/dashboard')} style={{ background: P.violetPale, color: P.violet, border: `1.5px solid ${P.violetBorder}`, borderRadius: 12, padding: '8px 16px', fontWeight: 700, fontSize: isMobile ? 12 : 14, fontFamily: font, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {isMobile ? 'Кабинет' : 'Мой кабинет'}
        </button>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', maxWidth: 1100, width: '100%', margin: isMobile ? '0 auto' : '24px auto', gap: isMobile ? 0 : 16, padding: isMobile ? 0 : '0 16px', height: isMobile ? 'calc(100vh - 64px)' : 'calc(100vh - 112px)' }}>

        {/* Sidebar */}
        {(!isMobile || !showChat) && (
        <div style={{ width: isMobile ? '100%' : 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: isMobile ? '8px 12px' : 0 }}>

          {/* Start new chat — student writes to teacher */}
          {user.role === 'student' && teachers.length > 0 && (
            <div style={{ background: P.white, borderRadius: 16, border: `1.5px solid ${P.border}`, padding: 16, marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: P.ink, marginBottom: 10 }}><MessageCircle size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Написать учителю</div>
              {teachers.map(t => (
                <button key={t.id} onClick={() => handleStartNew(t)}
                  style={{ width: '100%', textAlign: 'left', background: P.violetPale, border: `1px solid ${P.violetBorder}`, borderRadius: 10, padding: '8px 12px', marginBottom: 6, cursor: 'pointer', fontFamily: font, fontSize: 13, fontWeight: 700, color: P.violet }}>
                  <MessageCircle size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>{t.first_name} {t.last_name}
                </button>
              ))}
            </div>
          )}

          {/* Start new chat — teacher writes to student */}
          {user.role === 'teacher' && students.length > 0 && (
            <div style={{ background: P.white, borderRadius: 16, border: `1.5px solid ${P.border}`, padding: 16, marginBottom: 4 }}>
              <button
                onClick={() => setShowContactList(p => !p)}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', fontWeight: 800, fontSize: 13, color: P.ink, cursor: 'pointer', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span style={{display:'inline-flex',alignItems:'center',gap:6}}><MessageCircle size={13}/>Написать студенту</span>
                <span style={{ fontSize: 11 }}>{showContactList ? '▲' : '▼'}</span>
              </button>
              {showContactList && (
                <div style={{ marginTop: 10, maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {students.map(s => (
                    <button key={s.id} onClick={() => handleStartWithStudent(s)}
                      style={{ width: '100%', textAlign: 'left', background: P.violetPale, border: `1px solid ${P.violetBorder}`, borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontFamily: font, fontSize: 13, fontWeight: 700, color: P.violet }}>
                      <GraduationCap size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>{s.first_name} {s.last_name}
                      <span style={{ fontWeight: 400, color: P.slate, fontSize: 11, marginLeft: 6 }}>{s.group_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conversation list */}
          <div style={{ background: P.white, borderRadius: 16, border: `1.5px solid ${P.border}`, overflow: 'hidden', flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: '16px 16px 12px', fontWeight: 800, fontSize: 14, color: P.ink, borderBottom: `1px solid ${P.border}` }}>
              Переписки {conversations.length > 0 && `(${conversations.length})`}
            </div>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: P.muted }}>Загрузка...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: P.muted, fontSize: 13 }}>
                <div style={{ marginBottom: 8, display:'flex', justifyContent:'center', color: P.muted }}><MessageCircle size={32}/></div>
                Нет переписок
              </div>
            ) : conversations.map(conv => {
              const other = getOtherPerson(conv);
              const isActive = activeConv?.id === conv.id;
              return (
                <div key={conv.id} onClick={() => openConversation(conv)}
                  style={{ padding: '12px 16px', cursor: 'pointer', background: isActive ? P.violetPale : 'transparent', borderLeft: isActive ? `3px solid ${P.violet}` : '3px solid transparent', borderBottom: `1px solid ${P.border}`, transition: 'all .15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: isActive ? P.violet : P.ink }}>
                      {other ? `${other.first_name} ${other.last_name}` : '—'}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {conv.unread_count > 0 && (
                        <span style={{ background: P.violet, color: '#fff', borderRadius: 100, padding: '2px 7px', fontSize: 11, fontWeight: 800 }}>{conv.unread_count}</span>
                      )}
                      <span style={{ fontSize: 11, color: P.muted }}>{formatTime(conv.updated_at)}</span>
                    </div>
                  </div>
                  {conv.last_message && (
                    <div style={{ fontSize: 12, color: P.slate, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.last_message.sender_id === user.id ? 'Вы: ' : ''}{conv.last_message.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Chat window */}
        {(!isMobile || showChat) && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: P.white, borderRadius: isMobile ? 0 : 16, border: isMobile ? 'none' : `1.5px solid ${P.border}`, overflow: 'hidden', width: isMobile ? '100%' : 'auto' }}>
          {!activeConv ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.muted, flexDirection: 'column', gap: 12 }}>
              <div style={{ display:'flex', justifyContent:'center', color: P.muted }}><MessageCircle size={48}/></div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Выберите переписку</div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', gap: 12, background: P.violetPale }}>
                {isMobile && (
                  <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, marginRight: 4, padding: 0 }}>←</button>
                )}
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${P.violet},${P.violetSoft})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 16 }}>
                  {getOtherPerson(activeConv)?.first_name?.[0] || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: P.ink }}>
                    {getOtherPerson(activeConv)?.first_name} {getOtherPerson(activeConv)?.last_name}
                  </div>
                  <div style={{ fontSize: 12, color: P.violet, fontWeight: 700 }}>
                    {user.role === 'student' ? <span style={{display:'inline-flex',alignItems:'center',gap:4}}><User size={12}/>Учитель</span> : <span style={{display:'inline-flex',alignItems:'center',gap:4}}><GraduationCap size={12}/>Студент</span>}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.muted, fontSize: 14 }}>
                    <span style={{display:'inline-flex',alignItems:'center',gap:6}}>Начните переписку<Hand size={14}/></span>
                  </div>
                ) : messages.map(msg => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%',
                        background: isMe ? `linear-gradient(135deg,${P.violet},${P.violetSoft})` : P.surface,
                        color: isMe ? '#fff' : P.ink,
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        padding: '10px 14px',
                        border: isMe ? 'none' : `1px solid ${P.border}`,
                      }}>
                        <div style={{ fontSize: 14, lineHeight: 1.5 }}>{msg.text}</div>
                        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7, textAlign: 'right', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:3 }}>
                          {formatTime(msg.created_at)}
                          {isMe && (msg.is_read ? <span style={{display:'inline-flex',alignItems:'center'}}><Check size={11}/><Check size={11} style={{marginLeft:-5}}/></span> : <Check size={11}/>)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} style={{ padding: '12px 16px', borderTop: `1px solid ${P.border}`, display: 'flex', gap: 10, background: P.white }}>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Напишите сообщение..."
                  style={{ flex: 1, border: `1.5px solid ${P.border}`, borderRadius: 12, padding: '11px 16px', fontSize: 14, fontFamily: font, outline: 'none', color: P.ink }}
                  onFocus={e => e.target.style.borderColor = P.violet}
                  onBlur={e => e.target.style.borderColor = P.border}
                />
                <button type="submit" disabled={sending || !text.trim()}
                  style={{ background: `linear-gradient(135deg,${P.violet},${P.violetSoft})`, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 20px', fontWeight: 800, fontSize: 14, fontFamily: font, cursor: 'pointer', opacity: (sending || !text.trim()) ? 0.5 : 1 }}>
                  {sending ? '...' : <Send size={16}/>}
                </button>
              </form>
            </>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
