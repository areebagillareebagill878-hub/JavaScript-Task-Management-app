// ========================================
// TASK MANAGER STORAGE MODULE
// Local Storage + Schema Migration
// ========================================

const STORAGE_KEY = "javascript-task-manager";

const CURRENT_VERSION = 2;

// ========================================
// 1. CREATE DEFAULT DATA
// ========================================

function createDefaultData() {
    return {
        version: CURRENT_VERSION,
        tasks: []
    };
}

// ========================================
// 2. VALIDATE TASK DATA
// ========================================

function normalizeTask(task) {
    if (!task || typeof task !== "object") {
        return null;
    }

    if (typeof task.id !== "string" || !task.id) {
        return null;
    }

    if (typeof task.title !== "string" || !task.title.trim()) {
        return null;
    }

    const validPriorities = ["low", "medium", "high"];

    const validPriority = validPriorities.includes(task.priority)
        ? task.priority
        : "medium";

    return {
        id: task.id,
        title: task.title.trim(),

        description:
            typeof task.description === "string"
                ? task.description
                : "",

        priority: validPriority,

        completed: task.completed === true,

        createdAt:
            typeof task.createdAt === "string"
                ? task.createdAt
                : new Date().toISOString(),

        updatedAt:
            typeof task.updatedAt === "string"
                ? task.updatedAt
                : new Date().toISOString(),

        position:
            Number.isFinite(task.position)
                ? task.position
                : 0
    };
}

// ========================================
// 3. MIGRATE VERSION 1 TO VERSION 2
// ========================================

function migrateV1ToV2(oldData) {
    const oldTasks = Array.isArray(oldData.tasks)
        ? oldData.tasks
        : [];

    const migratedTasks = oldTasks
        .map((task, index) => {
            if (!task || typeof task !== "object") {
                return null;
            }

            const normalized = normalizeTask({
                id: String(task.id ?? ""),
                title: task.title,
                description: task.description ?? "",
                priority: task.priority ?? "medium",
                completed: task.completed ?? false,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                position: index
            });

            return normalized;
        })
        .filter(Boolean);

    return {
        version: 2,
        tasks: migratedTasks
    };
}

// ========================================
// 4. MIGRATION CONTROLLER
// ========================================

function migrateData(data) {
    if (!data || typeof data !== "object") {
        return createDefaultData();
    }

    let migratedData = data;

    const version = Number(data.version ?? 1);

    if (!Number.isInteger(version) || version < 1) {
        return createDefaultData();
    }

    if (version > CURRENT_VERSION) {
        throw new Error(
            "Saved data was created by a newer version of this application."
        );
    }

    if (version === 1) {
        migratedData = migrateV1ToV2(migratedData);
    }

    if (migratedData.version !== CURRENT_VERSION) {
        return createDefaultData();
    }

    return {
        version: CURRENT_VERSION,
        tasks: Array.isArray(migratedData.tasks)
            ? migratedData.tasks
                .map(normalizeTask)
                .filter(Boolean)
            : []
    };
}

// ========================================
// 5. SAVE DATA
// ========================================

export function saveTasks(tasks) {
    const data = {
        version: CURRENT_VERSION,
        tasks: tasks
            .map(normalizeTask)
            .filter(Boolean)
    };

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

        return true;
    } catch (error) {
        console.error("Unable to save tasks:", error);

        return false;
    }
}

// ========================================
// 6. LOAD DATA
// ========================================

export function loadTasks() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return [];
        }

        const parsedData = JSON.parse(savedData);

        const migratedData = migrateData(parsedData);

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(migratedData)
        );

        return migratedData.tasks;
    } catch (error) {
        console.error("Unable to load saved tasks:", error);

        return [];
    }
}

// ========================================
// 7. CLEAR SAVED DATA
// ========================================

export function clearSavedTasks() {
    try {
        localStorage.removeItem(STORAGE_KEY);

        return true;
    } catch (error) {
        console.error("Unable to clear saved tasks:", error);

        return false;
    }
}