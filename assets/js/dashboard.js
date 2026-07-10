// Сводная информация и отображение данных

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
