// ========================================
// COMMAND PATTERN
// UNDO / REDO HISTORY
// ========================================

const MAX_HISTORY = 20;

const undoStack = [];
const redoStack = [];

// ========================================
// 1. EXECUTE COMMAND
// ========================================

export function executeCommand(command) {
    command.execute();

    undoStack.push(command);

    if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
    }

    redoStack.length = 0;

    return true;
}

// ========================================
// 2. UNDO LAST ACTION
// ========================================

export function undo() {
    if (undoStack.length === 0) {
        return false;
    }

    const command = undoStack.pop();

    command.undo();

    redoStack.push(command);

    return true;
}

// ========================================
// 3. REDO LAST UNDONE ACTION
// ========================================

export function redo() {
    if (redoStack.length === 0) {
        return false;
    }

    const command = redoStack.pop();

    command.execute();

    undoStack.push(command);

    return true;
}

// ========================================
// 4. CHECK HISTORY STATUS
// ========================================

export function canUndo() {
    return undoStack.length > 0;
}

export function canRedo() {
    return redoStack.length > 0;
}

// ========================================
// 5. CLEAR HISTORY
// ========================================

export function clearHistory() {
    undoStack.length = 0;
    redoStack.length = 0;
}

// ========================================
// 6. HISTORY INFORMATION
// ========================================

export function getHistoryInfo() {
    return {
        undoCount: undoStack.length,
        redoCount: redoStack.length,
        maxHistory: MAX_HISTORY
    };
}