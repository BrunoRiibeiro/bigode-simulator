window.ExamService = (function () {
	function toTextAnswerList(value) {
		if (Array.isArray(value)) {
			return value
				.map(function (item) {
					return String(item || "").trim();
				})
				.filter(function (item) {
					return item !== "";
				});
		}

		const singleValue = String(value || "").trim();
		return singleValue ? [singleValue] : [];
	}

	function normalizeTextValue(value) {
		return String(value || "")
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.replace(/[^\p{L}\p{N}]+/gu, " ")
			.trim()
			.replace(/\s+/g, " ");
	}

	function isTextAnswerCorrect(selectedAnswers, correctAnswers) {
		if (!selectedAnswers.length || !correctAnswers.length) { return false; }

		return selectedAnswers.some(function (selectedAnswer) {
			const normalizedSelected = normalizeTextValue(selectedAnswer);
			return correctAnswers.some(function (correctAnswer) {
				return normalizeTextValue(correctAnswer) === normalizedSelected;
			});
		});
	}

	function toTextAnswerList(value) {
		if (Array.isArray(value)) {
			return value.map(function (item) {
					return String(item || "").trim();
				}).filter(function (item) {
					return item !== "";
				});
		}

		const singleValue = String(value || "").trim();
		return singleValue ? [singleValue] : [];
	}

	function normalizeTextValue(value) {
		return String(value || "")
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.replace(/[^\p{L}\p{N}]+/gu, " ")
			.trim()
			.replace(/\s+/g, " ");
	}

	function isTextAnswerCorrect(selectedAnswers, correctAnswers) {
		if (!selectedAnswers.length || !correctAnswers.length) {
			return false;
		}

		return selectedAnswers.some(function (selectedAnswer) {
			const normalizedSelected = normalizeTextValue(selectedAnswer);

			return correctAnswers.some(function (correctAnswer) {
				return normalizeTextValue(correctAnswer) === normalizedSelected;
			});
		});
	}

	function getBooleanOptionValue(question, key) {
		if (!question || !question.optionValues) { return null; }

		return Object.prototype.hasOwnProperty.call(question.optionValues, key)
			? question.optionValues[key]
			: null;
	}

	function getBooleanCorrectKey(question) {
		if (!question || !question.optionValues) { return ""; }

		return Object.keys(question.optionValues).find(function (key) {
			return question.optionValues[key] === question.answer;
		}) || "";
	}

	function isBooleanAnswerCorrect(question, selectedAnswers) {
		if (!selectedAnswers.length) { return false; }

		const selectedValue = getBooleanOptionValue(question, selectedAnswers[0]);
		return typeof selectedValue === "boolean" && selectedValue === question.answer;
	}

	function createRandomExam(questionBank, requestedCount) {
		if (!Array.isArray(questionBank) || !questionBank.length) {
			throw new Error("No question dump loaded.");
		}

		const parsedCount = Number(requestedCount) || 60;
		const safeCount = Math.max(1, Math.min(parsedCount, questionBank.length));

		return AppUtils.sample(questionBank, safeCount);
	}

	function gradeExam(examQuestions, userAnswers) {
		const items = examQuestions.map(function (question, index) {
			const isTextQuestion = question.type === "text";
			const isBooleanQuestion = question.type === "boolean";
			const selected = isTextQuestion
				? toTextAnswerList((userAnswers && userAnswers[question.id]) || [])
				: AppUtils.normalizeAnswerList((userAnswers && userAnswers[question.id]) || []);
			const correct = isTextQuestion
				? toTextAnswerList(question.answer || [])
				: isBooleanQuestion
				? (getBooleanCorrectKey(question) ? [getBooleanCorrectKey(question)] : [])
				: AppUtils.normalizeAnswerList(question.answer || []);
			const isAnswered = selected.length > 0;
			const isCorrect = isTextQuestion
				? isTextAnswerCorrect(selected, correct)
				: isBooleanQuestion
				? isBooleanAnswerCorrect(question, selected)
				: AppUtils.sameAnswers(selected, correct);

			return {
				number: index + 1,
				id: question.id,
				prompt: question.prompt,
				type: question.type,
				options: question.options.slice(),
				selected: selected,
				correct: correct,
				explanation: question.explanation,
				isAnswered: isAnswered,
				isCorrect: isCorrect
			};
		});

		const correctCount = items.filter(function (item) {
			return item.isCorrect;
		}).length;

		const blankCount = items.filter(function (item) {
			return !item.isAnswered;
		}).length;

		const wrongCount = items.length - correctCount - blankCount;
		const scorePercent = items.length ? (correctCount / items.length) * 100 : 0;

		return {
			totalQuestions: items.length,
			answeredQuestions: items.length - blankCount,
			correctCount: correctCount,
			wrongCount: wrongCount,
			blankCount: blankCount,
			scorePercent: scorePercent,
			items: items
		};
	}

	return {
		createRandomExam,
		gradeExam
	};
})();
