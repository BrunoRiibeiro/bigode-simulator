window.ResultView = (function () {
	function renderResults(result, refs) {
		refs.summary.innerHTML =
			'<div class="result-grid">' +
			'<div class="result-box"><strong>Total</strong><span>' + result.totalQuestions + "</span></div>" +
			'<div class="result-box"><strong>Respondidas</strong><span>' + result.answeredQuestions + "</span></div>" +
			'<div class="result-box"><strong>Acertos</strong><span>' + result.correctCount + "</span></div>" +
			'<div class="result-box"><strong>Erros</strong><span>' + result.wrongCount + "</span></div>" +
			'<div class="result-box"><strong>Em branco</strong><span>' + result.blankCount + "</span></div>" +
			'<div class="result-box"><strong>Aproveitamento</strong><span>' + AppUtils.formatPercent(result.scorePercent) + "</span></div>" +
			"</div>";

		refs.list.innerHTML = result.items
			.map(function (item) {
				return buildResultItem(item);
			})
			.join("");
	}

	function buildResultItem(item) {
		const statusText = item.isCorrect
			? "Acertou"
			: item.isAnswered
			? "Errou"
			: "Em branco";

		const statusClass = item.isCorrect
			? "result-item--correct"
			: item.isAnswered
			? "result-item--wrong"
			: "result-item--blank";

		return (
			'<article class="result-item ' + statusClass + '">' +
			'<header class="result-item__header">' +
			"<h3>Question " + item.number + "</h3>" +
			'<span class="result-item__status">' + statusText + "</span>" +
			"</header>" +
			'<div class="result-item__prompt">' + AppUtils.nl2br(item.prompt) + "</div>" +
			"<p><strong>Marcada:</strong> " + (item.selected.length ? item.selected.join(", ") : "—") + "</p>" +
			"<p><strong>Correta:</strong> " + item.correct.join(", ") + "</p>" +
			(item.options.length
				? '<ul class="result-item__options">' + buildOptionList(item) + "</ul>"
				: "") +
			(item.explanation
				? '<div class="result-item__explanation"><strong>Explicação:</strong> ' + AppUtils.nl2br(item.explanation) + "</div>"
				: "") +
			"</article>"
		);
	}

	function buildOptionList(item) {
		return item.options
			.map(function (optionText, index) {
				const key = AppUtils.extractOptionKey(optionText, index);
				const classNames = ["result-option"];

				if (item.selected.includes(key)) {
					classNames.push("result-option--selected");
				}

				if (item.correct.includes(key)) {
					classNames.push("result-option--correct");
				}

				const flags = [
					item.selected.includes(key) ? "<em>Marcada</em>" : "",
					item.correct.includes(key) ? "<strong>Correta</strong>" : ""
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
