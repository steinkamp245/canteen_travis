import mongoose from 'mongoose';
import config from 'config';
import bluebird from 'bluebird';



export default function () {
    const Fawn = require('fawn');
    const dbURL = config.get('db') as string;

    mongoose.Promise = bluebird;
    mongoose.connect(dbURL, { useNewUrlParser: true })
        .then(() => {
            Fawn.init(mongoose);
            console.log(`Connected to ${dbURL}...`);
        });
}