import mongoose from 'mongoose';

let isConnected;

export const connectToDatabase = async (uri) => {
    if (isConnected) {
        console.log('=> using existing database connection');
        return;
    }

    console.log('=> using new database connection');
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    isConnected = mongoose.connection.readyState;
};
