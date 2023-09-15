export function saveStateToLocalStorage(key: string, state: unknown) {
    localStorage.setItem(key, JSON.stringify(state));
}

export function loadStateFromLocalStorage(key: string): string | null {
    const storedState = localStorage.getItem(key);
    return storedState ? JSON.parse(storedState) : null;
}
