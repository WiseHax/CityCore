require('dotenv').config();
const axios = require('axios');
const sequelize = require('./config/database');
const Listing = require('./models/Listing');

// CONFIGURATION: Updated to your current location (Dasmariñas area) 📍
const LAT = 14.3318; 
const LNG = 120.9351;
const RADIUS = 10000; // 10km radius para maraming makuha

async function seedDatabase() {
    try {
        await sequelize.sync({ force: true }); 
        console.log('🗑️  CityCore: Local Database Purged.');

        console.log(`🌍 CityCore: Scanning planetary nodes near [${LAT}, ${LNG}]...`);
        
        const query = `
            [out:json][timeout:60];
            (
              node["amenity"~"restaurant|cafe|fast_food|bar|pub"](around:${RADIUS}, ${LAT}, ${LNG});
              node["shop"~"supermarket|convenience|bakery|hairdresser|laundry|dry_cleaning"](around:${RADIUS}, ${LAT}, ${LNG});
              node["amenity"~"doctors|dentist|pharmacy|bank|hospital"](around:${RADIUS}, ${LAT}, ${LNG});
            );
            out body;
        `;
        
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        const response = await axios.get(url);
        const elements = response.data.elements;

        console.log(`📦 CityCore: Found ${elements.length} nodes. Initializing MySQL sync...`);

        const listings = elements.map(place => {
            const t = place.tags;
            if (!t.name) return null;

            const category = determineCategory(t);
            const cuisine = t.cuisine || t.amenity || t.shop || "General Node";

            return {
                name: t.name,
                category: category,
                cuisine: capitalize(cuisine.replace(/_/g, ' ')),
                description: `High-fidelity node providing ${category.toLowerCase()} services in the local sector.`,
                rating: (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1), // Higher ratings for gems
                reviewCount: Math.floor(Math.random() * 150) + 5,
                address: t['addr:street'] || t['addr:full'] || 'Localized Sector',
                phone: t.phone || t['contact:phone'] || 'Encrypted',
                website: t.website || null,
                lat: place.lat,
                lng: place.lon,
                amenities: JSON.stringify(generateAmenities(category))
            };
        }).filter(item => item !== null);

        await Listing.bulkCreate(listings);
        console.log(`🎉 CityCore: SUCCESSFULLY SYNCED ${listings.length} NODES TO CORE DATABASE!`);
        process.exit();

    } catch (error) {
        console.error('❌ CityCore: Sync Failed. Overpass API might be busy.', error.message);
        process.exit(1);
    }
}

function determineCategory(tags) {
    if (tags.amenity === 'hospital' || tags.amenity === 'doctors' || tags.amenity === 'dentist' || tags.amenity === 'pharmacy') return 'Health';
    if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'fast_food' || tags.amenity === 'bar' || tags.amenity === 'pub') return 'Food';
    if (tags.shop) return 'Services';
    return 'Services';
}

function generateAmenities(category) {
    const common = ['Orbital Verified', 'Secure Link'];
    if (category === 'Food') return [...common, 'Atmospheric Seating', 'Neural Network WiFi'];
    return [...common, 'Priority Access'];
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

seedDatabase();
