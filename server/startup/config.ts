import config from 'config';
import express from 'express'


export default function (app: express.Application) {
    if (!config.get('jwtPrivateKey')) {
        throw new Error('FATAL ERROR: jwtPrivateKey is not defined');
    }
}