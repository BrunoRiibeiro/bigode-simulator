window.QuestionBankLoader = (function () {
	async function loadPreset(filePath) {
		const response = await fetch(filePath);

		if (!response.ok) {
			throw new Error("Could not load the selected file.");
		}

		const data = await response.json();
		const result = FileLoader.validateAndNormalize(data);

		return Object.assign({}, result, {
			fileName: getFileName(filePath)
		});
	}

	async function loadFile(file) {
		const result = await FileLoader.loadQuestionBankFromFile(file);
		return Object.assign({}, result, { fileName: file.name });
	}

	function getFileName(filePath) {
		return String(filePath).split("/").pop() || filePath;
	}

	return {
		loadPreset,
		loadFile
	};
})();
