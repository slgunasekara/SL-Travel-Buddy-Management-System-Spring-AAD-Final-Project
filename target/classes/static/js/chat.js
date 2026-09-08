const Chat = (() => {
    let widgetEl = null;
    let messages = [{
        role: "assistant",
        text: "Ask me anything about the fleet, trips, income, or alerts — I'll answer using today's live data. Try one of these, or type your own question:"
    }];
    let askedQuestions = new Set();


    const SUGGESTED_QUESTIONS = [
        "What was last month's profit?",
        "How much income have we made this month?",
        "What are the top routes this month?",
        "Which drivers are top performers this month?",
        "Any urgent alerts?",
        "Which bus needs maintenance?",
        "How many trips did we run this week?",
        "What can I ask you?"
    ];

    function visible() {
        const u = Session.currentUser();
        return !!u && (u.role === "Owner" || u.role === "Manager");
    }

    function ensureWidget() {
        if (widgetEl) return widgetEl;
        widgetEl = document.createElement("div");
        widgetEl.className = "chat-widget";
        widgetEl.innerHTML = `
      <button class="chat-widget__trigger" id="chatTrigger" title="Ask the Business Assistant" type="button">
        <img src="assets/chatbot-icon.png" alt="Chat with the Business Assistant" class="chat-widget__trigger-icon" />
      </button>
      <div class="chat-widget__panel" id="chatPanel" style="display:none;">
        <div class="chat-widget__head">
          <strong>Business Assistant</strong>
          <button class="chat-widget__close" id="chatClose" type="button">✕</button>
        </div>
        <div class="chat-widget__body" id="chatBody"></div>
        <form class="chat-widget__input" id="chatForm">
          <input type="text" id="chatInput" placeholder="e.g. How's this month looking?" autocomplete="off" />
          <button type="submit" class="btn btn--primary">Send</button>
        </form>
      </div>`;
        document.body.appendChild(widgetEl);

        qs("#chatTrigger", widgetEl).addEventListener("click", () => togglePanel());
        qs("#chatClose", widgetEl).addEventListener("click", () => togglePanel(false));
        qs("#chatForm", widgetEl).addEventListener("submit", onSubmit);

        renderMessages(true);
        return widgetEl;
    }

    function togglePanel(force) {
        const panel = qs("#chatPanel", widgetEl);
        const show = force !== undefined ? force : panel.style.display === "none";
        panel.style.display = show ? "flex" : "none";
        if (show) qs("#chatInput", widgetEl).focus();
    }

    function suggestionsHtml(count) {

        let pool = SUGGESTED_QUESTIONS.filter(q => !askedQuestions.has(q));
        if (pool.length === 0) {
            askedQuestions.clear();
            pool = SUGGESTED_QUESTIONS.slice();
        }
        const picked = pool.slice(0, count);
        return `
      <div class="chat-widget__suggestions">
        ${picked.map((q, i) => `<button type="button" class="chat-chip" style="animation-delay:${(i * 0.08).toFixed(2)}s">${Fmt.escapeHtml(q)}</button>`).join("")}
      </div>`;
    }

    function renderMessages(showSuggestions) {
        const body = qs("#chatBody", widgetEl);
        const messagesHtml = messages.map(m => `<div class="chat-msg chat-msg--${m.role}">${Fmt.escapeHtml(m.text)}</div>`).join("");


        const suggestionCount = messages.length === 1 ? SUGGESTED_QUESTIONS.length : 3;

        body.innerHTML = messagesHtml + (showSuggestions ? suggestionsHtml(suggestionCount) : "");
        body.scrollTop = body.scrollHeight;

        qsa(".chat-chip", body).forEach(chip => {
            chip.addEventListener("click", () => askQuestion(chip.textContent));
        });
    }

    async function askQuestion(question) {
        question = question.trim();
        if (!question) return;
        askedQuestions.add(question);

        messages.push({role: "user", text: question});
        renderMessages(false);

        const body = qs("#chatBody", widgetEl);
        body.insertAdjacentHTML("beforeend", `<div class="chat-msg chat-msg--assistant chat-msg--pending" id="chatPending">Thinking...</div>`);
        body.scrollTop = body.scrollHeight;

        const input = qs("#chatInput", widgetEl);
        input.disabled = true;
        try {
            const res = await apiRequest("POST", "/v1/chat/ask", {message: question});
            messages.push({role: "assistant", text: res.body.reply});
        } catch (err) {
            messages.push({role: "assistant", text: "Sorry — " + (err.message || "something went wrong.")});
        } finally {
            input.disabled = false;
            renderMessages(true);
            input.focus();
        }
    }

    async function onSubmit(e) {
        e.preventDefault();
        const input = qs("#chatInput", widgetEl);
        const question = input.value.trim();
        if (!question) return;
        input.value = "";
        await askQuestion(question);
    }

    function init() {
        if (!visible()) return;
        ensureWidget();
    }

    return {init};
})();
