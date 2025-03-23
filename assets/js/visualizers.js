/**
 * Sound Visualizer - Visualization Modules
 * Contains different visualization methods for audio data
 */

class AudioVisualizer {
    constructor(canvas, audioContext, analyser) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioContext = audioContext;
        this.analyser = analyser;
        this.sensitivity = 2;
        this.colorScheme = 'gradient1';
        
        // Set up canvas dimensions
        this.setupCanvas();
        
        // Bind resize event
        window.addEventListener('resize', () => this.setupCanvas());
    }
    
    setupCanvas() {
        // Set canvas to match container size
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Set canvas scaling
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.canvas.offsetWidth * dpr;
        this.canvas.height = this.canvas.offsetHeight * dpr;
        this.ctx.scale(dpr, dpr);
        
        // Reset styles
        this.ctx.fillStyle = '#1e1e1e';
        this.ctx.strokeStyle = '#00aeff';
        this.ctx.lineWidth = 2;
    }
    
    setSettings(sensitivity, colorScheme) {
        this.sensitivity = sensitivity;
        this.colorScheme = colorScheme;
    }
    
    getColor(index, total, intensity) {
        // Apply sensitivity multiplier to intensity
        intensity = Math.min(1, intensity * this.sensitivity);
        
        switch (this.colorScheme) {
            case 'gradient1': // Neon
                return `hsl(${index / total * 360}, 100%, ${50 + intensity * 50}%)`;
            case 'gradient2': // Sunset
                return `hsl(${(index / total * 60) + 10}, ${80 + intensity * 20}%, ${50 + intensity * 30}%)`;
            case 'gradient3': // Ocean
                return `hsl(${180 + (index / total * 60)}, ${70 + intensity * 30}%, ${30 + intensity * 50}%)`;
            case 'monochrome':
                return `rgba(0, 174, 255, ${0.2 + intensity * 0.8})`;
            default:
                return `hsl(${index / total * 360}, 100%, ${50 + intensity * 50}%)`;
        }
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

class BarVisualizer extends AudioVisualizer {
    constructor(canvas, audioContext, analyser) {
        super(canvas, audioContext, analyser);
        this.dataArray = new Uint8Array(analyser.frequencyBinCount);
        this.barWidth = 0;
        this.barSpacing = 2;
    }
    
    draw() {
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Clear canvas
        this.clearCanvas();
        
        // Calculate bar width based on canvas size and number of bars
        const numBars = Math.min(this.dataArray.length, Math.floor(this.canvas.width / 4));
        this.barWidth = (this.canvas.width / numBars) - this.barSpacing;
        
        // Draw bars
        for (let i = 0; i < numBars; i++) {
            // Skip some bars for performance on large canvases
            const dataIndex = Math.floor(i * (this.dataArray.length / numBars));
            const value = this.dataArray[dataIndex] / 255.0; // Normalize to 0-1
            
            // Calculate bar height
            const barHeight = (this.canvas.height * value) * this.sensitivity;
            
            // Calculate position
            const x = i * (this.barWidth + this.barSpacing);
            const y = this.canvas.height - barHeight;
            
            // Set color based on frequency and intensity
            this.ctx.fillStyle = this.getColor(i, numBars, value);
            
            // Draw rectangle
            this.ctx.fillRect(x, y, this.barWidth, barHeight);
            
            // Add optional highlight for more depth
            if (value > 0.7) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.fillRect(x, y, this.barWidth, 2);
            }
        }
    }
}

class WaveVisualizer extends AudioVisualizer {
    constructor(canvas, audioContext, analyser) {
        super(canvas, audioContext, analyser);
        this.dataArray = new Uint8Array(analyser.fftSize);
        this.lineWidth = 3;
    }
    
    draw() {
        // Get time domain data
        this.analyser.getByteTimeDomainData(this.dataArray);
        
        // Clear canvas
        this.clearCanvas();
        
        // Draw wave
        this.ctx.beginPath();
        
        const sliceWidth = this.canvas.width / this.dataArray.length;
        let x = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            const value = this.dataArray[i] / 128.0;
            const y = (value * this.canvas.height / 2) * this.sensitivity;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        // Set line style
        this.ctx.strokeStyle = this.getColor(50, 100, 0.8);
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.stroke();
        
        // Add glow effect
        this.ctx.strokeStyle = 'rgba(0, 174, 255, 0.2)';
        this.ctx.lineWidth = this.lineWidth + 4;
        this.ctx.stroke();
    }
}

class CircularVisualizer extends AudioVisualizer {
    constructor(canvas, audioContext, analyser) {
        super(canvas, audioContext, analyser);
        this.dataArray = new Uint8Array(analyser.frequencyBinCount);
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) * 0.8;
    }
    
    draw() {
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Update center and radius based on current canvas size
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) * 0.8;
        
        // Clear canvas
        this.clearCanvas();
        
        // Calculate number of points
        const numPoints = Math.min(this.dataArray.length, 128);
        const angleStep = (Math.PI * 2) / numPoints;
        
        // Draw outer circle
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Draw frequency points
        for (let i = 0; i < numPoints; i++) {
            const dataIndex = Math.floor(i * (this.dataArray.length / numPoints));
            const value = this.dataArray[dataIndex] / 255.0;
            
            const scaledRadius = this.radius + (value * this.radius * 0.5 * this.sensitivity);
            const angle = i * angleStep;
            
            const x = this.centerX + Math.cos(angle) * scaledRadius;
            const y = this.centerY + Math.sin(angle) * scaledRadius;
            
            // Draw lines from center to points
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.lineTo(x, y);
            this.ctx.strokeStyle = this.getColor(i, numPoints, value);
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw points
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2 + value * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = this.getColor(i, numPoints, value);
            this.ctx.fill();
        }
        
        // Draw inner circle
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius * 0.1, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fill();
    }
}

class ParticleVisualizer extends AudioVisualizer {
    constructor(canvas, audioContext, analyser) {
        super(canvas, audioContext, analyser);
        this.dataArray = new Uint8Array(analyser.frequencyBinCount);
        this.particles = [];
        this.maxParticles = 100;
        this.initParticles();
    }
    
    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 5 + 1,
                speedX: Math.random() * 2 - 1,
                speedY: Math.random() * 2 - 1,
                color: 'rgba(0, 174, 255, 0.5)',
                frequency: Math.floor(Math.random() * 32)
            });
        }
    }
    
    draw() {
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Clear canvas
        this.clearCanvas();
        
        // Draw and update particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Get frequency value for this particle
            const frequencyValue = this.dataArray[p.frequency] / 255.0;
            
            // Update size based on frequency
            const newSize = p.size + (frequencyValue * 10 * this.sensitivity);
            
            // Update position
            p.x += p.speedX * (1 + frequencyValue * 2);
            p.y += p.speedY * (1 + frequencyValue * 2);
            
            // Bounce off edges
            if (p.x < 0 || p.x > this.canvas.width) p.speedX *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.speedY *= -1;
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, newSize, 0, Math.PI * 2);
            p.color = this.getColor(p.frequency, 32, frequencyValue);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            
            // Connect nearby particles
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100 && frequencyValue > 0.2) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(0, 174, 255, ${0.1 * frequencyValue})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
    }
}

// NEW VISUALIZERS

class SpectrumAnalyzer extends AudioVisualizer {
    constructor(canvas, audioContext, analyser) {
        super(canvas, audioContext, analyser);
        this.dataArray = new Uint8Array(analyser.frequencyBinCount);
        this.minDecibels = -70;
        this.maxDecibels = -30;
        this.smoothingTimeConstant = 0.85;
        
        // Set analyzer properties for better spectrum analysis
        analyser.minDecibels = this.minDecibels;
        analyser.maxDecibels = this.maxDecibels;
        analyser.smoothingTimeConstant = this.smoothingTimeConstant;
    }
    
    draw() {
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Clear canvas
        this.clearCanvas();
        
        // Draw frequency spectrum with logarithmic scale
        const width = this.canvas.width;
        const height = this.canvas.height;
        const barCount = Math.min(128, this.dataArray.length);
        
        // Draw background grid
        this.drawGrid(width, height);
        
        // Draw frequency bands
        for (let i = 0; i < barCount; i++) {
            // Use logarithmic scale for x-position (frequency)
            const logIndex = Math.round(Math.pow(i / barCount, 0.5) * barCount);
            const value = this.dataArray[logIndex] / 255.0;
            
            // Calculate position
            const x = (i / barCount) * width;
            const barWidth = width / barCount;
            const barHeight = value * height * this.sensitivity;
            
            // Draw bar with gradient
            const gradient = this.ctx.createLinearGradient(0, height, 0, height - barHeight);
            gradient.addColorStop(0, this.getColor(i, barCount, 0.3));
            gradient.addColorStop(1, this.getColor(i, barCount, value));
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
            
            // Add marker lines for specific frequency ranges
            if (i % 16 === 0) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.fillRect(x, height - 5, 1, 5);
            }
        }
        
        // Draw frequency labels
        this.drawLabels(width, height);
    }
    
    drawGrid(width, height) {
        // Draw horizontal lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 5; i++) {
            const y = height * (i / 5);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        // Draw vertical lines
        for (let i = 0; i < 10; i++) {
            const x = width * (i / 10);
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
    }
    
    drawLabels(width, height) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        
        // Draw frequency labels (Hz)
        const freqLabels = ['20', '50', '100', '200', '500', '1k', '2k', '5k', '10k', '20k'];
        for (let i = 0; i < freqLabels.length; i++) {
            const x = width * (i / 10 + 0.05);
            this.ctx.fillText(freqLabels[i], x, height - 10);
        }
    }
}

class WaterDropVisualizer extends AudioVisualizer {
    constructor(canvas, audioContext, analyser) {
        super(canvas, audioContext, analyser);
        this.dataArray = new Uint8Array(analyser.frequencyBinCount);
        this.drops = [];
        this.lastTime = 0;
        this.dropInterval = 80; // ms between drop generations
        this.timeElapsed = 0;
    }
    
    draw() {
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calculate average frequency value for drop generation
        let sum = 0;
        const len = this.dataArray.length;
        for (let i = 0; i < len; i++) {
            sum += this.dataArray[i];
        }
        const avg = sum / len / 255;
        
        // Get current time for animation
        const now = Date.now();
        if (this.lastTime === 0) this.lastTime = now;
        const dt = now - this.lastTime;
        this.lastTime = now;
        
        this.timeElapsed += dt;
        
        // Create new drops based on intensity
        if (this.timeElapsed > this.dropInterval / (avg * this.sensitivity + 0.1)) {
            this.createDrop(avg);
            this.timeElapsed = 0;
        }
        
        // Clear canvas
        this.clearCanvas();
        
        // Update and draw drops
        this.updateAndDrawDrops(dt);
    }
    
    createDrop(intensity) {
        // Get a frequency bin for coloring
        const freqIndex = Math.floor(Math.random() * (this.dataArray.length / 4));
        const freqValue = this.dataArray[freqIndex] / 255.0;
        
        // Create a new drop
        this.drops.push({
            x: Math.random() * this.canvas.width,
            y: -20,
            radius: 5 + Math.random() * 15 * intensity * this.sensitivity,
            speed: 1 + Math.random() * 3 * intensity * this.sensitivity,
            color: this.getColor(freqIndex, this.dataArray.length / 4, freqValue),
            intensity: intensity,
            freqIndex: freqIndex,
            opacity: 1,
            ripples: []
        });
        
        // Limit number of drops
        if (this.drops.length > 30) {
            this.drops.shift();
        }
    }
    
    updateAndDrawDrops(dt) {
        const height = this.canvas.height;
        const ctx = this.ctx;
        
        // Update each drop
        for (let i = this.drops.length - 1; i >= 0; i--) {
            const drop = this.drops[i];
            
            // Update position
            drop.y += drop.speed * (dt / 16);
            
            // Check if drop hit bottom
            if (drop.y > height - 20 && drop.ripples.length === 0) {
                // Create ripples
                const rippleCount = Math.floor(2 + Math.random() * 3);
                for (let j = 0; j < rippleCount; j++) {
                    drop.ripples.push({
                        radius: drop.radius,
                        maxRadius: drop.radius * (4 + Math.random() * 4),
                        alpha: 0.7,
                        lineWidth: 2
                    });
                }
                drop.y = height - 20;
            }
            
            // Get updated frequency value
            const freqValue = this.dataArray[drop.freqIndex] / 255.0;
            
            // Draw drop
            if (drop.ripples.length === 0) {
                // Draw falling drop
                ctx.beginPath();
                ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.getColor(drop.freqIndex, this.dataArray.length / 4, freqValue);
                ctx.globalAlpha = drop.opacity;
                ctx.fill();
                
                // Draw drop trail
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y - drop.radius);
                ctx.lineTo(drop.x + drop.radius / 3, drop.y - drop.radius * 2);
                ctx.lineTo(drop.x - drop.radius / 3, drop.y - drop.radius * 2);
                ctx.closePath();
                ctx.fillStyle = this.getColor(drop.freqIndex, this.dataArray.length / 4, freqValue * 0.7);
                ctx.fill();
            } else {
                // Update and draw ripples
                let allRipplesComplete = true;
                
                for (let j = 0; j < drop.ripples.length; j++) {
                    const ripple = drop.ripples[j];
                    
                    // Update ripple
                    ripple.radius += (ripple.maxRadius - ripple.radius) * 0.05 * (dt / 16);
                    ripple.alpha -= 0.01 * (dt / 16);
                    ripple.lineWidth -= 0.02 * (dt / 16);
                    
                    if (ripple.alpha > 0 && ripple.lineWidth > 0) {
                        // Draw ripple
                        ctx.beginPath();
                        ctx.arc(drop.x, drop.y, ripple.radius, 0, Math.PI * 2);
                        ctx.strokeStyle = this.getColor(drop.freqIndex, this.dataArray.length / 4, freqValue);
                        ctx.globalAlpha = ripple.alpha;
                        ctx.lineWidth = ripple.lineWidth;
                        ctx.stroke();
                        
                        allRipplesComplete = false;
                    }
                }
                
                // Remove drop if all ripples are complete
                if (allRipplesComplete) {
                    this.drops.splice(i, 1);
                }
            }
        }
        
        // Reset global alpha
        ctx.globalAlpha = 1;
    }
}

class PulseVisualizer extends AudioVisualizer {
    constructor(canvas, audioContext, analyser) {
        super(canvas, audioContext, analyser);
        this.dataArray = new Uint8Array(analyser.frequencyBinCount);
        this.rings = [];
        this.maxRings = 5;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // Initialize rings
        for (let i = 0; i < this.maxRings; i++) {
            this.rings.push({
                radius: 0,
                targetRadius: 0,
                alpha: 0.8 - (i * 0.15),
                freqRange: {
                    min: Math.floor(i * (this.dataArray.length / this.maxRings)),
                    max: Math.floor((i + 1) * (this.dataArray.length / this.maxRings))
                }
            });
        }
    }
    
    draw() {
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Update center based on canvas size
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // Clear canvas
        this.clearCanvas();
        
        // Calculate max radius
        const maxRadius = Math.min(this.centerX, this.centerY) * 0.9;
        
        // Draw rings
        for (let i = 0; i < this.rings.length; i++) {
            const ring = this.rings[i];
            
            // Calculate average frequency value for this ring's range
            let sum = 0;
            let count = 0;
            for (let j = ring.freqRange.min; j < ring.freqRange.max; j++) {
                sum += this.dataArray[j];
                count++;
            }
            const avg = sum / count / 255;
            
            // Update ring target radius based on frequency
            ring.targetRadius = maxRadius * (0.2 + (i / this.rings.length) * 0.8) * (0.5 + avg * 0.5 * this.sensitivity);
            
            // Smoothly approach target radius
            ring.radius += (ring.targetRadius - ring.radius) * 0.1;
            
            // Draw ring
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, ring.radius, 0, Math.PI * 2);
            
            // Set color and style
            const color = this.getColor(i, this.rings.length, avg);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3 + avg * 7 * this.sensitivity;
            this.ctx.globalAlpha = ring.alpha;
            this.ctx.stroke();
            
            // Add glow effect for higher frequencies
            if (avg > 0.6) {
                this.ctx.beginPath();
                this.ctx.arc(this.centerX, this.centerY, ring.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 6 + avg * 10;
                this.ctx.globalAlpha = ring.alpha * 0.3;
                this.ctx.stroke();
                
                // Add pulses for high intensity
                if (avg > 0.8) {
                    this.ctx.beginPath();
                    this.ctx.arc(this.centerX, this.centerY, ring.radius * 0.95, 0, Math.PI * 2);
                    this.ctx.strokeStyle = 'white';
                    this.ctx.lineWidth = 2;
                    this.ctx.globalAlpha = avg * 0.5;
                    this.ctx.stroke();
                }
            }
        }
        
        // Reset global alpha
        this.ctx.globalAlpha = 1;
        
        // Draw center circle
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = this.getColor(0, 1, 0.8);
        this.ctx.fill();
    }
}

class SpiralVisualizer extends AudioVisualizer {
    constructor(canvas, audioContext, analyser) {
        super(canvas, audioContext, analyser);
        this.dataArray = new Uint8Array(analyser.frequencyBinCount);
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.rotation = 0;
        this.rotationSpeed = 0.005;
    }
    
    draw() {
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Update center based on canvas size
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // Clear canvas
        this.clearCanvas();
        
        // Update rotation
        this.rotation += this.rotationSpeed;
        if (this.rotation > Math.PI * 2) this.rotation -= Math.PI * 2;
        
        // Calculate max radius
        const maxRadius = Math.min(this.centerX, this.centerY) * 0.9;
        
        // Draw spiral
        const numPoints = Math.min(this.dataArray.length, 512);
        const angleStep = (Math.PI * 16) / numPoints;
        
        this.ctx.beginPath();
        
        for (let i = 0; i < numPoints; i++) {
            const angle = this.rotation + i * angleStep;
            const radiusFactor = i / numPoints;
            
            // Get frequency value
            const dataIndex = Math.floor(i * (this.dataArray.length / numPoints));
            const value = this.dataArray[dataIndex] / 255.0;
            
            // Calculate radius with frequency modulation
            const radius = maxRadius * radiusFactor * (0.1 + 0.9 * (1 + value * this.sensitivity) / 2);
            
            // Calculate position
            const x = this.centerX + Math.cos(angle) * radius;
            const y = this.centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            
            // Draw connecting dots at intervals
            if (i % 8 === 0) {
                this.ctx.fillStyle = this.getColor(i, numPoints, value);
                this.ctx.fillRect(x - 2, y - 2, 4, 4);
            }
        }
        
        // Style and stroke the spiral
        this.ctx.strokeStyle = this.getColor(50, 100, 0.8);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Add perimeter circle
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, maxRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
}

class FirefliesVisualizer extends AudioVisualizer {
    constructor(canvas, audioContext, analyser) {
        super(canvas, audioContext, analyser);
        this.dataArray = new Uint8Array(analyser.frequencyBinCount);
        this.fireflies = [];
        this.maxFireflies = 150;
        this.initFireflies();
    }
    
    initFireflies() {
        this.fireflies = [];
        for (let i = 0; i < this.maxFireflies; i++) {
            this.fireflies.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.5 + 0.1,
                angle: Math.random() * Math.PI * 2,
                angleChange: Math.random() * 0.1 - 0.05,
                pulseRate: Math.random() * 0.02 + 0.005,
                pulseOffset: Math.random() * Math.PI * 2,
                alpha: Math.random() * 0.5 + 0.2,
                frequencyIndex: Math.floor(Math.random() * 64)
            });
        }
    }
    
    draw() {
        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(30, 30, 30, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Get average frequency value
        let sum = 0;
        for (let i = 0; i < 32; i++) {
            sum += this.dataArray[i];
        }
        const avgBass = sum / 32 / 255;
        
        // Update and draw fireflies
        for (let i = 0; i < this.fireflies.length; i++) {
            const f = this.fireflies[i];
            
            // Get frequency value for this firefly
            const freqValue = this.dataArray[f.frequencyIndex] / 255.0;
            
            // Update position
            f.angle += f.angleChange + (freqValue * 0.1 - 0.05);
            const speed = f.speed * (1 + freqValue * this.sensitivity);
            f.x += Math.cos(f.angle) * speed;
            f.y += Math.sin(f.angle) * speed;
            
            // Wrap around edges
            if (f.x < 0) f.x = this.canvas.width;
            if (f.x > this.canvas.width) f.x = 0;
            if (f.y < 0) f.y = this.canvas.height;
            if (f.y > this.canvas.height) f.y = 0;
            
            // Calculate pulse for size variation
            const time = performance.now() * 0.001;
            const pulse = Math.sin(time * f.pulseRate + f.pulseOffset);
            const size = f.size * (1 + pulse * 0.3) * (1 + freqValue * 2 * this.sensitivity);
            
            // Draw firefly
            const alpha = f.alpha * (0.5 + freqValue * 0.5);
            this.ctx.beginPath();
            this.ctx.arc(f.x, f.y, size, 0, Math.PI * 2);
            
            // Create gradient for glow effect
            const gradient = this.ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, size * 3);
            const color = this.getColor(f.frequencyIndex, 64, freqValue);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = alpha;
            this.ctx.fill();
            
            // Draw core of firefly
            this.ctx.beginPath();
            this.ctx.arc(f.x, f.y, size * 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fill();
            
            // Add trails when bass is high
            if (avgBass > 0.6 && freqValue > 0.5) {
                this.ctx.beginPath();
                this.ctx.moveTo(f.x, f.y);
                const trailLength = 10 * avgBass * this.sensitivity;
                const tx = f.x - Math.cos(f.angle) * trailLength;
                const ty = f.y - Math.sin(f.angle) * trailLength;
                this.ctx.lineTo(tx, ty);
                this.ctx.strokeStyle = color;
                this.ctx.globalAlpha = alpha * 0.3;
                this.ctx.lineWidth = size * 0.8;
                this.ctx.stroke();
            }
        }
        
        // Reset global alpha
        this.ctx.globalAlpha = 1;
    }
}

// Factory function to create visualizers
function createVisualizer(type, canvas, audioContext, analyser) {
    switch (type) {
        case 'bars':
            return new BarVisualizer(canvas, audioContext, analyser);
        case 'wave':
            return new WaveVisualizer(canvas, audioContext, analyser);
        case 'circular':
            return new CircularVisualizer(canvas, audioContext, analyser);
        case 'particles':
            return new ParticleVisualizer(canvas, audioContext, analyser);
        case 'spectrum':
            return new SpectrumAnalyzer(canvas, audioContext, analyser);
        case 'waterdrops':
            return new WaterDropVisualizer(canvas, audioContext, analyser);
        case 'pulse':
            return new PulseVisualizer(canvas, audioContext, analyser);
        case 'spiral':
            return new SpiralVisualizer(canvas, audioContext, analyser);
        case 'fireflies':
            return new FirefliesVisualizer(canvas, audioContext, analyser);
        default:
            return new BarVisualizer(canvas, audioContext, analyser);
    }
}