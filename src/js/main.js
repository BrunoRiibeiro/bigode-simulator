(function () { const refs = {
	jsonFile: document.getElementById("jsonFile"),
	jsonPreset: document.getElementById("jsonPreset"),
	questionCountInput: document.getElementById("questionCount"),
	examMode: document.getElementById("examMode"),
	generateExamBtn: document.getElementById("generateExamBtn"),
	submitExamBtn: document.getElementById("submitExamBtn"),
	nextQuestionBtn: document.getElementById("nextQuestionBtn"),
	resetAppBtn: document.getElementById("resetAppBtn"),
	bankInfo: document.getElementById("bankInfo"),
	statusMessage: document.getElementById("statusMessage"),

	examSection: document.getElementById("examSection"),
	examMeta: document.getElementById("examMeta"),
	examForm: document.getElementById("examForm"),
	questionsContainer: document.getElementById("questionsContainer"),
	newExamBtn: document.getElementById("newExamBtn"),

	resultSection: document.getElementById("resultSection"),
	resultSummary: document.getElementById("resultSummary"),
	resultList: document.getElementById("resultList")
};

function init() {
	bindEvents();
	if (refs.examMode) { AppState.setExamMode(refs.examMode.value); }
	updateBankInfo();
}

function ison(ref, event, handler) { if (ref) ref.addEventListener(event, handler); }

function syncExamModeToggle(mode) {
	const buttons = document.querySelectorAll(".exam-mode-toggle__btn");
	const normalizedMode = mode === "step" ? "step" : "full";
	buttons.forEach(function (button) {
		button.classList.toggle("is-active", button.dataset.mode === normalizedMode);
		button.setAttribute("aria-pressed", button.dataset.mode === normalizedMode ? "true" : "false");
	});
}

function bindExamModeToggle() {
	if (!refs.examMode) { return; }
	const buttons = document.querySelectorAll(".exam-mode-toggle__btn");
	if (!buttons.length) { return; }
	buttons.forEach(function (button) {
		button.addEventListener("click", function () {
			const mode = button.dataset.mode === "step" ? "step" : "full";
			refs.examMode.value = mode;
			syncExamModeToggle(mode);
			refs.examMode.dispatchEvent(new Event("change", { bubbles: true }));
		});
	});

	syncExamModeToggle(refs.examMode.value);
}

function bindEvents() {
	ison(refs.jsonPreset, "change", onJsonPresetChange);
	ison(refs.jsonFile, "change", onFileSelected);
	ison(refs.generateExamBtn, "click", generateExam);
	ison(refs.examForm, "submit", onSubmitExam);
	ison(refs.newExamBtn, "click", generateExam);
	ison(refs.questionCountInput, "change", adjustQuestionCountInput);
	ison(refs.examMode, "change", onExamModeChange);
	ison(refs.nextQuestionBtn, "click", goToNextQuestion);
	ison(refs.resetAppBtn, "click", resetApp);
	bindExamModeToggle();
}

function onJsonPresetChange() {
	const filePath = refs.jsonPreset.value;
	if (!filePath) { return; }
	loadPresetJson(filePath);
}

async function loadPresetJson(filePath) {
	refs.generateExamBtn.disabled = true;
	setStatus("Loading question dump...", "info");

	try {
		const response = await fetch(filePath);

		if (!response.ok) {
			throw new Error("Could not load the selected file.");
		}

		const data = await response.json();
		const result = FileLoader.validateAndNormalize(data);

		AppState.setQuestionBank(result.questions, filePath);
		adjustQuestionCountInput();
		updateBankInfo();
		clearExamAndResults();

		refs.generateExamBtn.disabled = result.questions.length === 0;
		setStatus('Dump "' + (filePath ||"").split('/').pop() + '" loaded successfully.', "success");

	} catch (error) {
		console.error(error);
		AppState.reset();
		clearExamAndResults();
		updateBankInfo();
		refs.generateExamBtn.disabled = true;
		setStatus('Could not load the file "' + filePath + '".', "error");
	}
}

async function tryLoadDefaultJson() {
	try {
		const fileName = "hcia-cloud-service-3.5.json";
		const response = await fetch("./dumps/" + fileName);

		if (!response.ok) {
			throw new Error("Could not load the default file.");
		}

		const data = await response.json();
		const result = FileLoader.validateAndNormalize(data);

		AppState.setQuestionBank(result.questions, fileName);
		adjustQuestionCountInput();
		updateBankInfo();
		clearExamAndResults();

		refs.generateExamBtn.disabled = result.questions.length === 0;
		setStatus('Default file "' + fileName + '" loaded successfully.', "success");

	} catch (error) {
		setStatus("Could not automatically load the default JSON. Please use the file selector", "info");
	}
}

async function onFileSelected(event) {
	const file = event.target.files[0];

	if (!file) {
		return;
	}

	refs.generateExamBtn.disabled = true;
	setStatus("Loading question dump...", "info");

	try {
		const result = await FileLoader.loadQuestionBankFromFile(file);

		AppState.setQuestionBank(result.questions, file.name);
		adjustQuestionCountInput();
		updateBankInfo();

		refs.generateExamBtn.disabled = result.questions.length === 0;
		clearExamAndResults();

		if (result.discarded > 0) {
			setStatus(
				"Dump loaded with " +
				result.questions.length +
				" valid questions. " +
				result.discarded +
				" were discarded due to invalid format.",
				"success"
			);
		} else {
			setStatus(
				"Dump successfully loaded. Total valid questions: " +
				result.questions.length +
				".",
				"success"
			);
		}
	} catch (error) {
		AppState.reset();
		refs.generateExamBtn.disabled = true;
		clearExamAndResults();
		updateBankInfo();
		setStatus(error.message || "Erro loading the file.", "error");
	}
}

function adjustQuestionCountInput() {
	const state = AppState.getState();
	const available = state.questionBank.length;

	let desired = Number(refs.questionCountInput.value) || 60;

	if (desired < 1) {
		desired = 1;
	}

	if (available > 0 && desired > available) {
		desired = available;
	}

	refs.questionCountInput.max = available || 60;
	refs.questionCountInput.value = desired;
	AppState.setQuestionCount(desired);
}

function generateExam() {
	const state = AppState.getState();

	if (!state.questionBank.length) {
		setStatus("Load a question bank JSON first.", "error");
		return;
	}

	adjustQuestionCountInput();

	const requested = Number(refs.questionCountInput.value) || 60;
	const available = state.questionBank.length;
	const exam = ExamService.createRandomExam(state.questionBank, requested);

	AppState.setCurrentExam(exam);
	AppState.setUserAnswers({});
	AppState.setCurrentQuestionIndex(0);
	refs.nextQuestionBtn.classList.add("hidden");
	refs.submitExamBtn.classList.remove("hidden");

	refs.questionsContainer.innerHTML = "";
	refs.resultSummary.innerHTML = "";
	refs.resultList.innerHTML = "";
	refs.resultSection.classList.add("hidden");

	refs.examForm.reset();
	refs.examSection.classList.remove("hidden");

	if (AppState.getState().settings.examMode === "step") {
		refs.submitExamBtn.textContent = "Submit";
		renderCurrentStepQuestion();
	} else {
		refs.submitExamBtn.textContent = "Finish exam";
		ExamView.renderExam(exam, {
			container: refs.questionsContainer,
			meta: refs.examMeta
		});
	}

	if (requested > available) {
		setStatus(
			"The dump contains only " +
			available +
			" valid questions. The mock exam was generated with " +
			exam.length +
			" questions.",
			"info"
		);
	} else {
		setStatus(
			"Mock exam generated with " + exam.length + " random questions.",
			"success"
		);
	}

	refs.examSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function onSubmitExam(event) {
	event.preventDefault();

	if (AppState.getState().settings.examMode === "step") {
		submitCurrentStepQuestion();
		return;
	}

	const state = AppState.getState();

	if (!state.currentExam.length) {
		setStatus("No mock exam has been generated yet.", "error");
		return;
	}

	const userAnswers = ExamView.collectAnswers(refs.examForm, state.currentExam);
	AppState.setUserAnswers(userAnswers);

	const result = ExamService.gradeExam(state.currentExam, userAnswers);
	AppState.setResult(result);

	ResultView.renderResults(result, {
		summary: refs.resultSummary,
		list: refs.resultList
	});

	refs.resultSection.classList.remove("hidden");

	setStatus(
		"Result calculated. Score: " +
		AppUtils.formatPercent(result.scorePercent) +
		".",
		"success"
	);

	refs.resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearExamAndResults() {
	refs.examMeta.innerHTML = "";
	refs.questionsContainer.innerHTML = "";
	refs.resultSummary.innerHTML = "";
	refs.resultList.innerHTML = "";
	refs.examSection.classList.add("hidden");
	refs.resultSection.classList.add("hidden");
	refs.nextQuestionBtn.classList.add("hidden");
	refs.submitExamBtn.classList.remove("hidden");
	refs.submitExamBtn.textContent = "Finish exam";
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

function onExamModeChange() {
	const mode = refs.examMode.value === "step" ? "step" : "full";
	AppState.setExamMode(mode);
	syncExamModeToggle(mode);
}

function renderCurrentStepQuestion() {
	const state = AppState.getState();
	const index = state.currentQuestionIndex;
	const question = state.currentExam[index];

	if (!question) { finishStepMode(); return; }

	refs.examForm.reset();

	refs.submitExamBtn.textContent = "Submit";
	refs.submitExamBtn.classList.remove("hidden");
	refs.nextQuestionBtn.classList.add("hidden");

	ExamView.renderSingleQuestion(
		question,
		index + 1,
		state.currentExam.length,
		{ container: refs.questionsContainer, meta: refs.examMeta }
	);
}

function submitCurrentStepQuestion() {
	const state = AppState.getState();
	const index = state.currentQuestionIndex;
	const question = state.currentExam[index];

	if (!question) { return; }

	const selectedAnswer = ExamView.collectSingleAnswer(refs.examForm, question, index);
	const updatedAnswers = Object.assign({}, state.userAnswers, {[question.id]: selectedAnswer});

	AppState.setUserAnswers(updatedAnswers);
	ExamView.applyStepCorrection(refs.examForm, question, selectedAnswer);

	refs.submitExamBtn.classList.add("hidden");
	refs.nextQuestionBtn.classList.remove("hidden");

	refs.nextQuestionBtn.textContent =
		index === state.currentExam.length - 1
		? "Show final result"
		: "Next question";
}

function goToNextQuestion() {
	const state = AppState.getState();
	const nextIndex = state.currentQuestionIndex + 1;

	if (nextIndex >= state.currentExam.length) {
		finishStepMode();
		return;
	}

	AppState.setCurrentQuestionIndex(nextIndex);
	renderCurrentStepQuestion();
}

function finishStepMode() {
	const state = AppState.getState();
	const result = ExamService.gradeExam(state.currentExam, state.userAnswers);

	AppState.setResult(result);

	ResultView.renderResults(result, {
		summary: refs.resultSummary,
		list: refs.resultList
	});

	refs.resultSection.classList.remove("hidden");
	refs.nextQuestionBtn.classList.add("hidden");
	refs.submitExamBtn.classList.add("hidden");

	setStatus(
		"Mock exam completed. Score: " +
		AppUtils.formatPercent(result.scorePercent) +
		".",
		"success"
	);

	refs.resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetApp() {
	AppState.reset();
	refs.jsonFile.value = "";
	refs.questionCountInput.value = 60;
	if (refs.examMode) {
		refs.examMode.value = "full";
		syncExamModeToggle("full");
	}
	refs.generateExamBtn.disabled = true;
	refs.statusMessage.textContent = "";
	refs.statusMessage.dataset.type = "";
	updateBankInfo();
	clearExamAndResults();
	tryLoadDefaultJson();
}

init();
})();
