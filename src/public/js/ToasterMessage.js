class ToasterMessage {
    static show(text, type = 'info', duration = 3000) {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 300);
        }, duration);
    }

    static success(text, duration = 3000) {
        this.show(text, 'success', duration);
    }

    static error(text, duration = 3000) {
        this.show(text, 'error', duration);
    }

    static info(text, duration = 3000) {
        this.show(text, 'info', duration);
    }

    static gold(text, duration = 3000) {
        // Special styling for exceptional plays like Hole in One, Birdie, etc.
        this.show(text, 'gold', duration);
    }
} 