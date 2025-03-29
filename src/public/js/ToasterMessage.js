class ToasterMessage {
    static messageQueue = [];
    static isProcessingQueue = false;
    static defaultDuration = 3000;
    static messageSpacing = 10; // pixels between messages
    static activeMessages = new Set();

    static async processQueue() {
        if (this.isProcessingQueue || this.messageQueue.length === 0) return;
        
        this.isProcessingQueue = true;
        
        while (this.messageQueue.length > 0) {
            const { text, type, duration, color } = this.messageQueue.shift();
            await this.displayMessage(text, type, duration, color);
        }
        
        this.isProcessingQueue = false;
    }

    static async displayMessage(text, type = 'info', duration = this.defaultDuration, customColor = null) {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.innerHTML = text;

        // Apply custom color if provided
        if (customColor) {
            message.style.backgroundColor = customColor;
        }

        // Position message based on existing messages
        const activeMessagesArray = Array.from(this.activeMessages);
        let totalHeight = 0;
        activeMessagesArray.forEach(activeMsg => {
            totalHeight += activeMsg.offsetHeight + this.messageSpacing;
        });
        message.style.transform = `translateY(${totalHeight}px)`;

        document.body.appendChild(message);
        this.activeMessages.add(message);

        // Wait for animation and duration
        await new Promise(resolve => setTimeout(resolve, duration));

        // Fade out
        message.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 300)); // transition duration

        // Remove message and update positions of remaining messages
        this.activeMessages.delete(message);
        message.remove();

        // Adjust positions of remaining messages
        let newTotalHeight = 0;
        this.activeMessages.forEach(activeMsg => {
            activeMsg.style.transform = `translateY(${newTotalHeight}px)`;
            newTotalHeight += activeMsg.offsetHeight + this.messageSpacing;
        });
    }

    static show(text, type = 'info', duration = this.defaultDuration, color = null) {
        this.messageQueue.push({ text, type, duration, color });
        this.processQueue();
    }

    static success(text, duration = this.defaultDuration) {
        this.show(text, 'success', duration);
    }

    static error(text, duration = this.defaultDuration) {
        this.show(text, 'error', duration);
    }

    static info(text, duration = this.defaultDuration) {
        this.show(text, 'info', duration);
    }

    static gold(text, duration = this.defaultDuration) {
        this.show(text, 'gold', duration);
    }

    static custom(text, color, duration = this.defaultDuration) {
        this.show(text, 'custom', duration, color);
    }
} 