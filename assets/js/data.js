// Загрузка, преобразование и ручной ввод данных

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
  persistSession();
  event.currentTarget.reset();

  renderAll();
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
  persistSession();

  renderAll();
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
