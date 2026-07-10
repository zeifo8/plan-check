// Проверка проектного плана

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
