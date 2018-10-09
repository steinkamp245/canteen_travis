import express from 'express';
import { Meal, validateReqBody, validateRatingReqBody } from '../models/meal';
import validateObjectId from '../services/validateObjectId';
import _ from 'lodash';
import mongoose from 'mongoose';



const router = express.Router();

router.get('/', async (req, res) => {
    const meals = await Meal.
        find()
        .populate('allergenics', '-__v')
        .populate('ratings', '-__v')
    res.send(meals.map((meal) => _.pick(meal, ['_id', 'type', 'description', 'price', 'allergenics', 'ratings'])));
});

router.get('/:id', validateObjectId, async (req, res) => {
    const meal = await Meal
        .findById(req.params.id)
        .populate('allergenics', '-__v');
    if (!meal) return res.status(404).json({ message: 'An meal with the given id was not found' });
    res.send(_.pick(meal, ['_id', 'type', 'description', 'price', 'allergenics', 'ratings']));
});

router.post('/', async (req, res) => {
    const { error } = validateReqBody(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    for (let allergenic of req.body.allergenics) {
        if (!mongoose.Types.ObjectId.isValid(allergenic))
            return res.status(400).json({ message: `${allergenic} is not a valid Id` });
    }

    const meal = new Meal({
        type: req.body.type,
        description: req.body.description,
        price: req.body.price,
        allergenics: req.body.allergenics
    });
    await meal.save();
    res.status(201).send(_.pick(meal, ['_id', 'type', 'description', 'price', 'allergenics']));
});

router.post('/ratings/:id', validateObjectId, async (req, res) => {
    const { error } = validateRatingReqBody(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: 'A meal with the given id was not found' });

    for (let rating of meal.ratings) {
        if (rating.userId === req.body.userId) return res.status(400).json({ message: 'You have already rated the meal' });
    }

    meal.ratings.push(req.body);
    await meal.save();
    res.status(201).send(meal.ratings.find(rating => rating.userId === req.body.userId));
});

router.put('/:id', validateObjectId, async (req, res) => {
    const { error } = validateReqBody(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    for (let allergenic of req.body.allergenics) {
        if (!mongoose.Types.ObjectId.isValid(allergenic))
            return res.status(400).json({ message: `${allergenic} is not a valid Id` });
    }

    const meal = await Meal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!meal) return res.status(404).json({ message: 'A meal with the given id was not found' });
    res.status(200).send(_.pick(meal, ['_id', 'type', 'description', 'price', 'allergenics']));
});


router.put('/ratings/:id', validateObjectId, async (req, res) => {
    const { error } = validateRatingReqBody(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: 'A meal with the given id was not found' });

    let rating = meal.ratings.find(rating => rating.userId === req.body.userId);
    if (!rating) return res.status(404).json({ message: 'A rating with the given id was not found' });

    rating.set(req.body);
    await meal.save();
    return res.status(200).send(rating);
});

router.delete('/:id', validateObjectId, async (req, res) => {
    const meal = await Meal.findByIdAndRemove(req.params.id);
    if (!meal) return res.status(404).json({ message: 'A meal with the given id was not found' });
    res.status(200).send(_.pick(meal, ['_id', 'type', 'description', 'price', 'allergenics']))
});

router.delete('/ratings/:id/:userId', validateObjectId, async (req, res) => {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: 'A meal with the given id was not found' });

    let rating = meal.ratings.find(rating => rating.userId === req.params.userId);
    if (!rating) return res.status(404).json({ message: 'A rating with the given id was not found' });

    rating.remove();
    await meal.save();
    return res.status(200).send(rating);
});
export default router;

