window.ExamService = (function () {

	/* text normalisation and validation */
	function toTextAnswerList(value) {
		if (Array.isArray(value))
			return value.map(function (item) {
					return String(item ?? "").trim();
				}).filter(Boolean);

		const singleValue = String(value ?? "").trim();
		return singleValue ? [singleValue] : [];
	}

	function normaliseTextValue(value) {
		return String(value ?? "")
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.replace(/[^\p{L}\p{N}]+/gu, " ")
			.trim()
			.replace(/\s+/g, " ");
	}

	/* text validation */
	function isTextAnswerCorrect(selectedAnswers, correctAnswers) {
		if (!selectedAnswers.length || !correctAnswers.length) { return false; }

		return selectedAnswers.some(function (selectedAnswer) {
			const normalisedSelected = normaliseTextValue(selectedAnswer);
			return correctAnswers.some(function (correctAnswer) {
				return normaliseTextValue(correctAnswer) === normalisedSelected;
			});
		});
	}

	/* boolean value consulting and validation */
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

	/* matching validation */
	function isMatchingAnswerCorrect(selectedAnswers, correctAnswers, leftItems) {
		if (!selectedAnswers || !correctAnswers || !leftItems.length)
			return false;

		return leftItems.every(function (item) {
			return Object.prototype.hasOwnProperty.call(selectedAnswers, item.id) &&
				selectedAnswers[item.id] === correctAnswers[item.id];
		}) && Object.keys(selectedAnswers).length === leftItems.length;
	}

	/* centralised validation */
	function evaluateQuestion(question, selectedAnswers) {
		const isTextQuestion = question.type === "text";
		const isBooleanQuestion = question.type === "boolean";
		const isMatchingQuestion = question.type === "matching";

		const selected = isMatchingQuestion
			? (selectedAnswers && typeof selectedAnswers === "object" &&
				!Array.isArray(selectedAnswers)
				? selectedAnswers
				: {}
			)
			: isTextQuestion
			? toTextAnswerList(selectedAnswers)
			: AppUtils.normaliseAnswerList(selectedAnswers || []);

		const booleanCorrectKey = isBooleanQuestion
			? getBooleanCorrectKey(question)
			: "";

		const correct = isMatchingQuestion
			? question.answer || {}
			: isTextQuestion
			? toTextAnswerList(question.answer || [])
			: isBooleanQuestion
			? (booleanCorrectKey ? [booleanCorrectKey] : [])
			: AppUtils.normaliseAnswerList(question.answer || []);

		const isAnswered = isMatchingQuestion
			? Object.values(selected).some(function (value) {
				return value !== null && value !== undefined && value !== "";
			})
			: selected.length > 0;

		const isCorrect = isMatchingQuestion
			? isMatchingAnswerCorrect(selected, correct, question.left)
			: isTextQuestion
			? isTextAnswerCorrect(selected, correct)
			: isBooleanQuestion
			? isBooleanAnswerCorrect(question, selected)
			: AppUtils.sameAnswers(selected, correct);

		return {
			selected: selected,
			correct: correct,
			isAnswered: isAnswered,
			isCorrect: isCorrect
		};
	}

	/* exam generation and grading */
	function createRandomExam(questionBank, requestedCount) {
		if (!Array.isArray(questionBank) || !questionBank.length) {
			throw new Error("No question dump loaded.");
		}

		const parsedCount = Number(requestedCount);
		const requested = Number.isFinite(parsedCount) && parsedCount !== 0
			? Math.floor(parsedCount)
			: 60;
		const safeCount = Math.max(1, Math.min(requested, questionBank.length));

		return AppUtils.sample(questionBank, safeCount);
	}

	function gradeExam(examQuestions, userAnswers) {
		const items = examQuestions.map(function (question, index) {
			const userAnswer = userAnswers && userAnswers[question.id];
			const evaluation = evaluateQuestion(question, userAnswer);

			const item = {
				number: index + 1,
				id: question.id,
				prompt: question.prompt,
				type: question.type,
				options: Array.isArray(question.options)
				? question.options.slice()
				: [],
				selected: evaluation.selected,
				correct: evaluation.correct,
				explanation: question.explanation,
				tags: Array.isArray(question.tags) ? question.tags : [],
				isAnswered: evaluation.isAnswered,
				isCorrect: evaluation.isCorrect
			};

			if (question.type === "matching") {
				item.left = question.left;
				item.right = question.right;
			}

			return item;
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
		evaluateQuestion,
		gradeExam
	};
})();
