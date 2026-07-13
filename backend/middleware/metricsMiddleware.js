import { register, httpRequestDurationMicroseconds, httpRequestsTotal } from '../config/metrics.js';

export const metricsMiddleware = (req, res, next) => {
    // Skip logging for the metrics endpoint itself
    if (req.path === '/metrics') {
        return next();
    }

    const start = process.hrtime();

    res.on('finish', () => {
        const duration = process.hrtime(start);
        const durationInSeconds = duration[0] + duration[1] / 1e9;

        const route = req.route ? req.route.path : req.path;

        httpRequestDurationMicroseconds
            .labels(req.method, route, res.statusCode)
            .observe(durationInSeconds);

        httpRequestsTotal
            .labels(req.method, route, res.statusCode)
            .inc();
    });

    next();
};

export const metricsEndpoint = async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (ex) {
        res.status(500).send(ex);
    }
};
