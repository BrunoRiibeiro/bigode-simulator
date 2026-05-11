window.ExamView = (function () {
	function renderExam(examQuestions, refs) {
		refs.container.innerHTML = examQuestions
			.map(function (question, index) {
				return buildQuestionCard(question, index);
			})
			.join("");

		refs.meta.innerHTML =
			"<p><strong>Exam questions:</strong> " + examQuestions.length + "</p>";
	}

	function buildQuestionCard(question, index) {
		const inputName = "question_" + index;
		let answerHtml = "";
		let badgeText = "Single choice";
		let badgeId = question.id;

		if (question.type === "text") {
			const inputId = inputName + "_text";
			badgeText = "Answer in text";

			answerHtml =
				'<div class="question-card__text-answer">' +
				'<input ' +
				'type="text" ' +
				'id="' + AppUtils.escapeHtml(inputId) + '" ' +
				'name="' + AppUtils.escapeHtml(inputName) + '" ' +
				'placeholder="Type your anser" ' +
				'autocomplete="off">' +
				"</div>";
		} else {
			const inputType = question.type === "multiple" ? "checkbox" : "radio";
			badgeText = question.type === "multiple" ? "Multiple choice" : "Single choice";

			const optionsHtml = question.options
				.map(function (optionText, optionIndex) {
					const key = AppUtils.extractOptionKey(optionText, optionIndex);
					const inputId = inputName + "_" + key;

					return (
						'<label class="option" for="' + AppUtils.escapeHtml(inputId) + '">' +
						'<input ' +
						'type="' + inputType + '" ' +
						'id="' + AppUtils.escapeHtml(inputId) + '" ' +
						'name="' + AppUtils.escapeHtml(inputName) + '" ' +
						'value="' + AppUtils.escapeHtml(key) + '">' +
						'<span class="option__text">' + AppUtils.escapeHtml(optionText) + "</span>" +
						"</label>"
					);
				})
				.join("");

			answerHtml = '<div class="question-card__options">' + optionsHtml + "</div>";
		}

		const issueUrl = window.GitHubIssuesFeature ? window.GitHubIssuesFeature.buildIssueSearchUrl(question) : "";
		const issueRef = window.GitHubIssuesFeature ? window.GitHubIssuesFeature.getQuestionRef(question) : "";
		const issueLinkHtml = issueUrl ? '<a class="question-card__issue-link" href="' +
			AppUtils.escapeHtml(issueUrl) + '" target="_blank" rel="noopener noreferrer" title="Open GitHub issues for ' +
			AppUtils.escapeHtml(issueRef) + '">Discuss question</a>' : "";

		return (
			'<article class="question-card" data-question-id="' + AppUtils.escapeHtml(question.id) + '">' +
			'<header class="question-card__header">' +
			'<h3 class="question-card__title">Question ' + (index + 1) + '</h3>' +
			'<div class="question-card__meta">' +
			'<div class="question-card__badges">' +
			'<span class="question-card__badge question-card__badge--id">' + badgeId + '</span>' +
			'<span class="question-card__badge question-card__badge--type">' + badgeText + '</span>' +
			'</div>' +
			issueLinkHtml +
			'</div>' +
			'</header>' +
			'<div class="question-card__prompt">' + AppUtils.nl2br(question.prompt) + '</div>' +
			answerHtml +
			'</article>'
		);
	}

	function collectAnswers(form, examQuestions) {
		const answers = {};

		examQuestions.forEach(function (question, index) {
			const inputName = "question_" + index;

			if (question.type === "text") {
				const textInput = form.querySelector('input[name="' + inputName + '"]');
				const value = textInput ? textInput.value.trim() : "";

				answers[question.id] = value
					? AppUtils.normalizeAnswerList([value])
					: [];

				return;
			}

			const selected = Array.from(
				form.querySelectorAll('input[name="' + inputName + '"]:checked')
			).map(function (input) {
				return input.value;
			});

			answers[question.id] = AppUtils.normalizeAnswerList(selected);
		});

		return answers;
	}

	function renderSingleQuestion(question, questionNumber, totalQuestions, refs) {
		refs.container.innerHTML = buildQuestionCard(question, questionNumber - 1);
		refs.meta.innerHTML =
			"<p><strong>Question:</strong> " +
			questionNumber +
			" of " +
			totalQuestions +
			"</p>";
	}

	function collectSingleAnswer(form, question, questionIndex) {
		const inputName = "question_" + questionIndex;

		if (question.type === "text") {
			const textInput = form.querySelector('input[name="' + inputName + '"]');
			const value = textInput ? textInput.value.trim() : "";

			return value
				? AppUtils.normalizeAnswerList([value])
				: [];
		}

		const selected = Array.from(
			form.querySelectorAll('input[name="' + inputName + '"]:checked')
		).map(function (input) {
			return input.value;
		});

		return AppUtils.normalizeAnswerList(selected);
	}

	function applyStepCorrection(form, question, selectedAnswers) {
		const card = form.querySelector(
			'[data-question-id="' + question.id + '"]'
		);

		if (!card) { return; }

		const selected = AppUtils.normalizeAnswerList(selectedAnswers || []);
		const correct = AppUtils.normalizeAnswerList(question.answer || []);
		const isCorrectAnswer = AppUtils.sameAnswers(selected, correct);

		card.classList.remove(
			"question-card--correct",
			"question-card--wrong",
			"question-card--blank"
		);

		if (!selected.length) { card.classList.add("question-card--blank"); }
		else if (isCorrectAnswer) { card.classList.add("question-card--correct"); }
		else { card.classList.add("question-card--wrong"); }

		if (question.type === "text") {
			const textInput = card.querySelector('input[type="text"]');

			if (textInput) {
				textInput.disabled = true;
				textInput.classList.remove(
					"text-answer--correct",
					"text-answer--wrong",
					"text-answer--blank"
				);

				if (!selected.length) { textInput.classList.add("text-answer--blank"); }
				else if (isCorrectAnswer) { textInput.classList.add("text-answer--correct"); }
				else { textInput.classList.add("text-answer--wrong"); }
			}
			return;
		}

		const optionLabels = card.querySelectorAll(".option");

		optionLabels.forEach(function (label) {
			const input = label.querySelector("input");

			if (!input) { return; }

			const key = AppUtils.normalizeAnswerValue(input.value);
			const isSelected = selected.includes(key);
			const isCorrect = correct.includes(key);

			label.classList.remove("option--correct", "option--wrong");

			if (isCorrect) { label.classList.add("option--correct"); }
			if (isSelected && !isCorrect) { label.classList.add("option--wrong"); }

			input.disabled = true;
		});
	}

	return {
		renderExam,
		collectAnswers,
		renderSingleQuestion,
		collectSingleAnswer,
		applyStepCorrection
	};
})();
