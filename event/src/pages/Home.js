import { Link } from "react-router-dom";
import { useEvents } from "../context/EventsContext";
import "../styles/home.css";

const getEventTimeValue = (event) => {
  if (!event.date) return null;
  const time = event.time && event.time.trim() !== "" ? event.time : "00:00";
  const iso = `${event.date}T${time}`;
  const value = Date.parse(iso);
  if (Number.isNaN(value)) return null;
  return value;
}

const Home = () => {
  const { events } = useEvents();

  const total = events.length;
  const done = events.filter((e) => e.done).length;
  const pending = total - done;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const hour = now.getHours();

  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const todayEvents = events.filter((e) => e.date === todayStr);

  const upcomingEvents = events
    .map((e) => ({ event: e, value: getEventTimeValue(e) }))
    .filter((item) => item.value !== null && item.value >= now.getTime())
    .sort((a, b) => a.value - b.value);

  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0].event : null;

  const recent = [...events]
    .map((e) => ({ event: e, value: getEventTimeValue(e) || 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)
    .map((x) => x.event);

  return (
    <div className="page page-home">
      <section className="card hero-card">
        <div className="hero-left">
          <p className="hero-subtitle">{greeting}</p>
          <h1>Welcome to Eventify</h1>
          <p className="hero-subtitle">
            Personal event planner built with React. Organise your study, work,
            health and social life in one place.
          </p>

          <div className="hero-actions">
            <Link to="/events" className="btn-primary">
              Plan a new event
            </Link>
            <Link to="/categories" className="btn-outline">
              Explore categories
            </Link>
          </div>

          <div className="hero-tags">
  <span className="hero-tag">
    Today: {todayEvents.length}{" "}
    {todayEvents.length === 1 ? "event" : "events"}
  </span>

  <span className="hero-tag">
    Pending: {pending}
  </span>

  <span className="hero-tag">
    Completed: {done}
  </span>
</div>
        </div>

        <div className="hero-right">
          <h2>Next focus</h2>
          {nextEvent ? (
            <>
              <p>
                <strong>{nextEvent.title}</strong>
              </p>
              <p className="text-muted">
                {nextEvent.date}
                {nextEvent.time && ` · ${nextEvent.time}`} ·{" "}
                {nextEvent.category} · {nextEvent.priority} priority
              </p>

              <div className="hero-stat-grid">
                <div className="hero-stat">
                  <p className="hero-stat-label">Total events</p>
                  <p className="hero-stat-value">{total}</p>
                </div>
                <div className="hero-stat">
                  <p className="hero-stat-label">Pending</p>
                  <p className="hero-stat-value">{pending}</p>
                </div>
                <div className="hero-stat">
                  <p className="hero-stat-label">Completed</p>
                  <p className="hero-stat-value">{done}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted">
                No upcoming events yet. Create your first plan in{" "}
                <strong>My Events</strong>.
              </p>
              <div className="hero-stat-grid">
                <div className="hero-stat">
                  <p className="hero-stat-label">Total events</p>
                  <p className="hero-stat-value">{total}</p>
                </div>
                <div className="hero-stat">
                  <p className="hero-stat-label">Pending</p>
                  <p className="hero-stat-value">{pending}</p>
                </div>
                <div className="hero-stat">
                  <p className="hero-stat-label">Completed</p>
                  <p className="hero-stat-value">{done}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="card activity-card">
        <div className="activity-left">
          <h2>Recent activity</h2>
          <p className="text-muted">
            A quick timeline of the last events you added or updated. It helps
            you remember what you planned recently.
          </p>

          {recent.length === 0 ? (
            <p className="text-muted">
              No events yet. Start by creating one in <strong>My Events</strong>
              .
            </p>
          ) : (
            <ul className="activity-list">
              {recent.map((e) => (
                <li key={e.id} className="activity-item">
                  <span
                    className={
                      "activity-dot " + (e.done ? "activity-dot-done" : "activity-dot-pending")
                    }
                  ></span>
                  <div className="activity-main">
                    <div className="activity-title">{e.title}</div>
                    <div className="activity-meta">
                      {e.date || "No date"}
                      {e.time && ` · ${e.time}`} · {e.category} ·{" "}
                      {e.priority} priority
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="activity-right">
          <h3>How Eventify works</h3>
          <ol className="activity-steps">
            <li>
              <strong>Plan</strong> your tasks and events from{" "}
              <span className="activity-highlight">My Events</span>.
            </li>
            <li>
              <strong>Organise</strong> them using categories and priorities.
            </li>
            <li>
              <strong>Review</strong> your progress anytime from the{" "}
              <span className="activity-highlight">Summary</span> page.
            </li>
          </ol>
          <p className="text-muted">
            All the information is stored in a <strong>MySQL</strong> database
            (XAMPP) and accessed through a <strong>REST API</strong>. This keeps
            the app behaving like a real-world full-stack planner.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Home;
