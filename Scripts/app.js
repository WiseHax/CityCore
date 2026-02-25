const API_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://citycore.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
    const listingGrid = document.getElementById('listing-grid');
    const nearMeBtn = document.getElementById('near-me-btn');
    const sortRatingBtn = document.getElementById('sort-rating-btn');
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    const searchInput = document.querySelector('.search-input-v2') || document.querySelector('.search-bar input');
    
    let rawListings = []; 
    let userLocation = null;
    let isSortingByRating = false;

    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (currentPath.includes(link.getAttribute('href'))) link.classList.add('active');
        else link.classList.remove('active');
    });

    const pageTitle = document.querySelector('h1')?.innerText.toLowerCase() || '';
    let currentCategory = '';
    if (pageTitle.includes('dining')) currentCategory = 'Food';
    else if (pageTitle.includes('professional') || pageTitle.includes('expert')) currentCategory = 'Services';

    function getFrameworkIcon(category, cuisine) {
        const type = (cuisine || category || '').toLowerCase().replace(/_/g, ' ');
        if (type.includes('cafe') || type.includes('coffee')) return 'fa-solid fa-mug-hot';
        if (type.includes('burger') || type.includes('fast food')) return 'fa-solid fa-burger';
        if (type.includes('restaurant') || type.includes('dining')) return 'fa-solid fa-utensils';
        if (type.includes('grill') || type.includes('local')) return 'fa-solid fa-fire-burner';
        if (type.includes('doctor') || type.includes('health')) return 'fa-solid fa-user-doctor';
        if (type.includes('hair') || type.includes('beauty')) return 'fa-solid fa-scissors';
        if (type.includes('bank') || type.includes('finance')) return 'fa-solid fa-building-columns';
        if (type.includes('repair')) return 'fa-solid fa-screwdriver-wrench';
        return 'fa-solid fa-building';
    }

    async function fetchListings(query = {}) {
        if (!listingGrid) return;
        const countDisplay = document.getElementById('result-count');
        if (countDisplay) countDisplay.innerHTML = `<span class="scanning-pulse"><i class="fa-solid fa-satellite-dish me-2"></i> SCANNING SECTOR DATA...</span>`;
        renderSkeletons();
        try {
            const params = new URLSearchParams();
            if (currentCategory) params.append('category', currentCategory);
            if (query.search) params.append('search', query.search);
            if (query.lat && query.lng) { params.append('lat', query.lat); params.append('lng', query.lng); params.append('radius', '50000'); }
            const response = await fetch(`${API_URL}/listings?${params.toString()}`);
            rawListings = await response.json();
            setTimeout(() => applyFiltersAndSort(), 600);
        } catch (err) {
            listingGrid.innerHTML = `<div class="col-12 text-center py-5"><div class="glass-panel p-5 d-inline-block"><h4 class="text-danger">CORE OFFLINE</h4><p class="text-white-50">Unable to establish link.</p></div></div>`;
        }
    }

    function applyFiltersAndSort() {
        let filtered = [...rawListings];
        const checkedValues = Array.from(filterCheckboxes).filter(cb => cb.checked).map(cb => cb.value.toLowerCase());
        if (checkedValues.length > 0) {
            filtered = filtered.filter(item => {
                const typeStr = (item.cuisine || item.category || '').toLowerCase().replace(/_/g, ' ');
                return checkedValues.some(val => {
                    if (val === 'local') return typeStr.includes('local') || typeStr.includes('grill') || typeStr.includes('filipino');
                    return typeStr.includes(val);
                });
            });
        }
        const query = searchInput ? searchInput.value.toLowerCase() : '';
        if (query) filtered = filtered.filter(item => item.name.toLowerCase().includes(query) || (item.cuisine && item.cuisine.toLowerCase().includes(query)));
        if (isSortingByRating) filtered.sort((a, b) => b.rating - a.rating);
        renderListings(filtered);
    }

    function renderSkeletons() {
        listingGrid.innerHTML = Array(6).fill(0).map(() => `<div class="col-md-6 col-lg-4 mb-4"><div class="glass-panel h-100 p-5" style="opacity: 0.2;"><div class="skeleton" style="height: 180px;"></div></div></div>`).join('');
    }

    function renderListings(data) {
        listingGrid.innerHTML = '';
        const countDisplay = document.getElementById('result-count');
        if (countDisplay) countDisplay.innerText = `${data.length} Nodes Synchronized`;
        if (data.length === 0) {
            listingGrid.innerHTML = `<div id="empty-state" class="col-12 text-center py-5"><div class="glass-panel p-5 d-inline-block"><i class="fa-solid fa-satellite-slash display-1 text-primary mb-4 opacity-50"></i><h3 class="fw-bold">SECTOR EMPTY</h3><button id="clear-filters-btn" class="btn btn-primary rounded-pill mt-3 px-5">Reset</button></div></div>`;
            gsap.to("#empty-state", { opacity: 1, y: 0, duration: 0.5 });
            document.getElementById('clear-filters-btn')?.addEventListener('click', () => { filterCheckboxes.forEach(cb => cb.checked = false); if (searchInput) searchInput.value = ''; applyFiltersAndSort(); });
            return;
        }
        data.forEach(item => {
            const dist = item.distance ? `${parseFloat(item.distance).toFixed(2)} KM` : 'SYNCED';
            const iconClass = getFrameworkIcon(item.category, item.cuisine);
            listingGrid.insertAdjacentHTML('beforeend', `
                <div class="col-md-6 col-lg-4 mb-4 node-card-item" style="opacity: 0; transform: translateY(30px);">
                    <a href="Listing-Detail.html?id=${item.id}" class="text-decoration-none h-100 d-block">
                        <article class="glass-panel h-100 p-4 listing-card-pro">
                            <div class="d-flex justify-content-between mb-4">
                                <span class="node-id-badge">ID: ${item.id.toString().slice(-4)}</span>
                                <div class="icon-box-3d m-0"><i class="${iconClass}"></i></div>
                            </div>
                            <h3 class="h5 fw-800 mb-1 text-white text-uppercase tracking-tighter">${item.name}</h3>
                            <p class="text-warning small fw-bold mb-4"><i class="fa-solid fa-star me-1"></i> ${item.rating || '0.0'}</p>
                            <div class="pt-3 d-flex justify-content-between align-items-center" style="border-top: 1px solid var(--glass-border);">
                                <span class="small fw-bold text-primary">${dist}</span>
                                <span class="small fw-bold">ACCESS <i class="fa-solid fa-chevron-right ms-1"></i></span>
                            </div>
                        </article>
                    </a>
                </div>
            `);
        });
        gsap.to(".node-card-item", { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" });
    }

    // INITIALIZATION
    async function initPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const listingId = urlParams.get('id');
        const searchQuery = urlParams.get('search');

        if (listingId && window.location.pathname.includes('Listing-Detail.html')) {
            loadListingDetail(listingId);
            return;
        }

        const savedLoc = localStorage.getItem('citycore_location');
        if (savedLoc) userLocation = JSON.parse(savedLoc);

        if (searchQuery && searchInput) {
            searchInput.value = searchQuery;
            fetchListings({ search: searchQuery, ...userLocation });
        } else if (userLocation) {
            fetchListings(userLocation);
        } else {
            autoGetLocation();
        }
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
            
            // REVIEW FORM PRE-FILL
            const reviewForm = document.getElementById('review-form');
            const guestName = localStorage.getItem('citycore_guest_name');
            if (guestName && document.getElementById('review-name')) {
                document.getElementById('review-name').value = guestName;
            }

            if (reviewForm) {
                reviewForm.addEventListener('submit', async (e) => {
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
                            localStorage.setItem('citycore_guest_name', name); // Remember for next time
                            alert('Intelligence Synchronized Successfully!');
                            reviewForm.reset();
                            fetchReviews(id);
                        }
                    } catch (err) { console.error(err); }
                });
            }

            fetchReviews(id);
        } catch (err) { console.error(err); }
    }

    async function fetchReviews(id) {
        const container = document.getElementById('listing-reviews');
        if (!container) return;
        const res = await fetch(`${API_URL}/listings/${id}/reviews`);
        const reviews = await res.json();
        container.innerHTML = reviews.map(rev => `
            <div class="glass-panel p-4 mb-3 border-0" style="background: rgba(255,255,255,0.03);">
                <div class="d-flex justify-content-between mb-2"><h6 class="fw-bold mb-0 text-primary text-uppercase" style="font-size: 0.75rem; letter-spacing: 1px;">${rev.userName}</h6><span class="small opacity-50 text-white">${new Date(rev.createdAt).toLocaleDateString()}</span></div>
                <div class="text-warning small">${Array(parseInt(rev.rating)).fill('<i class="fa-solid fa-star"></i>').join('')}</div>
                <p class="text-white-50 small mt-2">"${rev.comment}"</p>
            </div>
        `).join('');
    }

    function autoGetLocation() {
        if (!navigator.geolocation) { fetchListings(); return; }
        navigator.geolocation.getCurrentPosition(
            (p) => { userLocation = { lat: p.coords.latitude, lng: p.coords.longitude }; localStorage.setItem('citycore_location', JSON.stringify(userLocation)); fetchListings(userLocation); },
            () => fetchListings(),
            { timeout: 10000 }
        );
    }

    initPage();
    if (nearMeBtn) nearMeBtn.addEventListener('click', (e) => { e.preventDefault(); autoGetLocation(); });
});
