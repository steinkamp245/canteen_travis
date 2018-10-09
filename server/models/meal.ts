import mongoose from 'mongoose';
import * as Joi from 'joi';
import { IAllergenic } from './allergenic';



export interface IMeal extends mongoose.Document {
    type: 'From the kitchen' | 'Meat free' | 'Sides' | 'Snack of the day' | 'Chefs theatre' | 'Soup kitchen'
    description: string
    price: number
    allergenics: IAllergenic[]
    ratings: IRating[]
};

interface IMealReqBody {
    type: 'From the kitchen' | 'Meat free' | 'Sides' | 'Snack of the day' | 'Chefs theatre' | 'Soup kitchen'
    description: string
    price: number
    allergenics: mongoose.Types.ObjectId[]
};

export interface IRating extends mongoose.Document {
    userId: string
    rating: number
    description?: string
};

interface IRatingReqBody {
    userId: string
    rating: number
    description?: string
}

export function validateReqBody(reqBody: IMealReqBody) {
    const schema = {
        type: Joi.string().valid('From the kitchen', 'Meat free', 'Sides', 'Snack of the day', 'Chefs theatre', 'Soup kitchen').required(),
        description: Joi.string().min(1).max(500).required(),
        price: Joi.number().min(0).max(100).required(),
        allergenics: Joi.array().items(Joi.string()).required()
    };
    return Joi.validate(reqBody, schema);
};

export function validateRatingReqBody(reqBody: IRatingReqBody) {
    const schema = {
        userId: Joi.string().min(5).max(25).required(),
        rating: Joi.number().integer().min(1).max(5).required(),
        description: Joi.string().min(1).max(500)
    };
    return Joi.validate(reqBody, schema);
};


let MealSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    description: {
        type: String,
        minlength: 1,
        maxlength: 500,
        required: true
    },
    price: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    allergenics: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Allergenic'
    }],
    ratings: [
        new mongoose.Schema({
            userId: {
                type: String,
                minlength: 5,
                maxlength: 25
            },
            rating: {
                type: Number,
                min: 1,
                max: 5,
                required: true
            },
            description: {
                type: String
            }
        })
    ]
});


export const Meal = mongoose.model<IMeal>('Meal', MealSchema);