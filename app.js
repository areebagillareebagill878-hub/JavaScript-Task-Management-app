// ========================================
// TASK MANAGER APPLICATION
// Main Controller
// ========================================

import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    restoreTasks
} from "./taskManager.js";

import {
    getFiltersFromURL,
    saveFiltersToURL,
    filterAndSortTasks,
    debounce,
    highlightText
} from "./filters.js";

import {
    executeCommand,
    undo,
    redo,
    canUndo,
    canRedo
} from "./commands.js";

import {
    formatDate,
    showMessage
} from "./utils.js";

// ========================================
// DOM ELEMENTS
// ========================================

const taskForm = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const descriptionInput = document.getElementById("task-description");
const priorityInput = document.getElementById("task-priority");

const submitButton = document.getElementById("submit-task");
const cancelEditButton = document.getElementById("cancel-edit");

const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const sortSelect = document.getElementById("sort-select");

const taskList = document.getElementById("task-list");
const taskSummary = document.getElementById("task-summary");

const undoButton = document.getElementById("undo-button");
const redoButton = document.getElementById("redo-button");

// ========================================
// APPLICATION STATE
// ========================================

let editingTaskId = null;
let draggedTaskId = null;

let filters = getFiltersFromURL();

searchInput.value = filters.search;
statusFilter.value = filters.status;
sortSelect.value = filters.sort;

// ========================================
// SAFE COMMAND EXECUTION
// ========================================

function runTaskCommand(action, reverseAction) {
    const before = getTasks();

    try {
        action();

        const after = getTasks();

        executeCommand({
            execute() {
                restoreTasks(after);
            },

            undo() {
                restoreTasks(before);
            }
        });

        renderTasks();

        return true;
    } catch (error) {
        console.error(error);

        showMessage(
            error.message || "Something went wrong."
        );

        return false;
    }
}

// ========================================
// CREATE / UPDATE TASK
// ========================================

taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const priority = priorityInput.value;

    if (!title) {
        showMessage("Please enter a task title.");
        titleInput.focus();
        return;
    }

    if (editingTaskId) {
        const id = editingTaskId;

        const success = runTaskCommand(() => {
            updateTask(id, {
                title,
                description,
                priority
            });
        });

        if (success) {
            showMessage("Task updated successfully.");
            resetForm();
        }
    } else {
        const success = runTaskCommand(() => {
            createTask({
                title,
                description,
                priority
            });
        });

        if (success) {
            showMessage("Task created successfully.");
            resetForm();
        }
    }
});

// ========================================
// RESET FORM
// ========================================

function resetForm() {
    taskForm.reset();

    editingTaskId = null;

    submitButton.textContent = "Add Task";
    cancelEditButton.hidden = true;

    priorityInput.value = "medium";
}

// ========================================
// CANCEL EDIT
// ========================================

cancelEditButton.addEventListener("click", resetForm);

// ========================================
// EDIT TASK
// ========================================

function startEditing(task) {
    editingTaskId = task.id;

    titleInput.value = task.title;
    descriptionInput.value = task.description;
    priorityInput.value = task.priority;

    submitButton.textContent = "Save Changes";
    cancelEditButton.hidden = false;

    titleInput.focus();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// ========================================
// TASK ACTIONS
// ========================================

function handleTaskAction(event) {
    const button = event.target.closest("button");

    if (!button) {
        return;
    }

    const item = button.closest(".task-item");

    if (!item) {
        return;
    }

    const id = item.dataset.id;

    const task = getTasks().find(task => task.id === id);

    if (!task) {
        return;
    }

    if (button.dataset.action === "edit") {
        startEditing(task);
        return;
    }

    if (button.dataset.action === "delete") {
        const confirmed = window.confirm(
            `Delete "${task.title}"?`
        );

        if (!confirmed) {
            return;
        }

        const success = runTaskCommand(() => {
            deleteTask(id);
        });

        if (success) {
            showMessage("Task deleted successfully.");
        }

        return;
    }

    if (button.dataset.action === "toggle") {
        const success = runTaskCommand(() => {
            updateTask(id, {
                completed: !task.completed
            });
        });

        if (success) {
            showMessage(
                task.completed
                    ? "Task marked as pending."
                    : "Task completed!"
            );
        }
    }
}

taskList.addEventListener("click", handleTaskAction);

// ========================================
// RENDER TASKS
// ========================================

function renderTasks() {
    const allTasks = getTasks();

    const visibleTasks = filterAndSortTasks(
        allTasks,
        filters
    );

    taskList.replaceChildren();

    if (visibleTasks.length === 0) {
        const emptyItem = document.createElement("li");

        emptyItem.className = "empty-state";

        emptyItem.textContent = allTasks.length === 0
            ? "No tasks yet. Create your first task!"
            : "No tasks match your search or filter.";

        taskList.appendChild(emptyItem);
    }

    visibleTasks.forEach(task => {
        const item = document.createElement("li");

        item.className = "task-item";

        if (task.completed) {
            item.classList.add("completed");
        }

        item.dataset.id = task.id;
        item.draggable = true;

        const heading = document.createElement("h3");

        heading.appendChild(
            highlightText(task.title, filters.search)
        );

        const description = document.createElement("p");

        description.appendChild(
            highlightText(
                task.description || "No description",
                filters.search
            )
        );

        const priority = document.createElement("span");

        priority.className = `priority priority-${task.priority}`;
        priority.textContent =
            task.priority.charAt(0).toUpperCase() +
            task.priority.slice(1) +
            " Priority";

        const status = document.createElement("p");

        status.textContent = task.completed
            ? "Status: Completed"
            : "Status: Pending";

        const date = document.createElement("p");

        date.textContent = `Created: ${formatDate(task.createdAt)}`;

        const actions = document.createElement("div");

        actions.className = "task-actions";

        actions.append(
            createActionButton(
                task.completed ? "Mark Pending" : "Complete",
                "toggle",
                "complete-button"
            ),
            createActionButton("Edit", "edit"),
            createActionButton("Delete", "delete", "delete-button")
        );

        item.append(
            heading,
            description,
            priority,
            status,
            date,
            actions
        );

        taskList.appendChild(item);
    });

    const completed = allTasks.filter(
        task => task.completed
    ).length;

    taskSummary.textContent =
        `Total: ${allTasks.length} | ` +
        `Completed: ${completed} | ` +
        `Pending: ${allTasks.length - completed} | ` +
        `Showing: ${visibleTasks.length}`;

    undoButton.disabled = !canUndo();
    redoButton.disabled = !canRedo();
}

// ========================================
// CREATE ACTION BUTTON
// ========================================

function createActionButton(
    text,
    action,
    className = ""
) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = text;
    button.dataset.action = action;

    if (className) {
        button.className = className;
    }

    return button;
}

// ========================================
// SEARCH WITH DEBOUNCE
// ========================================

const handleSearch = debounce(() => {
    filters.search = searchInput.value;

    saveFiltersToURL(filters);

    renderTasks();
}, 300);

searchInput.addEventListener("input", handleSearch);

// ========================================
// FILTERING
// ========================================

statusFilter.addEventListener("change", () => {
    filters.status = statusFilter.value;

    saveFiltersToURL(filters);

    renderTasks();
});

// ========================================
// SORTING
// ========================================

sortSelect.addEventListener("change", () => {
    filters.sort = sortSelect.value;

    saveFiltersToURL(filters);

    renderTasks();
});

// ========================================
// UNDO
// ========================================

undoButton.addEventListener("click", () => {
    try {
        if (undo()) {
            renderTasks();
            showMessage("Last action undone.");
        }
    } catch (error) {
        console.error(error);
        showMessage("Unable to undo the last action.");
    }
});

// ========================================
// REDO
// ========================================

redoButton.addEventListener("click", () => {
    try {
        if (redo()) {
            renderTasks();
            showMessage("Action restored.");
        }
    } catch (error) {
        console.error(error);
        showMessage("Unable to redo the action.");
    }
});

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

document.addEventListener("keydown", event => {
    const target = event.target;

    const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable;

    if (
        isTyping &&
        !event.ctrlKey &&
        !event.metaKey
    ) {
        return;
    }

    const modifier = event.ctrlKey || event.metaKey;

    if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();

        if (event.shiftKey) {
            redoButton.click();
        } else {
            undoButton.click();
        }
    }

    if (
        modifier &&
        event.key.toLowerCase() === "y"
    ) {
        event.preventDefault();
        redoButton.click();
    }

    if (
        modifier &&
        event.key.toLowerCase() === "k"
    ) {
        event.preventDefault();
        searchInput.focus();
    }

    if (event.key === "Escape") {
        resetForm();
        searchInput.value = "";
        filters.search = "";
        saveFiltersToURL(filters);
        renderTasks();
    }
});

// ========================================
// DRAG AND DROP
// ========================================

taskList.addEventListener("dragstart", event => {
    const item = event.target.closest(".task-item");

    if (!item) {
        return;
    }

    draggedTaskId = item.dataset.id;

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData(
        "text/plain",
        draggedTaskId
    );
});

taskList.addEventListener("dragover", event => {
    const item = event.target.closest(".task-item");

    if (!item || !draggedTaskId) {
        return;
    }

    event.preventDefault();

    event.dataTransfer.dropEffect = "move";
});

taskList.addEventListener("drop", event => {
    const targetItem = event.target.closest(".task-item");

    if (!targetItem || !draggedTaskId) {
        return;
    }

    event.preventDefault();

    const targetId = targetItem.dataset.id;

    if (targetId === draggedTaskId) {
        draggedTaskId = null;
        return;
    }

    const before = getTasks();

    const ordered = [...before];

    const fromIndex = ordered.findIndex(
        task => task.id === draggedTaskId
    );

    const toIndex = ordered.findIndex(
        task => task.id === targetId
    );

    if (fromIndex === -1 || toIndex === -1) {
        draggedTaskId = null;
        return;
    }

    const [movedTask] = ordered.splice(fromIndex, 1);

    ordered.splice(toIndex, 0, movedTask);

    try {
        reorderTasks(ordered.map(task => task.id));

        const after = getTasks();

        executeCommand({
            execute() {
                restoreTasks(after);
            },

            undo() {
                restoreTasks(before);
            }
        });

        renderTasks();

        showMessage("Task order updated.");
    } catch (error) {
        console.error(error);
        showMessage("Unable to reorder tasks.");
    }

    draggedTaskId = null;
});

taskList.addEventListener("dragend", () => {
    draggedTaskId = null;
});

// ========================================
// INITIALIZE APPLICATION
// ========================================

renderTasks();

console.log("Task Manager initialized successfully.");