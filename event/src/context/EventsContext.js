import { createContext, useContext, useEffect, useState } from "react";

const EventsContext = createContext();
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8080";
const EVENTS_URL = `${API_BASE}/api/events`
const CACHE_KEY = "eventify-events-cache";

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export const EventsProvider = ({ children }) => {
  const [events, setEvents] = useState([]);


  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(EVENTS_URL);
        if (!res.ok) throw new Error("Failed to load events");
        const data = await safeJson(res);
        if (!Array.isArray(data)) throw new Error("Bad response");
        if (cancelled) return;
        setEvents(data);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {}
      } catch (err) {
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (!cached) return;
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && !cancelled) setEvents(parsed);
        } catch {}
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshCache = (next) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(next));
    } catch {}
  };

  const addEvent = async (eventData) => {
    const res = await fetch(EVENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    });

    if (!res.ok) {
      const body = await safeJson(res);
      throw new Error(body?.error || "Failed to create event");
    }

    const created = await safeJson(res);
    setEvents((prev) => {
      const next = [...prev, created];
      refreshCache(next);
      return next;
    });
    return created;
  };

  const toggleDone = async (id) => {
    const current = events.find((e) => e.id === id);
    if (!current) return;

    const res = await fetch(`${EVENTS_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !current.done }),
    });

    if (!res.ok) {
      const body = await safeJson(res);
      throw new Error(body?.error || "Failed to update event");
    }

    const updated = await safeJson(res);
    setEvents((prev) => {
      const next = prev.map((e) => (e.id === id ? updated : e));
      refreshCache(next);
      return next;
    });
  };

  const removeEvent = async (id) => {
    const res = await fetch(`${EVENTS_URL}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await safeJson(res);
      throw new Error(body?.error || "Failed to delete event");
    }

    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      refreshCache(next);
      return next;
    });
  };

  const updateEvent = async (id, updatedFields) => {
    const res = await fetch(`${EVENTS_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields),
    });

    if (!res.ok) {
      const body = await safeJson(res);
      throw new Error(body?.error || "Failed to update event");
    }

    const updated = await safeJson(res);
    setEvents((prev) => {
      const next = prev.map((e) => (e.id === id ? updated : e));
      refreshCache(next);
      return next;
    });
    return updated;
  };

  return (
    <EventsContext.Provider
      value={{ events, addEvent, toggleDone, removeEvent, updateEvent }}
    >
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => useContext(EventsContext);
