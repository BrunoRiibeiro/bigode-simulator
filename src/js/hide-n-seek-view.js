window.HideNSeekView = (function () {
	function render(questions, refs) {
		refs.summary.innerHTML = buildSummary(questions);
		refs.list.innerHTML = questions
			.map(function (question, index) {
				return buildQuestionCard(question, index);
			})
			.join("");
	}

	function buildSummary(questions) {
		const counts = {
			total: questions.length,
			single: 0,
			multiple: 0,
			boolean: 0,
			text: 0
		};

		questions.forEach(function (question) {
			if (counts.hasOwnProperty(question.type)) { counts[question.type] += 1; }
		});

		return (
			'<div class="result-grid">' +
			'<div class="result-box"><strong>Total</strong><span>' + counts.total + "</span></div>" +
			'<div class="result-box"><strong>Single</strong><span>' + counts.single + "</span></div>" +
			'<div class="result-box"><strong>Multiple</strong><span>' + counts.multiple + "</span></div>" +
			'<div class="result-box"><strong>Boolean</strong><span>' + counts.boolean + "</span></div>" +
			'<div class="result-box"><strong>Text</strong><span>' + counts.text + "</span></div>" +
			"</div>"
		);
	}

	function buildQuestionCard(question, index) {
		const badgeId = AppUtils.escapeHtml(question.id);
		const badgeText = AppUtils.escapeHtml(getTypeLabel(question.type));

		return (
			'<article class="question-card" data-question-id="' + AppUtils.escapeHtml(question.id) + '">' +
			'<header class="question-card__header">' +
			'<h3 class="question-card__title">Question ' + (index + 1) + '</h3>' +
			'<div class="question-card__meta">' +
			'<div class="question-card__badges">' +
			'<span class="question-card__badge question-card__badge--id">' + badgeId + '</span>' +
			'<span class="question-card__badge question-card__badge--type">' + badgeText + '</span>' +
			"</div>" +
			"</div>" +
			"</header>" +
			'<div class="question-card__prompt">' + AppUtils.nl2br(question.prompt) + "</div>" +
			buildAnswerContent(question) +
			(question.explanation
				? '<div class="result-item__explanation"><strong>Explanation:</strong> ' + AppUtils.nl2br(question.explanation) + "</div>"
				: "") +
			"</article>"
		);
	}

	function buildAnswerContent(question) {
		if (question.type === "text") {
			return (
				'<div class="answer-key__accepted">' +
				"<strong>Accepted answer(s):</strong> " +
				formatTextAnswers(question.answer) +
				"</div>"
			);
		}

		return buildOptions(question);
	}

	function buildOptions(question) {
		const correctKeys = getCorrectKeys(question);

		const optionsHtml = (question.options || [])
			.map(function (optionText, index) {
				const key = AppUtils.extractOptionKey(optionText, index);
				const classNames = ["option"];

				if (correctKeys.includes(key)) { classNames.push("option--correct"); }

				return (
					'<div class="' + classNames.join(" ") + '">' +
					'<span class="option__text">' + AppUtils.escapeHtml(optionText) + "</span>" +
					"</div>"
				);
			})
			.join("");

		return '<div class="question-card__options">' + optionsHtml + "</div>";
	}

	function getCorrectKeys(question) {
		if (question.type === "boolean") {
			if (!question.optionValues) { return []; }

			return Object.keys(question.optionValues).filter(function (key) {
				return question.optionValues[key] === question.answer;
			});
		}

		return AppUtils.normalizeAnswerList(question.answer || []);
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

	function getTypeLabel(type) {
		if (type === "multiple") { return "Multiple choice"; }
		if (type === "boolean") { return "Boolean"; }
		if (type === "text") { return "Answer in text"; }
		return "Single choice";
	}

	return {
		render
	};
})();
