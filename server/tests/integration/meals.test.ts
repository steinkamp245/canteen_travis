import { Server } from 'http';
import request from 'supertest';
import { User } from '../../models/user';
import { authService } from '../../services/auth.service';
import { Meal, IMeal, IRating } from '../../models/meal';
import mongoose from 'mongoose';
import { IAllergenic, Allergenic } from '../../models/allergenic';


describe('/api/meals', () => {
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
        server.close();
    });

    describe('GET /', () => {
        let exec = () => {
            return request(server)
                .get('/api/meals')
                .set('cookie', token);
        };

        it('should return status 401 when no valid jwt-token', async () => {
            token = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return an array of allergenics', async () => {
            await Meal.insertMany([
                { type: 'From the kitchen', description: 'Example description', price: 2.5, allergenics: [], ratings: [] },
                { type: 'Snack of the day', description: 'Another example description', price: 4.5, allergenics: [], ratings: [] }
            ]);

            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.some((x: IMeal) =>
                x.type === 'From the kitchen' &&
                typeof x.description === 'string' &&
                typeof x.price === 'number' &&
                Array.isArray(x.allergenics) &&
                Array.isArray(x.ratings))).toBeTruthy();
            expect(res.body.some((x: IMeal) =>
                x.type === 'Snack of the day' &&
                typeof x.description === 'string' &&
                typeof x.price === 'number' &&
                Array.isArray(x.allergenics) &&
                Array.isArray(x.ratings))).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        let id: mongoose.Types.ObjectId | string;
        let meals: IMeal[];
        let allergenics: IAllergenic[];

        let exec = () => {
            return request(server)
                .get(`/api/meals/${id}`)
                .set('cookie', token);
        };

        beforeEach(async () => {
            allergenics = await Allergenic.insertMany([
                { name: 'Nut', picture: 'VGVzdDEyMyBIYWxsbw==' }
            ]);

            meals = await Meal.insertMany([
                { type: 'From the kitchen', description: 'Example description', price: 2.5, allergenics: [allergenics[0].id], ratings: [{ userId: 'randomId221312', rating: 4, description: 'great food - loved the beans' }] }
            ]);
            id = meals[0].id;
        });

        it('should return status 400 if the ReqParam is not a valid ObjectId', async () => {
            id = 'wrongId'
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if no meal with the given id was found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/meal with the given id/);
        });

        it('should return status 200 when successful', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return the a specific meal with the properties type, price, allergenics and ratings', async () => {
            const res = await exec();

            expect(res.body._id).toBe(meals[0].id);
            expect(typeof res.body.description).toEqual('string');
            expect(typeof res.body.type).toEqual('string');
            expect(typeof res.body.price).toEqual('number');
            expect(Array.isArray(res.body.allergenics)).toBeTruthy();
            expect(Array.isArray(res.body.ratings)).toBeTruthy();
        });

        it('should contain a specific allergenicId', async () => {
            const res = await exec();
            expect(res.body.allergenics[0]._id).toBe(allergenics[0].id);
        });

        it('should have a rating between 1 and 5 and a specific description', async () => {
            const res = await exec();

            expect(res.body.ratings[0].rating).toBeGreaterThanOrEqual(1);
            expect(res.body.ratings[0].rating).toBeLessThanOrEqual(5);
            expect(res.body.ratings[0].description).toMatch(/loved the beans/);
        });
    });

    describe('POST /', () => {
        let type: string | undefined;
        let description: string | undefined;
        let price: number | undefined;
        let allergenics: Array<mongoose.Types.ObjectId | string> | undefined = [];

        let exec = () => {
            return request(server)
                .post('/api/meals/')
                .send({ type, description, price, allergenics })
                .set('cookie', token);
        };

        beforeEach(async () => {
            const result = await Allergenic.insertMany([
                { name: 'Nut', picture: 'VGVzdDEyMyBIYWxsbw==' }
            ]);
            type = 'From the kitchen';
            description = 'Example description';
            price = 4
            allergenics = [result[0].id];
        });

        it('should return status 400 when the req.body is missing a type', async () => {
            type = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/type/);
        });

        it('should return status 400 when the req.body is missing a description', async () => {
            description = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/description/);
        });

        it('should return status 400 when the req.body is missing a price', async () => {
            price = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/price/);
        });

        it('should return status 400 when the req.body is missing an allergenicIds array', async () => {
            allergenics = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/allergenics/);
        });

        it('should return status 400 when there allergenicIds which are not valid mongoose-ObjectIds', async () => {
            allergenics!.push('invalidObjectId123');
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/is not a valid Id/);
        });

        it('should return status 400 if the meal_type is not an existing one', async () => {
            type = 'Not existing meal_type';
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/must be one of/)
        });

        it('shuold return 201 if successfully created', async () => {
            const res = await exec();
            expect(res.status).toBe(201);
        });

        it('should return the a specific meal with the properties _id, type, description, price, allergenics', async () => {
            const res = await exec();

            expect(mongoose.Types.ObjectId.isValid(res.body._id)).toBeTruthy();
            expect(typeof res.body.type).toEqual('string');
            expect(typeof res.body.description).toEqual('string');
            expect(typeof res.body.price).toEqual('number');
            expect(Array.isArray(res.body.allergenics)).toBeTruthy();
        });
    });

    describe('POST /ratings/:id', () => {
        let id: mongoose.Types.ObjectId | string;
        let userId: string | undefined;
        let rating: number | undefined;
        let description: string | undefined;

        let exec = () => {
            return request(server)
                .post(`/api/meals/ratings/${id}`)
                .send({ userId, rating, description })
                .set('cookie', token);
        };

        beforeEach(async () => {
            const meal = await Meal.insertMany([
                { type: 'From the kitchen', description: 'Example description', price: 4, allergenics: [], ratings: [] }
            ]);
            id = meal[0].id;

            userId = '12345randomId';
            rating = 4;
            description = 'This is a random description';
        });

        it('should return status 400 if the ReqParam is not a valid ObjectId', async () => {
            id = 'wrongId'
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 when the req.body is missing a userId', async () => {
            userId = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/userId/);
        });

        it('should return status 400 when the req.body is missing a rating', async () => {
            rating = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/rating/);
        });

        it('should return status 400 when the userId has less than 5 chars', async () => {
            userId = 'x'.repeat(4);
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/at least 5 characters/);
        });

        it('should return status 400 when the userId has more than 25 chars', async () => {
            userId = 'x'.repeat(26);
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/less than or equal to 25 characters/);
        });

        it('should return status 400 when the rating is smaller than 1', async () => {
            rating = 0;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/larger than or equal to 1/);
        });

        it('should return status 400 when the rating is smaller than 1', async () => {
            rating = 6;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/less than or equal to 5/);
        });

        it('should return status 400 when the rating is not an Integer', async () => {
            rating = 3.5;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/must be an integer/);
        });

        it('should return 404 if no meal with the given id was found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/meal with the given id/);
        });

        it('should return 400 if the user already rated the menu', async () => {
            const res1 = await exec();
            const res2 = await exec();

            expect(res2.status).toBe(400);
            expect(res2.body.message).toMatch(/already rated the meal/);
        });

        it('should return status 201 if a rating was successfully created', async () => {
            const res = await exec();
            expect(res.status).toBe(201);
        });

        it('should return a specific meal with the properties _id, type, description, rating', async () => {
            const res = await exec();
            
            expect(mongoose.Types.ObjectId.isValid(res.body._id)).toBeTruthy();
            expect(typeof res.body.userId).toEqual('string');
            expect(typeof res.body.rating).toEqual('number');
            expect(typeof res.body.description).toEqual('string');
        });

        it('should return a specific meal which contains the rating which was created', async () => {
            const res = await exec();
            const meal = await Meal.findById(id);
            const ratingId = meal!.ratings[0].id

            expect(res.body._id).toMatch(ratingId);
        });
    });


    describe('PUT /:id', () => {
        let id: mongoose.Types.ObjectId | string;
        let type: string | undefined;
        let description: string | undefined;
        let price: number | undefined;
        let allergenics: Array<mongoose.Types.ObjectId | string> | undefined = [];

        let exec = () => {
            return request(server)
                .put(`/api/meals/${id}`)
                .send({ type, description, price, allergenics })
                .set('cookie', token);
        };

        beforeEach(async () => {
            const result = await Allergenic.insertMany([
                { name: 'Nut', picture: 'VGVzdDEyMyBIYWxsbw==' },
                { name: 'Gluten' }
            ]);

            type = 'From the kitchen';
            description = 'Example description';
            price = 4
            allergenics = [result[0].id, result[1].id];

            const meal = await Meal.insertMany([
                { type, description, price, allergenics: [result[0].id], ratings: [] }
            ]);

            id = meal[0].id;
        });

        it('should return status 400 if the ReqParam is not a valid ObjectId', async () => {
            id = 'wrongId'
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 when the req.body is missing a type', async () => {
            type = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/type/);
        });

        it('should return status 400 when the req.body is missing a description', async () => {
            description = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/description/);
        });

        it('should return status 400 when the req.body is missing a price', async () => {
            price = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/price/);
        });

        it('should return status 400 when the req.body is missing an allergenicIds array', async () => {
            allergenics = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/allergenics/);
        });

        it('should return status 400 when there allergenicIds which are not valid mongoose-ObjectIds', async () => {
            allergenics!.push('invalidObjectId123');
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/is not a valid Id/);
        });

        it('should return status 400 if the meal_type is not an existing one', async () => {
            type = 'Not existing meal_type';
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/must be one of/)
        });

        it('should return status 400 if the price is smaller than 0', async () => {
            price = -200;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/larger than or equal to 0/);
        });

        it('should return status 400 if the price is higher than 100', async () => {
            price = 5000;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/less than or equal to 100/);
        });

        it('should return 404 if no meal with the given id was found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/meal with the given id/);
        });

        it('should return status 200 if successfully updated', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });

        it('should contain the new values', async () => {
            type = 'Meat free';
            description = 'New description';
            price = 4;
            const res = await exec();

            expect(res.body.type).toMatch('Meat free');
            expect(res.body.description).toMatch('New description');
            expect(res.body.price).toBe(4);
            expect(res.body.allergenics.length).toBe(2);
        });
    });


    describe('PUT /ratings/:id', () => {
        let id: mongoose.Types.ObjectId | string;
        let userId: string | undefined;
        let rating: number | undefined;
        let description: string | undefined;

        let exec = () => {
            return request(server)
                .put(`/api/meals/ratings/${id}`)
                .send({ userId, rating, description })
                .set('cookie', token);
        };

        beforeEach(async () => {
            const meal = await Meal.insertMany([
                { type: 'From the kitchen', description: 'Example description', price: 4, allergenics: [], ratings: [{ userId: '12345randomId', rating: 4, description: 'great food - loved the beans' }] }
            ]);
            id = meal[0].id;

            userId = meal[0].ratings[0].userId;
            rating = 5;
            description = 'This is a new description';
        });

        it('should return status 400 if the ReqParam is not a valid ObjectId', async () => {
            id = 'wrongId'
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 when the req.body is missing a userId', async () => {
            userId = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/userId/);
        });

        it('should return status 400 when the req.body is missing a rating', async () => {
            rating = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/rating/);
        });

        it('should return status 400 when the userId has less than 5 chars', async () => {
            userId = 'x'.repeat(4);
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/at least 5 characters/);
        });

        it('should return status 400 when the userId has more than 25 chars', async () => {
            userId = 'x'.repeat(26);
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/less than or equal to 25 characters/);
        });

        it('should return status 400 when the rating is smaller than 1', async () => {
            rating = 0;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/larger than or equal to 1/);
        });

        it('should return status 400 when the rating is smaller than 1', async () => {
            rating = 6;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/less than or equal to 5/);
        });

        it('should return status 400 when the rating is not an Integer', async () => {
            rating = 3.5;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/must be an integer/);
        });

        it('should return 404 if no meal with the given id was found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/meal with the given id/);
        });

        it('should return status 404 if for this meal no rating with the given id was found', async () => {
            userId = 'invalidId321';
            const res = await exec();

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/rating with the given id was not found/);
        });

        it('should return status 200 if a rating was successfully updated', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
        });


        it('should return the updated rating', async () => {
            const res = await exec();

            expect(mongoose.Types.ObjectId.isValid(res.body._id)).toBeTruthy();
            expect(typeof res.body.description).toEqual('string');
            expect(typeof res.body.rating).toEqual('number');
            expect(typeof res.body.userId).toBeTruthy();
        });

        it('should return a specific meal which contains the updated rating', async () => {
            const res = await exec();

            expect(res.body.userId).toMatch('12345randomId');
            expect(res.body.rating).toBe(5);
            expect(res.body.description).toMatch(/new description/);
        });
    });


    describe('DELETE /:id', () => {
        let id: mongoose.Types.ObjectId | string;

        let exec = () => {
            return request(server)
                .delete(`/api/meals/${id}`)
                .set('cookie', token);
        };

        beforeEach(async () => {
            const meal = await Meal.insertMany([
                { type: 'From the kitchen', description: 'Example description', price: 4, allergenics: [], ratings: [] }
            ]);
            id = meal[0].id;
        });

        it('should return status 400 if the ReqParam is not a valid ObjectId', async () => {
            id = 'wrongId'
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if no meal with the given id was found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/meal with the given id/);
        });

        it('should return status 200 and the deleted meal', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body._id).toEqual(id);
        });

        it('should not be able to find the delted allergenic', async () => {
            const res = await exec();
            const allergenic = await Allergenic.findById(id);

            expect(allergenic).not.toBeTruthy();
        });
    });

    describe('DELETE /ratings/:id/:userId', () => {
        let id: mongoose.Types.ObjectId | string;
        let userId: string;
        let ratingId: mongoose.Types.ObjectId;

        let exec = () => {
            return request(server)
                .delete(`/api/meals/ratings/${id}/${userId}`)
                .set('cookie', token);
        };

        beforeEach(async () => {
            const meal = await Meal.insertMany([
                {
                    type: 'From the kitchen',
                    description: 'Example description',
                    price: 4,
                    allergenics: [],
                    ratings:
                        [
                            { userId: '12345randomId', rating: 4, description: 'great food - loved the beans' },
                            { userId: '12345otherId', rating: 1, description: 'did not like it' }
                        ]
                }
            ]);
            id = meal[0].id;
            userId = meal[0].ratings[0].userId;
            ratingId = meal[0].ratings[0].id;
        });

        it('should return status 400 if the ReqParam.id is not a valid ObjectId', async () => {
            id = 'wrongId'
            const res = await exec();

            expect(res.status).toBe(400);
        })

        it('should return 404 if no meal with the given id was found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/meal with the given id/);
        });

        it('should return status 404 if for this meal no rating with the given id was found', async () => {
            userId = 'invalidId321';
            const res = await exec();

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/rating with the given id was not found/);
        });

        it('should return status 200 and the deleted rating', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body._id).toEqual(ratingId);
        });

        it('should not be able to find the delted rating', async () => {
            const res = await exec();
            const meal = await Meal.findById(id);
            const rating = meal!.ratings.find(rating => rating.id === ratingId);

            expect(rating).not.toBeTruthy();
        });
    });
});