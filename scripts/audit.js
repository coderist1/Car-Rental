
(function () {
    const STORAGE_KEY = 'auditLog';
    const MAX_ENTRIES = 1000;       // keep last N entries to prevent storage bloat
    let _logCache = null;           // in-memory cache
    let _saveTimeout = null;

    function _loadLog() {
        if (_logCache) return _logCache;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            _logCache = raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Failed to load audit log', e);
            _logCache = [];
        }
        return _logCache;
    }

    function _scheduleSave() {
        // debounce writes so multiple logAudit calls within a frame only trigger one storage write
        if (_saveTimeout) return;
        _saveTimeout = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(_logCache));
            } catch (e) {
                console.error('Failed to save audit log', e);
            }
            _saveTimeout = null;
        }, 100);
    }

    function _saveLog(log) {
        // log is only used during initial load, afterwards _scheduleSave handles persistence
        _scheduleSave();
    }

    function _getCurrentUser() {
        try {
            const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            return {
                name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Admin',
                email: profile.email || 'admin@rentacar.com',
                id: profile.id || 'admin'
            };
        } catch (e) {
            return { name: 'Admin', email: 'admin', id: 'admin' };
        }
    }

    window.logAudit = function(action, details, metadata = {}) {
        const user = _getCurrentUser();
        const entry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            action: action || '(unknown)',
            details: details || '',
            user: metadata.user || user,
            category: metadata.category || _categorizeAction(action),
            ipAddress: metadata.ipAddress || 'local',
            severity: metadata.severity || 'info' // info, warning, critical
        };
        const log = _loadLog();
        log.push(entry);
        // trim oldest entries if exceeding limit
        if (log.length > MAX_ENTRIES) {
            log.splice(0, log.length - MAX_ENTRIES);
        }
        _scheduleSave();
        window.dispatchEvent(new Event('auditLogged'));
        return entry;
    };

    function _categorizeAction(action) {
        if (!action) return 'other';
        const lower = action.toLowerCase();
        if (lower.includes('user') || lower.includes('delete') || lower.includes('toggle') || lower.includes('role')) return 'user_management';
        if (lower.includes('vehicle') || lower.includes('delete')) return 'vehicle_management';
        if (lower.includes('booking') || lower.includes('approve') || lower.includes('reject')) return 'booking_management';
        if (lower.includes('dispute') || lower.includes('resolve')) return 'dispute_management';
        if (lower.includes('return')) return 'return_request';
        return 'other';
    }

    window.getAuditLog = function() {
        // return a copy so callers cannot mutate internal cache accidentally
        return _loadLog().slice();
    };

    window.filterAuditLog = function(options = {}) {
        let logs = _loadLog().slice();
        
        if (options.action) {
            logs = logs.filter(l => l.action.toLowerCase().includes(options.action.toLowerCase()));
        }
        if (options.category) {
            logs = logs.filter(l => l.category === options.category);
        }
        if (options.user) {
            logs = logs.filter(l => 
                l.user && (l.user.name.toLowerCase().includes(options.user.toLowerCase()) || 
                          l.user.email.toLowerCase().includes(options.user.toLowerCase()))
            );
        }
        if (options.startDate) {
            const start = new Date(options.startDate);
            logs = logs.filter(l => new Date(l.timestamp) >= start);
        }
        if (options.endDate) {
            const end = new Date(options.endDate);
            logs = logs.filter(l => new Date(l.timestamp) <= end);
        }
        if (options.keyword) {
            const kw = options.keyword.toLowerCase();
            logs = logs.filter(l => 
                l.action.toLowerCase().includes(kw) || 
                l.details.toLowerCase().includes(kw) ||
                (l.user && (l.user.name.toLowerCase().includes(kw) || l.user.email.toLowerCase().includes(kw)))
            );
        }
        if (options.severity) {
            logs = logs.filter(l => l.severity === options.severity);
        }
        
        return logs;
    };

    window.getAuditStats = function() {
        const logs = _loadLog();
        const categories = {};
        const actionCounts = {};
        let criticalCount = 0;
        
        logs.forEach(l => {
            categories[l.category] = (categories[l.category] || 0) + 1;
            actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
            if (l.severity === 'critical') criticalCount++;
        });
        
        return {
            totalEntries: logs.length,
            byCategory: categories,
            byAction: actionCounts,
            criticalCount: criticalCount,
            oldestEntry: logs[0] ? new Date(logs[0].timestamp) : null,
            newestEntry: logs[logs.length - 1] ? new Date(logs[logs.length - 1].timestamp) : null
        };
    };


    window.clearAuditLog = function() {
        if (confirm('This will permanently delete all audit logs. Continue?')) {
            localStorage.removeItem(STORAGE_KEY);
            window.dispatchEvent(new Event('auditLogged'));
            return true;
        }
        return false;
    };

    window.dispatchEvent(new Event('auditHelperReady'));
})();