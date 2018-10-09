import mongoose from 'mongoose';
import * as Joi from 'joi';
import { IMeal } from './meal';

export interface IMenu extends mongoose.Document {
    date: Date
    meals: IMeal[]
}

interface IMenuReqBody {
    date: Date,
    meals: mongoose.Types.ObjectId[]
};

export function validateReqBody(reqBody: IMenuReqBody) {
    const schema = {
        date: Joi.date().required(),
        meals: Joi.array().items(Joi.string()).required()
    }
    return Joi.validate(reqBody, schema);
}


export let MenuSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    meals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meal'
    }]
});

export const Menu = mongoose.model<IMenu>('Menu', MenuSchema);