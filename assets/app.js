const COLORS = {
  "Аналитика": "#3b82f6",
  "Дизайн": "#8b5cf6",
  "Разработка": "#12a66a",
  "QA": "#f59e0b",
  "Документация": "#64748b",
  "Управление": "#06b6d4",
  "Milestone": "#ef4444",
  "Другое": "#0f172a"
};

const demoProject = {
  meta: {
    name: "Проект с ошибками планирования",
    description: "Пример плана с пересечениями задач у исполнителей, пустыми полями, длинной задачей и нарушенными зависимостями."
  },
  tasks: [
    {
      id: 1,
      text: "Анализ требований",
      start_date: "2026-07-01",
      end_date: "2026-07-03",
      assignee: "Иван",
      category: "Аналитика",
      deliverable: "Список требований"
    },
    {
      id: 2,
      text: "Дизайн интерфейса",
      start_date: "2026-07-02",
      end_date: "2026-07-05",
      assignee: "Иван",
      category: "Дизайн",
      deliverable: "Макет интерфейса"
    },
    {
      id: 3,
      text: "Проектирование архитектуры",
      start_date: "2026-07-03",
      end_date: "2026-07-05",
      assignee: "Анна",
      category: "Разработка",
      deliverable: "Схема архитектуры"
    },
    {
      id: 4,
      text: "Разработка backend",
      start_date: "2026-07-04",
      end_date: "2026-07-12",
      assignee: "Анна",
      category: "Разработка",
      deliverable: "API"
    },
    {
      id: 5,
      text: "Разработка frontend",
      start_date: "2026-07-06",
      end_date: "2026-07-13",
      assignee: "Сергей",
      category: "Разработка",
      deliverable: "Интерфейс"
    },
    {
      id: 6,
      text: "Тестирование",
      start_date: "2026-07-10",
      end_date: "2026-07-14",
      assignee: "Анна",
      category: "QA",
      deliverable: "Список ошибок"
    },
    {
      id: 7,
      text: "Подготовка отчёта",
      start_date: "2026-07-08",
      end_date: "2026-07-20",
      assignee: "",
      category: "Документация",
      deliverable: ""
    },
    {
      id: 8,
      text: "Презентация и финальная сдача",
      start_date: "2026-07-21",
      end_date: "2026-07-21",
      assignee: "Леонид",
      category: "Milestone",
      deliverable: "Готовый MVP и отчёт"
    }
  ],
  links: [
    { id: 1, source: 1, target: 2, type: "finish_to_start" },
    { id: 2, source: 1, target: 3, type: "finish_to_start" },
    { id: 3, source: 3, target: 4, type: "finish_to_start" },
    { id: 4, source: 2, target: 5, type: "finish_to_start" },
    { id: 5, source: 4, target: 6, type: "finish_to_start" },
    { id: 6, source: 5, target: 6, type: "finish_to_start" },
    { id: 7, source: 6, target: 8, type: "finish_to_start" }
  ]
};

const ui = {};
const state = {
  project: emptyProject(),
  issues: [],
  issueFilter: "all",
  activeView: "dashboard",
  ganttColumnWidth: 54,
  resourceDayWidth: 58
};

const three = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  taskMeshes: [],
  frame: null
};

document.addEventListener("DOMContentLoaded", startApp);

function startApp() {
  collectElements();
  setupGantt();
  bindEvents();
  loadProject(emptyProject());
}

function collectElements() {
  Object.assign(ui, {
    jsonInput: $("#jsonFileInput"),
    tableInput: $("#tableFileInput"),
    sampleBtn: $("#downloadSampleBtn"),
    clearBtn: $("#clearProjectBtn"),
    reportBtn: $("#exportReportBtn"),
    validateBtn: $("#runValidationBtn"),

    ganttZoomIn: $("#ganttZoomInBtn"),
    ganttZoomOut: $("#ganttZoomOutBtn"),
    ganttFit: $("#ganttFitBtn"),

    resourceZoomIn: $("#resourceZoomInBtn"),
    resourceZoomOut: $("#resourceZoomOutBtn"),
    resourceFit: $("#resourceFitBtn"),

    taskForm: $("#taskForm"),
    manualStatus: $("#manualStatus"),
    manualTasksBody: $("#manualTasksBody"),
    saveLocal: $("#saveLocalBtn"),
    loadLocal: $("#loadLocalBtn"),

    score: $("#qualityScore"),
    scoreText: $("#qualityText"),
    scoreRing: $("#scoreRing"),
    scoreRingValue: $("#scoreRingValue"),

    projectName: $("#projectName"),
    projectDescription: $("#projectDescription"),
    tasksMetric: $("#tasksMetric"),
    assigneesMetric: $("#assigneesMetric"),
    criticalMetric: $("#criticalMetric"),
    warningMetric: $("#warningMetric"),
    infoMetric: $("#infoMetric"),

    quickSummary: $("#quickSummary"),
    issuesList: $("#issuesList"),
    currentJson: $("#currentJson"),

    resourceLegend: $("#resourceLegend"),
    resourceTimeline: $("#resourceTimeline"),
    threeContainer: $("#threeContainer"),
    threeTaskInfo: $("#threeTaskInfo")
  });
}

function bindEvents() {
  ui.jsonInput.addEventListener("change", (event) => importFile(event, "json"));
  ui.tableInput.addEventListener("change", (event) => importFile(event, "table"));

  ui.sampleBtn.addEventListener("click", () => {
    saveTextFile("sample_project.json", JSON.stringify(demoProject, null, 2), "application/json");
  });

  ui.clearBtn.addEventListener("click", clearPlan);
  ui.reportBtn.addEventListener("click", exportTextReport);
  ui.validateBtn.addEventListener("click", () => {
    state.issues = validatePlan(state.project);
    renderAll();
    switchView("issues");
  });

  ui.ganttZoomIn.addEventListener("click", () => changeGanttZoom(12));
  ui.ganttZoomOut.addEventListener("click", () => changeGanttZoom(-12));
  ui.ganttFit.addEventListener("click", fitGantt);

  ui.resourceZoomIn.addEventListener("click", () => changeResourceZoom(12));
  ui.resourceZoomOut.addEventListener("click", () => changeResourceZoom(-12));
  ui.resourceFit.addEventListener("click", fitResourceView);

  ui.taskForm.addEventListener("submit", addTaskFromForm);
  ui.manualTasksBody.addEventListener("click", handleManualTableClick);
  ui.saveLocal.addEventListener("click", saveToBrowser);
  ui.loadLocal.addEventListener("click", loadFromBrowser);

  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  $$(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      state.issueFilter = button.dataset.filter;
      $$(".filter").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderIssues();
    });
  });
}

async function importFile(event, expectedType) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const name = file.name.toLowerCase();
    const isJson = name.endsWith(".json");

    if (expectedType === "json" && !isJson) {
      throw new Error("Выберите JSON-файл.");
    }

    if (expectedType === "table" && isJson) {
      throw new Error("Для JSON используйте отдельную кнопку загрузки.");
    }

    const project = await readProjectFile(file);
    loadProject(project);
  } catch (error) {
    alert(error.message || "Не удалось прочитать файл.");
    console.error(error);
  } finally {
    event.target.value = "";
  }
}

async function readProjectFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".json")) {
    return JSON.parse(await file.text());
  }

  if (name.endsWith(".csv")) {
    return tableRowsToProject(parseCsv(await file.text()), file.name);
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    if (typeof XLSX === "undefined") {
      throw new Error("Библиотека для Excel не загрузилась. Проверьте интернет.");
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    return tableRowsToProject(rows, file.name);
  }

  throw new Error("Поддерживаются JSON, CSV, XLSX и XLS.");
}

function tableRowsToProject(rows, fileName) {
  const preparedRows = rows
    .map(normalizeTableRow)
    .filter((row) => Object.values(row).some((value) => String(value).trim()));

  const tasks = preparedRows.map((row, index) => ({
    id: row.id || index + 1,
    text: row.text || "",
    start_date: toIsoDate(row.start_date),
    end_date: toIsoDate(row.end_date),
    assignee: row.assignee || "",
    category: row.category || "Другое",
    deliverable: row.deliverable || ""
  }));

  const links = [];
  let linkId = 1;

  preparedRows.forEach((row, index) => {
    const target = row.id || index + 1;
    parseDependencyList(row.depends_on).forEach((source) => {
      links.push({
        id: linkId++,
        source,
        target,
        type: "finish_to_start"
      });
    });
  });

  return {
    meta: {
      name: fileName.replace(/\.(csv|xlsx|xls)$/i, ""),
      description: "План импортирован из таблицы."
    },
    tasks,
    links
  };
}

function normalizeTableRow(row) {
  const normalized = {};

  Object.entries(row).forEach(([rawKey, value]) => {
    const key = columnName(rawKey);
    if (key) normalized[key] = value;
  });

  return normalized;
}

function columnName(rawKey) {
  const key = String(rawKey).trim().toLowerCase();

  const names = {
    id: ["id", "номер", "№"],
    text: ["text", "title", "task", "задача", "название", "название задачи"],
    start_date: ["start", "start_date", "дата начала", "начало"],
    end_date: ["end", "end_date", "дата окончания", "окончание", "конец"],
    assignee: ["assignee", "owner", "ответственный", "исполнитель"],
    category: ["category", "категория", "тип", "тип работ"],
    deliverable: ["deliverable", "result", "результат", "артефакт"],
    depends_on: ["depends_on", "dependencies", "зависит от", "зависимости"]
  };

  return Object.entries(names).find(([, variants]) => variants.includes(key))?.[0] || "";
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if ((char === "," || char === ";") && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell.trim());
      cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);

  const headers = rows.shift() || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function parseDependencyList(value) {
  return String(value || "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (Number.isNaN(Number(item)) ? item : Number(item)));
}

function loadProject(project) {
  state.project = normalizeProject(project);
  state.issues = validatePlan(state.project);
  state.issueFilter = "all";

  $$(".filter").forEach((item) => item.classList.toggle("active", item.dataset.filter === "all"));
  renderAll();
}

function normalizeProject(project) {
  const meta = project.meta || {};

  return {
    meta: {
      name: String(meta.name || project.name || "Без названия").trim(),
      description: String(meta.description || project.description || "Описание проекта не указано.").trim()
    },
    tasks: Array.isArray(project.tasks) ? project.tasks.map(normalizeTask) : [],
    links: Array.isArray(project.links) ? project.links.map(normalizeLink) : []
  };
}

function normalizeTask(task, index) {
  return {
    id: task.id ?? index + 1,
    text: String(task.text ?? task.title ?? "").trim(),
    start_date: String(task.start_date ?? task.start ?? "").trim(),
    end_date: String(task.end_date ?? task.end ?? "").trim(),
    assignee: String(task.assignee ?? task.owner ?? "").trim(),
    category: String(task.category ?? "Другое").trim() || "Другое",
    deliverable: String(task.deliverable ?? task.result ?? "").trim()
  };
}

function normalizeLink(link, index) {
  return {
    id: link.id ?? index + 1,
    source: link.source,
    target: link.target,
    type: link.type || "finish_to_start"
  };
}

function emptyProject() {
  return {
    meta: {
      name: "Новый проект",
      description: "Загрузите JSON, Excel/CSV или добавьте задачи вручную."
    },
    tasks: [],
    links: []
  };
}

function addTaskFromForm(event) {
  event.preventDefault();

  const form = new FormData(event.currentTarget);
  const taskId = nextTaskId();

  const task = {
    id: taskId,
    text: String(form.get("text") || "").trim(),
    start_date: String(form.get("start_date") || "").trim(),
    end_date: String(form.get("end_date") || "").trim(),
    assignee: String(form.get("assignee") || "").trim(),
    category: String(form.get("custom_category") || form.get("category") || "Другое").trim(),
    deliverable: String(form.get("deliverable") || "").trim()
  };

  state.project.tasks.push(task);

  parseDependencyList(form.get("depends_on")).forEach((source) => {
    state.project.links.push({
      id: nextLinkId(),
      source,
      target: taskId,
      type: "finish_to_start"
    });
  });

  state.issues = validatePlan(state.project);
  event.currentTarget.reset();

  renderHeader();
  renderMetrics();
  renderIssues();
  renderJsonPreview();
  renderSummary();
  renderManualTasks();
  refreshActiveViewAfterDataChange();

  showManualStatus(`Задача «${task.text || task.id}» добавлена.`);
}

function renderManualTasks() {
  if (!ui.manualTasksBody) return;

  if (!state.project.tasks.length) {
    ui.manualTasksBody.innerHTML = `<tr><td colspan="6" class="empty-row">Пока задач нет.</td></tr>`;
    return;
  }

  ui.manualTasksBody.innerHTML = state.project.tasks.map((task) => `
    <tr>
      <td>${escapeHtml(task.id)}</td>
      <td>${escapeHtml(task.text || "Без названия")}</td>
      <td>${escapeHtml(task.start_date || "—")} — ${escapeHtml(task.end_date || "—")}</td>
      <td>${escapeHtml(task.assignee || "не указан")}</td>
      <td>${escapeHtml(task.category || "Другое")}</td>
      <td><button class="row-action" type="button" data-delete-task="${escapeHtml(task.id)}">Удалить</button></td>
    </tr>
  `).join("");
}

function handleManualTableClick(event) {
  const button = event.target.closest("[data-delete-task]");
  if (!button) return;

  const taskId = button.dataset.deleteTask;
  const task = state.project.tasks.find((item) => String(item.id) === String(taskId));

  state.project.tasks = state.project.tasks.filter((item) => String(item.id) !== String(taskId));
  state.project.links = state.project.links.filter((link) =>
    String(link.source) !== String(taskId) && String(link.target) !== String(taskId)
  );

  state.issues = validatePlan(state.project);

  renderHeader();
  renderMetrics();
  renderIssues();
  renderJsonPreview();
  renderSummary();
  renderManualTasks();
  refreshActiveViewAfterDataChange();

  showManualStatus(`Задача «${task?.text || taskId}» удалена.`);
}

function showManualStatus(message) {
  if (!ui.manualStatus) return;

  ui.manualStatus.textContent = message;
  ui.manualStatus.classList.add("show");

  clearTimeout(showManualStatus.timer);
  showManualStatus.timer = setTimeout(() => {
    ui.manualStatus.classList.remove("show");
  }, 2500);
}

function refreshActiveViewAfterDataChange() {
  if (state.activeView === "gantt") {
    renderGantt();
  }

  if (state.activeView === "resources") {
    renderResourceView();
  }

  if (state.activeView === "three") {
    renderThreeView();
  }
}


function nextTaskId() {
  return nextNumericId(state.project.tasks);
}

function nextLinkId() {
  return nextNumericId(state.project.links);
}

function nextNumericId(items) {
  const ids = items.map((item) => Number(item.id)).filter(Number.isFinite);
  return ids.length ? Math.max(...ids) + 1 : 1;
}

function clearPlan() {
  if (!confirm("Очистить текущий проектный план?")) return;

  state.project = emptyProject();
  state.issues = [];
  renderAll();
}

function saveToBrowser() {
  localStorage.setItem("plancheck_project", JSON.stringify(state.project));
  alert("Проект сохранён в браузере.");
}

function loadFromBrowser() {
  const saved = localStorage.getItem("plancheck_project");

  if (!saved) {
    alert("В браузере пока нет сохранённого проекта.");
    return;
  }

  loadProject(JSON.parse(saved));
}

function renderAll() {
  renderHeader();
  renderMetrics();
  renderIssues();
  renderJsonPreview();
  renderSummary();
  renderManualTasks();

  if (state.activeView === "gantt") {
    renderGantt();
  }

  if (state.activeView === "resources") {
    renderResourceView();
  }

  renderThreeViewIfNeeded();
}

function renderHeader() {
  ui.projectName.textContent = state.project.meta.name;
  ui.projectDescription.textContent = state.project.meta.description;
}

function renderMetrics() {
  const score = planScore(state.issues);
  const assignees = new Set(state.project.tasks.map((task) => task.assignee).filter(Boolean));

  ui.score.textContent = state.project.tasks.length ? score : "—";
  ui.scoreRingValue.textContent = state.project.tasks.length ? score : "—";
  ui.scoreRing.style.setProperty("--score", `${score}%`);
  ui.scoreText.textContent = state.project.tasks.length ? scoreComment(score) : "Загрузите проектный план для анализа";

  ui.tasksMetric.textContent = state.project.tasks.length;
  ui.assigneesMetric.textContent = assignees.size;
  ui.criticalMetric.textContent = issueCount("critical");
  ui.warningMetric.textContent = issueCount("warning");
  ui.infoMetric.textContent = issueCount("info");
}

function renderSummary() {
  if (!state.project.tasks.length) {
    ui.quickSummary.className = "quick-summary empty";
    ui.quickSummary.textContent = "План ещё не загружен.";
    return;
  }

  const score = planScore(state.issues);
  const overlaps = findAssigneeOverlaps(state.project.tasks).length;

  ui.quickSummary.className = "quick-summary";
  ui.quickSummary.innerHTML = `
    <strong>Итог:</strong> качество плана оценено на <strong>${score}/100</strong>.<br>
    Критических ошибок: <strong>${issueCount("critical")}</strong>,
    предупреждений: <strong>${issueCount("warning")}</strong>,
    информационных замечаний: <strong>${issueCount("info")}</strong>.<br>
    Конфликтов загрузки исполнителей: <strong>${overlaps}</strong>.<br><br>
    ${score >= 85
      ? "План выглядит достаточно устойчивым. Его можно использовать как базу для дальнейшей детализации."
      : "План требует доработки: стоит проверить зависимости, ответственных, результаты задач и параллельную загрузку исполнителей."}
  `;
}

function renderJsonPreview() {
  ui.currentJson.textContent = JSON.stringify(state.project, null, 2);
}

function issueCount(level) {
  return state.issues.filter((issue) => issue.level === level).length;
}

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

function renderIssues() {
  const issues = state.issueFilter === "all"
    ? state.issues
    : state.issues.filter((issue) => issue.level === state.issueFilter);

  if (!issues.length) {
    ui.issuesList.className = "issues empty-box";
    ui.issuesList.textContent = state.project.tasks.length ? "По выбранному фильтру проблем нет." : "План ещё не загружен.";
    return;
  }

  ui.issuesList.className = "issues";
  ui.issuesList.innerHTML = orderIssues(issues).map((issue) => `
    <article class="issue ${issue.level}">
      <div class="issue-top">
        <strong>${issueIcon(issue.level)} ${escapeHtml(issue.title)}</strong>
        <span>${issueLabel(issue.level)}</span>
      </div>
      <p>${escapeHtml(issue.message)}</p>
    </article>
  `).join("");
}

function validatePlan(project) {
  const issues = [];
  const taskById = new Map(project.tasks.map((task) => [String(task.id), task]));

  project.tasks.forEach((task) => {
    validateTaskFields(task, issues);
    validateTaskPeriod(task, issues);
  });

  project.links.forEach((link) => validateLink(link, taskById, issues));

  findCycles(project.tasks, project.links).forEach((cycle) => {
    issues.push(makeIssue("critical", "Циклическая зависимость", `Найден цикл зависимостей: ${cycle.join(" → ")}.`, null));
  });

  findAssigneeOverlaps(project.tasks).forEach((overlap) => {
    issues.push(makeIssue(
      "warning",
      "Перегрузка исполнителя",
      `${overlap.assignee} назначен(а) на параллельные задачи: «${overlap.a.text}» и «${overlap.b.text}» в период ${formatDate(overlap.from)} — ${formatDate(overlap.to)}.`,
      overlap.a.id
    ));
  });

  if (project.tasks.length && !hasFinalTask(project.tasks)) {
    issues.push(makeIssue("warning", "Нет финальной контрольной точки", "В плане не найдена финальная задача: релиз, сдача, защита или передача результата.", null));
  }

  return issues;
}

function validateTaskFields(task, issues) {
  if (!task.text) {
    issues.push(makeIssue("critical", "Пустое название задачи", `У задачи с id=${task.id} не указано название.`, task.id));
  }

  if (!task.start_date) {
    issues.push(makeIssue("critical", "Нет даты начала", `У задачи «${task.text || task.id}» не указана дата начала.`, task.id));
  }

  if (!task.end_date) {
    issues.push(makeIssue("critical", "Нет даты окончания", `У задачи «${task.text || task.id}» не указана дата окончания.`, task.id));
  }

  if (!task.assignee) {
    issues.push(makeIssue("warning", "Нет ответственного", `У задачи «${task.text || task.id}» не указан assignee.`, task.id));
  }

  if (!task.deliverable) {
    issues.push(makeIssue("info", "Нет результата задачи", `У задачи «${task.text || task.id}» не указан ожидаемый результат/артефакт.`, task.id));
  }
}

function validateTaskPeriod(task, issues) {
  const start = parseDate(task.start_date);
  const end = parseDate(task.end_date);

  if (task.start_date && !start) {
    issues.push(makeIssue("critical", "Некорректная дата начала", `У задачи «${task.text || task.id}» дата начала должна быть в формате YYYY-MM-DD.`, task.id));
  }

  if (task.end_date && !end) {
    issues.push(makeIssue("critical", "Некорректная дата окончания", `У задачи «${task.text || task.id}» дата окончания должна быть в формате YYYY-MM-DD.`, task.id));
  }

  if (start && end && end < start) {
    issues.push(makeIssue("critical", "Некорректный период", `Задача «${task.text}» заканчивается раньше, чем начинается.`, task.id));
  }

  if (start && end && daysBetween(start, end) + 1 > 10) {
    issues.push(makeIssue("info", "Слишком длинная задача", `Задача «${task.text}» длится ${daysBetween(start, end) + 1} дней. Возможно, её стоит декомпозировать.`, task.id));
  }
}

function validateLink(link, taskById, issues) {
  const source = taskById.get(String(link.source));
  const target = taskById.get(String(link.target));

  if (!source || !target) {
    issues.push(makeIssue("critical", "Несуществующая зависимость", `Связь ${link.id} указывает на несуществующую задачу.`, null));
    return;
  }

  if (String(link.source) === String(link.target)) {
    issues.push(makeIssue("critical", "Самозависимость", `Задача «${source.text}» не может зависеть сама от себя.`, source.id));
  }

  const sourceEnd = parseDate(source.end_date);
  const targetStart = parseDate(target.start_date);

  if (sourceEnd && targetStart && targetStart < sourceEnd) {
    issues.push(makeIssue("critical", "Нарушена зависимость", `Задача «${target.text}» начинается раньше завершения задачи «${source.text}».`, target.id));
  }
}

function makeIssue(level, title, message, taskId) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    level,
    title,
    message,
    taskId
  };
}

function findAssigneeOverlaps(tasks) {
  const groups = new Map();
  const overlaps = [];

  tasks.forEach((task) => {
    if (!task.assignee || !hasValidPeriod(task)) return;
    if (!groups.has(task.assignee)) groups.set(task.assignee, []);
    groups.get(task.assignee).push(task);
  });

  groups.forEach((items, assignee) => {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const overlap = taskOverlap(items[i], items[j], assignee);
        if (overlap) overlaps.push(overlap);
      }
    }
  });

  return overlaps;
}

function taskOverlap(a, b, assignee) {
  const from = new Date(Math.max(parseDate(a.start_date), parseDate(b.start_date)));
  const to = new Date(Math.min(parseDate(a.end_date), parseDate(b.end_date)));

  return from <= to ? { assignee, a, b, from, to } : null;
}

function findCycles(tasks, links) {
  const graph = new Map(tasks.map((task) => [String(task.id), []]));
  const cycles = [];

  links.forEach((link) => {
    const source = String(link.source);
    const target = String(link.target);

    if (graph.has(source) && graph.has(target)) {
      graph.get(source).push(target);
    }
  });

  const visited = new Set();
  const stack = new Set();
  const path = [];

  function walk(node) {
    visited.add(node);
    stack.add(node);
    path.push(node);

    for (const next of graph.get(node) || []) {
      if (!visited.has(next)) {
        walk(next);
      } else if (stack.has(next)) {
        const start = path.indexOf(next);
        if (start >= 0) cycles.push([...path.slice(start), next]);
      }
    }

    stack.delete(node);
    path.pop();
  }

  graph.forEach((_, node) => {
    if (!visited.has(node)) walk(node);
  });

  return cycles;
}

function hasFinalTask(tasks) {
  return tasks.some((task) => /финал|релиз|сдач|защит|milestone|готов|передач/i.test(
    `${task.text} ${task.category} ${task.deliverable}`
  ));
}

function renderThreeViewIfNeeded() {
  if (state.activeView === "three") {
    renderThreeView();
  }
}

function renderThreeView() {
  if (!ui.threeContainer || typeof THREE === "undefined") return;

  const tasks = state.project.tasks.filter(hasValidPeriod);

  if (!tasks.length) {
    clearThree();
    ui.threeContainer.innerHTML = "";
    ui.threeTaskInfo.className = "three-task-info empty-box";
    ui.threeTaskInfo.textContent = "Нет задач с корректными датами.";
    return;
  }

  clearThree();

  const size = sceneSize();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1020);

  const camera = new THREE.PerspectiveCamera(50, size.width / size.height, 0.1, 3000);
  camera.position.set(260, 210, 260);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  ui.threeContainer.innerHTML = "";
  ui.threeContainer.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(80, 35, 28);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));

  const light = new THREE.DirectionalLight(0xffffff, 0.85);
  light.position.set(120, 180, 80);
  scene.add(light);

  drawThreeScene(scene, tasks, renderer.domElement, camera);

  Object.assign(three, { scene, camera, renderer, controls });

  const animate = () => {
    three.frame = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };

  animate();
}

function drawThreeScene(scene, tasks, canvas, camera) {
  const { minDate, maxDate } = projectRange(tasks);
  const totalDays = Math.max(1, daysBetween(minDate, maxDate) + 1);
  const assignees = unique(tasks.map((task) => task.assignee || "Без ответственного"));
  const orderedTasks = [...tasks].sort((a, b) => Number(a.id) - Number(b.id));

  const scale = { x: 18, y: 26, z: 16 };
  const max = {
    x: totalDays * scale.x,
    y: assignees.length * scale.y + 18,
    z: orderedTasks.length * scale.z + 12
  };

  drawGrid(scene, max, scale);
  drawAxes(scene, max);
  drawAxisLabels(scene, max);

  assignees.forEach((assignee, index) => {
    addText(scene, assignee, -22, index * scale.y + 18, 0, "#e5edff");
  });

  const step = Math.max(1, Math.ceil(totalDays / 8));
  for (let day = 0; day < totalDays; day += step) {
    addText(scene, formatDay(addDays(minDate, day)), day * scale.x, -18, 0, "#cbd5e1");
  }

  const conflicts = new Set(findAssigneeOverlaps(state.project.tasks).flatMap((item) => [String(item.a.id), String(item.b.id)]));

  orderedTasks.forEach((task, taskIndex) => {
    const mesh = makeTaskBox(task, taskIndex, assignees, minDate, scale, conflicts.has(String(task.id)));
    scene.add(mesh);
    three.taskMeshes.push(mesh);

    if (mesh.userData.hasConflict) {
      const edges = new THREE.EdgesGeometry(mesh.geometry);
      const outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xff3333 }));
      outline.position.copy(mesh.position);
      scene.add(outline);
    }

    addText(scene, String(task.id), mesh.position.x, mesh.position.y + 10, mesh.position.z, "#ffffff");
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(three.taskMeshes)[0];

    if (hit) {
      renderTaskCard(hit.object.userData.task, hit.object.userData.hasConflict);
    }
  });
}

function makeTaskBox(task, taskIndex, assignees, minDate, scale, hasConflict) {
  const start = parseDate(task.start_date);
  const end = parseDate(task.end_date);
  const duration = Math.max(1, daysBetween(start, end) + 1);
  const assigneeIndex = Math.max(0, assignees.indexOf(task.assignee || "Без ответственного"));

  const geometry = new THREE.BoxGeometry(Math.max(8, duration * scale.x - 2), 10, 8);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(taskColor(task.category)),
    roughness: 0.52,
    metalness: 0.08
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    daysBetween(minDate, start) * scale.x + (duration * scale.x) / 2,
    assigneeIndex * scale.y + 18,
    taskIndex * scale.z + 10
  );

  mesh.userData = { task, hasConflict };
  return mesh;
}

function drawGrid(scene, max, scale) {
  for (let x = 0; x <= max.x + 0.1; x += scale.x) {
    line(scene, [x, 0, 0], [x, max.y, 0], 0x1e293b);
    line(scene, [x, 0, 0], [x, 0, max.z], 0x1e293b);
  }

  for (let y = 0; y <= max.y + 0.1; y += scale.y) {
    line(scene, [0, y, 0], [max.x, y, 0], 0x1e293b);
  }

  for (let z = 0; z <= max.z + 0.1; z += scale.z) {
    line(scene, [0, 0, z], [max.x, 0, z], 0x1e293b);
  }

  line(scene, [0, 0, 0], [0, max.y, 0], 0x334155);
  line(scene, [0, max.y, 0], [max.x, max.y, 0], 0x334155);
  line(scene, [max.x, 0, 0], [max.x, max.y, 0], 0x334155);
  line(scene, [0, 0, max.z], [max.x, 0, max.z], 0x334155);
  line(scene, [max.x, 0, 0], [max.x, 0, max.z], 0x334155);
}

function drawAxes(scene, max) {
  line(scene, [0, 0, 0], [max.x + 35, 0, 0], 0x60a5fa);
  line(scene, [0, 0, 0], [0, max.y + 28, 0], 0x34d399);
  line(scene, [0, 0, 0], [0, 0, max.z + 24], 0xa78bfa);
}

function drawAxisLabels(scene, max) {
  addText(scene, "X: время", max.x + 45, 0, 0, "#93c5fd");
  addText(scene, "Y: исполнители", 0, max.y + 38, 0, "#86efac");
  addText(scene, "Z: задачи", 0, 0, max.z + 34, "#c4b5fd");
}

function line(scene, from, to, color) {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...from),
    new THREE.Vector3(...to)
  ]);

  scene.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color })));
}

function addText(scene, text, x, y, z, color) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 512;
  canvas.height = 128;

  ctx.font = "700 38px Inter, Arial, sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true
  }));

  sprite.position.set(x, y, z);
  sprite.scale.set(42, 10, 1);
  scene.add(sprite);
}

function renderTaskCard(task, hasConflict) {
  ui.threeTaskInfo.className = "three-task-info";
  ui.threeTaskInfo.innerHTML = `
    <dl>
      <div><dt>Задача</dt><dd>${escapeHtml(task.text)}</dd></div>
      <div><dt>Период</dt><dd>${escapeHtml(task.start_date)} — ${escapeHtml(task.end_date)}</dd></div>
      <div><dt>Ответственный</dt><dd>${escapeHtml(task.assignee || "не указан")}</dd></div>
      <div><dt>Категория</dt><dd>${escapeHtml(task.category || "Другое")}</dd></div>
      <div><dt>Результат</dt><dd>${escapeHtml(task.deliverable || "не указан")}</dd></div>
      <div><dt>Конфликт</dt><dd>${hasConflict ? "Есть пересечение по загрузке" : "Не найден"}</dd></div>
    </dl>
  `;
}

function clearThree() {
  if (three.frame) cancelAnimationFrame(three.frame);
  if (three.controls) three.controls.dispose();

  if (three.renderer) {
    const canvas = three.renderer.domElement;
    three.renderer.dispose();
    if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
  }

  Object.assign(three, {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    taskMeshes: [],
    frame: null
  });
}

function switchView(viewName) {
  state.activeView = viewName;

  $$(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  $$(".view").forEach((view) => {
    view.classList.toggle("active", view.id === `view-${viewName}`);
  });

  if (viewName === "gantt") {
    setTimeout(() => {
      renderGantt();
      gantt.render();
    }, 80);
  }

  if (viewName === "resources") {
    setTimeout(renderResourceView, 80);
  }

  if (viewName === "three") {
    setTimeout(renderThreeView, 80);
  } else {
    clearThree();
  }
}

function exportTextReport() {
  if (!state.project.tasks.length) {
    alert("Сначала загрузите проектный план.");
    return;
  }

  const score = planScore(state.issues);
  const assignees = new Set(state.project.tasks.map((task) => task.assignee).filter(Boolean)).size;
  const overlaps = findAssigneeOverlaps(state.project.tasks).length;

  const rows = [
    "ОТЧЁТ ПРОВЕРКИ ПРОЕКТНОГО ПЛАНА",
    "================================",
    "",
    `Дата формирования: ${new Date().toLocaleString("ru-RU")}`,
    `Проект: ${state.project.meta.name}`,
    `Описание: ${state.project.meta.description}`,
    "",
    "Сводка:",
    `- Quality Score: ${score}/100`,
    `- Количество задач: ${state.project.tasks.length}`,
    `- Количество исполнителей: ${assignees}`,
    `- Критические ошибки: ${issueCount("critical")}`,
    `- Предупреждения: ${issueCount("warning")}`,
    `- Информационные замечания: ${issueCount("info")}`,
    `- Конфликты загрузки исполнителей: ${overlaps}`,
    "",
    "Найденные проблемы:",
    ...(state.issues.length
      ? orderIssues(state.issues).map((item, index) => `${index + 1}. [${issueLabel(item.level)}] ${item.title}: ${item.message}`)
      : ["Проблем не найдено."]),
    "",
    "Комментарий:",
    scoreComment(score)
  ];

  saveTextFile("plancheck_report.txt", rows.join("\n"), "text/plain");
}

function saveTextFile(filename, content, type) {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function orderIssues(issues) {
  const order = { critical: 1, warning: 2, info: 3 };
  return [...issues].sort((a, b) => order[a.level] - order[b.level]);
}

function planScore(issues) {
  return Math.max(0, 100 - issues.reduce((sum, issue) => {
    if (issue.level === "critical") return sum + 12;
    if (issue.level === "warning") return sum + 7;
    return sum + 3;
  }, 0));
}

function scoreComment(score) {
  if (score >= 90) return "План выглядит устойчивым: критичных проблем почти нет.";
  if (score >= 75) return "План рабочий, но есть несколько замечаний для доработки.";
  if (score >= 50) return "План требует проверки: есть риски по срокам, зависимостям или исполнителям.";
  return "План содержит серьёзные ошибки и требует переработки перед стартом проекта.";
}

function issueLabel(level) {
  return {
    critical: "Критическая",
    warning: "Предупреждение",
    info: "Информация"
  }[level] || "Информация";
}

function issueIcon(level) {
  return {
    critical: "⛔",
    warning: "⚠",
    info: "ℹ"
  }[level] || "ℹ";
}

function taskColor(category) {
  return COLORS[category] || COLORS["Другое"];
}

function hasValidPeriod(task) {
  return Boolean(parseDate(task.start_date) && parseDate(task.end_date));
}

function projectRange(tasks) {
  return {
    minDate: new Date(Math.min(...tasks.map((task) => parseDate(task.start_date).getTime()))),
    maxDate: new Date(Math.max(...tasks.map((task) => parseDate(task.end_date).getTime())))
  };
}

function toIsoDate(value) {
  if (!value) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const base = new Date(Date.UTC(1899, 11, 30));
    return new Date(base.getTime() + value * 86400000).toISOString().slice(0, 10);
  }

  const raw = String(value).trim();
  const ru = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (ru) return `${ru[3]}-${ru[2]}-${ru[1]}`;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString().slice(0, 10);
}

function parseDate(value) {
  if (!value || typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(a, b) {
  return Math.round((dateOnly(b) - dateOnly(a)) / 86400000);
}

function dateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDay(date) {
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

function formatDate(date) {
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function textWidth(text) {
  return Math.max(40, String(text || "").length * 8.2);
}

function sceneSize() {
  return {
    width: ui.threeContainer.clientWidth || 900,
    height: ui.threeContainer.clientHeight || 640
  };
}

function unique(items) {
  return [...new Set(items)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return [...document.querySelectorAll(selector)];
}

window.addEventListener("resize", () => {
  if (!three.renderer || !three.camera || !ui.threeContainer) return;

  const size = sceneSize();
  three.camera.aspect = size.width / size.height;
  three.camera.updateProjectionMatrix();
  three.renderer.setSize(size.width, size.height);
});
