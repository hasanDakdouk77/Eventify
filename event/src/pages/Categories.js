import { useState } from "react";
import "../styles/categories.css";

const CATEGORY_DATA = [
  {
    id: "study",
    name: "Study",
    description:
      "Exams, assignments, group projects, study sessions and revision days.",
    ideas: [
      "Prepare for midterm exam",
      "Finish programming assignment",
      "Group revision session",
    ],
  },
  {
    id: "work",
    name: "Work",
    description:
      "Shifts, meetings, deadlines, presentations and any professional task.",
    ideas: [
      "Weekly team meeting",
      "Finish project report",
      "Prepare presentation slides",
    ],
  },
  {
    id: "health",
    name: "Health",
    description:
      "Anything related to your physical and mental health and movement.",
    ideas: ["Gym workout", "Doctor appointment", "Morning walk"],
  },
  {
    id: "social",
    name: "Social",
    description:
      "Friends, family, birthdays, game nights, outings and gatherings.",
    ideas: ["Movie night with friends", "Family lunch", "Birthday party"],
  },
  {
    id: "other",
    name: "Other",
    description:
      "Everything that does not fit in the other groups: hobbies, travel, etc.",
    ideas: ["Photography day", "Shopping", "Short trip"],
  },
];

const Categories = () => {
  const [selectedId, setSelectedId] = useState("study");

  const selectedCategory =
    CATEGORY_DATA.find((c) => c.id === selectedId) || CATEGORY_DATA[0];

  return (
    <div className="page page-categories">
      <section className="card">
        <h1>Event categories</h1>
        <p className="text-muted">
          Categories help you organise your personal events. Choose one to see a
          short description and example event ideas.
        </p>

        <div className="categories-layout">
          <ul className="category-list">
            {CATEGORY_DATA.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  className={
                    "category-btn" +
                    (selectedId === category.id ? " category-btn-active" : "")
                  }
                  onClick={() => setSelectedId(category.id)}
                >
                  <span>{category.name}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="category-details">
            <h2>{selectedCategory.name}</h2>
            <p>{selectedCategory.description}</p>

            <h3>Example ideas</h3>
            <ul>
              {selectedCategory.ideas.map((idea) => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Categories;
