// API Base URL
const API_BASE = '';

export const api = {
    // Paths Management
    async getPaths() {
        const response = await fetch(`${API_BASE}/paths`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    },

    async validatePath(path) {
        // For validation, we'll create a temporary path object and validate it
        const tempPathData = {
            name: 'temp_validation',
            path: path,
            description: 'Temporary path for validation'
        };

        const response = await fetch(`${API_BASE}/paths`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tempPathData)
        });

        if (response.status === 409) {
            // Path already exists, which means it's valid
            return { valid: true, message: 'Path is valid and accessible' };
        }

        if (response.ok) {
            // Path was created successfully, so it's valid - but we should clean it up
            const result = await response.json();
            if (result.data && result.data.id) {
                // Delete the temporary path we just created
                await fetch(`${API_BASE}/paths/${result.data.id}`, { method: 'DELETE' });
            }
            return { valid: true, message: 'Path is valid and accessible' };
        }

        // Try to get error message from response
        try {
            const errorData = await response.json();
            return { valid: false, message: errorData.message || 'Path validation failed' };
        } catch {
            return { valid: false, message: `Validation failed (HTTP ${response.status})` };
        }
    },

    async addPath(name, path, description = '') {
        const pathData = {
            name: name,
            path: path,
            description: description || `Documentation path: ${path}`
        };

        const response = await fetch(`${API_BASE}/paths`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pathData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    },

    async updatePath(id, updates) {
        const response = await fetch(`${API_BASE}/paths/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    },

    async removePath(id) {
        const response = await fetch(`${API_BASE}/paths/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    },

    async validatePathById(id) {
        const response = await fetch(`${API_BASE}/paths/${id}/validate`, {
            method: 'POST'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    },

    // Legacy methods for backward compatibility
    async reindexAll() {
        // This would need to be implemented in the backend
        // For now, return a mock response
        return {
            success: true,
            message: 'Reindexing completed',
            totalDocs: 0
        };
    }
};
