// API Base URL
const API_BASE = '/config';

export const api = {
    // Rutas
    async getPaths() {
        const response = await fetch(`${API_BASE}/paths`);
        return await response.json();
    },

    async validatePath(path) {
        const response = await fetch(`${API_BASE}/test-path`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });
        return await response.json();
    },

    async addPath(path) {
        const response = await fetch(`${API_BASE}/paths`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });
        return await response.json();
    },

    async removePath(path) {
        const response = await fetch(`${API_BASE}/paths/${encodeURIComponent(path)}`, {
            method: 'DELETE'
        });
        return await response.json();
    },

    // Globales
    async reindexAll() {
        const response = await fetch(`${API_BASE}/reindex`, { method: 'POST' });
        return await response.json();
    }
};
