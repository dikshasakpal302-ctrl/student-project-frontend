import { createContext, useContext } from "react";
import usePersistentState from "../hooks/usePersistentState";

const initialMilestones = [
  {
    id: 1,
    projectId: 1,
    title: "Database ready",
    description: "Schema designed and tables created.",
    deadline: "2026-10-10",
  },
];

const MilestonesContext = createContext(null);

export function MilestonesProvider({ children }) {
  const [milestones, setMilestones] = usePersistentState(
    "spm_milestones",
    initialMilestones
  );
  return (
    <MilestonesContext.Provider value={{ milestones, setMilestones }}>
      {children}
    </MilestonesContext.Provider>
  );
}

export function useMilestones() {
  return useContext(MilestonesContext);
}