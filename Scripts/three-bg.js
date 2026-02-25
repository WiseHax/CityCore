// CITYCORE 3D ORBITAL ENGINE v3.1
// Global Animation Controller & 3D Render

let scene, camera, renderer, earthGroup, earth, clouds, stars;
let mouseX = 0, mouseY = 0;

const path = window.location.pathname.toLowerCase();
const isHomePage = path.endsWith('index.html') || path.endsWith('/') || path === '' || path.includes('index.html');

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#three-canvas'),
        antialias: true,
        alpha: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // EARTH ENGINE (Index Only)
    if (isHomePage) {
        earthGroup = new THREE.Group();
        scene.add(earthGroup);

        const earthGeometry = new THREE.SphereGeometry(2, 128, 128);
        const earthMaterial = new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'),
            bumpMap: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg'),
            bumpScale: 0.1,
            specularMap: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'),
            shininess: 15
        });
        earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earthGroup.add(earth);

        const cloudGeometry = new THREE.SphereGeometry(2.04, 128, 128);
        const cloudMaterial = new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'),
            transparent: true, opacity: 0.4
        });
        clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        earthGroup.add(clouds);

        gsap.to(earthGroup.position, {
            y: 1.2, z: -1.5,
            scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 1 }
        });
    }

    // STARFIELD (Global)
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, sizeAttenuation: true });
    const starVertices = [];
    for (let i = 0; i < 15000; i++) {
        starVertices.push((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(5, 5, 5);
    scene.add(sun);

    camera.position.z = isHomePage ? 12 : 6;

    // GLOBAL ENTRANCE ANIMATIONS 🚀
    if (isHomePage) {
        gsap.to(camera.position, { z: 4.8, duration: 2.5, ease: "power4.out" });
        gsap.to(".reveal-hero", { opacity: 1, y: 0, duration: 1.5, delay: 0.5, ease: "expo.out" });
        gsap.to(".reveal-header", { 
            opacity: 1, y: 0, duration: 1.2, 
            scrollTrigger: { trigger: ".reveal-header", start: "top 85%" }
        });
        
        // Bento Slide-in
        gsap.utils.toArray(".node-reveal-left").forEach((card) => {
            gsap.fromTo(card, { opacity: 0, x: -100 }, { opacity: 1, x: 0, duration: 1, scrollTrigger: { trigger: card, start: "top 90%" } });
        });
        gsap.utils.toArray(".node-reveal-right").forEach((card) => {
            gsap.fromTo(card, { opacity: 0, x: 100 }, { opacity: 1, x: 0, duration: 1, scrollTrigger: { trigger: card, start: "top 90%" } });
        });
    }

    // CRITICAL FIX: Animate all elements with .reveal class on every page
    gsap.to(".reveal", {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.3
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (isHomePage && earthGroup) {
        earth.rotation.y += 0.0008;
        clouds.rotation.y += 0.001;
        earthGroup.rotation.y += (mouseX * 0.1 - earthGroup.rotation.y) * 0.05;
        earthGroup.rotation.x += (mouseY * 0.1 - earthGroup.rotation.x) * 0.05;
    }
    stars.rotation.y += 0.0001;
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
});

init();
