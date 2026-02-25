// CITYCORE: Detail Logic (Cloud-Ready)
const API_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://citycore.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('id');

    if (!listingId) return;

    function getFrameworkIcon(category, cuisine) {
        const type = (cuisine || category || '').toLowerCase();
        if (type.includes('cafe')) return 'fa-solid fa-mug-hot';
        if (type.includes('burger')) return 'fa-solid fa-burger';
        if (type.includes('restaurant')) return 'fa-solid fa-utensils';
        if (type.includes('doctor')) return 'fa-solid fa-user-doctor';
        return 'fa-solid fa-building';
    }

    async function loadListingDetail(id) {
        try {
            const res = await fetch(`${API_URL}/listings/${id}`);
            let item;
            if (res.ok) item = await res.json();
            else {
                const cache = localStorage.getItem('citycore_nodes_cache');
                if (cache) item = JSON.parse(cache).find(l => l.id.toString() === id.toString());
            }
            if (!item) return;

            const iconClass = getFrameworkIcon(item.category, item.cuisine);
            document.getElementById('listing-name').innerText = item.name;
            document.getElementById('listing-badge-category').innerText = item.category;
            document.getElementById('listing-rating').innerHTML = `<i class="fa-solid fa-star text-warning me-1"></i> ${item.rating} <span class="ms-2 opacity-50 fw-normal" style="font-size: 0.8rem;">PLANETARY CONSENSUS</span>`;
            document.getElementById('listing-location').innerText = item.address;
            document.getElementById('listing-description').innerText = item.description;
            document.getElementById('listing-icon-large').innerHTML = `<i class="${iconClass}"></i>`;
            
            const amenities = JSON.parse(item.amenities || '[]');
            document.getElementById('listing-amenities').innerHTML = amenities.map(a => `<div class="col-md-6"><div class="glass-panel p-3 mb-3 border-0" style="background: rgba(255,255,255,0.05);"><i class="fa-solid fa-circle-check text-primary me-2"></i> ${a}</div></div>`).join('');

            const btnMap = document.getElementById('btn-map');
            if (btnMap && item.lat) btnMap.href = `https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lng}#map=18/${item.lat}/${item.lng}`;
            
            fetchReviews(id);
            setupReviewForm(id);
        } catch (err) { console.error(err); }
    }

    function setupReviewForm(id) {
        const reviewForm = document.getElementById('review-form');
        const guestName = localStorage.getItem('citycore_guest_name');
        if (guestName && document.getElementById('review-name')) document.getElementById('review-name').value = guestName;

        reviewForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('review-name').value;
            const rating = document.getElementById('review-rating').value;
            const comment = document.getElementById('review-comment').value;

            try {
                const postRes = await fetch(`${API_URL}/listings/${id}/reviews`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userName: name, rating, comment })
                });
                if (postRes.ok) {
                    localStorage.setItem('citycore_guest_name', name);
                    alert('Intelligence Synchronized!');
                    reviewForm.reset();
                    fetchReviews(id);
                }
            } catch (err) { console.error(err); }
        });
    }

    async function fetchReviews(id) {
        const container = document.getElementById('listing-reviews');
        if (!container) return;
        const res = await fetch(`${API_URL}/listings/${id}/reviews`);
        const reviews = await res.json();
        container.innerHTML = reviews.map(rev => `
            <div class="glass-panel p-4 mb-3 border-0" style="background: rgba(255,255,255,0.03);">
                <div class="d-flex justify-content-between mb-2"><h6 class="fw-bold mb-0 text-primary text-uppercase" style="font-size: 0.75rem; letter-spacing: 1px;">${rev.userName}</h6></div>
                <div class="text-warning small">${Array(parseInt(rev.rating)).fill('<i class="fa-solid fa-star"></i>').join('')}</div>
                <p class="text-white-50 small mt-2">"${rev.comment}"</p>
            </div>
        `).join('');
    }

    loadListingDetail(listingId);
});
