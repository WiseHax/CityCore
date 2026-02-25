// CITYCORE: Precision Directory Logic v3.5 (Cloud-Ready)
const API_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://citycore-api.onrender.com/api'; // I-update natin 'to pag nakuha na natin yung Render URL

document.addEventListener('DOMContentLoaded', () => {
    const listingGrid = document.getElementById('listing-grid');
    const nearMeBtn = document.getElementById('near-me-btn');
    const sortRatingBtn = document.getElementById('sort-rating-btn');
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    const searchInput = document.querySelector('.search-input-v2') || document.querySelector('.search-bar input');
    
    let rawListings = []; 
    let userLocation = null;
    let isSortingByRating = false;

    const pageTitle = document.querySelector('h1')?.innerText.toLowerCase() || '';
    let currentCategory = '';
    if (pageTitle.includes('dining') || pageTitle.includes('food')) currentCategory = 'Food';
    else if (pageTitle.includes('professional') || pageTitle.includes('service')) currentCategory = 'Services';

    function getFrameworkIcon(category, cuisine, name = "") {
        const combined = `${category} ${cuisine} ${name}`.toLowerCase().replace(/_/g, ' ');
        if (combined.includes('coffee') || combined.includes('cafe')) return 'fa-solid fa-mug-hot';
        if (combined.includes('grill') || combined.includes('filipino') || combined.includes('sisig') || combined.includes('lutong bahay')) return 'fa-solid fa-fire-burner';
        if (combined.includes('burger')) return 'fa-solid fa-burger';
        if (combined.includes('fast food')) return 'fa-solid fa-bolt-lightning';
        if (combined.includes('doctor') || combined.includes('health') || combined.includes('medical')) return 'fa-solid fa-user-doctor';
        if (combined.includes('hair') || combined.includes('beauty') || combined.includes('barber')) return 'fa-solid fa-scissors';
        if (combined.includes('bank') || combined.includes('atm')) return 'fa-solid fa-building-columns';
        if (combined.includes('repair') || combined.includes('mechanic')) return 'fa-solid fa-screwdriver-wrench';
        return 'fa-solid fa-location-dot';
    }

    async function fetchListings(query = {}) {
        if (!listingGrid) return;
        const countDisplay = document.getElementById('result-count');
        if (countDisplay) countDisplay.innerHTML = `<span class="scanning-pulse"><i class="fa-solid fa-satellite-dish me-2"></i> SCANNING SECTOR DATA...</span>`;
        
        listingGrid.innerHTML = Array(6).fill(0).map(() => `<div class="col-md-6 col-lg-4 mb-4"><div class="glass-panel h-100 p-5" style="opacity: 0.2;"><div class="skeleton" style="height: 180px;"></div></div></div>`).join('');

        try {
            const params = new URLSearchParams();
            if (currentCategory) params.append('category', currentCategory);
            if (query.search) params.append('search', query.search);
            if (query.lat && query.lng) {
                params.append('lat', query.lat);
                params.append('lng', query.lng);
                params.append('radius', '50000'); 
            }

            const response = await fetch(`${API_URL}/listings?${params.toString()}`);
            rawListings = await response.json();
            localStorage.setItem('citycore_nodes_cache', JSON.stringify(rawListings));
            setTimeout(() => applyFiltersAndSort(), 400);
        } catch (err) {
            listingGrid.innerHTML = `<div class="col-12 text-center py-5"><h4 class="text-danger">CORE OFFLINE</h4></div>`;
        }
    }

    function applyFiltersAndSort() {
        let filtered = [...rawListings];
        const checkedValues = Array.from(filterCheckboxes).filter(cb => cb.checked).map(cb => cb.value.toLowerCase());
        if (checkedValues.length > 0) {
            filtered = filtered.filter(item => {
                const combined = `${item.cuisine} ${item.category} ${item.name}`.toLowerCase().replace(/_/g, ' ');
                return checkedValues.some(val => {
                    if (val === 'local') return combined.includes('grill') || combined.includes('filipino') || combined.includes('sisig') || combined.includes('bbq') || combined.includes('chicken');
                    if (val === 'cafe') return combined.includes('cafe') || combined.includes('coffee') || combined.includes('bakery');
                    if (val === 'doctor') return combined.includes('doctor') || combined.includes('health') || combined.includes('medical');
                    return combined.includes(val);
                });
            });
        }
        const query = searchInput ? searchInput.value.toLowerCase() : '';
        if (query) filtered = filtered.filter(item => item.name.toLowerCase().includes(query) || (item.cuisine && item.cuisine.toLowerCase().includes(query)));
        if (isSortingByRating) filtered.sort((a, b) => b.rating - a.rating);
        renderListings(filtered);
    }

    function renderListings(data) {
        listingGrid.innerHTML = '';
        if (document.getElementById('result-count')) document.getElementById('result-count').innerText = `${data.length} Nodes Synchronized`;
        if (data.length === 0) {
            listingGrid.innerHTML = `<div id="empty-feedback" class="col-12 text-center py-5" style="opacity: 0; transform: translateY(20px);"><div class="glass-panel p-5 d-inline-block"><i class="fa-solid fa-satellite-slash display-1 text-primary mb-4 opacity-50"></i><h3 class="fw-bold">SECTOR EMPTY</h3><p class="text-white-50">Intelligence scan yielded zero nodes. Try resetting filters.</p><button id="reset-nodes-btn" class="btn btn-primary rounded-pill mt-3 px-5 fw-bold">Reset Sector</button></div></div>`;
            gsap.to("#empty-feedback", { opacity: 1, y: 0, duration: 0.5 });
            document.getElementById('reset-nodes-btn')?.addEventListener('click', () => { filterCheckboxes.forEach(cb => cb.checked = false); if (searchInput) searchInput.value = ''; applyFiltersAndSort(); });
            return;
        }
        data.forEach(item => {
            const dist = item.distance ? `${parseFloat(item.distance).toFixed(2)} KM` : 'STATIONARY';
            const iconClass = getFrameworkIcon(item.category, item.cuisine, item.name);
            listingGrid.insertAdjacentHTML('beforeend', `
                <div class="col-md-6 col-lg-4 mb-4 node-card-item">
                    <a href="Listing-Detail.html?id=${item.id}" class="text-decoration-none h-100 d-block">
                        <article class="glass-panel h-100 p-4 listing-card-pro">
                            <div class="d-flex justify-content-between mb-4">
                                <span class="node-id-badge">NODE_${item.id.toString().slice(-4)}</span>
                                <div class="icon-box-3d m-0"><i class="${iconClass}"></i></div>
                            </div>
                            <h3 class="h5 fw-800 mb-1 text-white text-uppercase tracking-tighter">${item.name}</h3>
                            <p class="text-warning small fw-bold mb-4"><i class="fa-solid fa-star me-1"></i> ${item.rating || '0.0'} <span class="text-white-50 ms-2 fw-normal opacity-50">INTEL</span></p>
                            <div class="pt-3 d-flex justify-content-between align-items-center" style="border-top: 1px solid var(--glass-border);">
                                <span class="small fw-bold text-primary">${dist}</span>
                                <span class="small fw-bold text-uppercase" style="font-size: 0.6rem; letter-spacing: 1px;">Access <i class="fa-solid fa-chevron-right ms-1"></i></span>
                            </div>
                        </article>
                    </a>
                </div>
            `);
        });
        gsap.to(".node-card-item", { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" });
    }

    function autoGetLocation() {
        if (!navigator.geolocation) { fetchListings(); return; }
        if (nearMeBtn) nearMeBtn.innerHTML = "<i class='fa-solid fa-satellite-dish fa-spin me-2'></i> Syncing...";

        navigator.geolocation.getCurrentPosition(
            (p) => {
                userLocation = { lat: p.coords.latitude, lng: p.coords.longitude };
                localStorage.setItem('citycore_location', JSON.stringify(userLocation));
                if (nearMeBtn) {
                    nearMeBtn.innerHTML = "<i class='fa-solid fa-circle-check me-2'></i> Sync Active";
                    nearMeBtn.classList.remove('btn-outline-danger');
                    nearMeBtn.classList.add('btn-primary');
                }
                fetchListings(userLocation);
            },
            () => {
                console.warn("Location Access Denied");
                if (nearMeBtn) {
                    nearMeBtn.innerHTML = "<i class='fa-solid fa-ban me-2'></i> Sync Offline";
                    nearMeBtn.classList.replace('btn-primary', 'btn-outline-danger');
                }
                fetchListings(); // Load all without proximity
            },
            { timeout: 8000 }
        );
    }

    if (sortRatingBtn) {
        sortRatingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isSortingByRating = !isSortingByRating;
            sortRatingBtn.classList.toggle('btn-primary', isSortingByRating);
            sortRatingBtn.innerHTML = isSortingByRating ? `<i class="fa-solid fa-star me-2"></i> Top Rated: ON` : `<i class="fa-solid fa-star me-2"></i> Top Rated`;
            applyFiltersAndSort();
        });
    }

    filterCheckboxes.forEach(cb => cb.addEventListener('change', () => applyFiltersAndSort()));
    if (searchInput) searchInput.addEventListener('input', () => applyFiltersAndSort());

    const savedLoc = localStorage.getItem('citycore_location');
    if (savedLoc) { userLocation = JSON.parse(savedLoc); fetchListings(userLocation); }
    else { autoGetLocation(); }

    if (nearMeBtn) nearMeBtn.addEventListener('click', (e) => { e.preventDefault(); autoGetLocation(); });
});
