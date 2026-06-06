import { CALENDAR_EVENTS } from "../../constants/index.js";

const DAYS = [
  { day: 13, weekday: "Четверг" },
  { day: 14, weekday: "Пятница" },
  { day: 15, weekday: "Суббота" },
  { day: 17, weekday: "Понедельник" },
  { day: 18, weekday: "Вторник" },
];

const TAG_COLORS = {
  КОНКУРС:    { bg: "#EFF6FF", color: "#1D4ED8" },
  ОЛИМПИАДА:  { bg: "#ECFDF5", color: "#059669" },
  СЕМИНАР:    { bg: "#FFFBEB", color: "#D97706" },
  СОБЫТИЕ:    { bg: "rgba(31,80,115,0.08)", color: "#1F5073" },
};

export default function EventCalendar() {
  const filtered = CALENDAR_EVENTS;

  const grouped = DAYS.reduce((acc, d) => {
    acc[d.day] = filtered.filter(e => e.day === d.day);
    return acc;
  }, {});

  return (
    <section 
    id="calendar"
    style={{ background: "#1a2744", marginTop: 56, padding: "0 0 40px" }}>
      <style>{`
        .cal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px 32px 0;
          flex-wrap: wrap; gap: 12px;
        }
        .cal-month {
          font-size: 22px; font-weight: 800; color: #fff;
          letter-spacing: 0.08em; text-transform: uppercase;
        }
        .cal-nav { display: flex; align-items: center; gap: 8px; }
        .cal-nav-btn {
          width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.08); color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .cal-nav-btn:hover { background: rgba(255,255,255,0.18); }
        .cal-days {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1px;
          margin-top: 16px;
          background: rgba(255,255,255,0.06);
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .cal-day-col {
          padding: 16px 14px;
          background: #1a2744;
          min-height: 180px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .cal-day-col:hover { background: #1e3058; }
        .cal-day-head {
          display: flex; align-items: baseline; gap: 6px;
          margin-bottom: 6px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .cal-day-num {
          font-size: 20px; font-weight: 800; color: #fff;
        }
        .cal-day-name {
          font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5);
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .cal-event {
          border-radius: 6px;
          padding: 7px 9px;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .cal-event:hover { opacity: 0.85; }
        .cal-event-tag {
          font-size: 9px; font-weight: 800; letter-spacing: 0.08em;
          text-transform: uppercase; margin-bottom: 4px;
        }
        .cal-event-time {
          font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.7);
          margin-bottom: 3px;
        }
        .cal-event-title {
          font-size: 11px; line-height: 1.4; color: #fff;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (max-width: 900px) {
          .cal-days { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 580px) {
          .cal-days { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="cal-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="cal-month">Март27</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Событийный календарь</div>
        </div>
        <div className="cal-nav">
          <button className="cal-nav-btn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7l4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="cal-nav-btn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="cal-days">
        {DAYS.map(({ day, weekday }) => (
          <div key={day} className="cal-day-col">
            <div className="cal-day-head">
              <span className="cal-day-num">{day}</span>
              <span className="cal-day-name">{weekday}</span>
            </div>
            {(grouped[day] || []).map((ev, i) => {
              const colors = TAG_COLORS[ev.tag] || { bg: "#1D4ED8", color: "#fff" };
              return (
                <div key={i} className="cal-event" style={{ background: "rgba(255,255,255,0.07)", borderLeft: `3px solid ${colors.bg}` }}>
                  <div className="cal-event-tag" style={{ color: colors.bg }}>{ev.tag}</div>
                  <div className="cal-event-time">{ev.time}</div>
                  <div className="cal-event-title">{ev.title}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
