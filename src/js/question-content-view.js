window.QuestionContentView = (function () {
	function buildExplanation(item) {
		if (!item.explanation) { return ""; }
		return (
			'<div class="result-item__explanation">' +
			'<div class="result-item__explanation-header">' +
			'<strong>Explanation:</strong>' +
			buildExplanationBadges(item) +
			'</div>' +
			'<div class="result-item__explanation-content">' +
			AppUtils.nl2br(item.explanation) +
			'</div>' +
			'</div>'
		);
	}

	function buildExplanationBadges(item) {
		const tags = Array.isArray(item.tags) ? item.tags : [];
		if (!tags.includes("ai-generated")) { return ""; }
		return (
			'<span class="result-item__badge result-item__badge--ai">' +
			'<span aria-hidden="true">✦</span> AI Generated' +
			'</span>'
		);
	}

	function formatTextAnswers(answer) {
		const answers = Array.isArray(answer) ? answer : [];
		if (!answers.length) { return "—"; }
		return answers
			.map(function (item) {
				return AppUtils.escapeHtml(String(item));
			})
			.join(" / ");
	}

	return {
		buildExplanation,
		formatTextAnswers
	};
})();
