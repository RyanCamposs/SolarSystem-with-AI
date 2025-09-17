// DOCUMENTAÇÃO DO CÓDIGO: script.js
// Objetivo: Versão final, completa e unificada de todo o projeto.

// --- 1. CONFIGURAÇÃO BÁSICA E FUNÇÕES AUXILIARES ---
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const randomInRange = (min, max) => Math.random() * (max - min) + min;
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 90;
scene.add(camera);
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxDistance = 250;

// Referência ao elemento de UI do HTML
const infoBox = document.getElementById('info-box');
infoBox.classList.add('hidden');
let infoTimeout;

// --- TEXTURAS ---
const texturaTerraDia = textureLoader.load('terra.png');
const texturaTerraNoite = textureLoader.load('terra.png');
const texturaTerraNuvens = textureLoader.load('terra.png');
const texturasPlanetasRochosos = [ 'terra.png', 'https://raw.githubusercontent.com/Dev-Jerome/gltf-planets/main/assets/planets/venus_atmos_2048.jpg' ];
const texturasGigantesGasosos = [ 'terra.png', 'https://raw.githubusercontent.com/Dev-Jerome/gltf-planets/main/assets/planets/uranus_2048.jpg' ];
const texturaRochaLua = textureLoader.load('https://raw.githubusercontent.com/Dev-Jerome/gltf-planets/main/assets/planets/moon_2048.jpg');
const texturaAneis = textureLoader.load('https://raw.githubusercontent.com/Dev-Jerome/gltf-planets/main/assets/planets/saturn_rings.png');

let universoDistante, galaxiaProxima, cinturaoAsteroides;

// --- 2. CRIAÇÃO DO UNIVERSO DE FUNDO ---
criarUniverso();
criarNebulosa();

// --- 3. GERAÇÃO DO SISTEMA SOLAR ---
const planets = [];
const planetContainerGroup = new THREE.Group();
scene.add(planetContainerGroup);
const starGeometry = new THREE.SphereGeometry(randomInRange(5, 8), 32, 32);
const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffddaa });
const star = new THREE.Mesh(starGeometry, starMaterial);
scene.add(star);
const pointLight = new THREE.PointLight(0xffffff, 2.5, 500);
scene.add(pointLight);
const numPlanets = Math.floor(randomInRange(4, 6));
let previousOrbitRadius = 20;

for (let i = 0; i < numPlanets; i++) {
    const orbitRadius = previousOrbitRadius + randomInRange(20, 35);
    const planetSpeed = randomInRange(0.05, 0.4);
    let planetSystemGroup = new THREE.Group();
    let planetData = {};

    if (i === 0) { // Terra
        const earthSize = 3;
        const earthGeometry = new THREE.SphereGeometry(earthSize, 64, 64);
        const earthMaterial = new THREE.MeshStandardMaterial({
            map: texturaTerraDia, emissiveMap: texturaTerraNoite, emissive: 0xffffff, roughness: 0.7
        });
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.userData = { size: earthSize, type: 'Terra' };
        
        const cloudGeometry = new THREE.SphereGeometry(earthSize + 0.05, 64, 64);
        const cloudMaterial = new THREE.MeshStandardMaterial({ map: texturaTerraNuvens, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        
        planetSystemGroup.add(earth, clouds);
        planetSystemGroup.userData = { isEarth: true, planet: earth, clouds: clouds };
        
        const moonSize = 0.8;
        const moonGeometry = new THREE.SphereGeometry(moonSize, 32, 32);
        const moonMaterial = new THREE.MeshStandardMaterial({ map: texturaRochaLua });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.userData = { size: moonSize, type: 'Lua' };
        planetSystemGroup.add(moon);
        planetSystemGroup.userData.moon = moon;
        
        planetData.moonData = { orbitRadius: earthSize + 4, speed: 0.8, angle: Math.random() * Math.PI * 2 };
    } else { // Planetas procedurais
        if (i === 2) {
            const espacoInicioCinturao = 15;
            const larguraCinturao = 35;
            const raioInicioCinturao = previousOrbitRadius + espacoInicioCinturao;
            criarCinturaoDeAsteroides(raioInicioCinturao, larguraCinturao);
            previousOrbitRadius = raioInicioCinturao + larguraCinturao;
        }
        const planetSize = randomInRange(1.2, 4.5);
        const planetGeometry = new THREE.SphereGeometry(planetSize, 32, 32);
        const isGasGiant = Math.random() < 0.4;
        const textureArray = isGasGiant ? texturasGigantesGasosos : texturasPlanetasRochosos;
        const texturaUrl = textureArray[Math.floor(Math.random() * textureArray.length)];
        const planetMaterial = new THREE.MeshStandardMaterial({ map: textureLoader.load(texturaUrl), roughness: 0.8 });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.userData = { size: planetSize, type: isGasGiant ? 'Gigante Gasoso' : 'Planeta Rochoso' };
        planetSystemGroup.add(planet);
        planetSystemGroup.userData.planet = planet;
        if (isGasGiant && Math.random() < 0.6) {
            const innerRadius = planetSize + randomInRange(1, 2);
            const outerRadius = innerRadius + randomInRange(2, 5);
            const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({ map: texturaAneis, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false });
            const rings = new THREE.Mesh(ringGeometry, ringMaterial);
            rings.rotation.x = Math.PI * 0.5 + randomInRange(-0.1, 0.1);
            rings.rotation.z = randomInRange(-0.1, 0.1);
            planetSystemGroup.add(rings);
        }
    }
    
    const orbitGeometry = new THREE.RingGeometry(orbitRadius - 0.1, orbitRadius + 0.1, 128);
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.15 });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);
    planetData = { ...planetData, systemGroup: planetSystemGroup, orbitRadius: orbitRadius, speed: planetSpeed, angle: Math.random() * Math.PI * 2 };
    planets.push(planetData);
    planetContainerGroup.add(planetSystemGroup);
    previousOrbitRadius = orbitRadius + planetSystemGroup.userData.planet.userData.size;
}

// --- 4. INTERATIVIDADE ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
function onPlanetClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const allClickableObjects = [];
    planetContainerGroup.children.forEach(group => {
        allClickableObjects.push(group.userData.planet);
        if(group.userData.moon) allClickableObjects.push(group.userData.moon);
    });
    const intersects = raycaster.intersectObjects(allClickableObjects);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        
        if(clickedObject.userData.type) {
            clearTimeout(infoTimeout);
            infoBox.textContent = clickedObject.userData.type;
            infoBox.classList.remove('hidden');
            infoTimeout = setTimeout(() => {
                infoBox.classList.add('hidden');
            }, 4000);
        }
        
        const targetPosition = new THREE.Vector3();
        clickedObject.getWorldPosition(targetPosition);
        const isEarth = clickedObject.userData.type === 'Terra';
        const cameraOffset = (clickedObject.userData.size || 1) * (isEarth ? 2.5 : 4);
        const cameraFinalPosition = new THREE.Vector3(targetPosition.x + cameraOffset, targetPosition.y + (cameraOffset / 2), targetPosition.z + cameraOffset);
        gsap.to(camera.position, { duration: 1.5, x: cameraFinalPosition.x, y: cameraFinalPosition.y, z: cameraFinalPosition.z, ease: "power2.inOut" });
        gsap.to(controls.target, { duration: 1.5, x: targetPosition.x, y: targetPosition.y, z: targetPosition.z, ease: "power2.inOut" });
    }
}
window.addEventListener('click', onPlanetClick);

// --- 5. FUNÇÕES DE CRIAÇÃO ---
function criarCinturaoDeAsteroides(raioInicio, largura) {
    const contagemAsteroides = 5000;
    const geometriaAstroide = new THREE.DodecahedronGeometry(0.2, 0);
    const materialAstroide = new THREE.MeshStandardMaterial({ map: texturaRochaLua, roughness: 0.8 });
    cinturaoAsteroides = new THREE.InstancedMesh(geometriaAstroide, materialAstroide, contagemAsteroides);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < contagemAsteroides; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const raio = raioInicio + Math.pow(Math.random(), 2) * largura;
        dummy.position.set(Math.cos(angulo) * raio, (Math.random() - 0.5) * 2.5, Math.sin(angulo) * raio);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const escala = randomInRange(0.5, 2.5);
        dummy.scale.set(escala, escala, escala);
        dummy.updateMatrix();
        cinturaoAsteroides.setMatrixAt(i, dummy.matrix);
    }
    scene.add(cinturaoAsteroides);
}

function criarUniverso() {
    const geometriaGalaxia = new THREE.BufferGeometry();
    const posicoesGalaxia = new Float32Array(25000 * 3);
    for (let i = 0; i < posicoesGalaxia.length; i++) { posicoesGalaxia[i] = (Math.random() - 0.5) * 300; }
    geometriaGalaxia.setAttribute('position', new THREE.BufferAttribute(posicoesGalaxia, 3));
    const materialGalaxia = new THREE.PointsMaterial({ size: 0.25, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending });
    galaxiaProxima = new THREE.Points(geometriaGalaxia, materialGalaxia);
    scene.add(galaxiaProxima);
    const geometriaUniverso = new THREE.BufferGeometry();
    const posicoesUniverso = new Float32Array(5000 * 3);
    for (let i = 0; i < posicoesUniverso.length; i++) { posicoesUniverso[i] = (Math.random() - 0.5) * 1500; }
    geometriaUniverso.setAttribute('position', new THREE.BufferAttribute(posicoesUniverso, 3));
    const materialUniverso = new THREE.PointsMaterial({ size: 0.3, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xaaaaaa });
    universoDistante = new THREE.Points(geometriaUniverso, materialUniverso);
    scene.add(universoDistante);
}

function criarNebulosa() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const cor1 = `rgba(${randomInRange(10, 80)}, ${randomInRange(10, 80)}, ${randomInRange(50, 150)}, 1)`;
    const cor2 = `rgba(${randomInRange(50, 150)}, ${randomInRange(10, 80)}, ${randomInRange(10, 80)}, 1)`;
    const gradiente = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradiente.addColorStop(0, cor1); gradiente.addColorStop(1, cor2);
    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 50;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    }
    const texturaNebulosa = new THREE.CanvasTexture(canvas);
    for(let i=0; i<3; i++) {
        const geometriaPlano = new THREE.PlaneGeometry(600, 600);
        const materialPlano = new THREE.MeshBasicMaterial({ map: texturaNebulosa, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.25, depthWrite: false });
        const plano = new THREE.Mesh(geometriaPlano, materialPlano);
        plano.position.set((Math.random() - 0.5) * 800, (Math.random() - 0.5) * 800, -800);
        plano.rotation.z = Math.random() * Math.PI;
        scene.add(plano);
    }
}

// --- 6. RESPONSIVIDADE ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --- 7. LOOP DE ANIMAÇÃO E INICIALIZAÇÃO ---
const clock = new THREE.Clock();
const animate = () => {
    planets.forEach(p => {
        p.angle += p.speed * 0.01;
        p.systemGroup.position.x = Math.cos(p.angle) * p.orbitRadius;
        p.systemGroup.position.z = Math.sin(p.angle) * p.orbitRadius;
        p.systemGroup.userData.planet.rotation.y += 0.005;
        if (p.systemGroup.userData.clouds) {
            p.systemGroup.userData.clouds.rotation.y += 0.0025;
        }
        if (p.moonData) {
            const moon = p.systemGroup.userData.moon;
            p.moonData.angle += p.moonData.speed * 0.01;
            moon.position.x = Math.cos(p.moonData.angle) * p.moonData.orbitRadius;
            moon.position.z = Math.sin(p.moonData.angle) * p.moonData.orbitRadius;
        }
    });

    if (galaxiaProxima) galaxiaProxima.rotation.y += 0.0001;
    if (universoDistante) universoDistante.rotation.y += 0.00005;
    if (cinturaoAsteroides) cinturaoAsteroides.rotation.y += 0.0002;

    controls.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
};

animate();