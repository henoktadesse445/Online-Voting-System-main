const cache = new Map();
const CACHE_TTL = {
    VOTING_SETTINGS: 5 * 60 * 1000,
    USER_STATS: 2 * 60 * 1000,
    ELECTION_RESULTS: 10 * 60 * 1000,
    DEFAULT: 3 * 60 * 1000
};

const getCached = (key) => {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
        cache.delete(key);
        return null;
    }
    return item.data;
};

const setCache = (key, data, ttl = CACHE_TTL.DEFAULT) => {
    cache.set(key, {
        data,
        expiry: Date.now() + ttl
    });
};

const clearCache = (pattern) => {
    if (pattern) {
        for (const key of cache.keys()) {
            if (key.includes(pattern)) {
                cache.delete(key);
            }
        }
    } else {
        cache.clear();
    }
};

module.exports = {
    getCached,
    setCache,
    clearCache,
    CACHE_TTL
};
