import express from 'express';
import { Menu, validateReqBody } from '../models/menu';
import mongoose from 'mongoose';
import validateObjectId from '../services/validateObjectId';
import _ from 'lodash';

const router = express.Router();


router.get('/', async (req, res) => {
    const menus = await Menu
        .find()
        .populate('meals', '-__v');
    res.status(200).send(menus.map((menu) => _.pick(menu, ['_id', 'date', 'meals'])));
});

router.get('/:id', validateObjectId, async (req, res) => {
    const menu = await Menu
        .findById(req.params.id)
        .populate('meals', '-__v');
    if (!menu) return res.status(404).json({ message: 'An menu with the given id was not found' });
    res.send(_.pick(menu, ['_id', 'date', 'meals']));
});

router.post('/', async (req, res) => {
    const { error } = validateReqBody(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const tempDate = new Date(req.body.date);
    const today = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate());
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    const existingMenu = await Menu.findOne({ date: { "$gte": today, "$lt": tomorrow } });
    if (existingMenu) return res.status(409).json({ message: 'An menu with the given date already exists' });

    for (let meals of req.body.meals) {
        if (!mongoose.Types.ObjectId.isValid(meals))
            return res.status(400).json({ message: `${meals} is not a valid Id` });
    }

    const menu = new Menu(req.body);
    await menu.save();
    res.status(201).json(_.pick(menu, '_id', 'date', 'meals'));
});

router.put('/:id', validateObjectId, async (req, res) => {
    const { error } = validateReqBody(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const tempDate = new Date(req.body.date);
    const today = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate());
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    const existingMenu = await Menu.findOne({ date: { "$gte": today, "$lt": tomorrow } });
    if (existingMenu && existingMenu.id !== req.params.id) return res.status(409).json({ message: 'An menu with the given date already exists' });

    for (let meals of req.body.meals) {
        if (!mongoose.Types.ObjectId.isValid(meals))
            return res.status(400).json({ message: `${meals} is not a valid Id` });
    }

    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!menu) return res.status(404).json({ message: 'A menu with the given id was not found' });
    res.status(200).send(_.pick(menu, ['_id', 'date', 'meals']));
});

router.delete('/:id', validateObjectId, async (req, res) => {
    const menu = await Menu.findByIdAndRemove(req.params.id);
    if (!menu) return res.status(404).json({ message: 'An menu with the given id was not found' });
    res.status(200).send(_.pick(menu, ['_id', 'date', 'meals']))
});




export default router;
