window.ResultView = (function () {
	function renderResults(result, refs) {
		refs.summary.innerHTML =
			'<div class="result-grid">' +
			'<div class="result-box"><strong>Total</strong><span>' +
			result.totalQuestions + "</span></div>" +
			'<div class="result-box"><strong>Answered</strong><span>' +
			result.answeredQuestions + "</span></div>" +
			'<div class="result-box"><strong>Correct</strong><span>' +
			result.correctCount + "</span></div>" +
			'<div class="result-box"><strong>Wrong</strong><span>' +
			result.wrongCount + "</span></div>" +
			'<div class="result-box"><strong>Unanswered</strong><span>' +
			result.blankCount + "</span></div>" +
			'<div class="result-box"><strong>Score</strong><span>' +
			AppUtils.formatPercent(result.scorePercent) + "</span></div>" +
			"</div>";

		refs.list.innerHTML = result.items
			.map(function (item) {
				return buildResultItem(item);
			})
			.join("");
	}

	function stripOptionPrefix(optionText) {
		return String(optionText || "").replace(/^[A-Z]\.\s*/, "").trim();
	}

	function resolveAnswerLabel(item, answerKey) {
		if (item.type !== "boolean") return String(answerKey);

		const match = (item.options || []).find(function (optionText, index) {
			return AppUtils.extractOptionKey(optionText, index) === answerKey;
		});

		return match ? stripOptionPrefix(match) : String(answerKey);
	}

	function formatDisplayAnswerList(item, values, separator) {
		const list = Array.isArray(values) ? values : [];

		if (!list.length) return "—";

		return list
			.map(function (value) {
				return AppUtils.escapeHtml(resolveAnswerLabel(item, value));
			}).join(separator || ", ");
	}

	function resolveMatchingText(items, itemId) {
		const match = (items || []).find(function (item) {
			return item.id === itemId;
		});

		return match ? match.text : "—";
	}

	function buildMatchingResult(item) {
		const selected = item.selected || {};
		const correct = item.correct || {};

		return (
			'<div class="result-matching">' +
			'<div class="result-matching__header">' +
			'<span>Item</span>' +
			'<span>Your match</span>' +
			'<span>Correct match</span>' +
			'</div>' +
			item.left.map(function (leftItem) {
				const selectedId = selected[leftItem.id];
				const correctId = correct[leftItem.id];

				const selectedClass = !selectedId
					? ""
					: selectedId === correctId
					? "result-matching__value--correct"
					: "result-matching__value--wrong";

				return (
					'<div class="result-matching__row">' +
					'<span class="result-matching__item">' +
					AppUtils.escapeHtml(leftItem.text) +
					'</span>' +
					'<span class="result-matching__value ' + selectedClass + '">' +
					AppUtils.escapeHtml(
						resolveMatchingText(item.right, selectedId)
					) +
					'</span>' +
					'<span class="result-matching__value result-matching__value--correct">' +
					AppUtils.escapeHtml(
						resolveMatchingText(item.right, correctId)
					) +
					'</span>' +
					'</div>'
				);
			}).join("") +
			'</div>'
		);
	}

	function buildResultItem(item) {
		const statusText = item.isCorrect
			? "Correct"
			: item.isAnswered
			? "Wrong"
			: "Unanswered";

		const statusClass = item.isCorrect
			? "result-item--correct"
			: item.isAnswered
			? "result-item--wrong"
			: "result-item--blank";

		let badgeId = item.id;
		const issuesFeature = window.GitHubIssuesFeature;
		const issueUrl = issuesFeature ? issuesFeature.buildIssueSearchUrl(item) : "";
		const issueRef = issuesFeature ? issuesFeature.getQuestionRef(item) : "";
		const issueLinkHtml = issueUrl ? '<a class="question-card__issue-link" href="' +
			AppUtils.escapeHtml(issueUrl) + '" target="_blank" rel="noopener noreferrer" title="Open GitHub issues for ' +
			AppUtils.escapeHtml(issueRef) + '">Discuss question</a>' : "";

		const answerSeparator = item.type === "text" ? " / " : ", ";
		const answerHtml = item.type === "matching"
			? buildMatchingResult(item)
			: (
				"<p><strong>Selected:</strong> " +
				formatDisplayAnswerList(item, item.selected, answerSeparator) +
				"</p>" +
				"<p><strong>Correct:</strong> " +
				formatDisplayAnswerList(item, item.correct, answerSeparator) +
				"</p>"
			);

		return (
			'<article class="result-item ' + statusClass + '">' +
			'<header class="result-item__header">' +
			"<h3>Question " + item.number + "</h3>" +
			'<div class="question-card__meta">' +
			'<span class="question-card__badge question-card__badge--id">' + badgeId + '</span>' +
			'<span class="result-item__status">' + statusText + "</span>" +
			issueLinkHtml +
			'</div>' +
			"</header>" +
			'<div class="result-item__prompt">' + AppUtils.nl2br(item.prompt) + "</div>" +
			answerHtml +
			(item.type !== "matching" && item.options.length
				? '<ul class="result-item__options">' + buildOptionList(item) + "</ul>"
				: "") +
			QuestionContentView.buildExplanation(item) +
			"</article>"
		);
	}

	function buildOptionList(item) {
		return item.options
			.map(function (optionText, index) {
				const key = AppUtils.extractOptionKey(optionText, index);
				const classNames = ["result-option"];

				if (item.selected.includes(key))
					classNames.push("result-option--selected");

				if (item.correct.includes(key))
					classNames.push("result-option--correct");

				const flags = [
					item.selected.includes(key) ? "<em>Selected</em>" : "",
					item.correct.includes(key) ? "<strong>Correct</strong>" : ""
				]
					.filter(Boolean)
					.join("");

				return (
					'<li class="' + classNames.join(" ") + '">' +
					'<span class="result-option__text">' + AppUtils.escapeHtml(optionText) + "</span>" +
					(flags ? '<span class="result-option__flags">' + flags + "</span>" : "") +
					"</li>"
				);
			})
			.join("");
	}

	return { renderResults };
})();
