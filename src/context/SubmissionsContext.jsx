import { createContext, useContext } from "react";
import usePersistentState from "../hooks/usePersistentState";

// status: "pending" | "submitted" | "approved" | "changes"
const initialSubmissions = [
  {
    id: 1,
    projectId: 1,
    title: "Final report",
    description: "Complete project report as a PDF.",
    deadline: "2026-10-26",
    status: "pending",
    link: "",
    fileName: "",
    fileSize: 0,
    submittedBy: "",
    submittedAt: "",
    reviewer: "",
    reviewNote: "",
    reviewedAt: "",
  },
];

const SubmissionsContext = createContext(null);

export function SubmissionsProvider({ children }) {
  const [submissions, setSubmissions] = usePersistentState(
    "spm_submissions",
    initialSubmissions
  );
  return (
    <SubmissionsContext.Provider value={{ submissions, setSubmissions }}>
      {children}
    </SubmissionsContext.Provider>
  );
}

export function useSubmissions() {
  return useContext(SubmissionsContext);
}