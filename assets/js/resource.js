// Представление задач по исполнителям

function renderResourceView() {
  const tasks = state.project.tasks.filter(hasValidPeriod);

  if (!tasks.length) {
    ui.resourceLegend.innerHTML = "";
    ui.resourceTimeline.className = "resource-timeline empty-box";
    ui.resourceTimeline.textContent = "Нет задач с корректными датами.";
    return;
  }

  const { minDate, maxDate } = projectRange(tasks);
  const totalDays = Math.max(1, daysBetween(minDate, maxDate) + 1);
  const days = Array.from({ length: totalDays }, (_, index) => addDays(minDate, index));
  const assignees = unique(tasks.map((task) => task.assignee || "Без ответственного"));
  const conflictIds = new Set(findAssigneeOverlaps(state.project.tasks).flatMap((item) => [String(item.a.id), String(item.b.id)]));
  const categories = unique(tasks.map((task) => task.category || "Другое"));
  const width = Math.max(980, 190 + totalDays * state.resourceDayWidth, requiredResourceWidth(tasks, minDate));

  ui.resourceLegend.innerHTML = categories.map((category) => `
    <span class="legend-item">
      <span class="legend-dot" style="background:${taskColor(category)}"></span>
      ${escapeHtml(category)}
    </span>
  `).join("");

  ui.resourceTimeline.className = "resource-timeline";
  ui.resourceTimeline.innerHTML = `
    <div class="resource-grid" style="--days-count:${totalDays}; --resource-width:${width}px;">
      <div class="resource-header">
        <div class="resource-name">Исполнитель</div>
        <div class="resource-axis">
          ${days.map((day) => `<div class="day-cell">${formatDay(day)}</div>`).join("")}
        </div>
      </div>
      ${assignees.map((assignee) => renderAssigneeRow(assignee, tasks, minDate, conflictIds)).join("")}
    </div>
  `;
}

function renderAssigneeRow(assignee, tasks, minDate, conflictIds) {
  const items = tasks.filter((task) => (task.assignee || "Без ответственного") === assignee);

  return `
    <div class="resource-row">
      <div class="resource-name">${escapeHtml(assignee)}</div>
      <div class="resource-lane">
        ${items.map((task) => renderResourceTask(task, minDate, conflictIds)).join("")}
      </div>
    </div>
  `;
}

function renderResourceTask(task, minDate, conflictIds) {
  const start = parseDate(task.start_date);
  const end = parseDate(task.end_date);
  const offset = Math.max(0, daysBetween(minDate, start));
  const duration = Math.max(1, daysBetween(start, end) + 1);

  const left = offset * state.resourceDayWidth;
  const baseWidth = duration * state.resourceDayWidth - 8;
  const width = Math.max(baseWidth, textWidth(task.text) + 26, task.category === "Milestone" ? 74 : 54);

  const conflictClass = conflictIds.has(String(task.id)) ? " conflict" : "";
  const milestoneClass = task.category === "Milestone" ? " milestone-task" : "";

  return `
    <div
      class="resource-task${conflictClass}${milestoneClass}"
      style="left:${left}px; width:${width}px; background:${taskColor(task.category)}"
      title="${escapeHtml(task.text)}"
    >
      <span>${escapeHtml(task.text)}</span>
    </div>
  `;
}

function changeResourceZoom(delta) {
  state.resourceDayWidth = clamp(state.resourceDayWidth + delta, 44, 150);
  renderResourceView();
}

function fitResourceView() {
  const tasks = state.project.tasks.filter(hasValidPeriod);
  if (!tasks.length) return;

  const { minDate, maxDate } = projectRange(tasks);
  const totalDays = Math.max(1, daysBetween(minDate, maxDate) + 1);
  const width = ui.resourceTimeline?.clientWidth || 1100;
  const available = Math.max(520, width - 220);

  state.resourceDayWidth = clamp(Math.floor(available / totalDays), 50, 120);
  renderResourceView();
}

function requiredResourceWidth(tasks, minDate) {
  return tasks.reduce((maxRight, task) => {
    const start = parseDate(task.start_date);
    const end = parseDate(task.end_date);
    const offset = Math.max(0, daysBetween(minDate, start));
    const duration = Math.max(1, daysBetween(start, end) + 1);
    const taskRight = 190 + offset * state.resourceDayWidth + Math.max(duration * state.resourceDayWidth, textWidth(task.text) + 40) + 48;

    return Math.max(maxRight, taskRight);
  }, 980);
}
