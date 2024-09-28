const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const speedSlider = document.getElementById('speedSlider');
const sensitivitySlider = document.getElementById('sensitivitySlider');
const restartButton = document.getElementById('restartButton');
const playButton = document.getElementById('playButton');

let ball = { x: canvas.width / 5, y: canvas.height / 2, radius: 10 };
let tunnelWidth = 150;
let tunnelCurves = [];
let score = 0;
let gameOver = false;
let speed = 2.5;
let sensitivity = 5;
let pointCounterPosition = { x: 10, y: 50 };
let touchStartY = 0;
let scrollDelta = 0;

// Resize canvas to fit the screen adaptively
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ball.x = canvas.width / 5;
    ball.y = canvas.height / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Draw the wavy tunnel
function drawTunnel() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(0, tunnelCurves[0] - tunnelWidth / 2);

    tunnelCurves.forEach((curve, index) => {
        const x = index * 10;
        ctx.lineTo(x, curve - tunnelWidth / 2);
    });

    ctx.lineTo(canvas.width, tunnelCurves[tunnelCurves.length - 1] - tunnelWidth / 2);
    ctx.lineTo(canvas.width, tunnelCurves[tunnelCurves.length - 1] + tunnelWidth / 2);

    for (let i = tunnelCurves.length - 1; i >= 0; i--) {
        const x = i * 10;
        ctx.lineTo(x, tunnelCurves[i] + tunnelWidth / 2);
    }

    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
}

// Generate smoother, wavy tunnel curves
function generateTunnelCurves() {
    tunnelCurves = tunnelCurves.slice(-canvas.width / 10);
    let lastCurve = tunnelCurves[tunnelCurves.length - 1] || canvas.height / 2;
    let newCurve = lastCurve + Math.sin(score / 10) * 10 + (Math.random() - 0.5) * 15;
    tunnelCurves.push(newCurve);
}

// Draw the ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
}

// Draw the score counter
function drawScore() {
    ctx.font = '48px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(score.toString(), pointCounterPosition.x, pointCounterPosition.y);
}

// Update the game state
function update() {
    if (gameOver) return;

    generateTunnelCurves();
    updateBallPosition();

    const ballTunnelIndex = Math.floor(ball.x / 10);
    const tunnelTop = tunnelCurves[ballTunnelIndex] - tunnelWidth / 2;
    const tunnelBottom = tunnelCurves[ballTunnelIndex] + tunnelWidth / 2;

    if (ball.y < tunnelTop || ball.y > tunnelBottom) {
        gameOver = true;
        showRestartButton();
        showScoreSubmissionForm();
    }

    score += 1;
}

// Handle gamepad input
function handleGamepad() {
    const gp = navigator.getGamepads()[0];
    if (gp) {
        const yAxis = gp.axes[1];
        ball.y += yAxis * sensitivity;
    }
}

// Handle mouse scroll input
function handleMouseScroll(event) {
    scrollDelta += event.deltaY * 0.1;
}

// Add event listener for mouse wheel scroll
window.addEventListener('wheel', handleMouseScroll);

// Update ball position using touch, scroll, and gamepad input
function updateBallPosition() {
    handleGamepad();
    ball.y += scrollDelta * sensitivity;
    scrollDelta = 0;
}

// Show the restart button
function showRestartButton() {
    restartButton.style.display = 'block';
    speedSlider.parentElement.style.display = 'block';
}

// Show the score submission form
function showScoreSubmissionForm() {
    document.getElementById('scoreSubmission').style.display = 'block'; // Show name input and submit button
}

// Hide the restart button and score submission form
function hideRestartButton() {
    restartButton.style.display = 'none';
    speedSlider.parentElement.style.display = 'none';
    document.getElementById('scoreSubmission').style.display = 'none';
}

// Restart game
function restartGame() {
    gameOver = false;
    score = 0;
    ball = { x: canvas.width / 5, y: canvas.height / 2, radius: 10 };
    tunnelCurves = [];
    for (let i = 0; i < canvas.width / 10; i++) {
        tunnelCurves.push(canvas.height / 2);
    }
    hideRestartButton();
    gameLoop();
}

// Start game after clicking play
function startGame() {
    playButton.style.display = 'none';
    speedSlider.parentElement.style.display = 'flex';
    restartGame();
}

playButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);

speedSlider.addEventListener('input', (e) => {
    speed = e.target.value / 2;
});

sensitivitySlider.addEventListener('input', (e) => {
    sensitivity = e.target.value / 1.5;
});

// Initialize tunnel curves
for (let i = 0; i < canvas.width / 10; i++) {
    tunnelCurves.push(canvas.height / 2);
}

// Add touch event listeners for mobile
canvas.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const deltaY = touchY - touchStartY;
    ball.y += deltaY * (sensitivity / 5);
    touchStartY = touchY;
});

// Game loop function to control the gameplay
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTunnel();
    drawBall();
    drawScore();
    update();
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    } else {
        ctx.font = '48px Arial';
        ctx.fillStyle = 'red';
        ctx.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
    }
}

// Submit score function when the player enters their name and clicks submit
function submitScore() {
    const playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        alert('Please enter your name!');
        return;
    }

    // Sending score to the server
    fetch('/submit-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: playerName, score: score }),
    })
    .then(response => response.json())
    .then(data => {
        alert('Score submitted successfully!');
        window.location.href = '/leaderboard.html'; // Redirect to leaderboard page
    })
    .catch(error => {
        console.error('Error submitting score:', error);
        alert('Failed to submit score. Please try again.');
    });
}

// Event listener for the submit button
document.getElementById('submitScoreButton').addEventListener('click', submitScore);

// Detect joystick connection
window.addEventListener('gamepadconnected', (e) => {
    gamepad = e.gamepad;
    console.log('Gamepad connected:', gamepad);
});
