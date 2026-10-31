// ========================================
// UTILITY FUNCTIONS
// ========================================

// 1. FORMAT DATE

export function formatDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
}

// 2. ESCAPE HTML CHARACTERS

export function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        character => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        }
    );
}

// 3. SHOW APPLICATION MESSAGE

export function showMessage(
    message,
    elementId = "app-message"
) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = message;
}