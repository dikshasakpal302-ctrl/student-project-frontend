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
  const [members, setMembers] = useState(initialMembers);
  const [documents, setDocuments] = useState(initialDocuments);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [reviewRequests, setReviewRequests] = useState({});

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