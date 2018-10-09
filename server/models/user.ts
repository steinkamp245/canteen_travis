import mongoose from 'mongoose';
import * as Joi from 'joi';

export interface IUser extends mongoose.Document {
    name: string
    email: string
    password: string
}

interface IUserReqBody {
    email: string
    password: string
};

export function validateReqBody(reqBody: IUserReqBody) {
    const schema = {
        email: Joi.string().email().required(),
        password: Joi.string().min(4).max(1024).required()
    }

    return Joi.validate(reqBody, schema);
}


let UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

export const User = mongoose.model<IUser>('User', UserSchema);