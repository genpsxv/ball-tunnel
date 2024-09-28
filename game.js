const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const speedSlider = document.getElementById('speedSlider');
const tunnelSpeedSlider = document.getElementById('tunnelSpeedSlider');
const restartButton = document.getElementById('restartButton');
const playButton = document.getElementById('playButton');

let ball = { x: 0, y: 0, radius: 10 };
let tunnelWidth = 150;
let tunnelCurves = [];
let score = 0;
let gameOver = false;
let ballSpeed = 5;
let tunnelSpeed = 1.5;
let pointCounterPosition = { x: 10, y: 50 };
let touchStartY = 0;
let scrollDelta = 0;
let gamepad = null; // For tracking gamepad input

// Resize canvas to fit the screen adaptively
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.8; // Adjust height to fit mobile view better
    resetBallPosition();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Reset ball position based on canvas size
function resetBallPosition() {
    ball.x = canvas.width / 5;
    ball.y = canvas.height / 2;
}

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
    tunnelCurves = tunnelCurves.slice(-Math.ceil(canvas.width / 10));
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
    ctx.font = '24px Arial';
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

// Update ball position using mouse wheel, touch, and gamepad input
function updateBallPosition() {
    handleGamepadInput(); // Handle gamepad input if connected
    ball.y += scrollDelta * (ballSpeed / 5); // Adjust ball movement speed based on slider value
    scrollDelta = 0; // Reset scrollDelta after applying
}

// Handle gamepad input
function handleGamepadInput() {
    const gamepads = navigator.getGamepads();
    if (gamepads[0]) {
        gamepad = gamepads[0];
        const yAxis = gamepad.axes[1]; // Y-axis on most controllers
        ball.y += yAxis * ballSpeed; // Adjust sensitivity for better control
    }
}

// Show the restart button
function showRestartButton() {
    restartButton.style.display = 'block';
    speedSlider.parentElement.style.display = 'block';
    tunnelSpeedSlider.parentElement.style.display = 'block';
}

// Show the score submission form
function showScoreSubmissionForm() {
    document.getElementById('scoreSubmission').style.display = 'block'; // Show name input and submit button
}

// Hide the restart button and score submission form
function hideRestartButton() {
    restartButton.style.display = 'none';
    speedSlider.parentElement.style.display = 'none';
    tunnelSpeedSlider.parentElement.style.display = 'none';
    document.getElementById('scoreSubmission').style.display = 'none';
}

// Restart game
function restartGame() {
    gameOver = false;
    score = 0;
    resetBallPosition();
    tunnelCurves = [];
    for (let i = 0; i < Math.ceil(canvas.width / 10); i++) {
        tunnelCurves.push(canvas.height / 2);
    }
    hideRestartButton();
    gameLoop();
}

// Start game after clicking play
function startGame() {
    playButton.style.display = 'none';
    speedSlider.parentElement.style.display = 'flex';
    tunnelSpeedSlider.parentElement.style.display = 'flex';
    restartGame();
}

playButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);

// Adjust ball and tunnel speeds based on slider inputs
speedSlider.addEventListener('input', (e) => {
    ballSpeed = e.target.value;
});

tunnelSpeedSlider.addEventListener('input', (e) => {
    tunnelSpeed = e.target.value / 2;
});

// Initialize tunnel curves
for (let i = 0; i < Math.ceil(canvas.width / 10); i++) {
    tunnelCurves.push(canvas.height / 2);
}

// Add touch event listeners for mobile
canvas.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const deltaY = touchY - touchStartY;
    ball.y += deltaY * (ballSpeed / 5);
    touchStartY = touchY;
});

// Handle mouse scroll input
window.addEventListener('wheel', (e) => {
    scrollDelta += e.deltaY * 0.1; // Adjust sensitivity if needed
});

// Game loop function to control the gameplay
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Ensure canvas is cleared
    drawTunnel();
    drawBall();
    drawScore();
    update();
    if (!gameOver) {
        requestAnimationFrame(gameLoop); // Continue looping if not game over
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

    // Sending score to the server (example URL; needs backend setup)
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
    console.log('Gamepad connected:', e.gamepad);
});
