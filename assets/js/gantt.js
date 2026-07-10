// Классическая диаграмма Ганта

function setupGantt() {
  gantt.config.date_format = "%Y-%m-%d";
  gantt.config.xml_date = "%Y-%m-%d";
  gantt.config.grid_width = 470;
  gantt.config.row_height = 44;
  gantt.config.bar_height = 26;
  gantt.config.scale_height = 56;
  gantt.config.readonly = true;
  gantt.config.show_errors = false;
  gantt.config.fit_tasks = true;
  gantt.config.min_column_width = state.ganttColumnWidth;

  gantt.config.scales = [
    { unit: "month", step: 1, format: "%F %Y" },
    { unit: "day", step: 1, format: "%d" }
  ];

  gantt.config.columns = [
    { name: "text", label: "Задача", tree: true, width: 190 },
    { name: "assignee", label: "Assignee", align: "center", width: 120 },
    { name: "category", label: "Категория", align: "center", width: 120 }
  ];

  gantt.templates.task_text = (_, __, task) => task.text;
  gantt.templates.tooltip_text = (_, __, task) => `
    <b>${escapeHtml(task.text)}</b><br>
    Ответственный: ${escapeHtml(task.assignee || "не указан")}<br>
    Категория: ${escapeHtml(task.category || "Другое")}<br>
    Результат: ${escapeHtml(task.deliverable || "не указан")}
  `;

  gantt.init("gantt_here");
}

function renderGantt() {
  const datedTasks = state.project.tasks.filter(hasValidPeriod);

  if (datedTasks.length) {
    const { minDate, maxDate } = projectRange(datedTasks);
    gantt.config.start_date = addDays(minDate, -1);
    gantt.config.end_date = addDays(maxDate, 2);
  }

  gantt.clearAll();
  gantt.parse({
    data: state.project.tasks.map(toGanttTask),
    links: state.project.links.map((link) => ({
      id: link.id,
      source: link.source,
      target: link.target,
      type: "0"
    }))
  });
}

function toGanttTask(task) {
  const start = parseDate(task.start_date);
  const end = parseDate(task.end_date);
  const duration = start && end ? Math.max(1, daysBetween(start, end) + 1) : 1;

  return {
    ...task,
    start_date: task.start_date || "2026-07-01",
    duration,
    color: taskColor(task.category),
    textColor: "#ffffff"
  };
}

function changeGanttZoom(delta) {
  state.ganttColumnWidth = clamp(state.ganttColumnWidth + delta, 34, 140);
  gantt.config.min_column_width = state.ganttColumnWidth;
  gantt.render();
}

function fitGantt() {
  const tasks = state.project.tasks.filter(hasValidPeriod);
  if (!tasks.length) return;

  const { minDate, maxDate } = projectRange(tasks);
  const totalDays = Math.max(1, daysBetween(minDate, maxDate) + 2);
  const width = document.getElementById("gantt_here")?.clientWidth || 1000;
  const timelineWidth = Math.max(420, width - gantt.config.grid_width);

  state.ganttColumnWidth = clamp(Math.floor(timelineWidth / totalDays), 34, 120);
  gantt.config.min_column_width = state.ganttColumnWidth;
  gantt.render();
}
