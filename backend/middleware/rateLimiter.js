const buckets = new Map();

const rateLimit = ({ windowMs = 60_000, max = 60 } = {}) => (req, res, next) => {
    const now = Date.now();
    const identity = req.user?._id ? `user:${req.user._id}` : `ip:${req.ip}`;
    const key = `${identity}:${req.baseUrl}${req.route?.path || req.path}`;
    const existing = buckets.get(key);
    const bucket = !existing || existing.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : existing;

    bucket.count += 1;
    buckets.set(key, bucket);
    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", Math.max(0, max - bucket.count));
    res.setHeader("RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > max) {
        return res.status(429).json({ message: "Too many requests. Please try again later." });
    }

    next();
};

setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}, 60_000).unref();

module.exports = { rateLimit };
