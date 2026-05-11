window.GitHubIssuesFeature = (function () {
	const REPO = "BrunoRiibeiro/bigode-simulator";

	function stripExtension(filename) {
		return String(filename || "").replace(/^.*\//, "").replace(/\.[^.]+$/, "");
	}

	function getLoadedFileName() {
		if (!window.AppState || typeof window.AppState.getState !== "function") {
			return "";
		}

		const state = window.AppState.getState();
		return state && state.loadedFileName ? String(state.loadedFileName) : "";
	}

	function getBankId() {
		return stripExtension(getLoadedFileName()) || "unknown-bank";
	}

	function getQuestionId(question) {
		return question && question.id ? String(question.id).trim() : "unknown-question";
	}

	function getQuestionRef(question) { return getBankId() + "/" + getQuestionId(question); }

	function buildIssueSearchQuery(question) {
		return 'repo:' + REPO + ' is:issue "Question-Ref: ' + getQuestionRef(question) + '"';
	}

	function buildIssueSearchUrl(question) {
		return "https://github.com/" + REPO + "/issues?q=" + encodeURIComponent(buildIssueSearchQuery(question));
	}

	function formatAnswer(question) {
		if (!question) return "";
		if (Array.isArray(question.answer)) { return question.answer.join(", "); }
		if (typeof question.answer === "string") { return question.answer; }
		return "";
	}

	function buildIssueTitle(question) { return "[Question] " + getQuestionRef(question); }

	function buildIssueBody(question) {
		const lines = [
			"Question-Ref: " + getQuestionRef(question),
			"",
			"Bank: " + getBankId(),
			"Question ID: " + getQuestionId(question),
			"Type: " + (question && question.type ? question.type : ""),
			"",
			"Prompt:",
			question && question.prompt ? question.prompt : "",
			"",
			"Current answer:",
			formatAnswer(question),
			"",
			"Suggested correction:",
			"",
			"Reason / reference:",
			""
		];

		return lines.join("\n");
	}

	function buildNewIssueUrl(question) {
		const title = buildIssueTitle(question);
		const body = buildIssueBody(question);
		const labels = ["question-feedback"];

		return "https://github.com/" + REPO + "/issues/new"
			+ "?title=" + encodeURIComponent(title)
			+ "&body=" + encodeURIComponent(body)
			+ "&labels=" + encodeURIComponent(labels.join(","));
	}

	return {
		getLoadedFileName,
		getBankId,
		getQuestionId,
		getQuestionRef,
		buildIssueSearchQuery,
		buildIssueSearchUrl,
		buildIssueTitle,
		buildIssueBody,
		buildNewIssueUrl
	};
})();
