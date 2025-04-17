document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const powerToggle = document.getElementById('power-toggle');
    const fiberSelect = document.getElementById('fiber-select');
    const laserSelect = document.getElementById('laser-select');
    const zDistanceSlider = document.getElementById('z-distance');
    const xDistanceSlider = document.getElementById('x-distance');
    const zValueDisplay = document.getElementById('z-value');
    const xValueDisplay = document.getElementById('x-value');
    const intensityDisplay = document.getElementById('intensity-display');
    const fiberLight = document.getElementById('fiber-light');
    const laserBeam = document.getElementById('laser-beam');
    const vernierReading = document.getElementById('vernier-reading');
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    const showVernierBtn = document.getElementById('show-vernier');
    const showGraphBtn = document.getElementById('show-graph');
    const resetBtn = document.getElementById('reset-btn');
    const helpBtn = document.getElementById('help-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const helpModal = document.getElementById('help-modal');
    const closeHelpBtn = document.getElementById('close-help');
    const panelToggle = document.getElementById('panel-toggle');
    const controlContent = document.querySelector('.control-content');
    const graphContainer = document.getElementById('graph-container');
    const graphCanvas = document.getElementById('graph-canvas');
    const lightRaysContainer = document.getElementById('light-rays-container');

    // Simulation parameters
    const fibers = {
        'glass-glass': {
            name: 'Glass-Glass Fiber',
            NA: 0.22,
            n1: 1.48, // Core refractive index
            n2: 1.46  // Cladding refractive index
        },
        'plastic': {
            name: 'Plastic Fiber',
            NA: 0.30,
            n1: 1.492,
            n2: 1.46
        },
        'graded': {
            name: 'Graded Index Fiber',
            NA: 0.25,
            n1: 1.50,
            n2: 1.47
        }
    };

    const lasers = {
        'red': {
            name: 'Red (650 nm)',
            wavelength: 650,
            color: '#ff0000',
            intensity: 1.0
        },
        'green': {
            name: 'Green (532 nm)',
            wavelength: 532,
            color: '#00ff00',
            intensity: 1.2
        },
        'blue': {
            name: 'Blue (450 nm)',
            wavelength: 450,
            color: '#0066ff',
            intensity: 0.8
        }
    };

    // Current state
    let currentState = {
        power: false,
        fiber: 'glass-glass',
        laser: 'red',
        zDistance: 2.0,
        xDistance: 0.0,
        showVernier: false,
        showGraph: false,
        maxAngle: 0,
        intensityData: []
    };

    // Initialize the simulation
    function initSimulation() {
        // Set initial UI states
        powerToggle.checked = currentState.power;
        fiberSelect.value = currentState.fiber;
        laserSelect.value = currentState.laser;
        zDistanceSlider.value = currentState.zDistance;
        xDistanceSlider.value = currentState.xDistance;

        updateZValueDisplay();
        updateXValueDisplay();
        updateIntensityDisplay();
        updateFiberLight();
        updateLaserBeam();
        updateVernierReading();

        // Create light rays
        createLightRays();

        // Hide vernier and graph initially
        vernierReading.classList.remove('visible');
        graphContainer.classList.remove('visible');
    }

    // Helper functions
    function updateZValueDisplay() {
        zValueDisplay.textContent = currentState.zDistance.toFixed(1);
    }

    function updateXValueDisplay() {
        xValueDisplay.textContent = currentState.xDistance.toFixed(1);
    }

    function updateIntensityDisplay() {
        const intensity = calculateIntensity();
        intensityDisplay.textContent = intensity.toFixed(2);

        if (currentState.power) {
            intensityDisplay.classList.remove('detector-off');
            intensityDisplay.classList.add('detector-powered');
        } else {
            intensityDisplay.classList.remove('detector-powered');
            intensityDisplay.classList.add('detector-off');
        }
    }

    function updateFiberLight() {
        if (currentState.power) {
            fiberLight.classList.add('powered');
            fiberLight.style.backgroundColor = lasers[currentState.laser].color;
        } else {
            fiberLight.classList.remove('powered');
        }
    }

    function updateLaserBeam() {
        if (currentState.power) {
            laserBeam.classList.add('powered');
            laserBeam.style.backgroundColor = lasers[currentState.laser].color;
            laserBeam.style.boxShadow = `0 0 10px ${lasers[currentState.laser].color}`;
        } else {
            laserBeam.classList.remove('powered');
        }
    }

    function updateVernierReading() {
        const angle = calculateAngle();
        vernierReading.textContent = `Angle: ${angle.toFixed(1)}°`;

        if (currentState.showVernier) {
            vernierReading.classList.add('visible');
        } else {
            vernierReading.classList.remove('visible');
        }
    }

    function calculateAngle() {
        // Calculate the angle based on x and z distances
        return Math.atan(Math.abs(currentState.xDistance) / currentState.zDistance) * (180 / Math.PI);
    }

    function calculateIntensity() {
        if (!currentState.power) return 0;

        const fiber = fibers[currentState.fiber];
        const laser = lasers[currentState.laser];
        const angle = calculateAngle();
        const maxAngle = Math.asin(fiber.NA) * (180 / Math.PI);
        currentState.maxAngle = maxAngle;

        // Calculate intensity based on angle, fiber type, and laser
        let intensity;
        if (angle <= maxAngle) {
            // Gaussian distribution of intensity within acceptance cone
            intensity = laser.intensity * Math.exp(-Math.pow(angle / maxAngle, 2) * 2);
        } else {
            // Rapid falloff outside acceptance cone
            intensity = laser.intensity * Math.exp(-Math.pow(angle / maxAngle, 2) * 4);
        }

        // Adjust for distance
        intensity *= 1 / (1 + Math.pow(currentState.zDistance / 2, 2));

        // Scale to a reasonable value
        intensity *= 10;

        return intensity;
    }

    function createLightRays() {
        // Clear existing rays
        lightRaysContainer.innerHTML = '';

        // Create a fan of light rays
        const numRays = 20;
        const fiber = fibers[currentState.fiber];
        const maxAngle = Math.asin(fiber.NA);

        for (let i = 0; i < numRays; i++) {
            const angle = (i / (numRays - 1)) * 2 * maxAngle - maxAngle;

            // Create ray element
            const ray = document.createElement('div');
            ray.className = 'light-ray';
            ray.style.left = '375px'; // Center of fiber hole
            ray.style.top = '250px';  // Center of fiber hole
            ray.style.width = '300px';
            ray.style.transform = `rotate(${angle * (180 / Math.PI)}deg)`;

            if (currentState.power) {
                ray.classList.add('visible');
                ray.style.backgroundColor = lasers[currentState.laser].color;
                ray.style.boxShadow = `0 0 3px ${lasers[currentState.laser].color}`;
            }

            lightRaysContainer.appendChild(ray);
        }
    }

    function updateLightRays() {
        const rays = document.querySelectorAll('.light-ray');

        rays.forEach(ray => {
            if (currentState.power) {
                ray.classList.add('visible');
                ray.style.backgroundColor = lasers[currentState.laser].color;
                ray.style.boxShadow = `0 0 3px ${lasers[currentState.laser].color}`;
            } else {
                ray.classList.remove('visible');
            }
        });
    }

    function generateIntensityData() {
        // Generate data points for the graph
        const data = [];
        const fiber = fibers[currentState.fiber];
        const laser = lasers[currentState.laser];
        const maxAngle = Math.asin(fiber.NA) * (180 / Math.PI);

        // Save original x and z values
        const originalX = currentState.xDistance;
        const originalZ = currentState.zDistance;

        // Generate data points
        for (let x = -5; x <= 5; x += 0.2) {
            currentState.xDistance = x;
            const angle = calculateAngle();
            const intensity = calculateIntensity();

            data.push({
                x: x,
                angle: angle,
                intensity: intensity
            });
        }

        // Restore original values
        currentState.xDistance = originalX;
        currentState.zDistance = originalZ;

        return data;
    }

    function drawGraph() {
        if (!currentState.showGraph) return;

        const data = generateIntensityData();
        currentState.intensityData = data;

        const ctx = graphCanvas.getContext('2d');
        const width = graphCanvas.width;
        const height = graphCanvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Set canvas dimensions
        graphCanvas.width = graphContainer.clientWidth - 20;
        graphCanvas.height = graphContainer.clientHeight - 20;

        // Draw background
        ctx.fillStyle = '#f9f9f9';
        ctx.fillRect(0, 0, width, height);

        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, height - 30);
        ctx.lineTo(width - 20, height - 30);
        ctx.moveTo(50, 20);
        ctx.lineTo(50, height - 30);
        ctx.stroke();

        // Draw labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText('X Distance (mm)', width / 2 - 40, height - 10);
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Intensity (µW)', 0, 0);
        ctx.restore();

        // Draw axis markers
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';

        // X axis markers
        for (let x = -5; x <= 5; x += 1) {
            const xPos = 50 + ((x + 5) / 10) * (width - 70);
            ctx.beginPath();
            ctx.moveTo(xPos, height - 30);
            ctx.lineTo(xPos, height - 25);
            ctx.stroke();
            ctx.fillText(x.toString(), xPos - 5, height - 15);
        }

        // Y axis markers
        const maxIntensity = Math.max(...data.map(d => d.intensity)) * 1.1;
        for (let i = 0; i <= 5; i++) {
            const y = height - 30 - (i / 5) * (height - 50);
            const value = (i / 5) * maxIntensity;
            ctx.beginPath();
            ctx.moveTo(45, y);
            ctx.lineTo(50, y);
            ctx.stroke();
            ctx.fillText(value.toFixed(1), 20, y + 5);
        }

        // Draw data line
        ctx.beginPath();
        ctx.strokeStyle = lasers[currentState.laser].color;
        ctx.lineWidth = 2;

        data.forEach((point, index) => {
            const x = 50 + ((point.x + 5) / 10) * (width - 70);
            const y = height - 30 - (point.intensity / maxIntensity) * (height - 50);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw current position marker
        const currentX = 50 + ((currentState.xDistance + 5) / 10) * (width - 70);
        const currentY = height - 30 - (calculateIntensity() / maxIntensity) * (height - 50);

        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw maximum angle lines
        const maxAngle = Math.asin(fibers[currentState.fiber].NA) * (180 / Math.PI);
        const maxX = currentState.zDistance * Math.tan(maxAngle * Math.PI / 180);
        const maxXPos = 50 + ((maxX + 5) / 10) * (width - 70);
        const negMaxXPos = 50 + ((-maxX + 5) / 10) * (width - 70);

        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;

        // Positive angle line
        ctx.beginPath();
        ctx.moveTo(maxXPos, height - 30);
        ctx.lineTo(maxXPos, 20);
        ctx.stroke();

        // Negative angle line
        ctx.beginPath();
        ctx.moveTo(negMaxXPos, height - 30);
        ctx.lineTo(negMaxXPos, 20);
        ctx.stroke();

        ctx.setLineDash([]);

        // Draw NA value
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText(`NA = ${fibers[currentState.fiber].NA.toFixed(2)}, θₘₐₓ = ${maxAngle.toFixed(1)}°`, width - 170, 30);
    }

    // Event handlers
    powerToggle.addEventListener('change', function () {
        currentState.power = this.checked;
        updateIntensityDisplay();
        updateFiberLight();
        updateLaserBeam();
        updateLightRays();
        drawGraph();
    });

    fiberSelect.addEventListener('change', function () {
        currentState.fiber = this.value;
        createLightRays();
        updateIntensityDisplay();
        updateVernierReading();
        drawGraph();
    });

    laserSelect.addEventListener('change', function () {
        currentState.laser = this.value;
        updateLaserBeam();
        updateFiberLight();
        updateLightRays();
        updateIntensityDisplay();
        drawGraph();
    });

    zDistanceSlider.addEventListener('input', function () {
        currentState.zDistance = parseFloat(this.value);
        updateZValueDisplay();
        updateIntensityDisplay();
        updateVernierReading();
        drawGraph();
    });

    xDistanceSlider.addEventListener('input', function () {
        currentState.xDistance = parseFloat(this.value);
        updateXValueDisplay();
        updateIntensityDisplay();
        updateVernierReading();
        drawGraph();
    });

    upBtn.addEventListener('click', function () {
        currentState.xDistance += 0.1;
        if (currentState.xDistance > 5) currentState.xDistance = 5;
        xDistanceSlider.value = currentState.xDistance;
        updateXValueDisplay();
        updateIntensityDisplay();
        updateVernierReading();
        drawGraph();
    });

    downBtn.addEventListener('click', function () {
        currentState.xDistance -= 0.1;
        if (currentState.xDistance < -5) currentState.xDistance = -5;
        xDistanceSlider.value = currentState.xDistance;
        updateXValueDisplay();
        updateIntensityDisplay();
        updateVernierReading();
        drawGraph();
    });

    showVernierBtn.addEventListener('click', function () {
        currentState.showVernier = !currentState.showVernier;
        updateVernierReading();
        if (currentState.showVernier) {
            this.textContent = 'Hide Vernier';
        } else {
            this.textContent = 'Show Vernier';
        }
    });

    showGraphBtn.addEventListener('click', function () {
        currentState.showGraph = !currentState.showGraph;
        if (currentState.showGraph) {
            graphContainer.classList.add('visible');
            this.textContent = 'Hide Graph';
            drawGraph();
        } else {
            graphContainer.classList.remove('visible');
            this.textContent = 'Show Graph';
        }
    });

    resetBtn.addEventListener('click', function () {
        currentState = {
            power: false,
            fiber: 'glass-glass',
            laser: 'red',
            zDistance: 1.0,
            xDistance: 0.0,
            showVernier: false,
            showGraph: false,
            maxAngle: 0,
            intensityData: []
        };

        powerToggle.checked = false;
        fiberSelect.value = 'glass-glass';
        laserSelect.value = 'red';
        zDistanceSlider.value = 1.0;
        xDistanceSlider.value = 0.0;

        updateZValueDisplay();
        updateXValueDisplay();
        updateIntensityDisplay();
        updateFiberLight();
        updateLaserBeam();
        updateVernierReading();
        createLightRays();

        vernierReading.classList.remove('visible');
        graphContainer.classList.remove('visible');
        showVernierBtn.textContent = 'Show Vernier';
        showGraphBtn.textContent = 'Show Graph';
    });

    helpBtn.addEventListener('click', function () {
        helpModal.style.display = 'flex';
    });

    closeHelpBtn.addEventListener('click', function () {
        helpModal.style.display = 'none';
    });

    window.addEventListener('click', function (event) {
        if (event.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });

    panelToggle.addEventListener('click', function () {
        controlContent.style.display = controlContent.style.display === 'none' ? 'block' : 'none';
        this.textContent = controlContent.style.display === 'none' ? '▲' : '▼';
    });

    fullscreenBtn.addEventListener('click', function () {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            this.textContent = '◼';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                this.textContent = '□';
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', function () {
        if (currentState.showGraph) {
            drawGraph();
        }
    });

    // Initialize the simulation
    initSimulation();
});
