import express from 'express';
import { Allergenic, IAllergenic, validateReqBody } from '../models/allergenic';
import validateObjectId from '../services/validateObjectId';
import _ from 'lodash';

const router = express.Router();


router.get('/', async (req, res) => {
    const allergenics = await Allergenic.find();
    res.send(allergenics.map((allergenic) => _.pick(allergenic, ['_id', 'name', 'picture'])));
});

router.get('/:id', validateObjectId, async (req, res) => {
    const allergenic = await Allergenic.findById(req.params.id) as IAllergenic;
    if (!allergenic) return res.status(404).json({ message: 'An allergenic with the given id was not found' });
    res.send(_.pick(allergenic, ['_id', 'name', 'picture']));
});

router.post('/', async (req, res) => {
    const { error } = validateReqBody(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const existingAllergenic = await Allergenic.findOne({ name: req.body.name });
    if (existingAllergenic) return res.status(409).json({ message: 'An allergenic with the given name already exists' });

    const allergenic = new Allergenic(req.body);
    await allergenic.save();
    res.status(201).json(_.pick(allergenic, ['_id', 'name', 'picture']));
});

router.put('/:id', validateObjectId, async (req, res) => {
    const { error } = validateReqBody(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const allergenic = await Allergenic.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!allergenic) return res.status(404).json({ message: 'An allergenic with the given id was not found' });
    res.status(200).send(_.pick(allergenic, ['_id', 'name', 'picture']));
});

router.delete('/:id', validateObjectId, async (req, res) => {
    const allergenic = await Allergenic.findByIdAndRemove(req.params.id);
    if (!allergenic) return res.status(404).json({ message: 'An allergenic with the given id was not found' });
    res.status(200).send(_.pick(allergenic, ['_id', 'name', 'picture']))
});


export default router;
