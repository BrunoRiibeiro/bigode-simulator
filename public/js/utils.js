window.AppUtils = (function () {
  function shuffle(array) {
    const cloned = array.slice();

    for (let i = cloned.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }

    return cloned;
  }

  function sample(array, count) {
    return shuffle(array).slice(0, count);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function nl2br(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
  }

  function extractOptionKey(optionText, index) {
    const text = String(optionText ?? "").trim();
    const match = text.match(/^([A-Z])[\.\)\-:]\s*/i);

    if (match) {
      return match[1].toUpperCase();
    }

    return String.fromCharCode(65 + index);
  }

  function normalizeAnswerValue(value) {
    const text = String(value ?? "").trim();
    const match = text.match(/^([A-Z])(?:[\.\)\-:]\s*.+)?$/i);

    if (match) {
      return match[1].toUpperCase();
    }

    return text.toUpperCase();
  }

  function normalizeAnswerList(answer) {
    const list = Array.isArray(answer)
      ? answer
      : answer != null
        ? [answer]
        : [];

    return Array.from(
      new Set(
        list
          .map(normalizeAnswerValue)
          .map(function (item) {
            return item.trim();
          })
          .filter(Boolean)
      )
    ).sort();
  }

  function sameAnswers(a, b) {
    const normalizedA = normalizeAnswerList(a);
    const normalizedB = normalizeAnswerList(b);

    if (normalizedA.length !== normalizedB.length) {
      return false;
    }

    return normalizedA.every(function (value, index) {
      return value === normalizedB[index];
    });
  }

  function formatPercent(value) {
    return Number(value).toFixed(2).replace(".", ",") + "%";
  }

  return {
    shuffle,
    sample,
    escapeHtml,
    nl2br,
    extractOptionKey,
    normalizeAnswerValue,
    normalizeAnswerList,
    sameAnswers,
    formatPercent
  };
})();
