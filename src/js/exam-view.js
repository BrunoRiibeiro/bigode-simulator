window.ExamView = (function () {
	function setupMatching(container) {
		if (container.dataset.matchingSetup === "true") return;
		container.dataset.matchingSetup = "true";

		container.addEventListener("dragstart", function (event) {
			const item = event.target.closest("[data-left-id]");
			if (!item) return;
			event.dataTransfer.setData("text/plain", item.dataset.leftId);
			event.dataTransfer.effectAllowed = "move";
		});

		container.addEventListener("dragover", function (event) {
			const target = event.target.closest("[data-right-id]");
			if (!target) return;
			event.preventDefault();
			event.dataTransfer.dropEffect = "move";
			target.classList.add("matching-item--drag-over");
		});

		container.addEventListener("dragleave", function (event) {
			const target = event.target.closest("[data-right-id]");
			if (!target) return;
			target.classList.remove("matching-item--drag-over");
		});

		container.addEventListener("drop", function (event) {
			const target = event.target.closest("[data-right-id]");
			if (!target) return;
			event.preventDefault();
			target.classList.remove("matching-item--drag-over");
			const leftId = event.dataTransfer.getData("text/plain");
			if (!leftId) return;
			const matchingContainer = target.closest("[data-matching-name]");
			assignMatchingItem(matchingContainer, leftId, target.dataset.rightId);
		});

		container.addEventListener("click", function (event) {
			const item = event.target.closest("[data-left-id], [data-right-id]");
			if (!item || !item.classList.contains("matching-item--matched"))
				return;
			const matchingContainer = item.closest("[data-matching-name]");
			clearMatchingAssociation(matchingContainer, item);
		});
	}

	function assignMatchingItem(container, leftId, rightId) {
		const leftItems = Array.from(
			container.querySelectorAll("[data-left-id]"));

		const rightItems = Array.from(
			container.querySelectorAll("[data-right-id]"));

		const leftItem = leftItems.find(function (item) {
			return item.dataset.leftId === leftId;
		});

		const rightItem = rightItems.find(function (item) {
			return item.dataset.rightId === rightId;
		});

		if (!leftItem || !rightItem) return;

		clearMatchingAssociation(container, leftItem);
		clearMatchingAssociation(container, rightItem);

		const label = getMatchingLabel(leftItems.indexOf(leftItem));

		leftItem.dataset.matchedRightId = rightId;
		rightItem.dataset.matchedLeftId = leftId;
		leftItem.classList.add("matching-item--matched");
		rightItem.classList.add("matching-item--matched");
		addMatchingBadge(leftItem, label);
		addMatchingBadge(rightItem, label);
	}

	function clearMatchingAssociation(container, item) {
		const isLeftItem = item.hasAttribute("data-left-id");
		const counterpartId = isLeftItem
			? item.dataset.matchedRightId
			: item.dataset.matchedLeftId;

		if (!counterpartId) return;

		const counterpart = Array.from(container.querySelectorAll(isLeftItem
			? "[data-right-id]"
			: "[data-left-id]")).find(function (element) {
				return isLeftItem
					? element.dataset.rightId === counterpartId
					: element.dataset.leftId === counterpartId;
				});

		[item, counterpart].forEach(function (element) {
			if (!element) return;
			delete element.dataset.matchedRightId;
			delete element.dataset.matchedLeftId;
			element.classList.remove("matching-item--matched");
			const badge = element.querySelector(".matching-item__badge");
			if (badge) badge.remove();
		});
	}

	function getMatchingLabel(index) {
		let label = "";
		let number = index + 1;
		while (number > 0) {
			number--;
			label = String.fromCharCode(65 + number % 26) + label;
			number = Math.floor(number / 26);
		}
		return label;
	}

	function addMatchingBadge(item, label, status) {
		const badge = document.createElement("span");
		badge.className = "matching-item__badge";
		if (status) badge.classList.add("matching-item__badge--" + status);
		badge.textContent = label;
		item.appendChild(badge);
	}

	function renderExam(examQuestions, refs) {
		refs.container.innerHTML = examQuestions
			.map(function (question, index) {
				return buildQuestionCard(question, index);
			})
			.join("");

		refs.meta.innerHTML =
			"<p><strong>Exam questions:</strong> " + examQuestions.length + "</p>";
		setupMatching(refs.container);
	}

	function buildMatchingQuestion(question, inputName) {
		const leftItems = question.left.map(function (item) {
			return (
				'<button type="button" class="matching-item" ' +
				'data-left-id="' + AppUtils.escapeHtml(item.id) + '" ' +
				'draggable="true">' +
				'<span class="matching-item__text">' +
				AppUtils.escapeHtml(item.text) +
				'</span>' +
				'</button>'
			);
		}).join("");

		const rightItems = question.right.map(function (item) {
			return (
				'<button type="button" class="matching-item matching-item--target" ' +
				'data-right-id="' + AppUtils.escapeHtml(item.id) + '">' +
				'<span class="matching-item__text">' +
				AppUtils.escapeHtml(item.text) +
				'</span>' +
				'</button>'
			);
		}).join("");

		return (
			'<div class="question-card__matching" data-matching-name="' +
			AppUtils.escapeHtml(inputName) + '">' +
			'<div class="matching-column">' +
			'<h4 class="matching-column__title">Drag</h4>' +
			leftItems +
			'</div>' +
			'<div class="matching-column">' +
			'<h4 class="matching-column__title">Drop</h4>' +
			rightItems +
			'</div>' +
			'</div>'
		);
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
				'placeholder="Type your answer" ' +
				'autocomplete="off">' +
				"</div>";
		} else if (question.type === "matching") {
			badgeText = "Matching";
			answerHtml = buildMatchingQuestion(question, inputName);
		} else {
			const inputType = question.type === "multiple" ? "checkbox" : "radio";
			badgeText = question.type === "multiple" ? "Multiple choice" :
				question.type === "boolean" ? "Boolean" : "Single choice";

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
				answers[question.id] = value ? [value] : [];
				return;
			}

			if (question.type === "matching") {
				const matchingContainer = form.querySelector(
					'[data-matching-name="' + inputName + '"]');

				const associations = {};

				if (matchingContainer) {
					matchingContainer.querySelectorAll("[data-left-id]")
						.forEach(function (item) {
							const rightId = item.dataset.matchedRightId;
							if (rightId)
								associations[item.dataset.leftId] = rightId;
						});
				}
				answers[question.id] = associations;
				return;
			}

			const selected = Array.from(
				form.querySelectorAll('input[name="' + inputName + '"]:checked')
			).map(function (input) {
				return input.value;
			});

			answers[question.id] = AppUtils.normaliseAnswerList(selected);
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
		setupMatching(refs.container);
	}

	function collectSingleAnswer(form, question, questionIndex) {
		const inputName = "question_" + questionIndex;

		if (question.type === "text") {
			const textInput = form.querySelector('input[name="' + inputName + '"]');
			const value = textInput ? textInput.value.trim() : "";
			return value ? [value] : [];
		}

		if (question.type === "matching") {
			const matchingContainer = form.querySelector(
				'[data-matching-name="' + inputName + '"]');

			const associations = {};

			if (matchingContainer) {
				matchingContainer.querySelectorAll("[data-left-id]")
					.forEach(function (item) {
						const rightId = item.dataset.matchedRightId;
						if (rightId) associations[item.dataset.leftId] = rightId;
					});
			}
			return associations;
		}

		const selected = Array.from(
			form.querySelectorAll('input[name="' + inputName + '"]:checked')
		).map(function (input) {
			return input.value;
		});

		return AppUtils.normaliseAnswerList(selected);
	}

	function applyMatchingCorrection(card, question, evaluation) {
		const selected = evaluation.selected;
		const correct = evaluation.correct;
		const leftItems = Array.from(card.querySelectorAll("[data-left-id]"));
		const rightItems = Array.from(card.querySelectorAll("[data-right-id]"));

		leftItems.forEach(function (leftItem, index) {
			const leftId = leftItem.dataset.leftId;
			const selectedRightId = selected[leftId];
			const correctRightId = correct[leftId];
			const hasSelection = Boolean(selectedRightId);
			const isCorrect = hasSelection && selectedRightId === correctRightId;

			leftItem.classList.remove(
				"matching-item--matched",
				"matching-item--selected",
				"matching-item--correct",
				"matching-item--wrong",
				"matching-item--blank"
			);

			leftItem.querySelectorAll(".matching-item__badge")
				.forEach(function (badge) {
					badge.remove();
				});

			if (isCorrect) {
				leftItem.classList.add("matching-item--correct");
				addMatchingBadge(leftItem, getMatchingLabel(index), "correct");
			} else if (hasSelection) {
				leftItem.classList.add("matching-item--wrong");
				addMatchingBadge(leftItem, getMatchingLabel(index), "wrong");
				addMatchingBadge(leftItem, getMatchingLabel(index), "correct");
			} else {
				leftItem.classList.add("matching-item--blank");
				addMatchingBadge(leftItem, getMatchingLabel(index), "correct");
			}

			leftItem.disabled = true;
			leftItem.draggable = false;
		});

		rightItems.forEach(function (rightItem) {
			const rightId = rightItem.dataset.rightId;

			rightItem.classList.remove(
				"matching-item--matched",
				"matching-item--selected",
				"matching-item--correct",
				"matching-item--wrong",
				"matching-item--blank"
			);

			rightItem.querySelectorAll(".matching-item__badge")
				.forEach(function (badge) {
					badge.remove();
				});

			const selectedLeftIndex = question.left.findIndex(function (leftItem) {
				return selected[leftItem.id] === rightId;
			});

			const correctLeftIndex = question.left.findIndex(function (leftItem) {
				return correct[leftItem.id] === rightId;
			});

			if (selectedLeftIndex !== -1) {
				const selectedLeft = question.left[selectedLeftIndex];
				const isCorrect = selected[selectedLeft.id] ===
					correct[selectedLeft.id];

				rightItem.classList.add(isCorrect ? "matching-item--correct" :
					"matching-item--wrong");

				addMatchingBadge(rightItem,
					getMatchingLabel(selectedLeftIndex),
					isCorrect ? "correct" : "wrong");
			}

			if (correctLeftIndex !== -1 &&
				selected[question.left[correctLeftIndex].id] !== rightId) {

				if (selectedLeftIndex === -1)
					rightItem.classList.add("matching-item--correct");

				addMatchingBadge(rightItem, getMatchingLabel(correctLeftIndex),
					"correct");
			}
			rightItem.disabled = true;
		});
	}

	function applyStepCorrection(form, question, selectedAnswers) {
		const card = Array.from(form.querySelectorAll(".question-card"))
			.find(function (element) {
				return element.dataset.questionId === String(question.id);
			});

		if (!card) return;

		const evaluation = ExamService.evaluateQuestion(question, selectedAnswers);
		const selected = evaluation.selected;
		const correct = evaluation.correct;
		const isCorrectAnswer = evaluation.isCorrect;
		const isTextQuestion = question.type === "text";
		const isMatchingQuestion = question.type === "matching";

		card.classList.remove("question-card--correct", "question-card--wrong",
			"question-card--blank");

		if (!evaluation.isAnswered) card.classList.add("question-card--blank");
		else if (isCorrectAnswer) card.classList.add("question-card--correct");
		else card.classList.add("question-card--wrong");

		if (isTextQuestion) {
			const textInput = card.querySelector('input[type="text"]');

			if (textInput) {
				textInput.disabled = true;
				textInput.classList.remove("text-answer--correct",
					"text-answer--wrong", "text-answer--blank");

				if (!selected.length) textInput.classList.add("text-answer--blank");
				else if (isCorrectAnswer)
					textInput.classList.add("text-answer--correct");
				else textInput.classList.add("text-answer--wrong");

				textInput.parentElement.insertAdjacentHTML("beforeend",
					QuestionContentView.buildTextAnswerResult(selected, correct,
						evaluation.isCorrect, evaluation.isAnswered));
			}
		} else if (isMatchingQuestion)
			applyMatchingCorrection(card, question, evaluation);
		else {
			const optionLabels = card.querySelectorAll(".option");

			optionLabels.forEach(function (label) {
				const input = label.querySelector("input");

				if (!input) return;

				const key = AppUtils.normaliseAnswerValue(input.value);
				const isSelected = selected.includes(key);
				const isCorrect = correct.includes(key);

				label.classList.remove("option--correct", "option--wrong");

				if (isCorrect) label.classList.add("option--correct");
				if (isSelected && !isCorrect) label.classList.add("option--wrong");

				input.disabled = true;
			});
		}
		card.insertAdjacentHTML("beforeend",
			QuestionContentView.buildExplanation(question));
	}

	return {
		renderExam,
		collectAnswers,
		renderSingleQuestion,
		collectSingleAnswer,
		applyStepCorrection
	};
})();
