window.AppState = (function () {
	const state = {
		questionBank: [],
		loadedFileName: "",
		currentExam: [],
		userAnswers: {},
		result: null,
		currentQuestionIndex: 0,
		settings: { questionCount: 60, examMode: "full" }
	};

	function getState() {
		return state;
	}

	function setQuestionBank(questions, fileName) {
		state.questionBank = Array.isArray(questions) ? questions.slice() : [];
		state.loadedFileName = fileName || "";
		state.currentExam = [];
		state.userAnswers = {};
		state.currentQuestionIndex = 0;
		state.result = null;
	}

	function setCurrentExam(exam) {
		state.currentExam = Array.isArray(exam) ? exam.slice() : [];
		state.userAnswers = {};
		state.currentQuestionIndex = 0;
		state.result = null;
	}

	function setUserAnswers(userAnswers) {
		state.userAnswers = userAnswers || {};
	}

	function setResult(result) {
		state.result = result || null;
	}

	function setQuestionCount(count) {
		const numericCount = Number(count) || 60;
		state.settings.questionCount = numericCount;
	}

	function reset() {
		state.questionBank = [];
		state.loadedFileName = "";
		state.currentExam = [];
		state.userAnswers = {};
		state.result = null;
		state.settings.questionCount = 60;
		state.currentQuestionIndex = 0;
		state.settings.examMode = "full";
	}

	function setExamMode(mode) {
		state.settings.examMode = mode === "step" ? "step" : "full";
	}

	function setCurrentQuestionIndex(index) {
		state.currentQuestionIndex = Math.max(0, Number(index) || 0);
	}

	return {
		getState,
		setQuestionBank,
		setCurrentExam,
		setUserAnswers,
		setResult,
		setQuestionCount,
		setExamMode,
		setCurrentQuestionIndex,
		reset
	};
})();
