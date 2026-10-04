// Rule-based placeholder for Member 3's Viva AI.
// Member 3 can replace generateQuestions() with a real AI call.
// The screen only needs: [{ category, question, hint, followUps: [] }]

export const CATEGORIES = [
  { key: "basic", label: "Basic" },
  { key: "technical", label: "Technical" },
  { key: "architecture", label: "Architecture" },
  { key: "database", label: "Database" },
  { key: "ml", label: "ML / AI" },
  { key: "project", label: "Project-specific" },
  { key: "cross", label: "Cross-questioning" },
];

const has = (text, words) => words.some((w) => text.includes(w));

export function generateQuestions({ project, tasks, milestones, knowledge, today }) {
  if (!project) return [];

  const stack = project.techStack || [];
  const taskTitles = tasks.map((t) => t.title).join(" ");
  const text = [stack.join(" "), project.description, project.goals, taskTitles]
    .join(" ")
    .toLowerCase();

  const q = [];
  const add = (category, question, hint, followUps = []) =>
    q.push({ category, question, hint, followUps });

  /* ---------- Basic ---------- */
  add(
    "basic",
    `Explain "${project.name}" in two minutes.`,
    "Cover four things: the problem, who has it, what your system does, and what you achieved. Practise it out loud with a timer.",
    ["Who is your target user?", "What makes it different from existing tools?"]
  );
  add(
    "basic",
    "What problem does your project solve?",
    "Give a real example, for example student teams missing deadlines because nobody sees risks early.",
    ["How did you confirm that this problem is real?"]
  );
  add(
    "basic",
    "What was your personal contribution to the project?",
    "Be specific about what you built yourself and how you worked with the others. Name screens, files or features.",
    ["Which part was the hardest for you and why?", "What would you do differently now?"]
  );
  add(
    "basic",
    "What are the limitations of your project, and what would you add next?",
    "Honest limits are fine. Mention what is mocked or simplified, then give a clear next step for each.",
    ["Which limitation matters most to real users?"]
  );

  /* ---------- Technical ---------- */
  stack.slice(0, 4).forEach((tech) =>
    add(
      "technical",
      `Why did you choose ${tech}? What alternatives did you consider?`,
      `Give 2 or 3 concrete reasons for ${tech}, name one alternative, and say why you did not pick it.`,
      [`What is one weakness of ${tech}?`]
    )
  );
  if (has(text, ["react"])) {
    add(
      "technical",
      "What is the difference between props and state in React? How does your app share data between pages?",
      "Props are passed in from a parent, state is owned by the component. This app shares data with Context providers, so every page reads the same tasks and projects.",
      ["What happens when state changes?", "Why not just use props everywhere?"]
    );
    add(
      "technical",
      "What are React hooks? Which ones did you use?",
      "Mention useState, useContext and useEffect, and say where each one is used in your project.",
      ["Why can hooks not be called inside an if statement?"]
    );
  }
  if (has(text, ["tailwind"])) {
    add(
      "technical",
      "What is Tailwind CSS and what are its pros and cons?",
      "Utility classes written in markup. Pros: fast, consistent. Cons: long class lists, learning the names.",
      []
    );
  }
  if (has(text, ["fastapi", "python"])) {
    add(
      "technical",
      "How does FastAPI validate incoming data, and why is it fast?",
      "Pydantic models validate and convert request data. It is built on async Starlette and automatically generates Swagger docs.",
      ["What is the difference between sync and async endpoints?"]
    );
  }
  if (has(text, ["node", "express"])) {
    add(
      "technical",
      "How does Node.js handle many requests at once?",
      "A single-threaded event loop with non-blocking I/O. Slow work is passed off and a callback or promise returns later.",
      []
    );
  }
  add(
    "technical",
    "How does login and authentication work in your system?",
    "Explain sign up, password storage, how the user stays logged in (for example a JWT token), and how pages are protected. Note that the demo version stores accounts in the browser only.",
    ["Why must passwords never be stored as plain text?", "What is a JWT and what does it contain?"]
  );
  add(
    "technical",
    "How did your team use Git and GitHub?",
    "Mention commits, branches, pull requests and how you avoided overwriting each other's work.",
    ["What is a merge conflict and how do you fix one?"]
  );

  /* ---------- Architecture ---------- */
  add(
    "architecture",
    "Draw and explain the architecture of your system.",
    "Browser (React) calls the API (FastAPI), which reads and writes the database. The AI layer reads project data and returns health, risks and recommendations. GitHub and documents feed the data in.",
    ["Which part is the single point of failure?", "Where does each team member's work plug in?"]
  );
  add(
    "architecture",
    "How does data flow from the browser to the database and back?",
    "Walk through one action, for example creating a task: form, API request, validation, database insert, response, screen updates.",
    ["What happens if the request fails halfway?"]
  );
  add(
    "architecture",
    "How would your system handle 1,000 projects instead of 10?",
    "Database indexes, pagination, caching the health scores, running the AI on a schedule instead of on every page load.",
    ["Which part would break first?"]
  );
  add(
    "architecture",
    "Where do you handle security in your system?",
    "Authentication, role checks (student vs mentor), input validation, keeping API keys in environment files and out of GitHub.",
    ["What is the difference between authentication and authorization?"]
  );
  if (milestones.length > 0) {
    add(
      "architecture",
      `You planned ${milestones.length} ${milestones.length === 1 ? "milestone" : "milestones"} (${milestones
        .slice(0, 3)
        .map((m) => m.title)
        .join(", ")}). Why did you split the work this way?`,
      "Explain the order, which milestone depends on which, and how you tracked progress.",
      ["What would you move earlier if you started again?"]
    );
  }

  /* ---------- Database ---------- */
  add(
    "database",
    "Explain your database schema and how the tables are related.",
    "Users, Projects, Milestones, Tasks, Subtasks, Dependencies, Documents and Feedback. A project has many milestones and tasks, and a task can belong to a milestone and have many dependencies.",
    ["Draw one-to-many and many-to-many examples from your schema."]
  );
  add(
    "database",
    has(text, ["postgres", "sql"])
      ? "Why a relational database like PostgreSQL instead of MongoDB for this project?"
      : "Which database does your project use and why?",
    "Your data is full of relationships (project, milestone, task, dependency, member), and a relational model enforces them with foreign keys and joins.",
    ["When would MongoDB have been the better choice?"]
  );
  add(
    "database",
    "How do you store task dependencies in a database?",
    "A join table (task_id, depends_on_id) forms a many-to-many relationship from tasks to tasks. You also need to stop circular dependencies.",
    ["How would you detect a circular dependency?"]
  );
  add(
    "database",
    "What is normalization, and what is an index?",
    "Normalization removes duplicated data by splitting tables. An index speeds up lookups, for example on project_id or deadline, but slows down writes a little.",
    ["Which column in your schema needs an index?"]
  );

  /* ---------- ML / AI ---------- */
  const mlWords = ["ml", "model", "opencv", "tensorflow", "pytorch", "scikit", "face", "predict", "neural", "dataset", "ai "];
  if (has(text + " ", mlWords) || knowledge.some((k) => k.type === "Dataset")) {
    add(
      "ml",
      "Which model or algorithm did you use, and why?",
      "Name the model, what input it takes, what it outputs, and why it fits better than a simpler option.",
      ["What simpler baseline did you compare against?"]
    );
    add(
      "ml",
      "How did you evaluate your model? Which metrics did you use?",
      "Accuracy alone can mislead. Mention precision, recall or F1, the train and test split, and what score you reached.",
      ["What is overfitting and how did you check for it?"]
    );
    add(
      "ml",
      "Where did your data come from, and how did you clean it?",
      "Source, size, missing values, class balance, and any bias you noticed.",
      ["What would happen with data from a different college?"]
    );
  }
  add(
    "ml",
    "How does your system calculate the project health score and risks? Is it machine learning?",
    "Currently rules: overdue tasks, blocked tasks, overloaded members and deadline status each reduce a score from 100. Be honest that it is rule-based and explainable, and say how a trained model could improve it later.",
    ["Why are explainable rules a good first step?", "What data would you need to train a real prediction model?"]
  );
  add(
    "ml",
    "How does the what-if simulation work?",
    "It follows task dependencies. If a task slips by N days, every task that depends on it slips too, and the final date is compared with the project deadline.",
    ["What does this simple model ignore?"]
  );

  /* ---------- Project-specific (from your real data) ---------- */
  const members = new Set(tasks.map((t) => t.assignee).filter(Boolean));
  if (members.size > 1) {
    add(
      "project",
      "Who worked on what? How did you divide the work in your team?",
      `${[...members].join(", ")} have tasks in this project. Explain the split and how you handled someone falling behind.`,
      ["What did you do when a task was blocked by someone else?"]
    );
  }
  tasks
    .filter((t) => t.status === "blocked")
    .slice(0, 2)
    .forEach((t) =>
      add(
        "project",
        `Your task "${t.title}" is blocked. What is blocking it and how will you unblock it?`,
        "Name the exact cause, the person or resource you need, and a date by which it will be fixed.",
        ["Which other tasks are affected while it stays blocked?"]
      )
    );
  tasks
    .filter((t) => t.status !== "done" && t.deadline && t.deadline < today)
    .slice(0, 2)
    .forEach((t) =>
      add(
        "project",
        `"${t.title}" is past its deadline (${t.deadline}). Why is it late?`,
        "Give an honest cause and a recovery plan: smaller subtasks, more help, or a realistic new date.",
        ["What did you learn about estimating work?"]
      )
    );
  milestones.slice(0, 3).forEach((m) =>
    add(
      "project",
      `Walk us through the milestone "${m.title}". What did you deliver?`,
      "Describe the tasks inside it, what is finished, and what is evidence (a demo, a commit, a document).",
      ["How did the mentor review this milestone?"]
    )
  );
  knowledge
    .filter((k) => k.type === "Research paper" || k.type === "Architecture")
    .slice(0, 2)
    .forEach((k) =>
      add(
        "project",
        `How did "${k.title}" influence your design?`,
        "Summarise the key idea in two sentences, then name one decision in your project that came from it.",
        ["What did you decide not to copy, and why?"]
      )
    );

  /* ---------- Cross-questioning ---------- */
  add(
    "cross",
    "What happens if two users edit the same task at the same time?",
    "Last write wins in a simple system. Better options: version numbers (optimistic locking), or refreshing data before saving.",
    ["How would you tell the second user about the conflict?"]
  );
  add(
    "cross",
    "If we asked you to add a new feature in one day, which one would you pick and what would you change?",
    "Choose something small and real, and name the files, tables and screens it would touch.",
    ["What could break because of this change?"]
  );
  add(
    "cross",
    "How do you know your health score is meaningful and not just a number?",
    "It is explainable: each point lost has a stated reason. To prove it you would compare scores with real outcomes on finished projects.",
    ["What would make the score misleading?"]
  );
  add(
    "cross",
    "What if your database is deleted? How would you recover?",
    "Regular backups, restore steps, and keeping a copy of important files outside the server.",
    ["How often should backups run?"]
  );
  add(
    "cross",
    "Which part of the project are you least confident about, and why?",
    "Pick one honestly and say what you did to understand it better. Examiners respect honesty more than guessing.",
    []
  );

  return q;
}