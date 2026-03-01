// email.js - simple "notification" system that records outgoing emails in localStorage
// This mimics sending emails in a client-only app by persisting message data

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
        // notify listeners on same window
        window.dispatchEvent(new Event('emailSent'));
        return entry;
    };

    window.getSentEmails = function () {
        return _loadQueue();
    };

    window.clearEmailLog = function () {
        localStorage.removeItem(STORAGE_KEY);
    };

    // signal that helper is defined so other scripts can react
    window.dispatchEvent(new Event('emailHelperReady'));
})();
