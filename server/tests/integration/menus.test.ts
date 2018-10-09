import { Server } from 'http';
import request from 'supertest';
import { User } from '../../models/user';
import { authService } from '../../services/auth.service';
import { Meal } from '../../models/meal';
import mongoose from 'mongoose';
import { Allergenic } from '../../models/allergenic';
import { Menu, IMenu } from '../../models/menu';


describe('/api/menus', () => {
    let server: Server;
    let token: string;


    beforeEach(async () => {
        server = require('../../app');
        let user = new User({
            name: 'John Doh',
            email: 'john@doh.com',
        });
        token = await authService.createTokenForUser(user);
        token = `jwt-token=${token}`;
    });

    afterEach(async () => {
        await Allergenic.deleteMany({});
        await Meal.deleteMany({});
        await Menu.deleteMany({});
        server.close();
    });

    describe('GET /', () => {
        let exec = () => {
            return request(server)
                .get('/api/menus')
                .set('cookie', token);
        };

        it('should return status 401 when no valid jwt-token', async () => {
            token = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return an array of allergenics', async () => {
            const result = await Meal.insertMany([
                { type: 'From the kitchen', description: 'Example description', price: 2.5, allergenics: [], ratings: [] },
                { type: 'Snack of the day', description: 'Another example description', price: 4.5, allergenics: [], ratings: [] }
            ]);

            await Menu.insertMany([
                { date: new Date(2018, 0, 1), meals: [result[0].id, result[1].id] },
                { date: new Date(2018, 1, 2), meals: [] }
            ]);

            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.some((x: IMenu) => x.date instanceof Date && Array.isArray(x.meals)));
        });
    });

    describe('GET /:id', () => {
        let id: mongoose.Types.ObjectId | string;

        let exec = () => {
            return request(server)
                .get(`/api/menus/${id}`)
                .set('cookie', token);
        };

        beforeEach(async () => {
            const result = await Menu.insertMany([
                { date: new Date(2018, 1, 2), meals: [] }
            ]);
            id = result[0].id;
        });

        it('should return status 400 if the ReqParam is not a valid ObjectId', async () => {
            id = 'wrongId'
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if no menu with the given id was found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/menu with the given id/);
        });

        it('should return status 200 when successful', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return the a specific meal with the properties date and meals', async () => {
            const res = await exec();

            expect(res.body._id).toBe(id);
            expect(new Date(res.body.date)).toBeInstanceOf(Date);
            expect(Array.isArray(res.body.meals)).toBeTruthy();
        });
    });

    describe('POST /', () => {
        let date: Date | undefined;
        let meals: Array<mongoose.Types.ObjectId | string> | undefined = [];

        let exec = () => {
            return request(server)
                .post('/api/menus/')
                .send({ date, meals })
                .set('cookie', token);
        };

        beforeEach(async () => {
            const result = await Meal.insertMany([
                { type: 'From the kitchen', description: 'Example description', price: 2.5, allergenics: [], ratings: [] },
                { type: 'Snack of the day', description: 'Another example description', price: 4.5, allergenics: [], ratings: [] }
            ]);

            date = new Date(2018, 11, 24);
            meals = [result[0].id, result[1].id];
        });

        it('should return status 400 when the req.body is missing a date', async () => {
            date = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/date/);
        });

        it('should return status 400 when the req.body is missing a meals array', async () => {
            meals = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/meals/);
        });

        it('should return 400 if the date is already used', async () => {
            const res = await exec();
            const res2 = await exec();

            expect(res2.status).toBe(409);
            expect(res2.body.message).toMatch(/date already exists/);
        });

        it('should return status 400 when there are mealIds which are not valid mongoose-ObjectIds', async () => {
            meals!.push('invalidObjectId123');
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/is not a valid Id/);
        });

        it('shuold return 201 if successfully created', async () => {
            const res = await exec();
            expect(res.status).toBe(201);
        });

        it('should return the a specific meal with the properties _id, date, meals', async () => {
            const res = await exec();

            expect(mongoose.Types.ObjectId.isValid(res.body._id)).toBeTruthy();
            expect(new Date(res.body.date)).toBeInstanceOf(Date);
            expect(Array.isArray(res.body.meals)).toBeTruthy();
        });
    });


    describe('PUT /:id', () => {
        let date: Date | undefined;
        let meals: Array<mongoose.Types.ObjectId | string> | undefined = [];
        let id: mongoose.Types.ObjectId | undefined;

        let exec = () => {
            return request(server)
                .put(`/api/menus/${id}`)
                .send({ date, meals })
                .set('cookie', token);
        };

        beforeEach(async () => {
            const tempMeals = await Meal.insertMany([
                { type: 'From the kitchen', description: 'Example description', price: 2.5, allergenics: [], ratings: [] },
            ]);

            const menus = await Menu.insertMany([
                { date: new Date('2018-3-3'), meals: [] },
                { date: new Date('2042-3-3'), meals: [] }
            ]);

            date = new Date('2018-3-3');
            meals = [tempMeals[0].id];
            id = menus[0].id;
        });

        it('should return status 400 when the req.body is missing a date', async () => {
            date = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/date/);
        });

        it('should return status 400 when the req.body is missing a meals array', async () => {
            meals = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/meals/);
        });

        it('should return 400 if the date is already used', async () => {
            date = new Date('2042-3-3')
            const res = await exec();

            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/date already exists/);
        });

        it('should return status 400 when there are mealIds which are not valid mongoose-ObjectIds', async () => {
            meals!.push('invalidObjectId123');
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/is not a valid Id/);
        });

        it('should return 200 if successfully updated', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return the a specific meal with the properties _id, date, meals', async () => {
            const res = await exec();

            expect(mongoose.Types.ObjectId.isValid(res.body._id)).toBeTruthy();
            expect(new Date(res.body.date)).toBeInstanceOf(Date);
            expect(Array.isArray(res.body.meals)).toBeTruthy();
        });

        it('should have one meal and another date now', async () => {
            date = new Date('1999-3-3');
            const res = await exec();

            expect(new Date(res.body.date).getTime()).toBe(new Date('1999-3-3').getTime());
            expect(res.body.meals.length).toBe(1);
        });
    });

    describe('DELETE /:id', () => {
        let id: mongoose.Types.ObjectId | string;

        let exec = () => {
            return request(server)
                .delete(`/api/menus/${id}`)
                .set('cookie', token);
        };

        beforeEach(async () => {
            const menus = await Menu.insertMany([
                { date: new Date('2018-3-3'), meals: [] },
                { date: new Date('2042-3-3'), meals: [] }
            ]);

            id = menus[0].id;
        });

        it('should return status 400 if the ReqParam is not a valid ObjectId', async () => {
            id = 'wrongId'
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if no menu with the given id was found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/menu with the given id/);
        });

        it('should return status 200 and the deleted menu', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body._id).toEqual(id);
        });

        it('should not be able to find the delted menu', async () => {
            const res = await exec();
            const menu = await Menu.findById(id);

            expect(menu).not.toBeTruthy();
        });
    });
});