
(function () {
    const STORAGE_KEY = 'emailQueue';

    function _loadQueue() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Failed to load email queue', e);
            return [];
        }
    }

    function _saveQueue(queue) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        } catch (e) {
            console.error('Failed to save email queue', e);
        }
    }

    window.sendEmail = function (to, subject, body) {
        const entry = {
            id: Date.now(),
            to: to || '(unknown)',
            subject: subject || '(no subject)',
            body: body || '',
            timestamp: new Date().toISOString(),
        };
        const queue = _loadQueue();
        queue.push(entry);
        _saveQueue(queue);
        console.log('Email logged', entry);
        window.dispatchEvent(new Event('emailSent'));
        return entry;
    };

    window.getSentEmails = function () {
        return _loadQueue();
    };

    window.clearEmailLog = function () {
        localStorage.removeItem(STORAGE_KEY);
    };

    window.dispatchEvent(new Event('emailHelperReady'));
})();
