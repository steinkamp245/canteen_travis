import winston from 'winston';
import express from 'express';
import morgan from 'morgan';

export const logger = winston.createLogger({
    level: 'error',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' })
    ]
});

export default function (app: express.Application) {
    process.on('uncaughtException', (err) => {
        logger.error(err.message);
        process.exit(1);
    });

    process.on('unhandledRejection', (err) => {
        logger.error(err.message);
        process.exit(1);
    });

    if (process.env.NODE_ENV !== 'production') {
        logger.add(new winston.transports.Console({
            format: winston.format.simple()
        }));
    }

    if (app.get('env') === 'development') {
        app.use(morgan('tiny'));
    }
}