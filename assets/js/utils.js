// Общие вспомогательные функции

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
