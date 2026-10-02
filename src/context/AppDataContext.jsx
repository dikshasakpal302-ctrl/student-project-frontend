import { createContext, useContext } from "react";
import usePersistentState from "../hooks/usePersistentState";

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

const initialFeedback = [
  {
    id: 1,
    projectId: 1,
    mentor: "Mentor",
    comment: "Good idea. Add more detail to the risk prediction goals.",
    status: "needs_changes",
    date: "2026-09-28",
  },
];

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [members, setMembers] = usePersistentState("spm_members", initialMembers);
  const [documents, setDocuments] = usePersistentState("spm_documents", initialDocuments);
  const [feedback, setFeedback] = usePersistentState("spm_feedback", initialFeedback);
  const [reviewRequests, setReviewRequests] = usePersistentState("spm_reviews", {});

  return (
    <AppDataContext.Provider
      value={{
        members,
        setMembers,
        documents,
        setDocuments,
        feedback,
        setFeedback,
        reviewRequests,
        setReviewRequests,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}