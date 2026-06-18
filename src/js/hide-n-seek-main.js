(function () {
	const refs = {
		jsonFile: document.getElementById("jsonFile"),
		jsonPreset: document.getElementById("jsonPreset"),
		bankInfo: document.getElementById("bankInfo"),
		statusMessage: document.getElementById("statusMessage"),
		answerKeySection: document.getElementById("answerKeySection"),
		answerKeySummary: document.getElementById("answerKeySummary"),
		answerKeyList: document.getElementById("answerKeyList")
	};

	function init() {
		bindEvents();
		updateBankInfo();
	}

	function on(ref, event, handler) {
		if (ref) { ref.addEventListener(event, handler); }
	}

	function bindEvents() {
		on(refs.jsonPreset, "change", onJsonPresetChange);
		on(refs.jsonFile, "change", onFileSelected);
	}

	function onJsonPresetChange() {
		const filePath = refs.jsonPreset.value;

		if (!filePath) {
			AppState.reset();
			clearAnswerKey();
			updateBankInfo();
			setStatus("", "info");
			return;
		}

		if (refs.jsonFile) { refs.jsonFile.value = ""; }

		loadPresetJson(filePath);
	}

	async function loadPresetJson(filePath) {
		setStatus("Loading question dump...", "info");

		try {
			const response = await fetch(filePath);

			if (!response.ok) { throw new Error("Could not load the selected file."); }

			const data = await response.json();
			const result = FileLoader.validateAndNormalize(data);
			const fileName = (filePath || "").split("/").pop() || filePath;

			AppState.setQuestionBank(result.questions, fileName);
			updateBankInfo();
			renderAnswerKey(result.questions);

			setStatus('Dump "' + fileName + '" loaded successfully.', "success");
		} catch (error) {
			console.error(error);
			AppState.reset();
			clearAnswerKey();
			updateBankInfo();
			setStatus('Could not load the file "' + filePath + '".', "error");
		}
	}

	async function onFileSelected(event) {
		const file = event.target.files[0];

		if (!file) { return; }
		if (refs.jsonPreset) { refs.jsonPreset.value = ""; }

		setStatus("Loading question dump...", "info");

		try {
			const result = await FileLoader.loadQuestionBankFromFile(file);

			AppState.setQuestionBank(result.questions, file.name);
			updateBankInfo();
			renderAnswerKey(result.questions);

			if (result.discarded > 0) {
				setStatus(
					'Dump "' + file.name + '" loaded with ' +
					result.questions.length +
					" valid questions. " +
					result.discarded +
					" were discarded due to invalid format.",
					"success"
				);
			} else {
				setStatus(
					'Dump "' + file.name + '" loaded successfully. Total valid questions: ' +
					result.questions.length +
					".",
					"success"
				);
			}
		} catch (error) {
			console.error(error);
			AppState.reset();
			clearAnswerKey();
			updateBankInfo();
			setStatus(error.message || "Error loading the file.", "error");
		}
	}

	function renderAnswerKey(questions) {
		clearAnswerKey();

		HideNSeekView.render(questions, {
			summary: refs.answerKeySummary,
			list: refs.answerKeyList
		});

		refs.answerKeySection.classList.remove("hidden");
		refs.answerKeySection.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function clearAnswerKey() {
		refs.answerKeySummary.innerHTML = "";
		refs.answerKeyList.innerHTML = "";
		refs.answerKeySection.classList.add("hidden");
	}

	function updateBankInfo() {
		const state = AppState.getState();

		if (!state.questionBank.length) {
			refs.bankInfo.textContent = "No question dump loaded.";
			return;
		}

		refs.bankInfo.innerHTML =
			"<strong>File:</strong> " +
			AppUtils.escapeHtml(state.loadedFileName) +
			" | <strong>Valid questions:</strong> " +
			state.questionBank.length;
	}

	function setStatus(message, type) {
		refs.statusMessage.textContent = message || "";
		refs.statusMessage.dataset.type = type || "info";
	}

	init();
})();
