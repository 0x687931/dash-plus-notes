/**
 * Accessibility Module for Dash-Plus Notes
 * WCAG 2.1 AA Compliance
 *
 * This module adds accessibility features that can be injected into the app.
 * To use: Add <script src="accessibility.js"></script> before </body>
 */

(function() {
    'use strict';

    // ===== SCREEN READER ANNOUNCEMENTS =====

    /**
     * Announce a message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' (default) or 'assertive'
     */
    window.announce = function(message, priority = 'polite') {
        const announcer = document.getElementById('announcements');
        if (!announcer) {
            console.warn('Announcements region not found');
            return;
        }

        announcer.setAttribute('aria-live', priority);
        announcer.textContent = message;

        // Clear after announcement
        setTimeout(() => {
            announcer.textContent = '';
        }, 1000);
    };

    // ===== FOCUS MANAGEMENT =====

    let lastFocusedElement = null;
    const focusTrapListeners = new Map();

    /**
     * Open a modal with proper focus management
     * @param {string} modalId - ID of the modal element
     */
    window.openAccessibleModal = function(modalId) {
        lastFocusedElement = document.activeElement;
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');

        // Focus first focusable element
        setTimeout(() => {
            const focusable = modal.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length > 0) {
                focusable[0].focus();
            }
        }, 100);

        // Trap focus
        const trapHandler = (e) => trapFocus(e, modal);
        focusTrapListeners.set(modalId, trapHandler);
        modal.addEventListener('keydown', trapHandler);

        // Close on Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeAccessibleModal(modalId);
            }
        };
        modal.addEventListener('keydown', escapeHandler);
        focusTrapListeners.set(modalId + '-escape', escapeHandler);
    };

    /**
     * Close a modal and restore focus
     * @param {string} modalId - ID of the modal element
     */
    window.closeAccessibleModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');

        // Remove event listeners
        const trapHandler = focusTrapListeners.get(modalId);
        const escapeHandler = focusTrapListeners.get(modalId + '-escape');
        if (trapHandler) modal.removeEventListener('keydown', trapHandler);
        if (escapeHandler) modal.removeEventListener('keydown', escapeHandler);
        focusTrapListeners.delete(modalId);
        focusTrapListeners.delete(modalId + '-escape');

        // Restore focus
        if (lastFocusedElement && lastFocusedElement.focus) {
            setTimeout(() => {
                lastFocusedElement.focus();
            }, 100);
        }
    };

    /**
     * Trap focus within a modal
     * @param {KeyboardEvent} e - Keyboard event
     * @param {HTMLElement} modal - Modal element
     */
    function trapFocus(e, modal) {
        if (e.key !== 'Tab') return;

        const focusable = Array.from(modal.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ));

        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    // ===== LOADING STATES =====

    /**
     * Show loading skeleton
     * @param {string} containerId - Container element ID
     * @param {number} count - Number of skeleton rows
     */
    window.showLoadingSkeleton = function(containerId, count = 3) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let skeletons = '';
        for (let i = 0; i < count; i++) {
            skeletons += '<div class="skeleton h-12 mb-2"></div>';
        }

        container.innerHTML = skeletons;
        container.setAttribute('aria-busy', 'true');
        container.setAttribute('aria-label', 'Loading content');
    };

    /**
     * Show loading spinner
     * @param {string} containerId - Container element ID
     * @param {string} message - Loading message
     */
    window.showLoadingSpinner = function(containerId, message = 'Loading...') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12" role="status" aria-live="polite">
                <svg class="spinner w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="sr-only">${message}</span>
            </div>
        `;
        container.setAttribute('aria-busy', 'true');
    };

    /**
     * Hide loading state
     * @param {string} containerId - Container element ID
     */
    window.hideLoading = function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.removeAttribute('aria-busy');
        container.removeAttribute('aria-label');
    };

    // ===== ERROR HANDLING =====

    /**
     * Show error message for a form field
     * @param {string} fieldId - Form field ID
     * @param {string} message - Error message
     */
    window.showFieldError = function(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Announce to screen readers
        announce(message, 'assertive');

        // Add error styling
        field.classList.add('error-border');
        field.setAttribute('aria-invalid', 'true');

        // Create/update error message element
        const errorId = `${fieldId}-error`;
        let errorEl = document.getElementById(errorId);

        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.id = errorId;
            errorEl.className = 'error-text text-sm mt-1';
            errorEl.setAttribute('role', 'alert');
            field.parentNode.appendChild(errorEl);
        }

        errorEl.textContent = message;
        field.setAttribute('aria-describedby', errorId);
    };

    /**
     * Clear error from a form field
     * @param {string} fieldId - Form field ID
     */
    window.clearFieldError = function(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        field.classList.remove('error-border');
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');

        const errorId = `${fieldId}-error`;
        const errorEl = document.getElementById(errorId);
        if (errorEl) {
            errorEl.remove();
        }
    };

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - 'success', 'error', 'warning', 'info'
     */
    window.showToast = function(message, type = 'info') {
        announce(message, type === 'error' ? 'assertive' : 'polite');

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `fixed bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-50 max-w-md`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

        // Styling based on type
        const colors = {
            success: 'bg-green-600 text-white',
            error: 'bg-red-600 text-white',
            warning: 'bg-yellow-600 text-white',
            info: 'bg-blue-600 text-white'
        };
        toast.className += ' ' + colors[type];

        toast.textContent = message;
        document.body.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 300ms';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // ===== KEYBOARD NAVIGATION HELPERS =====

    /**
     * Make an element keyboard-accessible
     * @param {HTMLElement} element - Element to make accessible
     * @param {Function} onClick - Click handler
     */
    window.makeKeyboardAccessible = function(element, onClick) {
        if (!element) return;

        // Ensure it's focusable
        if (!element.hasAttribute('tabindex') && element.tagName !== 'BUTTON' && element.tagName !== 'A') {
            element.setAttribute('tabindex', '0');
        }

        // Add keyboard handler
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
            }
        });
    };

    // ===== ENHANCED EXISTING FUNCTIONS =====

    // Override toggleKeyboardHelp to use accessible modal
    const originalToggleKeyboardHelp = window.toggleKeyboardHelp;
    window.toggleKeyboardHelp = function() {
        const modal = document.getElementById('keyboardHelp');
        if (modal && modal.classList.contains('hidden')) {
            openAccessibleModal('keyboardHelp');
            state.showKeyboardHelp = true;
        } else {
            closeAccessibleModal('keyboardHelp');
            state.showKeyboardHelp = false;
        }
    };

    // Override hamburger menu for accessibility
    const originalToggleHamburgerMenu = window.toggleHamburgerMenu;
    window.toggleHamburgerMenu = function() {
        const menu = document.getElementById('hamburgerMenu');
        if (menu && menu.classList.contains('hidden')) {
            openAccessibleModal('hamburgerMenu');
            state.hamburgerMenuOpen = true;
            announce('Menu opened');
        } else {
            closeAccessibleModal('hamburgerMenu');
            state.hamburgerMenuOpen = false;
            announce('Menu closed');
        }
    };

    // Enhance task creation with announcement
    const originalCreateTask = window.createTask;
    window.createTask = function(...args) {
        const task = originalCreateTask.apply(this, args);
        if (task && task.content) {
            announce(`Task created: ${task.content}`);
        }
        return task;
    };

    // Enhance task update with announcement
    const originalUpdateTask = window.updateTask;
    window.updateTask = function(taskId, updates) {
        originalUpdateTask.call(this, taskId, updates);

        // Announce status changes
        if (updates.status) {
            const term = window.getTerm(updates.status);
            announce(`Task status changed to ${term}`);
        }

        // Announce completion
        if (updates.status === 'done') {
            announce('Task completed');
        }
    };

    // Enhance task deletion with announcement
    const originalArchiveTask = window.archiveTask;
    window.archiveTask = function(taskId) {
        const task = getTasks().find(t => t.id === taskId);
        originalArchiveTask.call(this, taskId);
        if (task) {
            announce(`Task deleted: ${task.content}`);
        }
    };

    // ===== GLOBAL ESCAPE KEY HANDLER =====

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open overlays
            if (state.linkingMode) window.cancelLinking();
            if (state.showKeyboardHelp) window.toggleKeyboardHelp();
            if (state.hamburgerMenuOpen) window.toggleHamburgerMenu();
            if (state.fabMenuOpen) window.toggleFabMenu();
            if (state.showTypeSelector) window.hideTypeSelector();

            announce('Closed');
        }
    });

    // ===== INITIALIZATION =====

    console.log('✓ Accessibility module loaded - WCAG 2.1 AA');

    // Announce app ready
    setTimeout(() => {
        announce('Dash-Plus Notes loaded');
    }, 1000);

})();
