import { useState } from "react";
import { useEvents } from "../context/EventsContext";
import "../styles/more.css";

const More = () => {
  const { events } = useEvents();
  const [showCompleted, setShowCompleted] = useState(true);

  const total = events.length;
  const completed = events.filter((e) => e.done).length;
  const pending = total - completed;
  const completion =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  const categoryCounts = events.reduce((acc, e) => {
    const key = e.category || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const filteredEvents = events.filter((e) =>
    showCompleted ? true : !e.done
  );

  return (
    <div className="page page-more">
      <section className="card summary-header-card">
        <div className="summary-header-left">
          <p className="summary-kicker">Overview</p>
          <h1>My planning summary</h1>
          <p className="text-muted">
            This page gives a quick dashboard of all your events:
            how many you created, how many are completed and a small
            breakdown per category.
          </p>

          <div className="summary-kpi-grid">
            <div className="summary-kpi">
              <span className="summary-kpi-label">Total events</span>
              <span className="summary-kpi-value">{total}</span>
            </div>
            <div className="summary-kpi">
              <span className="summary-kpi-label">Pending</span>
              <span className="summary-kpi-value">{pending}</span>
            </div>
            <div className="summary-kpi">
              <span className="summary-kpi-label">Completed</span>
              <span className="summary-kpi-value">{completed}</span>
            </div>
          </div>

          <div className="summary-progress-wrap">
            <div className="summary-progress-top">
              <span className="text-muted">Completion</span>
              <span className="summary-progress-percent">
                {completion}%
              </span>
            </div>
            <div className="summary-progress">
              <div
                className="summary-progress-fill"
                style={{ width: completion + "%" }}
              ></div>
            </div>
          </div>
        </div>

        <div className="summary-header-right">
          <h2>By category</h2>
          {Object.keys(categoryCounts).length === 0 ? (
            <p className="text-muted">
              No events yet. Add some from <strong>My Events</strong> to
              see the breakdown.
            </p>
          ) : (
            <ul className="summary-category-list">
              {Object.entries(categoryCounts).map(([name, count]) => (
                <li key={name}>
                  <span className="summary-category-name">{name}</span>
                  <span className="summary-category-count badge">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card summary-list-card">
        <div className="summary-list-header">
          <div>
            <h2>Events list (summary view)</h2>
            <p className="text-muted">
              This small list lets you quickly review your events. You can
              hide completed ones if you just want to focus on what is
              still active.
            </p>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={() => setShowCompleted((prev) => !prev)}
            />
            Show completed
          </label>
        </div>

        {filteredEvents.length === 0 ? (
          <p className="text-muted">
            No events to show with the current filter.
          </p>
        ) : (
          <ul className="summary-events-list">
            {filteredEvents.map((e) => (
              <li
                key={e.id}
                className={
                  "summary-event-item " + (e.done ? "filtered-done" : "")
                }
              >
                <div className="summary-event-main">
                  <span
                    className={
                      "summary-status-dot " +
                      (e.done
                        ? "summary-status-dot-done"
                        : "summary-status-dot-pending")
                    }
                  ></span>
                  <div>
                    <div className="summary-event-title">{e.title}</div>
                    <div className="summary-event-meta">
                      {e.date || "No date"}
                      {e.time && ` · ${e.time}`} · {e.category} ·{" "}
                      {e.priority} priority
                    </div>
                  </div>
                </div>
                <div className="summary-event-notes">
                  {e.notes ? e.notes : "No notes"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default More;
