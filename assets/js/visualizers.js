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
        default:
            return new BarVisualizer(canvas, audioContext, analyser);
    }
}