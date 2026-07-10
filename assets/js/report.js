// Экспорт текстового отчёта

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
