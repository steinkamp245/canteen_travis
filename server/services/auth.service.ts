import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { IUser } from '../models/user';
import { Request, Response, NextFunction } from 'express';
import config from 'config';
import * as Joi from 'joi';

const JWT_SECRET = config.get('jwtPrivateKey') as string;


export interface JWTClaimSet {
    id?: string;
    name?: string;
    email?: string;
}

function validateUser(user: Partial<IUser>) {
    const schema = {
        id: Joi.string().required(),
        name: Joi.string().min(3).max(255).required(),
        email: Joi.string().email().required()
    };

    return Joi.validate(user, schema, { allowUnknown: true });
}

export const authService = {

    hashPassword(password: string) {
        return new Promise<string>((resolve, reject) => {
            bcrypt.hash(password, 10, (err, hash) => {
                err ? reject(err) : resolve(hash);
            });
        });
    },

    validatePassword(password: string, hash: string) {
        return new Promise<boolean>((resolve, reject) => {
            bcrypt.compare(password, hash, (err, isValid) => {
                err ? reject(err) : resolve(isValid);
            });
        });
    },

    createTokenForUser(user: Partial<IUser>) {
        return new Promise<string>((resolve, reject) => {
            const { error } = validateUser(user);
            if (error) reject(error.details[0].message);

            const claimSet: JWTClaimSet = {
                id: user.id,
                name: user.name,
                email: user.email
            }
            jwt.sign(claimSet, JWT_SECRET, { algorithm: 'HS256', expiresIn: '24h' },
                (err, token) => {
                    err ? reject(err) : resolve(token);
                }
            );
        });
    },

    extractClaimSetFromToken(token: string) {
        return new Promise<JWTClaimSet>((resolve, reject) => {
            jwt.verify(token || '', JWT_SECRET, (err, claimSet) => {
                return err ? reject(err) : resolve(claimSet as JWTClaimSet);
            });
        });
    }
}


export async function jwtClaimSetMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        let claimsSet = await authService.extractClaimSetFromToken(req.cookies['jwt-token']);
        res.locals.user = claimsSet;
        next();
    }
    catch (err) {
        next();
    }
}


export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    if (res.locals.user) {
        next();
    } else {
        res.status(401).json({ message: 'Please sign-up first!' });
    }
}