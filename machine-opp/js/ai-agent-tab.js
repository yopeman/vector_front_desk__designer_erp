// AI Agent Tab Component
class AIAgentTab {
    constructor() {
        this.init();
    }
    init() {
        // Initialization handled by ai-agent-section.js
    }
    activate() {
        if (typeof AIAgent !== 'undefined' && typeof AIAgent.loadSessions === 'function') {
            AIAgent.loadSessions();
        }
    }
}
const aiAgentTab = new AIAgentTab();