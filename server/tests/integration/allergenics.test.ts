import { Server } from 'http';
import request from 'supertest';
import { User } from '../../models/user';
import { authService } from '../../services/auth.service';
import { Allergenic, IAllergenic } from '../../models/allergenic';
import mongoose from 'mongoose';



describe('/api/allergenics', () => {
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
        server.close();
        await Allergenic.deleteMany({});
    });

    describe('GET /', () => {
        let exec = () => {
            return request(server)
                .get('/api/allergenics')
                .set('cookie', token);
        };

        it('should return status 401 when no valid jwt-token', async () => {
            token = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return an array of allergenics', async () => {
            await Allergenic.insertMany([
                { name: 'Nut', picture: 'VGVzdDEyMyBIYWxsbw==' },
                { name: 'Gluten', picture: 'VGVzdDEyMyBIYWxsbw==' },
                { name: 'Lactose', picture: 'VGVzdDEyMyBIYWxsbw==' }
            ]);

            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body.some((x: IAllergenic) => x.name === 'Gluten' && typeof x.picture === 'string')).toBeTruthy();
            expect(res.body.some((x: IAllergenic) => x.name === 'Lactose' && typeof x.picture === 'string')).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        it('should return status 400 if the ReqParam is not a valid ObjectId', async () => {
            const res = await request(server)
                .get('/api/allergenics/wronId123')
                .set('cookie', token);

            expect(res.status).toBe(400);
        });

        it('should return 404 if no allergenic with the given id was found', async () => {
            const res = await request(server)
                .get(`/api/allergenics/${mongoose.Types.ObjectId()}`)
                .set('cookie', token);

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/allergenic with the given id/);
        });

        it('should return the a specific allergenic', async () => {
            const allergenics = await Allergenic.insertMany([
                { name: 'Nut', picture: 'VGVzdDEyMyBIYWxsbw==' },
                { name: 'Gluten', picture: 'VGVzdDEyMyBIYWxsbw==' },
                { name: 'Lactose', picture: 'VGVzdDEyMyBIYWxsbw==' }
            ]);

            const res = await request(server)
                .get(`/api/allergenics/${allergenics[1].id}`)
                .set('cookie', token);

            expect(res.status).toBe(200);
            expect(res.body._id).toBe(allergenics[1].id);
        });
    });

    describe('POST /', () => {
        let name: string | undefined;
        let picture: string | undefined;

        let exec = () => {
            return request(server)
                .post('/api/allergenics')
                .send({ name, picture })
                .set('cookie', token);
        };

        beforeEach(async () => {
            name = 'Gluten';
            picture = 'VGVzdDEyMyBIYWxsbw==';
        });

        it('should return status 400 when the req.body is missing a name', async () => {
            name = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/name/);
        });

        it('should return status 400 when the req.body.picture is not a valid base64 string', async () => {
            picture = 'NoValidBase64String';
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/must be a valid base64 string/);
        });

        it('should return status 409 when a allergenic with the same name already exists', async () => {
            await Allergenic.insertMany([
                { name: 'Gluten', picture: 'VGVzdDEyMyBIYWxsbw==' },
            ]);
            const res = await exec();

            expect(res.status).toBe(409);
        });
        
        it('should return status 201 when successfully created', async () => {
            const res = await exec();
            expect(res.status).toBe(201);
        });

        it('should return the created allergenic when successfully', async () => {
            const res = await exec();

            expect(res.body.name).toEqual('Gluten');
            expect(res.body.picture).toEqual('VGVzdDEyMyBIYWxsbw==');
            expect(res.body._id).toBeTruthy();
        });

        it('should find the created allergenic on the database', async () => {
            const res = await exec();
            const allergenic = await Allergenic.findOne({ name: 'Gluten' }) as IAllergenic;

            expect(allergenic.name).toEqual('Gluten');
        });
    });

    describe('PUT /:id', () => {
        let name: string | undefined;
        let picture: string | undefined;
        let id: mongoose.Types.ObjectId | string;
        let allergenics: IAllergenic[];

        let exec = () => {
            return request(server)
                .put(`/api/allergenics/${id}`)
                .send({ name, picture })
                .set('cookie', token);
        };

        beforeEach(async () => {
            allergenics = await Allergenic.insertMany([
                { name: 'Nut', picture: 'VGVzdDEyMyBIYWxsbw==' },
                { name: 'Gluten', picture: 'VGVzdDEyMyBIYWxsbw==' },
                { name: 'Lactose', picture: 'VGVzdDEyMyBIYWxsbw==' }
            ]);
            name = 'newName';
            picture = 'VGVzdDEyMyBIYWxsbw==';
            id = allergenics[1].id;
        });


        it('should return status 400 if the ReqParam is not a valid ObjectId', async () => {
            id = 'wrongId'
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if no allergenic with the given id was found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/allergenic with the given id/);
        });

        it('should return status 400 when the req.body is missing a name', async () => {
            name = undefined;
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/name/);
        });

        it('should return status 400 when the req.body.picture is not a valid base64 string', async () => {
            picture = 'NoValidBase64String';
            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/must be a valid base64 string/);
        });

        it('should return status 200 and the updated allergenic', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.name).toEqual('newName');
        });

        it('should find the updated allergenic on the database', async () => {
            const res = await exec();
            const allergenic = await Allergenic.findOne({ name: 'newName' }) as IAllergenic;

            expect(allergenic.name).toEqual('newName');
        });
    });

    describe('DELETE /:id', async () => {
        let id: mongoose.Types.ObjectId | string;
        let allergenics: IAllergenic[];
        
        let exec = () => {
            return request(server)
                .delete(`/api/allergenics/${id}`) 
                .set('cookie', token);
        };

        beforeEach(async () => {
            allergenics = await Allergenic.insertMany([
                { name: 'Nut', picture: 'VGVzdDEyMyBIYWxsbw==' },
                { name: 'Gluten', picture: 'VGVzdDEyMyBIYWxsbw==' },
                { name: 'Lactose', picture: 'VGVzdDEyMyBIYWxsbw==' }
            ]);
            id = allergenics[1].id;
        });

        it('should return status 400 if the ReqParam is not a valid ObjectId', async () => {
            id = 'wrongId'
            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if no allergenic with the given id was found', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/allergenic with the given id/);
        });

        it('should return status 200 and the deleted allergenic', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body._id).toEqual(allergenics[1].id);
        });

        it('should not be able to find the delted allergenic', async () => {
            const res = await exec();
            const allergenic = await Allergenic.findById(allergenics[1].id);

            expect(allergenic).not.toBeTruthy();
        });
    });
});