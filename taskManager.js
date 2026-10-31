// ========================================
// TASK MANAGER MODULE
// CRUD Operations
// ========================================

import { saveTasks, loadTasks } from "./storage.js";

let tasks = loadTasks();

// ========================================
// 1. GET ALL TASKS
// ========================================

export function getTasks() {
    return tasks.map(task => ({ ...task }));
}

// ========================================
// 2. CREATE TASK
// ========================================

export function createTask({
    title,
    description = "",
    priority = "medium"
}) {
    if (typeof title !== "string" || !title.trim()) {
        throw new Error("Task title is required.");
    }

    if (!["low", "medium", "high"].includes(priority)) {
        throw new Error("Invalid task priority.");
    }

    const now = new Date().toISOString();

    const task = {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description.trim(),
        priority,
        completed: false,
        createdAt: now,
        updatedAt: now,
        position: tasks.length
    };

    tasks.push(task);

    if (!saveTasks(tasks)) {
        tasks.pop();

        throw new Error(
            "Task could not be saved. Check browser storage."
        );
    }

    return { ...task };
}

// ========================================
// 3. UPDATE TASK
// ========================================

export function updateTask(id, updates) {
    const index = tasks.findIndex(task => task.id === id);

    if (index === -1) {
        throw new Error("Task not found.");
    }

    const oldTask = tasks[index];

    const updatedTask = {
        ...oldTask,
        ...updates,
        id: oldTask.id,
        updatedAt: new Date().toISOString()
    };

    if (
        typeof updatedTask.title !== "string" ||
        !updatedTask.title.trim()
    ) {
        throw new Error("Task title cannot be empty.");
    }

    if (
        !["low", "medium", "high"].includes(updatedTask.priority)
    ) {
        throw new Error("Invalid task priority.");
    }

    if (typeof updatedTask.completed !== "boolean") {
        throw new Error("Invalid task status.");
    }

    updatedTask.title = updatedTask.title.trim();

    updatedTask.description =
        typeof updatedTask.description === "string"
            ? updatedTask.description.trim()
            : "";

    tasks[index] = updatedTask;

    if (!saveTasks(tasks)) {
        tasks[index] = oldTask;

        throw new Error("Unable to save the updated task.");
    }

    return { ...updatedTask };
}

// ========================================
// 4. DELETE TASK
// ========================================

export function deleteTask(id) {
    const index = tasks.findIndex(task => task.id === id);

    if (index === -1) {
        throw new Error("Task not found.");
    }

    const [deletedTask] = tasks.splice(index, 1);

    tasks.forEach((task, position) => {
        task.position = position;
    });

    if (!saveTasks(tasks)) {
        tasks.splice(index, 0, deletedTask);

        tasks.forEach((task, position) => {
            task.position = position;
        });

        throw new Error("Unable to delete the task.");
    }

    return { ...deletedTask };
}

// ========================================
// 5. REORDER TASKS
// ========================================

export function reorderTasks(orderedIds) {
    if (!Array.isArray(orderedIds)) {
        throw new Error("Task order must be an array.");
    }

    if (
        orderedIds.length !== tasks.length ||
        new Set(orderedIds).size !== tasks.length ||
        !orderedIds.every(id => tasks.some(task => task.id === id))
    ) {
        throw new Error("Invalid task order.");
    }

    const previousTasks = tasks.map(task => ({ ...task }));

    tasks = orderedIds.map((id, index) => {
        const task = tasks.find(item => item.id === id);

        return {
            ...task,
            position: index
        };
    });

    if (!saveTasks(tasks)) {
        tasks = previousTasks;

        throw new Error("Unable to save the new task order.");
    }

    return getTasks();
}
// ========================================
// RESTORE TASK STATE
// Used by Undo / Redo
// ========================================

export function restoreTasks(savedTasks) {
    if (!Array.isArray(savedTasks)) {
        throw new Error("Invalid task state.");
    }

    const previousTasks = tasks.map(task => ({ ...task }));

    tasks = savedTasks.map(task => ({ ...task }));

    if (!saveTasks(tasks)) {
        tasks = previousTasks;

        throw new Error("Unable to restore task state.");
    }

    return getTasks();
}