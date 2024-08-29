import * as dotenv from "dotenv";

dotenv.config();

if (
    !process.env.MONGO_URI ||
    !process.env.DB_NAME ||
    !process.env.TON_API_KEY ||
    !process.env.PRODUCT_ADDRESS
) {
    throw Error('No environment variable found!');
};

import Database from "./libs/database";

(async () => {
    const instance = Database.getInstance();
    const db = await instance.getDb();
    const analystCollection = db.collection("analysts");

    await analystCollection.createIndex({ analyst_id: 1, analyst_time: 1 }, { unique: true });
})();

import './analysis/users';