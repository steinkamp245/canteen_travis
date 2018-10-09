import { authService } from '../../../services/auth.service';
import { IUser } from '../../../models/user';


describe('authService.createTokenForUser', () => {
    it('should throw an error when no id is given', async () => {
        const user: Partial<IUser> = {
            name: 'John Doh', 
            email: 'john@doh.com'
        };
        try {
            const token = await authService.createTokenForUser(user);
            fail('Expected an error because the user has no id');
        }
        catch (err) {
            expect(true);
        }
    });


    it('should return a token', async () => {
        const user: Partial<IUser> = {
            id: '123JF92JSK1220KSL2',
            name: 'John Doh',
            email: 'john@doh.com'
        };

        const token = await authService.createTokenForUser(user);
        expect(typeof token).toEqual('string');
    });
}); 