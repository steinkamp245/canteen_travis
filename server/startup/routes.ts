import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import users from '../routes/users';
import allergenics from '../routes/allergenics';
import meals from '../routes/meals';
import menus from '../routes/menus';
import error from '../services/error';



import { jwtClaimSetMiddleware, authMiddleware } from '../services/auth.service';

export default function (app: express.Application) {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(helmet());
    app.use(jwtClaimSetMiddleware);


    app.use('/api/users', authMiddleware, users);
    app.use('/api/allergenics', authMiddleware, allergenics);
    app.use('/api/meals', authMiddleware, meals)
    app.use('/api/menus', authMiddleware, menus)
    app.use(error);
}