import { useState, useEffect } from 'react';
import api from '../api';
import { Briefcase, User, Target, ClipboardList, CheckCircle, XCircle, AlertTriangle, Clock, Save, Trash2, BookOpen, Banknote } from 'lucide-react';

const P = {
  violet:       '#7C3AED',
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
  red:          '#DC2626',
  redPale:      '#FEF2F2',
};
const font = "'Nunito','Segoe UI',system-ui,sans-serif";
const inputS    = { width:'100%', border:`1.5px solid #E8E4F0`, borderRadius:10, padding:'10px 14px', fontSize:14, fontFamily:font, outline:'none', color:'#0F0A1E', background:'#fff', boxSizing:'border-box' };
const textareaS = { ...inputS, resize:'vertical', lineHeight:1.6 };
const EMPTY     = { title:'', type:'teacher', subject:'', description:'', requirements:'', conditions:'', salary:'', schedule:'', status:'active' };
const TYPE_LABELS  = { teacher:'Учитель', mentor:'Ментор', curator:'Куратор', other:'Другое' };
const STATUS_COLOR = { active:'#059669', paused:'#D97706', closed:'#DC2626' };
const STATUS_LABEL = { active:'Активна', paused:'Приостановлена', closed:'Закрыта' };

export default function VacancyManager() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState('');

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = () => {
    setLoading(true);
    api.get('/hr/vacancies/')
      .then(r => setVacancies(Array.isArray(r.data) ? r.data : []))
      .catch(() => setVacancies([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowForm(true); };
  const openEdit = v => {
    setForm({ title:v.title, type:v.type, subject:v.subject||'', description:v.description, requirements:v.requirements||'', conditions:v.conditions||'', salary:v.salary||'', schedule:v.schedule||'', status:v.status });
    setEditId(v.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) { showToast('Заполни название и описание'); return; }
    setSaving(true);
    try {
      if (editId) {
        await api.patch(`/hr/vacancies/manage/?id=${editId}`, form);
        showToast('Вакансия обновлена');
      } else {
        await api.post('/hr/vacancies/manage/', form);
        showToast('Вакансия создана');
      }
      setShowForm(false);
      load();
    } catch { showToast('Ошибка сохранения'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Удалить вакансию?')) return;
    try {
      await api.delete(`/hr/vacancies/manage/?id=${id}`);
      setVacancies(p => p.filter(v => v.id !== id));
      showToast('Вакансия удалена');
    } catch { showToast('Ошибка'); }
  };

  return (
    <div style={{ fontFamily:font }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:24, right:24, background:P.ink, color:'#fff', borderRadius:12, padding:'12px 20px', fontWeight:700, fontSize:14, zIndex:9999, boxShadow:'0 8px 24px rgba(0,0,0,.2)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontWeight:900, fontSize:22, color:P.ink, letterSpacing:-0.5, display:'flex', alignItems:'center', gap:8 }}><Briefcase size={22}/> Управление вакансиями</div>
          <div style={{ fontSize:13, color:P.slate, marginTop:3 }}>
            {vacancies.length} вакансий · {vacancies.filter(v => v.status === 'active').length} активных
          </div>
        </div>
        <button onClick={openCreate} style={{ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:12, padding:'11px 24px', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:font, boxShadow:`0 4px 16px rgba(124,58,237,.3)` }}>
          + Создать вакансию
        </button>
      </div>

      {/* Modal form */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:P.white, borderRadius:24, padding:'36px 40px', maxWidth:640, width:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div style={{ fontWeight:900, fontSize:20, color:P.ink }}>{editId ? 'Редактировать' : 'Новая вакансия'}</div>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:P.muted, display:'flex', alignItems:'center' }}><XCircle size={22}/></button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:5 }}>Название *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Учитель математики (ENT)" style={inputS} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:5 }}>Тип</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...inputS, cursor:'pointer' }}>
                    <option value="teacher">Учитель</option>
                    <option value="mentor">Ментор</option>
                    <option value="curator">Куратор</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:5 }}>Статус</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inputS, cursor:'pointer' }}>
                    <option value="active">Активна</option>
                    <option value="paused">Приостановлена</option>
                    <option value="closed">Закрыта</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:5 }}>Предметы</label>
                <input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Математика, Физика" style={inputS} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:5 }}>Зарплата</label>
                  <input value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="150 000 – 300 000 ₸" style={inputS} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:5 }}>График</label>
                  <input value={form.schedule} onChange={e => set('schedule', e.target.value)} placeholder="Удалённо, гибкий" style={inputS} />
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:5 }}>Описание *</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Чем будет заниматься сотрудник..." rows={4} style={textareaS} />
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:5 }}>Требования</label>
                <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)} placeholder="— Опыт преподавания от 1 года&#10;— Знание ЕНТ программы" rows={4} style={textareaS} />
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:700, color:P.ink, marginBottom:5 }}>Условия</label>
                <textarea value={form.conditions} onChange={e => set('conditions', e.target.value)} placeholder="— Стабильная оплата&#10;— Методические материалы" rows={3} style={textareaS} />
              </div>

              <div style={{ display:'flex', gap:12, marginTop:4 }}>
                <button onClick={() => setShowForm(false)} style={{ flex:1, background:P.surface, color:P.slate, border:`1.5px solid ${P.border}`, borderRadius:12, padding:'12px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:font }}>
                  Отмена
                </button>
                <button onClick={handleSave} disabled={saving} style={{ flex:2, background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:12, padding:'12px', fontWeight:900, fontSize:15, cursor:'pointer', fontFamily:font, opacity:saving?0.7:1 }}>
                  {saving ? 'Сохраняем...' : editId ? 'Сохранить' : 'Создать вакансию'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vacancy list */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:P.slate }}>Загрузка...</div>
      ) : vacancies.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, background:P.white, borderRadius:20, border:`1.5px solid ${P.border}` }}>
          <div style={{ marginBottom:16, display:'flex', justifyContent:'center', color:P.muted }}><Briefcase size={48}/></div>
          <div style={{ fontWeight:800, fontSize:18, color:P.ink, marginBottom:8 }}>Вакансий пока нет</div>
          <div style={{ color:P.slate, fontSize:14, marginBottom:24 }}>Создайте первую — она сразу появится на сайте</div>
          <button onClick={openCreate} style={{ background:`linear-gradient(135deg,${P.violet},${P.violetSoft})`, color:'#fff', border:'none', borderRadius:12, padding:'12px 28px', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:font }}>
            + Создать вакансию
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {vacancies.map(v => (
            <div key={v.id} style={{ background:P.white, border:`1.5px solid ${P.border}`, borderRadius:16, padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6, flexWrap:'wrap' }}>
                  <span style={{ fontWeight:900, fontSize:16, color:P.ink }}>{v.title}</span>
                  <span style={{ background:STATUS_COLOR[v.status]+'18', color:STATUS_COLOR[v.status], borderRadius:6, padding:'2px 10px', fontSize:11, fontWeight:800 }}>
                    {STATUS_LABEL[v.status]}
                  </span>
                </div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                  <span style={{ fontSize:13, color:P.slate }}>{TYPE_LABELS[v.type]}</span>
                  {v.subject  && <span style={{ fontSize:13, color:P.slate, display:'inline-flex', alignItems:'center', gap:4 }}><BookOpen size={12}/> {v.subject}</span>}
                  {v.salary   && <span style={{ fontSize:13, color:P.green, fontWeight:700, display:'inline-flex', alignItems:'center', gap:4 }}><Banknote size={12}/> {v.salary}</span>}
                  {v.schedule && <span style={{ fontSize:13, color:P.slate, display:'inline-flex', alignItems:'center', gap:4 }}><Clock size={12}/> {v.schedule}</span>}
                </div>
                {v.description && (
                  <div style={{ fontSize:13, color:P.muted, marginTop:6, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', maxWidth:500 }}>
                    {v.description}
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <button onClick={() => openEdit(v)} style={{ background:P.violetPale, color:P.violet, border:`1.5px solid ${P.violetBorder}`, borderRadius:10, padding:'8px 16px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:font }}>
                  Изменить
                </button>
                <button onClick={() => handleDelete(v.id)} style={{ background:P.redPale, color:P.red, border:`1px solid ${P.red}33`, borderRadius:10, padding:'8px 14px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:font }}>
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}