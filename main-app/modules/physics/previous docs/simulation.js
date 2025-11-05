const canvas = document.getElementById('elevatorCanvas');
const ctx = canvas.getContext('2d');

const accelerationInput = document.getElementById('acceleration');
const accelerationValueSpan = document.getElementById('accelerationValue');
const startStopBtn = document.getElementById('startStopBtn');
const resetBtn = document.getElementById('resetBtn');
const gravityValueSpan = document.getElementById('gravityValue');
const massValueSpan = document.getElementById('massValue');
const gravityForceSpan = document.getElementById('gravityForce');
const normalForceSpan = document.getElementById('normalForce');
const stateSpan = document.getElementById('state');

// Simulation parameters
const g = 9.8; // 重力加速度
const mass = 50; // 人的质量 (kg)
let elevatorAcceleration = parseFloat(accelerationInput.value); // 电梯加速度 (m/s^2)
let isRunning = false;
let animationFrameId;

// Object dimensions and positions
const elevatorWidth = 200;
const elevatorHeight = 300;
const elevatorX = (canvas.width - elevatorWidth) / 2;
let elevatorY = canvas.height - elevatorHeight - 50; // Initial position at bottom

const personWidth = 60;
const personHeight = 100;
const personX = elevatorX + (elevatorWidth - personWidth) / 2;
let personY = elevatorY + elevatorHeight - personHeight - 20; // Person inside elevator

// Update info display
function updateInfo() {
    const normalForce = mass * (g + elevatorAcceleration);
    gravityValueSpan.textContent = g.toFixed(1);
    massValueSpan.textContent = mass.toFixed(0);
    gravityForceSpan.textContent = (mass * g).toFixed(1);
    normalForceSpan.textContent = normalForce.toFixed(1);

    if (elevatorAcceleration > 0) {
        stateSpan.textContent = "超重 (加速上升或减速下降)";
        stateSpan.style.color = "red";
    } else if (elevatorAcceleration < 0 && Math.abs(elevatorAcceleration) < g) {
        stateSpan.textContent = "失重 (加速下降或减速上升)";
        stateSpan.style.color = "blue";
    } else if (elevatorAcceleration <= -g) {
        stateSpan.textContent = "完全失重 (自由落体)";
        stateSpan.style.color = "purple";
    } else {
        stateSpan.textContent = "静止或匀速运动";
        stateSpan.style.color = "green";
    }
}

// Drawing functions
function drawElevator() {
    ctx.fillStyle = '#7f8c8d'; // Grey
    ctx.fillRect(elevatorX, elevatorY, elevatorWidth, elevatorHeight);
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 5;
    ctx.strokeRect(elevatorX, elevatorY, elevatorWidth, elevatorHeight);

    // Draw ropes
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(elevatorX + elevatorWidth / 4, 0);
    ctx.lineTo(elevatorX + elevatorWidth / 4, elevatorY);
    ctx.moveTo(elevatorX + elevatorWidth * 3 / 4, 0);
    ctx.lineTo(elevatorX + elevatorWidth * 3 / 4, elevatorY);
    ctx.stroke();
}

function drawPerson() {
    // Body
    ctx.fillStyle = '#e67e22'; // Orange
    ctx.fillRect(personX, personY, personWidth, personHeight);
    // Head
    ctx.fillStyle = '#f1c40f'; // Yellow
    ctx.beginPath();
    ctx.arc(personX + personWidth / 2, personY - 20, 20, 0, Math.PI * 2);
    ctx.fill();
}

function drawGround() {
    ctx.fillStyle = '#27ae60'; // Green
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    drawGround();
    drawElevator();
    drawPerson();
    updateInfo();
}

// Animation loop
let lastTime = 0;
function animate(currentTime) {
    if (!isRunning) {
        lastTime = currentTime;
        animationFrameId = requestAnimationFrame(animate);
        return;
    }

    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    const moveSpeed = 50; // pixels per second for visual effect
    if (elevatorAcceleration > 0) { // Accelerating upwards
        elevatorY -= moveSpeed * deltaTime;
        personY -= moveSpeed * deltaTime;
    } else if (elevatorAcceleration < 0) { // Accelerating downwards
        elevatorY += moveSpeed * deltaTime;
        personY += moveSpeed * deltaTime;
    }

    // Keep elevator within bounds (simple loop for visual effect)
    if (elevatorY < 50) {
        elevatorY = canvas.height - elevatorHeight - 50;
        personY = elevatorY + elevatorHeight - personHeight - 20;
    } else if (elevatorY > canvas.height - elevatorHeight - 50) {
        elevatorY = 50;
        personY = elevatorY + elevatorHeight - personHeight - 20;
    }

    draw();
    animationFrameId = requestAnimationFrame(animate);
}

// Event Listeners
accelerationInput.addEventListener('input', () => {
    elevatorAcceleration = parseFloat(accelerationInput.value);
    accelerationValueSpan.textContent = `${elevatorAcceleration.toFixed(1)} m/s²`;
    if (!isRunning) { // Update info immediately if not running
        updateInfo();
    }
});

startStopBtn.addEventListener('click', () => {
    isRunning = !isRunning;
    startStopBtn.textContent = isRunning ? "停止" : "开始";
    if (isRunning) {
        lastTime = performance.now(); // Reset lastTime to prevent large deltaTime on start
        animationFrameId = requestAnimationFrame(animate);
    } else {
        cancelAnimationFrame(animationFrameId);
        draw(); // Redraw to ensure info is updated
    }
});

resetBtn.addEventListener('click', () => {
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
    elevatorAcceleration = 0;
    accelerationInput.value = 0;
    accelerationValueSpan.textContent = "0.0 m/s²";
    elevatorY = canvas.height - elevatorHeight - 50;
    personY = elevatorY + elevatorHeight - personHeight - 20;
    startStopBtn.textContent = "开始";
    draw();
});

// Initial draw
draw();
