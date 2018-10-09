import express from 'express';
import mongoose from 'mongoose';

export default function (req: express.Request, res: express.Response, next: express.NextFunction) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: 'Invalid ID' });

    next();
}