// ai-agent Section Component
// Renders the full Vector AI Assistant (FloatingAssistant port, embedded view)

class AIAgentSection {
    constructor() {
        this.render();
    }

    render() {
        const container = document.getElementById('content-ai-agent');
        if (!container) return;

        container.innerHTML = `
            <div class="ai-agent-full">
                <div id="ai-agent-root" class="ai-agent-root" aria-label="AI Assistant"></div>
            </div>`;

        this.mount();
    }

    mount() {
        const root = document.getElementById('ai-agent-root');
        if (!root) return;

        if (typeof window.AIAgent !== 'undefined' && typeof window.AIAgent.init === 'function') {
            // init() resolves the current auth user itself and waits for auth to be ready
            window.AIAgent.init(root, null);
        }
    }
}

// Initialize section
document.addEventListener('DOMContentLoaded', () => {
    new AIAgentSection();
});