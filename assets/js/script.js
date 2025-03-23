/**
 * Sound Visualizer - Main Script
 * Handles microphone input and visualization control
 */

// DOM Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const visualizerSelect = document.getElementById('visualizer-type');
const sensitivitySlider = document.getElementById('sensitivity');
const colorSchemeSelect = document.getElementById('color-scheme');
const canvas = document.getElementById('visualizer');
const aboutLink = document.getElementById('about-link');
const aboutModal = document.getElementById('about-modal');
const closeModal = document.querySelector('.close');

// Audio context and analyzer setup
let audioContext;
let analyser;
let microphone;
let visualizer;
let animationId;
let isRunning = false;

// Initialize everything
function init() {
    // Event listeners
    startBtn.addEventListener('click', startMicrophone);
    stopBtn.addEventListener('click', stopMicrophone);
    visualizerSelect.addEventListener('change', changeVisualizer);
    sensitivitySlider.addEventListener('input', updateSettings);
    colorSchemeSelect.addEventListener('change', updateSettings);
    
    // Modal events
    aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        aboutModal.style.display = 'flex';
    });
    
    closeModal.addEventListener('click', () => {
        aboutModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
    });
    
    // Set initial state
    document.querySelector('.visualizer-container').classList.add('loading');
}

// Start microphone and audio processing
async function startMicrophone() {
    try {
        // Create audio context if it doesn't exist
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        // Create microphone source
        microphone = audioContext.createMediaStreamSource(stream);
        
        // Create analyzer
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        
        // Connect microphone to analyzer
        microphone.connect(analyser);
        
        // Create visualizer
        visualizer = createVisualizer(visualizerSelect.value, canvas, audioContext, analyser);
        
        // Start animation
        startVisualization();
        
        // Update UI
        startBtn.disabled = true;
        stopBtn.disabled = false;
        document.querySelector('.visualizer-container').classList.remove('loading');
        
        // Set running state
        isRunning = true;
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions and try again.');
    }
}

// Stop microphone and audio processing
function stopMicrophone() {
    if (isRunning) {
        // Stop animation
        cancelAnimationFrame(animationId);
        
        // Disconnect microphone
        if (microphone) {
            microphone.disconnect();
            microphone = null;
        }
        
        // Reset UI
        startBtn.disabled = false;
        stopBtn.disabled = true;
        document.querySelector('.visualizer-container').classList.add('loading');
        
        // Clear canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set running state
        isRunning = false;
    }
}

// Change visualizer type
function changeVisualizer() {
    if (isRunning && visualizer) {
        // Stop current animation
        cancelAnimationFrame(animationId);
        
        // Create new visualizer
        visualizer = createVisualizer(visualizerSelect.value, canvas, audioContext, analyser);
        
        // Update settings
        updateSettings();
        
        // Restart animation
        startVisualization();
    }
}

// Update visualizer settings
function updateSettings() {
    if (visualizer) {
        const sensitivity = parseFloat(sensitivitySlider.value);
        const colorScheme = colorSchemeSelect.value;
        visualizer.setSettings(sensitivity, colorScheme);
    }
}

// Start the visualization loop
function startVisualization() {
    function animate() {
        // Draw current frame
        if (visualizer) {
            visualizer.draw();
        }
        
        // Request next frame
        animationId = requestAnimationFrame(animate);
    }
    
    // Start animation loop
    animate();
}

// Check browser compatibility
function checkCompatibility() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio input. Please try a modern browser like Chrome, Firefox, or Edge.');
        startBtn.disabled = true;
        return false;
    }
    return true;
}

// On page load
window.addEventListener('load', () => {
    init();
    checkCompatibility();
});