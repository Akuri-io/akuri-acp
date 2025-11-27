export const ui = {
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `px-6 py-4 rounded-lg shadow-lg mb-2 transition-all transform translate-x-0 ${type === 'success' ? 'bg-success' : 'bg-error'
            } text-white`;
        toast.textContent = message;

        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-x-full');
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        }
    },

    setupNavigation(activePage) {
        const nav = document.querySelector('nav');
        if (!nav) return;

        // Highlight active link
        const links = nav.querySelectorAll('a');
        links.forEach(link => {
            if (link.getAttribute('href') === activePage) {
                link.classList.add('border-primary', 'text-primary');
                link.classList.remove('text-gray-400', 'border-transparent');
            } else {
                link.classList.remove('border-primary', 'text-primary');
                link.classList.add('text-gray-400', 'border-transparent');
            }
        });
    }
};
