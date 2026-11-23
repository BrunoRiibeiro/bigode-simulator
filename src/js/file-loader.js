window.FileLoader = (function () {

	/* text normalisation and helpers */
	function normaliseTextAnswers(rawAnswer) {
		const answers = Array.isArray(rawAnswer) ? rawAnswer : [rawAnswer];

		return answers.map(function (answer) {
			return String(answer || "").trim();
		}).filter(Boolean);
	}

	function stripOptionPrefix(optionText) {
		return String(optionText || "").replace(/^[A-Z]\.\s*/, "").trim();
	}

	function inferBooleanValue(label) {
		const normalised = stripOptionPrefix(label).toLowerCase();
		if (normalised === "true") return true;
		if (normalised === "false") return false;
		return null;
	}

	/* boolean normalisation */
	function normaliseBooleanOptions(rawOptions) {
		const source = Array.isArray(rawOptions) && rawOptions.length
			? rawOptions
			: [
				{ key: "A", label: "True", value: true },
				{ key: "B", label: "False", value: false }
			];

		const normalised = source
			.map(function (option, index) {
				if (option && typeof option === "object" && !Array.isArray(option)) {
					const key = String(option.key || String.fromCharCode(65 +
						index)).trim().toUpperCase();

					const label = String(option.label || "").trim();
					const value = typeof option.value === "boolean"
						? option.value
						: inferBooleanValue(label);

					if (!key || !label || typeof value !== "boolean")
						return null;

					return { key: key, label: label, value: value };
				}

				const optionText = String(option || "").trim();
				if (!optionText) return null;

				const key = AppUtils.extractOptionKey(optionText, index);
				const label = stripOptionPrefix(optionText);
				const value = inferBooleanValue(label);

				if (!label || typeof value !== "boolean") return null;

				return { key: key, label: label, value: value };
			}).filter(Boolean);

		const hasTrue = normalised.some(function (option) {
			return option.value === true;
		});

		const hasFalse = normalised.some(function (option) {
			return option.value === false;
		});

		const uniqueKeys = new Set(normalised.map(function (option) {
			return option.key;
		})
		);

		if (normalised.length !== 2 || !hasTrue || !hasFalse || uniqueKeys.size
			!== normalised.length) return null;

		return normalised;
	}

	function normaliseBooleanAnswer(rawAnswer, booleanOptions) {
		if (typeof rawAnswer === "boolean") return rawAnswer;

		const first = Array.isArray(rawAnswer) ? rawAnswer[0] : rawAnswer;

		if (typeof first === "boolean") return first;

		const normalised = String(first || "").trim().toLowerCase();

		if (normalised === "true") return true;
		if (normalised === "false") return false;

		const optionMatch = (booleanOptions || []).find(function (option) {
			return String(option.key).toLowerCase() === normalised;
		});

		return optionMatch ? optionMatch.value : null;
	}

	/* matching normalisation */
	function normaliseMatchingItems(rawItems) {
		if (!Array.isArray(rawItems) || rawItems.length < 2) return null;

		const items = rawItems.map(function (item) {
			if (!item || typeof item !== "object" || Array.isArray(item))
				return null;

			const id = String(item.id || "").trim();
			const text = String(item.text || "").trim();
			if (!id || !text) return null;
			return { id, text };
		});

		if (items.some(function (item) { return !item; })) return null;
		const ids = items.map(function (item) { return item.id; });
		if (new Set(ids).size !== ids.length) return null;
		return items;
	}

	function normaliseMatchingAnswer(rawAnswer, left, right) {
		if (!rawAnswer || typeof rawAnswer !== "object" ||
			Array.isArray(rawAnswer)) return null;

		const answerKeys = Object.keys(rawAnswer);
		const leftIds = left.map(function (item) { return item.id; });
		const rightIds = right.map(function (item) { return item.id; });

		if (answerKeys.length !== leftIds.length) return null;

		const usedRightIds = new Set();

		for (const leftId of leftIds) {
			const rightId = rawAnswer[leftId];

			if (!Object.prototype.hasOwnProperty.call(rawAnswer, leftId) ||
				typeof rightId !== "string" || !rightIds.includes(rightId) ||
				usedRightIds.has(rightId))
				return null;

			usedRightIds.add(rightId);
		}

		return Object.fromEntries(leftIds.map(function (leftId) {
			return [leftId, rawAnswer[leftId]];
		})
		);
	}

	function normaliseMatchingQuestion(rawQuestion) {
		const left = normaliseMatchingItems(rawQuestion.left);
		const right = normaliseMatchingItems(rawQuestion.right);
		if (!left || !right || left.length !== right.length) return null;

		const answer = normaliseMatchingAnswer(rawQuestion.answer, left, right);
		if (!answer) return null;

		return { left, right, answer };
	}

	/* questions validation and normalisation */
	function isValidQuestionType(type) {
		return ["single", "multiple", "boolean", "text", "matching"].includes(type);
	}

	function normaliseQuestion(rawQuestion, index) {
		if (!rawQuestion || typeof rawQuestion !== "object" ||
			Array.isArray(rawQuestion)) return null;

		const prompt = String(rawQuestion.prompt || "").trim();
		const type = String(rawQuestion.type || "").trim().toLowerCase();

		if (!prompt || !isValidQuestionType(type)) return null;

		let options = [];
		let answers = [];
		let optionValues = null;
		let matchingItems = null;

		if (type === "text") {
			answers = normaliseTextAnswers(rawQuestion.answer);
			if (!answers.length) return null;
		} else if (type === "boolean") {
			const booleanOptions = normaliseBooleanOptions(rawQuestion.options);
			const booleanAnswer = normaliseBooleanAnswer(rawQuestion.answer,
				booleanOptions || []);

			if (!booleanOptions || typeof booleanAnswer !== "boolean")
				return null;

			options = booleanOptions.map(function (option) {
				return option.key + ". " + option.label;
			});

			optionValues = {};

			booleanOptions.forEach(function (option) {
				optionValues[option.key] = option.value;
			});

			answers = booleanAnswer;
		} else if (type === "matching") {
			matchingItems = normaliseMatchingQuestion(rawQuestion);
			if (!matchingItems) return null;
			answers = matchingItems.answer;
		} else {
			options = Array.isArray(rawQuestion.options)
				? rawQuestion.options.map(function (option) {
					return String(option);
				}).filter(function (option) {
					return option.trim() !== "";
				})
				: [];

			answers = AppUtils.normaliseAnswerList(rawQuestion.answer);

			if (options.length < 2 || !answers.length) return null;

			const optionKeys = options.map(function (option, optionIndex) {
				return AppUtils.extractOptionKey(option, optionIndex);
			});

			const allAnswersExist = answers.every(function (answerKey) {
				return optionKeys.includes(answerKey);
			});

			if (!allAnswersExist) return null;
			if (type === "single" && answers.length !== 1) return null;
			if (type === "multiple" && answers.length < 2) return null;
		}

		const id = String(rawQuestion.id || "").trim() || "q" +
			String(index + 1).padStart(4, "0");
		const normalisedQuestion = {
			id: id,
			type: type,
			prompt: prompt,
			answer: answers,
			explanation: String(rawQuestion.explanation || "").trim(),
			tags: Array.isArray(rawQuestion.tags)
			? rawQuestion.tags.map(function (tag) {
				return String(tag);
			})
			: []
		};

		if (matchingItems) {
			normalisedQuestion.left = matchingItems.left;
			normalisedQuestion.right = matchingItems.right;
		} else normalisedQuestion.options = options;

		if (optionValues) normalisedQuestion.optionValues = optionValues;

		return normalisedQuestion;
	}

	/* question bank validation */
	function validateAndNormalise(data) {
		if (!data || !Array.isArray(data.questions))
			throw new Error('The JSON must contain the "questions" property as an array.');

		let discarded = 0;
		const usedIds = new Set();

		const questions = data.questions.map(function (question, index) {
			const normalisedQuestion = normaliseQuestion(question, index);
			if (!normalisedQuestion || usedIds.has(normalisedQuestion.id)) {
				discarded += 1;
				return null;
			}
			usedIds.add(normalisedQuestion.id);
			return normalisedQuestion;
		}).filter(Boolean);

		if (!questions.length)
			throw new Error("No valid questions were found in the file.");

		return {
			questions,
			discarded,
			totalOriginal: data.questions.length
		};
	}

	/* file loading */
	async function loadQuestionBankFromFile(file) {
		if (!file) throw new Error("Select a dump file.");

		const text = await file.text();
		let data;

		try {
			data = JSON.parse(text);
		} catch (error) {
			throw new Error("The selected file does not contain valid JSON.");
		}

		return validateAndNormalise(data);
	}

	return {
		loadQuestionBankFromFile,
		validateAndNormalise
	};
})();
