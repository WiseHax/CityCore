const { Sequelize } = require('sequelize');
require('dotenv').config();

// Support for both individual params (local) and Connection String (Cloud)
const sequelize = process.env.DATABASE_URL 
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
            ssl: {
                rejectUnauthorized: false // Required for most cloud DBs
            }
        }
    })
    : new Sequelize(
        process.env.DB_NAME || 'cityguide',
        process.env.DB_USER || 'root',
        process.env.DB_PASS || '',
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: 'mysql',
            logging: false,
        }
    );

module.exports = sequelize;
