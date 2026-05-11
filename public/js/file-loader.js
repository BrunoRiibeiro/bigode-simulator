window.FileLoader = (function () {
	async function loadQuestionBankFromFile(file) {
		if (!file) {
			throw new Error("Select a dump file.");
		}

		const text = await file.text();

		let data;

		try {
			data = JSON.parse(text);
		} catch (error) {
			throw new Error("The selected file does not contain valid JSON.");
		}

		return validateAndNormalize(data);
	}

	function validateAndNormalize(data) {
		if (!data || !Array.isArray(data.questions)) {
			throw new Error('The JSON must contain the "questions" property as an array.');
		}

		let discarded = 0;

		const questions = data.questions
			.map(function (question, index) {
				return normalizeQuestion(question, index);
			})
			.filter(function (question) {
				if (!question) {
					discarded += 1;
					return false;
				}
				return true;
			});

		if (!questions.length) {
			throw new Error("No valid questions were found in the file.");
		}

		return {
			questions,
			discarded,
			totalOriginal: data.questions.length
		};
	}

	function normalizeQuestion(rawQuestion, index) {
		if (!rawQuestion || typeof rawQuestion !== "object") {
			return null;
		}

		const prompt = String(rawQuestion.prompt || "").trim();
		const options = Array.isArray(rawQuestion.options)
			? rawQuestion.options
			.map(function (option) {
				return String(option);
			})
			.filter(function (option) {
				return option.trim() !== "";
			})
			: [];

		const answers = AppUtils.normalizeAnswerList(rawQuestion.answer);
		const rawType = String(rawQuestion.type || "").trim().toLowerCase();
		const isTextQuestion = rawType === "text";

		if (!prompt || answers.length < 1) {
			return null;
		}

		if (!isTextQuestion) {
			if (options.length < 2) {
				return null;
			}

			const optionKeys = options.map(function (option, indexOption) {
				return AppUtils.extractOptionKey(option, indexOption);
			});

			const allAnswersExist = answers.every(function (answerKey) {
				return optionKeys.includes(answerKey);
			});

			if (!allAnswersExist) {
				return null;
			}
		}

		const type =
			isTextQuestion
			? "text"
			: rawType === "multiple" ||
			rawType === "multi" ||
			answers.length > 1
			? "multiple"
			: "single";

		return {
			id: String(rawQuestion.id || "q" + String(index + 1).padStart(4, "0")),
			type: type,
			prompt: prompt,
			options: options,
			answer: answers,
			explanation: String(rawQuestion.explanation || "").trim(),
			tags: Array.isArray(rawQuestion.tags)
			? rawQuestion.tags.map(function (tag) {
				return String(tag);
			})
			: []
		};
	}

	return {
		loadQuestionBankFromFile,
		validateAndNormalize
	};
})();
