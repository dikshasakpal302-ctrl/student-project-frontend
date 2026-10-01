import { createContext, useContext, useState } from "react";

const initialTasks = [
  { id: 1, title: "Design login screen", assignee: "Diksha", priority: "high", deadline: "2026-10-05", status: "todo" },
  { id: 2, title: "Set up database", assignee: "Member 2", priority: "medium", deadline: "2026-10-08", status: "in_progress" },
  { id: 3, title: "Train risk model", assignee: "Member 3", priority: "high", deadline: "2026-10-12", status: "blocked" },
  { id: 4, title: "Create project form", assignee: "Diksha", priority: "low", deadline: "2026-10-01", status: "done" },
];

const TasksContext = createContext(null);

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState(initialTasks);
  return (
    <TasksContext.Provider value={{ tasks, setTasks }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  return useContext(TasksContext);
}