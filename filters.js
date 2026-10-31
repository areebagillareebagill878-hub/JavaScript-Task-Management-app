// ========================================
// FILTERS MODULE
// Search, Filtering, Sorting, URL State
// ========================================

// 1. READ FILTERS FROM URL

export function getFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);

    const allowedStatuses = [
        "all",
        "pending",
        "completed"
    ];

    const allowedSorts = [
        "created-desc",
        "created-asc",
        "title-asc",
        "priority-desc"
    ];

    const status = params.get("status");
    const sort = params.get("sort");

    return {
        status: allowedStatuses.includes(status)
            ? status
            : "all",

        sort: allowedSorts.includes(sort)
            ? sort
            : "created-desc",

        search: params.get("search") || ""
    };
}

// 2. SAVE FILTERS TO URL

export function saveFiltersToURL(filters) {
    const params = new URLSearchParams();

    if (filters.status !== "all") {
        params.set("status", filters.status);
    }

    if (filters.sort !== "created-desc") {
        params.set("sort", filters.sort);
    }

    if (filters.search.trim()) {
        params.set("search", filters.search.trim());
    }

    const query = params.toString();

    const newURL = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;

    window.history.replaceState({}, "", newURL);
}

// 3. FILTER AND SORT TASKS

export function filterAndSortTasks(tasks, filters) {
    let result = [...tasks];

    // Filter by completion status
    if (filters.status === "pending") {
        result = result.filter(task => !task.completed);
    }

    if (filters.status === "completed") {
        result = result.filter(task => task.completed);
    }

    // Search by title and description
    const searchTerm = filters.search.trim().toLowerCase();

    if (searchTerm) {
        result = result.filter(task => {
            const title = task.title.toLowerCase();

            const description = (
                task.description || ""
            ).toLowerCase();

            return (
                title.includes(searchTerm) ||
                description.includes(searchTerm)
            );
        });
    }

    // Sorting
    const priorityOrder = {
        low: 1,
        medium: 2,
        high: 3
    };

    switch (filters.sort) {
        case "created-asc":
            result.sort((a, b) =>
                a.createdAt.localeCompare(b.createdAt)
            );
            break;

        case "title-asc":
            result.sort((a, b) =>
                a.title.localeCompare(b.title)
            );
            break;

        case "priority-desc":
            result.sort((a, b) =>
                priorityOrder[b.priority] -
                priorityOrder[a.priority]
            );
            break;

        case "created-desc":
        default:
            result.sort((a, b) =>
                b.createdAt.localeCompare(a.createdAt)
            );
            break;
    }

    return result;
}

// 4. DEBOUNCED SEARCH

export function debounce(callback, delay = 300) {
    let timer;

    return function (...args) {
        clearTimeout(timer);

        timer = setTimeout(() => {
            callback.apply(this, args);
        }, delay);
    };
}

// 5. HIGHLIGHT SEARCH MATCHES

export function highlightText(text, searchTerm) {
    const fragment = document.createDocumentFragment();

    const value = String(text ?? "");
    const search = searchTerm.trim();

    if (!search) {
        fragment.appendChild(
            document.createTextNode(value)
        );

        return fragment;
    }

    const lowerValue = value.toLowerCase();
    const lowerSearch = search.toLowerCase();

    let start = 0;
    let index = lowerValue.indexOf(lowerSearch);

    while (index !== -1) {
        fragment.appendChild(
            document.createTextNode(
                value.slice(start, index)
            )
        );

        const mark = document.createElement("mark");

        mark.textContent = value.slice(
            index,
            index + search.length
        );

        fragment.appendChild(mark);

        start = index + search.length;

        index = lowerValue.indexOf(
            lowerSearch,
            start
        );
    }

    fragment.appendChild(
        document.createTextNode(value.slice(start))
    );

    return fragment;
}