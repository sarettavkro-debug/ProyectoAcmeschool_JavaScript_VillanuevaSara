class ExamTimer extends HTMLElement {
static get observedAttributes() {
    return ["seconds"];
}

constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
        <style>
        .timer-box {
            background: #ffffff;
            color: #1f2430;
            border: 1px solid #d6d9e0;
            border-radius: 10px;
            padding: 0.55rem 1rem;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 0.95rem;
            font-weight: 700;
            white-space: nowrap;
        }
        .timer-box.is-warning {
            border-color: #c81e1e;
            color: #c81e1e;
        }
        </style>
        <div class="timer-box" part="box">
        Tiempo restante: <strong id="clock">00:00</strong>
        </div>
    `;
}

connectedCallback() {
    this.renderTime();
}

attributeChangedCallback(name) {
    if (name === "seconds") {
    this.renderTime();
    }
}

renderTime() {
    const total = Math.max(0, Number(this.getAttribute("seconds")) || 0);
    const mins = String(Math.floor(total / 60)).padStart(2, "0");
    const secs = String(total % 60).padStart(2, "0");

    const clockEl = this.shadowRoot.getElementById("clock");
    const boxEl = this.shadowRoot.querySelector(".timer-box");

    if (clockEl) clockEl.textContent = `${mins}:${secs}`;
    if (boxEl) boxEl.classList.toggle("is-warning", total <= 30);
}
}

if (!customElements.get("exam-timer")) {
customElements.define("exam-timer", ExamTimer);
}