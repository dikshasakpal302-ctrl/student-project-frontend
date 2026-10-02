import { createContext, useContext, useState } from "react";

const initialProjects = [
  {
    id: 1,
    name: "Student Project Manager",
    description: "A tool to plan, track and manage student team projects.",
    team: ["Diksha", "Member 2", "Member 3"],
    techStack: ["React", "Tailwind", "Node.js"],
    startDate: "2026-09-25",
    deadline: "2026-10-28",
    goals: "Demo a working app with AI risk prediction at the summit.",
  },
];

const ProjectsContext = createContext(null);

export function ProjectsProvider({ children }) {
  const [projects, setProjects] = useState(initialProjects);
  return (
    <ProjectsContext.Provider value={{ projects, setProjects }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  return useContext(ProjectsContext);
}