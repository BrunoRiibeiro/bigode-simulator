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

	function normalizeTextAnswers(rawAnswer) {
		if (Array.isArray(rawAnswer)) {
			return rawAnswer.map(function (answer) {
					return String(answer || "").trim();
				}).filter(function (answer) {
					return answer !== "";
				});
		}

		const singleAnswer = String(rawAnswer || "").trim();
		return singleAnswer ? [singleAnswer] : [];
	}

	function stripOptionPrefix(optionText) {
		return String(optionText || "").replace(/^[A-Z]\.\s*/, "").trim();
	}

	function inferBooleanValue(label) {
		const normalized = stripOptionPrefix(label).toLowerCase();

		if (normalized === "true") { return true; }
		if (normalized === "false") { return false; }
		return null;
	}

	function normalizeBooleanOptions(rawOptions) {
		const source = Array.isArray(rawOptions) && rawOptions.length
			? rawOptions
			: [
				{ key: "A", label: "True", value: true },
				{ key: "B", label: "False", value: false }
			];

		const normalized = source
			.map(function (option, index) {
				if (option && typeof option === "object" && !Array.isArray(option)) {
					const key = String(option.key || String.fromCharCode(65 + index))
						.trim()
						.toUpperCase();

					const label = String(option.label || "").trim();
					const value = typeof option.value === "boolean"
						? option.value
						: inferBooleanValue(label);

					if (!label || typeof value !== "boolean") { return null; }

					return {
						key: key,
						label: label,
						value: value
					};
				}

				const optionText = String(option || "").trim();
				if (!optionText) { return null; }

				const key = AppUtils.extractOptionKey(optionText, index);
				const label = stripOptionPrefix(optionText);
				const value = inferBooleanValue(label);

				if (!label || typeof value !== "boolean") { return null; }

				return {
					key: key,
					label: label,
					value: value
				};
			})
			.filter(Boolean);

		const hasTrue = normalized.some(function (option) {
			return option.value === true;
		});

		const hasFalse = normalized.some(function (option) {
			return option.value === false;
		});

		const uniqueKeys = new Set(
			normalized.map(function (option) {
				return option.key;
			})
		);

		if (normalized.length < 2 || !hasTrue || !hasFalse || uniqueKeys.size !== normalized.length) {
			return null;
		}

		return normalized;
	}

	function normalizeBooleanAnswer(rawAnswer, booleanOptions) {
		if (typeof rawAnswer === "boolean") { return rawAnswer; }

		const first = Array.isArray(rawAnswer) ? rawAnswer[0] : rawAnswer;

		if (typeof first === "boolean") { return first; }

		const normalized = String(first || "").trim().toLowerCase();

		if (normalized === "true") { return true; }

		if (normalized === "false") { return false; }

		const optionMatch = (booleanOptions || []).find(function (option) {
			return String(option.key).toLowerCase() === normalized;
		});

		return optionMatch ? optionMatch.value : null;
	}

	function normalizeQuestion(rawQuestion, index) {
		if (!rawQuestion || typeof rawQuestion !== "object") {
			return null;
		}

		const prompt = String(rawQuestion.prompt || "").trim();
		const rawType = String(rawQuestion.type || "").trim().toLowerCase();
		const isTextQuestion = rawType === "text";
		const isBooleanQuestion =
			rawType === "boolean" ||
			rawType === "bool" ||
			rawType === "tf" ||
			rawType === "truefalse" ||
			rawType === "true-false";

		let options = [];
		let answers = [];
		let optionValues = null;

		if (isTextQuestion) {
			answers = normalizeTextAnswers(rawQuestion.answer);
		} else if (isBooleanQuestion) {
			const booleanOptions = normalizeBooleanOptions(rawQuestion.options);
			const booleanAnswer = normalizeBooleanAnswer(rawQuestion.answer, booleanOptions || []);

			if (!booleanOptions || typeof booleanAnswer !== "boolean") { return null; }

			options = booleanOptions.map(function (option) {
				return option.key + ". " + option.label;
			});

			optionValues = {};
			booleanOptions.forEach(function (option) {
				optionValues[option.key] = option.value;
			});

			answers = booleanAnswer;
		} else {
			options = Array.isArray(rawQuestion.options)
				? rawQuestion.options
				.map(function (option) {
					return String(option);
				})
				.filter(function (option) {
					return option.trim() !== "";
				})
				: [];

			answers = AppUtils.normalizeAnswerList(rawQuestion.answer);
		}

		if (!prompt) { return null; }
		if (isTextQuestion && answers.length < 1) { return null; }
		if (!isTextQuestion && !isBooleanQuestion) {
			if (options.length < 2 || answers.length < 1) { return null; }

			const optionKeys = options.map(function (option, indexOption) {
				return AppUtils.extractOptionKey(option, indexOption);
			});

			const allAnswersExist = answers.every(function (answerKey) {
				return optionKeys.includes(answerKey);
			});

			if (!allAnswersExist) { return null; }
		}

		const type =
			isTextQuestion
			? "text"
			: isBooleanQuestion
			? "boolean"
			: rawType === "multiple" ||
			rawType === "multi" ||
			answers.length > 1
			? "multiple"
			: "single";

		const normalizedQuestion = {
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

		if (isBooleanQuestion) { normalizedQuestion.optionValues = optionValues; }

		return normalizedQuestion;
	}

	return {
		loadQuestionBankFromFile,
		validateAndNormalize
	};
})();
