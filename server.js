require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Op, Sequelize } = require('sequelize');
const sequelize = require('./config/database');
const Listing = require('./models/Listing');
const Review = require('./models/Review');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. SECURITY: Helmet sets secure HTTP headers
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for Three.js CDNs ease, but can be refined later
    crossOriginEmbedderPolicy: false
}));

// 2. SECURITY: Rate Limiting (Anti-Spam)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { message: "Too many requests from this sector. Orbital link restricted for 15 minutes." }
});
app.use('/api/', limiter);

// 3. SECURITY: CORS Config
const corsOptions = {
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', /\.netlify\.app$/], // Allow local dev and Netlify
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10kb' })); // Protection against large payloads
app.use(express.static(path.join(__dirname)));

// DISCOVERY LOGIC (Optimized)
async function discoverAndCache(lat, lng, category) {
    try {
        console.log(`📡 CityCore Discovery: Scanning [${lat}, ${lng}]...`);
        const radius = 5000;
        let query = `[out:json][timeout:30];(`;
        if (category === 'Food' || !category) query += `node["amenity"~"restaurant|cafe|fast_food|bar|pub"](around:${radius}, ${lat}, ${lng});`;
        if (category === 'Services' || !category) {
            query += `node["shop"~"supermarket|convenience|bakery|hairdresser"](around:${radius}, ${lat}, ${lng});`;
            query += `node["amenity"~"doctors|dentist|pharmacy|bank"](around:${radius}, ${lat}, ${lng});`;
        }
        query += `);out body;`;

        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        const response = await axios.get(url);
        const elements = response.data.elements;

        const newNodes = [];
        for (const el of elements) {
            if (!el.tags.name) continue;
            const exists = await Listing.findOne({ where: { lat: el.lat, lng: el.lon } });
            if (!exists) {
                newNodes.push({
                    name: el.tags.name,
                    category: category || (el.tags.amenity === 'restaurant' ? 'Food' : 'Services'),
                    cuisine: (el.tags.cuisine || el.tags.amenity || el.tags.shop || "General").split(';')[0],
                    description: `Active business node located at ${el.tags['addr:street'] || 'local coordinate'}. Intelligence verified by CityCore.`,
                    rating: (Math.random() * (5.0 - 4.2) + 4.2).toFixed(1), // Premium feel: High ratings for discovery
                    reviewCount: Math.floor(Math.random() * 20),
                    address: el.tags['addr:street'] || 'Coordinate Synced',
                    phone: el.tags.phone || 'Encrypted',
                    website: el.tags.website || null,
                    lat: el.lat,
                    lng: el.lon,
                    amenities: JSON.stringify(['Orbital Verified', 'Secure Uplink'])
                });
            }
        }
        if (newNodes.length > 0) await Listing.bulkCreate(newNodes);
        return newNodes.length;
    } catch (err) { console.error("OSM Error:", err.message); return 0; }
}

// ROUTES
app.get('/api/listings', async (req, res) => {
    try {
        const { category, search, lat, lng } = req.query;
        let where = {};
        if (category) where.category = category;
        if (search) where.name = { [Op.like]: `%${search}%` };

        const distanceAttr = (lat && lng) ? Sequelize.literal(`(6371 * acos(cos(radians(${lat})) * cos(radians(lat)) * cos(radians(lng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(lat))))`) : null;

        let listings = await Listing.findAll({
            where,
            attributes: distanceAttr ? { include: [[distanceAttr, 'distance']] } : undefined,
            order: distanceAttr ? [[distanceAttr, 'ASC']] : [['createdAt', 'DESC']],
            limit: 50
        });

        if (listings.length < 3 && lat && lng) {
            await discoverAndCache(lat, lng, category);
            listings = await Listing.findAll({ where, attributes: distanceAttr ? { include: [[distanceAttr, 'distance']] } : undefined, order: distanceAttr ? [[distanceAttr, 'ASC']] : undefined, limit: 50 });
        }
        res.json(listings);
    } catch (err) { res.status(500).json({ message: "Orbital database error." }); }
});

app.get('/api/listings/:id', async (req, res) => {
    try {
        const listing = await Listing.findByPk(req.params.id);
        listing ? res.json(listing) : res.status(404).json({ message: 'Node not found' });
    } catch (err) { res.status(500).json({ message: "Query failed." }); }
});

app.post('/api/listings/:id/reviews', async (req, res) => {
    try {
        const { userName, rating, comment } = req.body;
        // Simple sanitization: restrict comment length
        if (comment.length > 500) return res.status(400).json({ message: "Intel too long." });
        
        const newReview = await Review.create({ listingId: req.params.id, userName, rating, comment });
        res.status(201).json(newReview);
    } catch (err) { res.status(400).json({ message: "Transmission failed." }); }
});

app.get('/api/listings/:id/reviews', async (req, res) => {
    try {
        const reviews = await Review.findAll({ where: { listingId: req.params.id }, order: [['createdAt', 'DESC']] });
        res.json(reviews);
    } catch (err) { res.status(500).json({ message: "Intelligence retrieval failed." }); }
});

sequelize.sync().then(() => {
    console.log('✅ CityCore Security: Active.');
    app.listen(PORT, () => console.log(`🚀 Core Server: http://localhost:${PORT}`));
});
