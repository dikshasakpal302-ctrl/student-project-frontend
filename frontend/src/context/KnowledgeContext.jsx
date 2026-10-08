import { createContext, useContext } from "react";
import usePersistentState from "../hooks/usePersistentState";

const initialItems = [
  {
    id: 1,
    projectId: 1,
    kind: "note",
    type: "Meeting note",
    title: "Kickoff meeting",
    description: "Agreed on React frontend, FastAPI backend and PostgreSQL database.",
    content: "",
    link: "",
    fileName: "",
    fileSize: 0,
    tags: ["kickoff", "planning"],
    addedBy: "Diksha",
    date: "2026-09-30",
  },
];

const KnowledgeContext = createContext(null);

export function KnowledgeProvider({ children }) {
  const [items, setItems] = usePersistentState("spm_knowledge", initialItems);
  return (
    <KnowledgeContext.Provider value={{ items, setItems }}>
      {children}
    </KnowledgeContext.Provider>
  );
}

export function useKnowledge() {
  return useContext(KnowledgeContext);
}