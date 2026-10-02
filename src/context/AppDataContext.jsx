import { createContext, useContext, useState } from "react";

const initialMembers = [
  { id: 1, name: "Diksha", role: "Frontend & Design", email: "" },
  { id: 2, name: "Member 2", role: "Backend & Database", email: "" },
  { id: 3, name: "Member 3", role: "AI & Analytics", email: "" },
];

const initialDocuments = [
  {
    id: 1,
    title: "Project proposal",
    type: "Report",
    link: "",
    addedBy: "Diksha",
    date: "2026-09-25",
  },
];

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [members, setMembers] = useState(initialMembers);
  const [documents, setDocuments] = useState(initialDocuments);
  return (
    <AppDataContext.Provider
      value={{ members, setMembers, documents, setDocuments }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}