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

const PAGE_URLS = {
  dashboard: "index.html",
  gantt: "pages/gantt.html",
  resources: "pages/resources.html",
  three: "pages/three.html",
  issues: "pages/issues.html",
  data: "pages/data.html"
};

document.addEventListener("DOMContentLoaded", startApp);

function startApp() {
  state.activeView = document.body.dataset.page || "dashboard";
  collectElements();

  if (ui.ganttContainer && typeof gantt !== "undefined") {
    setupGantt();
  }

  bindEvents();

  loadProject(restoreSession());
}

function collectElements() {
  Object.assign(ui, {
    jsonInput: $("#jsonFileInput"),
    tableInput: $("#tableFileInput"),
    sampleBtn: $("#downloadSampleBtn"),
    clearBtn: $("#clearProjectBtn"),
    reportBtn: $("#exportReportBtn"),
    validateBtn: $("#runValidationBtn"),

    ganttContainer: $("#gantt_here"),
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
  ui.jsonInput?.addEventListener("change", (event) => importFile(event, "json"));
  ui.tableInput?.addEventListener("change", (event) => importFile(event, "table"));

  ui.sampleBtn?.addEventListener("click", () => {
    saveTextFile("sample_project.json", JSON.stringify(demoProject, null, 2), "application/json");
  });

  ui.clearBtn?.addEventListener("click", clearPlan);
  ui.reportBtn?.addEventListener("click", exportTextReport);
  ui.validateBtn?.addEventListener("click", () => {
    state.issues = validatePlan(state.project);
    persistSession();
    renderAll();
  });

  ui.ganttZoomIn?.addEventListener("click", () => changeGanttZoom(12));
  ui.ganttZoomOut?.addEventListener("click", () => changeGanttZoom(-12));
  ui.ganttFit?.addEventListener("click", fitGantt);

  ui.resourceZoomIn?.addEventListener("click", () => changeResourceZoom(12));
  ui.resourceZoomOut?.addEventListener("click", () => changeResourceZoom(-12));
  ui.resourceFit?.addEventListener("click", fitResourceView);

  ui.taskForm?.addEventListener("submit", addTaskFromForm);
  ui.manualTasksBody?.addEventListener("click", handleManualTableClick);
  ui.saveLocal?.addEventListener("click", saveToBrowser);
  ui.loadLocal?.addEventListener("click", loadFromBrowser);

  $$(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      state.issueFilter = button.dataset.filter;
      $$(".filter").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderIssues();
    });
  });
}

function loadProject(project) {
  state.project = normalizeProject(project);
  state.issues = validatePlan(state.project);
  state.issueFilter = "all";

  persistSession();
  $$(".filter").forEach((item) => item.classList.toggle("active", item.dataset.filter === "all"));
  renderAll();
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

function clearPlan() {
  if (!confirm("Очистить текущий проектный план?")) return;

  state.project = emptyProject();
  state.issues = [];
  persistSession();
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

function persistSession() {
  const value = JSON.stringify(state.project);

  try {
    sessionStorage.setItem("plancheck_session", value);
  } catch (error) {
    console.warn("Не удалось сохранить данные в sessionStorage", error);
  }

  window.name = `plancheck:${value}`;
}

function restoreSession() {
  try {
    const saved = sessionStorage.getItem("plancheck_session");
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.warn("Не удалось прочитать sessionStorage", error);
  }

  if (window.name.startsWith("plancheck:")) {
    try {
      return JSON.parse(window.name.slice("plancheck:".length));
    } catch (error) {
      console.warn("Не удалось восстановить данные между страницами", error);
    }
  }

  return emptyProject();
}

function renderAll() {
  if (ui.projectName) renderHeader();
  if (ui.score) renderMetrics();
  if (ui.quickSummary) renderSummary();
  if (ui.currentJson) renderJsonPreview();
  if (ui.manualTasksBody) renderManualTasks();
  if (ui.issuesList) renderIssues();
  if (ui.ganttContainer) renderGantt();
  if (ui.resourceTimeline) renderResourceView();
  if (ui.threeContainer) renderThreeViewIfNeeded();
}

function switchView(viewName) {
  const prefix = document.body.dataset.pathPrefix || "";
  const url = PAGE_URLS[viewName] || PAGE_URLS.dashboard;
  persistSession();
  window.location.href = `${prefix}${url}`;
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

