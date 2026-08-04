// Modals module - dynamically injects modal forms into the DOM
import { marketRequestModal } from './modals/market-request-modal.js';
import { clientRegistryModal } from './modals/client-registry-modal.js';
import { invoiceModal } from './modals/invoice-modal.js';
import { researchModal } from './modals/research-modal.js';
import { digitalLogModal } from './modals/digital-log-modal.js';
import { tenderModal } from './modals/tender-modal.js';
import { feedbackModal } from './modals/feedback-modal.js';
import { leaveModal } from './modals/leave-modal.js';

const modalsHTML = 
    marketRequestModal +
    clientRegistryModal +
    invoiceModal +
    researchModal +
    digitalLogModal +
    tenderModal +
    feedbackModal +
    leaveModal;

// Inject modals into DOM when page loads
function injectModals() {
    const modalsContainer = document.createElement('div');
    modalsContainer.innerHTML = modalsHTML;
    document.body.appendChild(modalsContainer);
}

// Call injection on load
injectModals();
