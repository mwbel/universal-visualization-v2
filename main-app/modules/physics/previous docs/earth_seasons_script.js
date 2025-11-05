// Three.js and OrbitControls are loaded globally via CDN in HTML
// No import statements needed here

const sceneContainer = document.getElementById('scene-container');
const speedInput = document.getElementById('speed');
const speedValueSpan = document.getElementById('speedValue');
const startStopBtn = document.getElementById('startStopBtn');
const resetBtn = document.getElementById('resetBtn');
const currentSeasonSpan = document.getElementById('currentSeason');
const tiltAngleSpan = document.getElementById('tiltAngle');

let scene, camera, renderer, controls;
let sun, earth, earthOrbit;
let isAnimating = true;
let animationSpeed = parseFloat(speedInput.value);

const EARTH_TILT = 23.5 * Math.PI / 180; // Earth's axial tilt in radians
const EARTH_ORBIT_RADIUS = 10; // Distance from Sun to Earth
const EARTH_RADIUS = 1;
const SUN_RADIUS = 2;

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Black space background

    // Camera
    camera = new THREE.PerspectiveCamera(75, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 1000);
    camera.position.set(0, 15, 15);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
    sceneContainer.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when damping is enabled
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    // Sun
    const sunGeometry = new THREE.SphereGeometry(SUN_RADIUS, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow for Sun
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Sun Light
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    sun.add(pointLight); // Light emanates from the Sun

    // Earth Orbit (for visualization)
    const orbitGeometry = new THREE.RingGeometry(EARTH_ORBIT_RADIUS - 0.02, EARTH_ORBIT_RADIUS + 0.02, 128);
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
    earthOrbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    earthOrbit.rotation.x = Math.PI / 2; // Rotate to lie flat on the XZ plane
    scene.add(earthOrbit);

    // Earth
    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 32, 32);
    const earthMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff }); // Blue for Earth
    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.x = EARTH_ORBIT_RADIUS; // Initial position in orbit

    // Tilt Earth's axis
    earth.rotation.z = EARTH_TILT; // Tilt relative to its own axis

    // Create a group for Earth's orbit around the Sun
    const earthOrbitGroup = new THREE.Group();
    earthOrbitGroup.add(earth);
    scene.add(earthOrbitGroup);

    // Initial UI update
    updateUI();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (isAnimating) {
        // Earth's revolution around the Sun
        earth.parent.rotation.y += 0.005 * animationSpeed; // Rotate the group
        
        // Earth's rotation on its axis
        earth.rotation.y += 0.01 * animationSpeed;

        // Update season based on revolution angle
        updateSeason();
    }

    controls.update(); // only required if controls.enableDamping is set to true
    renderer.render(scene, camera);
}

function updateSeason() {
    const orbitAngle = earth.parent.rotation.y % (2 * Math.PI);
    let season = "";

    // Approximate angles for seasons (relative to initial position at x=EARTH_ORBIT_RADIUS)
    // Initial position (x=10, y=0, z=0) corresponds to Spring Equinox (March 21)
    // 0 radians: Spring Equinox (March 21)
    // PI/2 radians: Summer Solstice (June 22)
    // PI radians: Autumnal Equinox (September 23)
    // 3*PI/2 radians: Winter Solstice (December 22)

    if (orbitAngle >= 0 && orbitAngle < Math.PI / 4) {
        season = "春分 (全球昼夜同长)";
    } else if (orbitAngle >= Math.PI / 4 && orbitAngle < 3 * Math.PI / 4) {
        season = "夏至 (北半球昼最长，夜最短)";
    } else if (orbitAngle >= 3 * Math.PI / 4 && orbitAngle < 5 * Math.PI / 4) {
        season = "秋分 (全球昼夜同长)";
    } else if (orbitAngle >= 5 * Math.PI / 4 && orbitAngle < 7 * Math.PI / 4) {
        season = "冬至 (北半球昼最短，夜最长)";
    } else {
        season = "春分 (全球昼夜同长)"; // Loop back to spring
    }
    currentSeasonSpan.textContent = season;
}

function updateUI() {
    speedValueSpan.textContent = `${animationSpeed.toFixed(1)}x`;
    tiltAngleSpan.textContent = `${(EARTH_TILT * 180 / Math.PI).toFixed(1)}°`;
    startStopBtn.textContent = isAnimating ? "停止" : "开始";
    updateSeason();
}

// Event Listeners
speedInput.addEventListener('input', () => {
    animationSpeed = parseFloat(speedInput.value);
    updateUI();
});

startStopBtn.addEventListener('click', () => {
    isAnimating = !isAnimating;
    updateUI();
});

resetBtn.addEventListener('click', () => {
    isAnimating = false;
    animationSpeed = 1;
    speedInput.value = 1;
    
    // Reset Earth's position and rotation
    earth.parent.rotation.y = 0; // Reset orbit
    earth.rotation.y = 0; // Reset axial rotation

    updateUI();
    renderer.render(scene, camera); // Render static scene after reset
});

init();
animate();
