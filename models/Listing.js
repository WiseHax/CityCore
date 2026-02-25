const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Listing = sequelize.define('Listing', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('Food', 'Services', 'Health', 'Shopping', 'Other'),
        allowNull: false
    },
    cuisine: {
        type: DataTypes.STRING,
        defaultValue: 'General'
    },
    description: DataTypes.TEXT,
    rating: {
        type: DataTypes.DECIMAL(3, 1),
        defaultValue: 0.0
    },
    reviewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    address: DataTypes.STRING,
    phone: DataTypes.STRING,
    website: DataTypes.STRING,
    // MySQL handles lat/lng as separate columns for easier distance calculation
    lat: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false
    },
    lng: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false
    },
    amenities: {
        type: DataTypes.TEXT, // Stored as JSON string
        get() {
            const val = this.getDataValue('amenities');
            return val ? JSON.parse(val) : [];
        },
        set(val) {
            this.setDataValue('amenities', JSON.stringify(val));
        }
    },
    hours: DataTypes.STRING,
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = Listing;
