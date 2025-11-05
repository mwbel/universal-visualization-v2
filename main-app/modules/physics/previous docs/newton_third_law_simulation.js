import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

let scene, camera, renderer, labelRenderer, controls;
let blockA, blockB;
let forceArrowA, forceArrowB;
let forceLabelA, forceLabelB;
let currentForceMagnitude = 50; // Initial force from slider

const init = () => {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Label Renderer for HTML elements
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none'; // Allow mouse events to pass through
    document.body.appendChild(labelRenderer.domElement);

    // Orbit Controls
    controls = new OrbitControls(camera, renderer.domElement); // Attach controls to the WebGL canvas
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // Ground Plane
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    scene.add(plane);

    // Blocks
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const materialA = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red for Block A
    const materialB = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue for Block B

    blockA = new THREE.Mesh(boxGeometry, materialA);
    blockA.position.set(-1.1, 0, 0); // Slightly offset to show interaction point
    scene.add(blockA);

    blockB = new THREE.Mesh(boxGeometry, materialB);
    blockB.position.set(1.1, 0, 0); // Slightly offset to show interaction point
    scene.add(blockB);

    // Force Arrows and Labels
    createForceVisualizations();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    const forceSlider = document.getElementById('forceSlider');
    forceSlider.addEventListener('input', updateForce);
    updateForceDisplay(); // Initial display update
};

const createForceVisualizations = () => {
    // Force A (Block A on Block B) - Action
    const originA = new THREE.Vector3(blockB.position.x - 1, blockB.position.y, blockB.position.z);
    const dirA = new THREE.Vector3(-1, 0, 0).normalize(); // Points from B towards A
    const lengthA = currentForceMagnitude / 20; // Scale force to arrow length
    const hexA = 0xffa500; // Orange color for action force
    forceArrowA = new THREE.ArrowHelper(dirA, originA, lengthA, hexA, 0.5, 0.2);
    scene.add(forceArrowA);

    // Force B (Block B on Block A) - Reaction
    const originB = new THREE.Vector3(blockA.position.x + 1, blockA.position.y, blockA.position.z);
    const dirB = new THREE.Vector3(1, 0, 0).normalize(); // Points from A towards B
    const lengthB = currentForceMagnitude / 20; // Scale force to arrow length
    const hexB = 0x00ff00; // Green color for reaction force
    forceArrowB = new THREE.ArrowHelper(dirB, originB, lengthB, hexB, 0.5, 0.2);
    scene.add(forceArrowB);

    // Force Labels
    const createLabel = (text, position) => {
        const div = document.createElement('div');
        div.className = 'force-label';
        div.textContent = text;
        const label = new CSS2DObject(div);
        label.position.copy(position);
        scene.add(label);
        return label;
    };

    forceLabelA = createLabel(`F_A: ${currentForceMagnitude.toFixed(1)} N`, new THREE.Vector3(originA.x - lengthA / 2 - 1, originA.y + 1, originA.z));
    forceLabelB = createLabel(`F_B: ${currentForceMagnitude.toFixed(1)} N`, new THREE.Vector3(originB.x + lengthB / 2 + 1, originB.y + 1, originB.z));
};

const updateForce = (event) => {
    currentForceMagnitude = parseFloat(event.target.value);
    updateForceDisplay();
    updateForceVisualizations();
};

const updateForceDisplay = () => {
    document.getElementById('currentForce').textContent = `${currentForceMagnitude.toFixed(0)} N`;
};

const updateForceVisualizations = () => {
    const length = currentForceMagnitude / 20; // Scale force to arrow length

    // Update Force A (Block A on Block B)
    forceArrowA.setLength(length, 0.5, 0.2);
    forceLabelA.element.textContent = `F_甲对乙: ${currentForceMagnitude.toFixed(1)} N`;
    forceLabelA.position.set(forceArrowA.position.x + forceArrowA.dir.x * (length / 2 + 1), forceArrowA.position.y + 1, forceArrowA.position.z);


    // Update Force B (Block B on Block A)
    forceArrowB.setLength(length, 0.5, 0.2);
    forceLabelB.element.textContent = `F_乙对甲: ${currentForceMagnitude.toFixed(1)} N`;
    forceLabelB.position.set(forceArrowB.position.x + forceArrowB.dir.x * (length / 2 + 1), forceArrowB.position.y + 1, forceArrowB.position.z);
};

const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
};

const animate = () => {
    requestAnimationFrame(animate);
    controls.update(); // only required if controls.enableDamping is set to true
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
};

init();
animate();
