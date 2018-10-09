import mongoose from 'mongoose';
import * as Joi from 'joi';

export interface IAllergenic extends mongoose.Document {
    name: string
    picture?: string
}

interface IAllergenicReqBody {
    name: string,
    picture?: string
};

export function validateReqBody(reqBody: IAllergenicReqBody) {
    const schema = {
        name: Joi.string().min(3).max(255).required(),
        picture: Joi.string().base64()
    }

    return Joi.validate(reqBody, schema);
}


export let AllergenicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    picture: {
        type: String
    }
});

export const Allergenic = mongoose.model<IAllergenic>('Allergenic', AllergenicSchema);