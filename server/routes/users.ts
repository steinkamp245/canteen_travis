import express from 'express';
import { User, validateReqBody } from '../models/user';
import { authService } from '../services/auth.service';



const router = express.Router();

router.post('/sign-in', async (req, res) => {
    const { error } = validateReqBody(req.body);
    if (error) return res.status(404).json({ message: error.details[0].message });

    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'no user with the given email found' });

    try {
        const valid = await authService.validatePassword(req.body.password, user.password);
        if(!valid) throw new Error('password or email not valid');
        const token = await authService.createTokenForUser(user);
        res.cookie('jwt-token', token);
        res.status(200).send();
    }
    catch (err) {
        return res.status(401).json({ message: err.message });
    }
});

router.get('/sign-out', (req, res) => {
    res.clearCookie('jwt-token');
    res.status(200).send();
});

export default router;