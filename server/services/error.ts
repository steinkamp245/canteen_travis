import express from 'express';
import {logger} from '../startup/logging';

export default function (err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    logger.error(err.message, err);
    res.status(500).json({message: 'Something terribly failed on our side'});
}