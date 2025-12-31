import { useState } from "react";
import { useEvents } from "../context/EventsContext";
import "../styles/events.css";

const CATEGORY_OPTIONS = ["Study", "Work", "Health", "Social", "Other"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

const getDateSortValue = (event) => {
  if (!event.date) return "";
  const time = event.time && event.time.trim() !== "" ? event.time : "00:00";
  return `${event.date}T${time}`;
}

const Events = () => {
  const { events, addEvent, toggleDone, removeEvent, updateEvent } =
    useEvents();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("Study");
  const [priority, setPriority] = useState("Medium");
  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [filterCategory, setFilterCategory] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState("date");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !date) {
      alert("Title and date are required.");
      return;
    }

    const data = { title, date, time, category, priority, notes };

    try {
      if (editingId) await updateEvent(editingId, data);
      else await addEvent(data);
    } catch (err) {
      alert(err?.message || "Request failed");
      return;
    }

    setTitle("");
    setDate("");
    setTime("");
    setCategory("Study");
    setPriority("Medium");
    setNotes("");
    setEditingId(null);
  };

  const startEdit = (ev) => {
    setTitle(ev.title);
    setDate(ev.date);
    setTime(ev.time || "");
    setCategory(ev.category);
    setPriority(ev.priority);
    setNotes(ev.notes || "");
    setEditingId(ev.id);
  };

  let visible = events;

  if (filterCategory !== "All")
    visible = visible.filter((e) => e.category === filterCategory);

  if (filterPriority !== "All")
    visible = visible.filter((e) => e.priority === filterPriority);

  if (searchText.trim() !== "") {
    const t = searchText.toLowerCase();
    visible = visible.filter(
      (e) =>
        e.title.toLowerCase().includes(t) ||
        (e.notes || "").toLowerCase().includes(t)
    );
  }

  visible = [...visible].sort((a, b) => {
    if (sortMode === "date") {
      return getDateSortValue(a) > getDateSortValue(b) ? 1 : -1;
    } else if (sortMode === "priority") {
      const order = { High: 0, Medium: 1, Low: 2 };
      return order[a.priority] - order[b.priority];
    }
    return 0;
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = events.filter((e) => e.date === todayStr).length;
  const completedCount = events.filter((e) => e.done).length;

  return (
    <div className="page page-events">
      <section className="card event-add-card">
        <header className="event-header">
          <div>
            <h1>My events</h1>
            <p className="text-muted">
              Create and manage your personal events. Your data is saved in
              <strong> MySQL</strong> (XAMPP) <strong>Don't Worry :)</strong>
            </p>
          </div>
          <div className="event-step-pill">
            Step 1 · Add event details
          </div>
        </header>

        <form className="event-form-fixed" onSubmit={handleSubmit}>
          <div className="event-grid">
            <label>
              <span>Title *</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Study React exam"
              />
            </label>

            <label>
              <span>Date *</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            <label>
              <span>Time</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </label>

            <label>
              <span>Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Priority</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>

            <label className="full-row">
              <span>Notes</span>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Extra information..."
              />
            </label>
          </div>

          <div className="event-actions">
            <button type="submit" className="btn-primary event-add-btn">
              {editingId ? "Save changes" : "Add event"}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn-outline event-cancel-btn"
                onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setDate("");
                  setTime("");
                  setCategory("Study");
                  setPriority("Medium");
                  setNotes("");
                }}
              >
                Cancel edit
              </button>
            )}

            <p className="event-hint text-muted">
              Fields marked with * are required. After adding your event you
              can review it in the list below (Step 2).
            </p>
          </div>
        </form>
      </section>

      <section className="card event-list-card">
        <div className="stats-row">
          <span className="badge">Total: {events.length}</span>
          <span className="badge">Today: {todayCount}</span>
          <span className="badge">Completed: {completedCount}</span>
        </div>

        <div className="filters-row">
          <label>
            Category
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option>All</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <label>
            Priority
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option>All</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>

          <label>
            Sort by
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
              <option value="date">Date</option>
              <option value="priority">Priority</option>
            </select>
          </label>

          <label className="search-box">
            Search
            <input
              type="text"
              placeholder="Title or notes..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </label>
        </div>

        <h2>Event list</h2>

        {visible.length === 0 ? (
          <p className="text-muted">No events found.</p>
        ) : (
          <div className="table-responsive">
            <table className="event-table">
              <thead>
                <tr>
                  <th>Done</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Cat.</th>
                  <th>Prior.</th>
                  <th>Notes</th>
                  <th>Edit</th>
                  <th>Remove</th>
                </tr>
              </thead>

              <tbody>
                {visible.map((e) => (
                  <tr key={e.id} className={e.done ? "event-done" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={e.done}
                        onChange={() =>
                          toggleDone(e.id).catch((err) =>
                            alert(err?.message || "Request failed")
                          )
                        }
                      />
                    </td>
                    <td>{e.title}</td>
                    <td>{e.date}</td>
                    <td>{e.time || "-"}</td>
                    <td>{e.category}</td>
                    <td>{e.priority}</td>
                    <td>{e.notes || "-"}</td>
                    <td>
                      <button className="btn-outline small-btn" onClick={() => startEdit(e)}>
                        Edit
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn-danger small-btn"
                        onClick={() =>
                          removeEvent(e.id).catch((err) =>
                            alert(err?.message || "Request failed")
                          )
                        }
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Events;
