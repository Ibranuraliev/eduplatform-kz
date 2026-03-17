import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, Clock, Home, TrendingUp, Search, ChevronUp, ChevronDown, Rocket, Banknote, FileText, CheckCircle, Gift, BookOpen } from 'lucide-react';
import api from '../api';

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
};
const font = "'Nunito','Segoe UI',system-ui,sans-serif";

const TYPE_LABELS = {
  teacher: 'Учитель',
  mentor:  'Ментор',
  curator: 'Куратор',
  other:   'Другое',
};

const TYPE_COLORS = {
  teacher: '#7C3AED',
  mentor:  '#059669',
  curator: '#D97706',
  other:   '#2563EB',
};

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [filter, setFilter]       = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/hr/vacancies/')
      .then(r => setVacancies(r.data))
      .catch(() => setVacancies([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? vacancies : vacancies.filter(v => v.type === filter);

  return (
    <div style={{ minHeight: '100vh', background: '#F8F6FF', fontFamily: font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: P.white, borderBottom: `1px solid ${P.border}`, padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(124,58,237,.06)' }}>
        <Link to="/" style={{ fontWeight: 900, fontSize: 20, textDecoration: 'none', color: P.ink }}>
          <span style={{ color: P.violet }}>Edu</span>Platform
          <span style={{ marginLeft: 8, fontSize: 11, background: P.violet, color: '#fff', borderRadius: 6, padding: '2px 7px', fontWeight: 800, verticalAlign: 'middle' }}>KZ</span>
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link to="/" style={{ color: P.slate, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>← Курсы</Link>
          </div>
      </nav>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${P.violet} 0%, ${P.violetDark} 100%)`, padding: '60px 40px', textAlign: 'center', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', borderRadius: 100, padding: '6px 18px', marginBottom: 20, fontSize: 13, fontWeight: 700 }}>
            <Briefcase size={16} color="#fff" />
            Открытые вакансии
          </div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, margin: '0 0 16px', letterSpacing: -1, lineHeight: 1.1 }}>
            Присоединяйся к команде
          </h1>
          <p style={{ fontSize: 16, opacity: 0.85, maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
            Помогай казахстанским студентам поступить в лучшие университеты. Работай удалённо с гибким графиком.
          </p>

          {/* Benefits */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 36, flexWrap: 'wrap' }}>
            {[
              { icon: 'Banknote', label: 'Достойная оплата' },
              { icon: 'Clock', label: 'Гибкий график' },
              { icon: 'Home', label: 'Удалённая работа' },
              { icon: 'TrendingUp', label: 'Рост и развитие' },
            ].map(b => {
              const iconElement = b.icon === 'Banknote' ? <Banknote size={20} /> : b.icon === 'Clock' ? <Clock size={20} /> : b.icon === 'Home' ? <Home size={20} /> : <TrendingUp size={20} />;
              return (
                <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700 }}>
                  <span style={{ display:'flex', alignItems:'center' }}>
                    {iconElement}
                  </span>
                  {b.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Все' },
            { key: 'teacher', label: 'Учитель' },
            { key: 'mentor', label: 'Ментор' },
            { key: 'curator', label: 'Куратор' },
            { key: 'other', label: 'Другое' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                padding: '9px 20px', borderRadius: 12,
                fontWeight: 700, fontSize: 13, fontFamily: font, cursor: 'pointer',
                border: `1.5px solid ${filter === f.key ? P.violet : P.border}`,
                background: filter === f.key ? P.violetPale : P.white,
                color: filter === f.key ? P.violet : P.slate,
                transition: 'all .2s',
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: P.slate }}>
            <div style={{ marginBottom: 16, display:'flex', justifyContent:'center' }}><Clock size={40}/></div>
            Загружаем вакансии...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, background: P.white, borderRadius: 24, border: `1.5px solid ${P.border}` }}>
            <Search size={48} color={P.slate} style={{ marginBottom: 16, display: 'inline-block' }} />
            <div style={{ fontWeight: 800, fontSize: 18, color: P.ink, marginBottom: 8 }}>Вакансий пока нет</div>
            <div style={{ color: P.slate, fontSize: 14 }}>Следите за обновлениями — скоро появятся новые</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(v => (
              <div key={v.id}
                style={{
                  background: P.white, border: `1.5px solid ${P.border}`, borderRadius: 20,
                  padding: '28px 32px', cursor: 'pointer', transition: 'all .2s',
                  boxShadow: selected?.id === v.id ? `0 8px 32px rgba(124,58,237,.15)` : '0 2px 8px rgba(0,0,0,.04)',
                  borderColor: selected?.id === v.id ? P.violet : P.border,
                }}
                onClick={() => setSelected(selected?.id === v.id ? null : v)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    {/* Type badge */}
                    <span style={{
                      display: 'inline-block', marginBottom: 10,
                      background: TYPE_COLORS[v.type] + '18',
                      color: TYPE_COLORS[v.type],
                      borderRadius: 8, padding: '3px 12px',
                      fontSize: 12, fontWeight: 800,
                    }}>
                      {TYPE_LABELS[v.type]}
                    </span>

                    <h2 style={{ fontWeight: 900, fontSize: 20, color: P.ink, margin: '0 0 8px', letterSpacing: -0.3 }}>
                      {v.title}
                    </h2>

                    {v.subject && (
                      <div style={{ fontSize: 13, color: P.slate, marginBottom: 10 }}>
                        <BookOpen size={14} style={{ display: 'inline-block', marginRight: 6 }} />
                        {v.subject}
                      </div>
                    )}

                    <p style={{ color: P.slate, fontSize: 14, lineHeight: 1.7, margin: '0 0 16px' }}>
                      {v.description.length > 200 && selected?.id !== v.id
                        ? v.description.slice(0, 200) + '...'
                        : v.description}
                    </p>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {v.salary && (
                        <span style={{ background: P.greenPale, color: P.green, borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>
                          <Banknote size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>{v.salary}
                        </span>
                      )}
                      {v.schedule && (
                        <span style={{ background: P.violetPale, color: P.violet, borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>
                          <Clock size={13} style={{display:'inline-flex',verticalAlign:'middle',marginRight:4}}/>{v.schedule}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/apply-teacher?vacancy=${v.id}&title=${encodeURIComponent(v.title)}`); }}
                      style={{
                        background: `linear-gradient(135deg,${P.violet},${P.violetSoft})`,
                        color: '#fff', border: 'none', borderRadius: 14,
                        padding: '12px 24px', fontWeight: 900, fontSize: 14,
                        cursor: 'pointer', fontFamily: font,
                        boxShadow: `0 4px 16px rgba(124,58,237,.3)`,
                        whiteSpace: 'nowrap',
                      }}>
                      <FileText size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Откликнуться
                    </button>
                    <span style={{ fontSize: 12, color: P.muted }}>
                      {selected?.id === v.id ? <ChevronUp size={16} style={{ display: 'inline-block' }} /> : <ChevronDown size={16} style={{ display: 'inline-block' }} />}
                      {selected?.id === v.id ? ' Свернуть' : ' Подробнее'}
                    </span>
                  </div>
                </div>

                {/* Expanded details */}
                {selected?.id === v.id && (
                  <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1.5px solid ${P.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {v.requirements && (
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: P.ink, marginBottom: 8 }}><CheckCircle size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Требования</div>
                        <div style={{ color: P.slate, fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{v.requirements}</div>
                      </div>
                    )}
                    {v.conditions && (
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: P.ink, marginBottom: 8 }}><Gift size={14} style={{display:'inline-flex',verticalAlign:'middle',marginRight:6}}/>Условия</div>
                        <div style={{ color: P.slate, fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{v.conditions}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA bottom */}
        <div style={{ marginTop: 48, background: `linear-gradient(135deg,${P.violet},${P.violetDark})`, borderRadius: 24, padding: '40px', textAlign: 'center', color: '#fff' }}>
          <Rocket size={32} style={{ marginBottom: 12, display: 'inline-block' }} />
          <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Не нашёл подходящую вакансию?</div>
          <div style={{ opacity: 0.85, fontSize: 14, marginBottom: 24 }}>Оставь заявку — мы свяжемся когда появится нужная позиция</div>
          <button onClick={() => navigate('/apply-teacher')}
            style={{ background: '#fff', color: P.violet, border: 'none', borderRadius: 14, padding: '14px 32px', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: font }}>
            Оставить заявку
          </button>
        </div>
      </div>
    </div>
  );
}
