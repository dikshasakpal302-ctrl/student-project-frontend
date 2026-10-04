// Rule-based placeholder for Member 3's AI engine.
// Member 3 can replace these 3 functions (analyze, simulateDelay, answerQuestion)
// with real API calls. The screens only depend on the shapes they return.

const PRIORITY_RANK = { low: 0, medium: 1, high: 2 };

export const addDays = (iso, n) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (a, b) =>
  Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000);

function memberLoads(tasks, members, today) {
  const names = [
    ...new Set([
      ...members.map((m) => m.name),
      ...tasks.filter((t) => t.assignee).map((t) => t.assignee),
    ]),
  ];
  return names.map((name) => {
    const active = tasks.filter((t) => t.assignee === name && t.status !== "done");
    const overdue = active.filter((t) => t.deadline && t.deadline < today).length;
    return { name, active: active.length, overdue, load: active.length + overdue };
  });
}

/* ---------- 1. Health, risks and recommendations ---------- */
export function analyze({ project, tasks, members, today }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const active = tasks.filter((t) => t.status !== "done");
  const isOverdue = (t) => t.status !== "done" && t.deadline && t.deadline < today;

  const overdueTasks = active.filter(isOverdue);
  const blockedTasks = tasks.filter((t) => t.status === "blocked");
  const unassigned = active.filter((t) => !t.assignee);
  const loads = memberLoads(tasks, members, today);
  const overloaded = loads.filter((l) => l.load >= 5);
  const progress = total ? Math.round((done / total) * 100) : 0;
  const daysLeft = project?.deadline ? daysBetween(today, project.deadline) : null;
  const deadlinePassed = daysLeft !== null && daysLeft < 0 && (total === 0 || done < total);

  // tasks that are stuck or late AND have other tasks waiting on them
  const bottlenecks = active
    .map((t) => ({
      task: t,
      waiting: active.filter((o) => (o.dependsOn || []).includes(t.id)),
    }))
    .filter((b) => b.waiting.length > 0 && (b.task.status === "blocked" || isOverdue(b.task)));

  // health score (same rules as the Mentor Portal)
  let score = 100;
  if (total === 0) score -= 20;
  score -= Math.min(overdueTasks.length * 12, 36);
  score -= Math.min(blockedTasks.length * 10, 30);
  score -= overloaded.length * 10;
  if (deadlinePassed) score -= 20;
  score = Math.max(0, Math.min(100, score));
  const level = score >= 70 ? "healthy" : score >= 40 ? "warning" : "risk";

  // deadline confidence
  let confidence = 100;
  if (daysLeft === null) confidence = 50;
  else if (deadlinePassed) confidence = 5;
  else {
    confidence -= overdueTasks.length * 10 + blockedTasks.length * 10;
    if (active.length > Math.max(daysLeft, 0) * 2) confidence -= 25;
    confidence -= overloaded.length * 5;
  }
  confidence = Math.max(5, Math.min(100, confidence));

  // risks
  const risks = [];
  if (deadlinePassed) {
    risks.push({
      severity: "high",
      title: "Project deadline has passed",
      detail: `The deadline was ${-daysLeft} ${-daysLeft === 1 ? "day" : "days"} ago and ${active.length} tasks are still open.`,
    });
  } else if (daysLeft !== null && active.length > daysLeft * 2 && active.length > 0) {
    risks.push({
      severity: "medium",
      title: "Deadline looks tight",
      detail: `${active.length} open tasks and only ${daysLeft} days left.`,
    });
  }
  overdueTasks.forEach((t) => {
    const late = daysBetween(t.deadline, today);
    risks.push({
      severity: late >= 3 ? "high" : "medium",
      title: `"${t.title}" is ${late} ${late === 1 ? "day" : "days"} late`,
      detail: `Assigned to ${t.assignee || "nobody"}, due ${t.deadline}.`,
    });
  });
  blockedTasks.forEach((t) => {
    risks.push({
      severity: "high",
      title: `"${t.title}" is blocked`,
      detail: `Assigned to ${t.assignee || "nobody"}. Blocked tasks stop other work.`,
    });
  });
  bottlenecks.forEach((b) => {
    risks.push({
      severity: "high",
      title: `Bottleneck: "${b.task.title}"`,
      detail: `${b.waiting.length} ${b.waiting.length === 1 ? "task is" : "tasks are"} waiting on it: ${b.waiting
        .map((w) => w.title)
        .join(", ")}.`,
    });
  });
  overloaded.forEach((o) => {
    risks.push({
      severity: "medium",
      title: `${o.name} is overloaded`,
      detail: `${o.active} active tasks${o.overdue ? `, ${o.overdue} overdue` : ""}.`,
    });
  });
  if (unassigned.length > 0) {
    risks.push({
      severity: "low",
      title: `${unassigned.length} active ${unassigned.length === 1 ? "task has" : "tasks have"} no owner`,
      detail: unassigned.map((t) => t.title).join(", "),
    });
  }
  const order = { high: 0, medium: 1, low: 2 };
  risks.sort((a, b) => order[a.severity] - order[b.severity]);

  // recommendations
  const recommendations = [];
  bottlenecks.forEach((b) => {
    recommendations.push({
      action: `Finish "${b.task.title}" first`,
      reason: `${b.waiting.length} other ${b.waiting.length === 1 ? "task depends" : "tasks depend"} on it.`,
    });
  });
  blockedTasks.forEach((t) => {
    recommendations.push({
      action: `Unblock "${t.title}"`,
      reason: `Ask ${t.assignee || "the team"} what is stopping it and who can help.`,
    });
  });
  overloaded.forEach((o) => {
    const target = loads
      .filter((l) => l.name !== o.name && l.load < 3)
      .sort((a, b) => a.load - b.load)[0];
    const movable = active
      .filter((t) => t.assignee === o.name && t.status !== "blocked")
      .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1))[0];
    if (target && movable) {
      recommendations.push({
        action: `Move "${movable.title}" from ${o.name} to ${target.name}`,
        reason: `${o.name} has ${o.active} active tasks, ${target.name} has ${target.active}.`,
      });
    } else {
      recommendations.push({
        action: `Reduce ${o.name}'s workload`,
        reason: `${o.name} has ${o.active} active tasks and nobody has free capacity. Cut or postpone something.`,
      });
    }
  });
  overdueTasks.slice(0, 2).forEach((t) => {
    recommendations.push({
      action: `Re-plan "${t.title}"`,
      reason: `It is overdue. Set a realistic new date or split it into smaller subtasks.`,
    });
  });
  if (unassigned.length > 0) {
    recommendations.push({
      action: "Assign owners to unassigned tasks",
      reason: `${unassigned.length} active ${unassigned.length === 1 ? "task has" : "tasks have"} nobody responsible.`,
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      action: "Keep going. Nothing needs urgent action.",
      reason: "No overdue, blocked or overloaded work was found.",
    });
  }

  return {
    score,
    level,
    confidence,
    progress,
    daysLeft,
    counts: {
      total,
      done,
      overdue: overdueTasks.length,
      blocked: blockedTasks.length,
      unassigned: unassigned.length,
    },
    loads,
    overloaded,
    bottlenecks,
    blockedTasks,
    risks,
    recommendations: recommendations.slice(0, 6),
  };
}

/* ---------- 2. What-if: delay one task ---------- */
export function simulateDelay({ tasks, milestones, project, taskId, days }) {
  const source = tasks.find((t) => t.id === taskId);
  if (!source) return null;
  if (!source.deadline) {
    return { error: "This task has no deadline. Set one on the Task Board to run a simulation." };
  }

  const chain = [
    { task: source, oldDate: source.deadline, newDate: addDays(source.deadline, days), level: 0 },
  ];
  const seen = new Set([source.id]);
  let frontier = [source];
  let level = 0;

  // every task that depends on a delayed task is delayed too
  while (frontier.length) {
    level += 1;
    const next = [];
    frontier.forEach((cur) => {
      tasks.forEach((t) => {
        if (seen.has(t.id) || t.status === "done") return;
        if ((t.dependsOn || []).includes(cur.id)) {
          seen.add(t.id);
          chain.push({
            task: t,
            oldDate: t.deadline || null,
            newDate: t.deadline ? addDays(t.deadline, days) : null,
            level,
          });
          next.push(t);
        }
      });
    });
    frontier = next;
  }

  const dates = chain.map((c) => c.newDate).filter(Boolean).sort();
  const latest = dates[dates.length - 1] || null;

  let verdict = "unknown";
  let overshoot = 0;
  if (project?.deadline && latest) {
    overshoot = daysBetween(project.deadline, latest);
    verdict = overshoot > 0 ? "risk" : overshoot >= -2 ? "tight" : "safe";
  }

  const milestonesHit = milestones
    .map((m) => {
      const newest = chain
        .filter((c) => c.task.milestoneId === m.id && c.newDate)
        .map((c) => c.newDate)
        .sort()
        .pop();
      return newest && m.deadline && newest > m.deadline ? { milestone: m, newest } : null;
    })
    .filter(Boolean);

  const people = [...new Set(chain.map((c) => c.task.assignee).filter(Boolean))];

  return { chain, latest, verdict, overshoot, milestonesHit, people };
}

/* ---------- 3. Assistant (keyword based placeholder) ---------- */
export function answerQuestion({ question, insights, project, tasks, today }) {
  const q = question.toLowerCase();
  const i = insights;
  const status = { healthy: "HEALTHY", warning: "WARNING", risk: "AT RISK" }[i.level];

  if (/what if|happens if|delay/.test(q)) {
    return "Open the What-if tab, pick a task and choose how many days it slips. I will show which tasks, people and milestones are affected, and whether the project deadline is in danger.";
  }

  if (/block|stuck|waiting/.test(q)) {
    if (i.blockedTasks.length === 0 && i.bottlenecks.length === 0) {
      return "Nothing is blocked right now, and no task is holding up others.";
    }
    const lines = [];
    i.blockedTasks.forEach((t) =>
      lines.push(`• "${t.title}" is blocked (${t.assignee || "unassigned"}).`)
    );
    i.bottlenecks.forEach((b) =>
      lines.push(
        `• "${b.task.title}" is holding up ${b.waiting.length} ${b.waiting.length === 1 ? "task" : "tasks"}: ${b.waiting
          .map((w) => w.title)
          .join(", ")}.`
      )
    );
    return `These are blocking the project:\n${lines.join("\n")}`;
  }

  if (/overload|workload|busy|capacity/.test(q)) {
    if (i.loads.length === 0) return "There are no team members yet. Add them on the Team page.";
    const lines = i.loads
      .sort((a, b) => b.load - a.load)
      .map((l) => `• ${l.name}: ${l.active} active${l.overdue ? `, ${l.overdue} overdue` : ""}${l.load >= 5 ? " (overloaded)" : ""}`);
    const head = i.overloaded.length
      ? `${i.overloaded.map((o) => o.name).join(", ")} ${i.overloaded.length === 1 ? "is" : "are"} overloaded.`
      : "Nobody is overloaded.";
    return `${head}\n${lines.join("\n")}`;
  }

  if (/today|next|should|todo|priorit/.test(q)) {
    return `Here is what I would do first:\n${i.recommendations
      .slice(0, 4)
      .map((r, n) => `${n + 1}. ${r.action}. ${r.reason}`)
      .join("\n")}`;
  }

  if (/summar|progress|week|status|report/.test(q)) {
    return `${project?.name || "The project"} is ${status}, health ${i.score}/100.\nProgress: ${i.progress}% (${i.counts.done} of ${i.counts.total} tasks done).\nOverdue: ${i.counts.overdue}. Blocked: ${i.counts.blocked}. Unassigned: ${i.counts.unassigned}.\n${
      i.daysLeft === null
        ? "No project deadline is set."
        : i.daysLeft < 0
        ? `The deadline passed ${-i.daysLeft} days ago.`
        : `${i.daysLeft} days remain until the deadline (confidence ${i.confidence}%).`
    }`;
  }

  if (/why|risk|wrong|problem|issue|late/.test(q)) {
    if (i.risks.length === 0) {
      return `The project is ${status} (${i.score}/100). I found no risks.`;
    }
    return `The project is ${status} (${i.score}/100) because:\n${i.risks
      .slice(0, 4)
      .map((r) => `• ${r.title}. ${r.detail}`)
      .join("\n")}`;
  }

  return "I can answer questions about this project. Try: Why are we at risk? What should we work on today? Who is overloaded? What is blocking us? Summarize our progress.";
}