#!/usr/bin/env node
/**
 * scripts/seed-user.js
 *
 * Usage:
 *   node scripts/seed-user.js --name "Mayank" --email "mayankluthyagico@gmail.com" --username "mayankluthyagico@gmail.com" --password "secret" [--id 6908d55037739d6419b388bb] [--db your-db-name]
 *
 * The script reads `MONGODB_URI` from the environment or from a `.env` file (via dotenv).
 * It hashes the provided password using bcrypt and inserts a document into the `users` collection.
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Load .env if present
if (fs.existsSync('.env')) {
    require('dotenv').config();
}

function parseArgs() {
    const args = process.argv.slice(2);
    const out = {};
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (!a.startsWith('--')) continue;
        const key = a.slice(2);
        const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : undefined;
        out[key] = val === undefined ? true : val;
        if (val !== undefined) i++;
    }
    return out;
}

async function main() {
    const argv = parseArgs();

    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        console.error('Error: MONGODB_URI not set. Add it to your environment or .env file.');
        process.exit(1);
    }

    const name = argv.name || argv.n || 'Test User';
    const email = argv.email || argv.e;
    const username = argv.username || argv.u || email;
    const password = argv.password || argv.p;
    const id = argv.id; // optional
    const dbName = argv.db; // optional

    if (!email || !password) {
        console.error('Usage: node scripts/seed-user.js --name "Name" --email "email@example.com" --password "secret" [--id <hexObjectId>] [--db <dbName>]');
        process.exit(1);
    }

    try {
        console.log('Hashing password...');
        const hashed = await bcrypt.hash(password, 10);

        console.log('Connecting to MongoDB...');
        const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();

        const db = dbName ? client.db(dbName) : client.db();
        const users = db.collection('users');

        const doc = {
            name,
            email,
            username,
            password: hashed,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (id) {
            try {
                doc._id = new ObjectId(id);
            } catch (err) {
                console.warn('Warning: provided id is not a valid ObjectId. Ignoring.');
            }
        }

        const existing = await users.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            console.log('A user with that email or username already exists. Updating password and timestamps instead.');
            await users.updateOne({ _id: existing._id }, { $set: { password: hashed, updatedAt: new Date() } });
            console.log('Updated existing user:', existing._id.toString());
        } else {
            const res = await users.insertOne(doc);
            console.log('Inserted user with id:', res.insertedId.toString());
        }

        await client.close();
        console.log('Done.');
    } catch (err) {
        console.error('Error seeding user:', err);
        process.exit(1);
    }
}

main();
