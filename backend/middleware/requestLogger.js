import logger from '../config/logger.js';

const requestLogger = (req, res, next) => {
    logger.info(`Incoming Request: ${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    next();
};

export default requestLogger;
