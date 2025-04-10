document.addEventListener('DOMContentLoaded', function () {
    // Variables
    let powerOn = false;
    let fiberType = 'glass-glass';
    let laserColor = 'red';
    let detectorZ = 2.0;
    let detectorX = 0.0;
    let showVernier = true;
    let angle = 0;
    let intensity = 0;
    let graphData = [];
    let maxIntensity = 100;

    // DOM elements
    const powerToggle = document.getElementById('power-toggle');
    const fiberSelect = document.getElementById('fiber-select');
    const laserSelect = document.getElementById('laser-select');
    const zDistance = document.getElementById('z-distance');
    const xDistance = document.getElementById('x-distance');
    const vernierRadio = document.getElementById('vernier-reading-radio');
    const graphRadio = document.getElementById('graph-radio');
    const resetBtn = document.getElementById('reset-btn');
    const intensityDisplay = document.getElementById('intensity-display');
    const zValue = document.getElementById('z-value');
    const xValue = document.getElementById('x-value');
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    const laserBeam = document.getElementById('laser-beam');
    const fiberLight = document.getElementById('fiber-light');
    const vernierReadingDisplay = document.getElementById('vernier-reading');
    const graphContainer = document.getElementById('graph-container');
    const graphCanvas = document.getElementById('graph-canvas');
    const ctx = graphCanvas.getContext('2d');
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeHelp = document.getElementById('close-help');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const panelToggle = document.getElementById('panel-toggle');
    const lightRaysContainer = document.getElementById('light-rays-container');

    // Create light rays
    function createLightRays() {
        // Clear existing rays
        lightRaysContainer.innerHTML = '';

        // Create rays with different angles
        for (let i = -30; i <= 30; i += 5) {
            const ray = document.createElement('div');
            ray.className = 'light-ray';
            ray.style.left = '350px';
            ray.style.top = '200px';
            ray.style.width = '300px';
            ray.style.transform = `rotate(${i}deg)`;
            lightRaysContainer.appendChild(ray);
        }
    }

    // Update light rays visibility
    function updateLightRays() {
        const rays = document.querySelectorAll('.light-ray');
        const maxNA = getFiberNA();
        const maxAngle = Math.asin(maxNA) * (180 / Math.PI);

        rays.forEach((ray, index) => {
            const rayAngle = -30 + (index * 5);
            ray.classList.toggle('visible', powerOn && Math.abs(rayAngle) <= maxAngle);

            // Set color based on laser
            if (powerOn) {
                let color;
                switch (laserColor) {
                    case 'red': color = 'rgba(255,0,0,0.7)'; break;
                    case 'green': color = 'rgba(0,255,0,0.7)'; break;
                    case 'blue': color = 'rgba(0,100,255,0.7)'; break;
                }
                ray.style.backgroundColor = color;
                ray.style.boxShadow = `0 0 3px ${color}`;
            }
        });
    }

    // Get fiber NA based on type
    function getFiberNA() {
        switch (fiberType) {
            case 'glass-glass': return 0.22;
            case 'plastic': return 0.30;
            case 'graded': return 0.25;
            default: return 0.22;
        }
    }

    // Calculate intensity based on fiber, angle, etc.
    function calculateIntensity() {
        if (!powerOn) return 0;

        // Get NA for current fiber
        const maxNA = getFiberNA();

        // Calculate acceptance angle
        const maxAngle = Math.asin(maxNA) * (180 / Math.PI);

        // Calculate current angle
        angle = Math.atan2(Math.abs(detectorX), detectorZ) * (180 / Math.PI);

        // Calculate intensity based on angle
        let result;
        if (angle <= maxAngle) {
            result = maxIntensity * Math.pow(Math.cos(angle * Math.PI / 180), 2);
        } else {
            // Exponential decay outside acceptance cone
            result = maxIntensity * 0.05 * Math.exp(-(angle - maxAngle) / 3);
        }

        // Apply wavelength effect
        switch (laserColor) {
            case 'red': result *= 1.0; break;
            case 'green': result *= 0.85; break;
            case 'blue': result *= 0.70; break;
        }

        // Add small random noise for realism
        result *= (1 + (Math.random() * 0.04 - 0.02));

        return Math.max(0, result);
    }

    // Update the graph
    function updateGraph() {
        if (!graphCanvas) return;

        // Set canvas size
        graphCanvas.width = graphCanvas.offsetWidth;
        graphCanvas.height = graphCanvas.offsetHeight;

        const width = graphCanvas.width;
        const height = graphCanvas.height;

        // Clear the canvas
        ctx.clearRect(0, 0, width, height);

        // Draw graph background
        ctx.fillStyle = '#f9f9f9';
        ctx.fillRect(0, 0, width, height);

        // Draw axes
        ctx.beginPath();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.moveTo(50, height - 30);
        ctx.lineTo(width - 20, height - 30); // X-axis
        ctx.moveTo(50, height - 30);
        ctx.lineTo(50, 20); // Y-axis
        ctx.stroke();

        // Draw axis labels
        ctx.font = '12px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('Angle (degrees)', width / 2, height - 10);

        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Intensity (µW)', 0, 0);
        ctx.restore();

        // Find max angle for scaling
        const maxAngleToShow = 40;

        // Draw grid lines
        ctx.beginPath();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;

        // X grid (angle)
        for (let i = 0; i <= maxAngleToShow; i += 5) {
            const x = 50 + (i / maxAngleToShow) * (width - 70);
            ctx.moveTo(x, height - 30);
            ctx.lineTo(x, 20);

            // X-axis labels
            ctx.fillText(i.toString(), x, height - 15);
        }

        // Y grid (intensity)
        for (let i = 0; i <= maxIntensity; i += 20) {
            const y = height - 30 - (i / maxIntensity) * (height - 50);
            ctx.moveTo(50, y);
            ctx.lineTo(width - 20, y);

            // Y-axis labels
            ctx.fillText(i.toString(), 35, y + 4);
        }
        ctx.stroke();

        // Plot the data
        if (graphData.length > 0 && powerOn) {
            ctx.beginPath();
            ctx.strokeStyle = (() => {
                switch (laserColor) {
                    case 'red': return '#f00';
                    case 'green': return '#0c0';
                    case 'blue': return '#00f';
                    default: return '#f00';
                }
            })();
            ctx.lineWidth = 2;

            graphData.forEach((point, i) => {
                const x = 50 + (point.angle / maxAngleToShow) * (width - 70);
                const y = height - 30 - (point.intensity / maxIntensity) * (height - 50);

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // Draw current point with marker
            const currentX = 50 + (angle / maxAngleToShow) * (width - 70);
            const currentY = height - 30 - (intensity / maxIntensity) * (height - 50);

            ctx.beginPath();
            ctx.arc(currentX, currentY, 6, 0, 2 * Math.PI);
            ctx.fillStyle = '#f00';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // Update the UI elements based on current state
    function updateUI() {
        // Update intensity display
        intensity = calculateIntensity();
        intensityDisplay.textContent = intensity.toFixed(2);
        intensityDisplay.classList.toggle('detector-off', !powerOn);
        intensityDisplay.classList.toggle('detector-powered', powerOn);

        // Update fiber light
        fiberLight.classList.toggle('powered', powerOn);

        // Update laser beam
        laserBeam.classList.toggle('powered', powerOn);

        // Change laser color
        switch (laserColor) {
            case 'red':
                laserBeam.style.backgroundColor = '#f00';
                laserBeam.style.boxShadow = '0 0 10px rgba(255,0,0,0.7)';
                fiberLight.style.backgroundColor = '#f55';
                break;
            case 'green':
                laserBeam.style.backgroundColor = '#0f0';
                laserBeam.style.boxShadow = '0 0 10px rgba(0,255,0,0.7)';
                fiberLight.style.backgroundColor = '#5f5';
                break;
            case 'blue':
                laserBeam.style.backgroundColor = '#00f';
                laserBeam.style.boxShadow = '0 0 10px rgba(0,0,255,0.7)';
                fiberLight.style.backgroundColor = '#55f';
                break;
        }

        // Update vernier reading
        vernierReadingDisplay.textContent = `Angle: ${angle.toFixed(1)}°`;
        vernierReadingDisplay.classList.toggle('visible', showVernier && powerOn);

        // Update graph visibility
        graphContainer.classList.toggle('visible', !showVernier && powerOn);

        // Update light rays
        updateLightRays();

        // Update graph
        if (!showVernier && powerOn) {
            // Record data point if power is on
            if (powerOn) {
                // Check if we already have this angle in data
                const existingPoint = graphData.find(p => p.angle === parseFloat(angle.toFixed(1)));
                if (!existingPoint) {
                    graphData.push({
                        angle: parseFloat(angle.toFixed(1)),
                        intensity: intensity
                    });

                    // Sort by angle
                    graphData.sort((a, b) => a.angle - b.angle);
                }
            }
            updateGraph();
        }
    }

    // Handle changes to detector position
    function updateDetectorPosition(xChange = 0, zChange = 0) {
        let newX = detectorX + xChange;
        let newZ = detectorZ + zChange;

        // Enforce limits
        newX = Math.max(-5, Math.min(5, newX));
        newZ = Math.max(1, Math.min(10, newZ));

        // Update values
        detectorX = newX;
        detectorZ = newZ;

        // Update sliders
        xDistance.value = newX;
        zDistance.value = newZ;

        // Update display values
        xValue.textContent = newX.toFixed(1);
        zValue.textContent = newZ.toFixed(1);

        updateUI();
    }

    // Reset the simulation
    function resetSimulation() {
        powerOn = false;
        fiberType = 'glass-glass';
        laserColor = 'red';
        detectorZ = 2.0;
        detectorX = 0.0;
        showVernier = true;
        graphData = [];

        // Reset UI elements
        powerToggle.checked = false;
        fiberSelect.value = 'glass-glass';
        laserSelect.value = 'red';
        zDistance.value = 2;
        xDistance.value = 0;
        vernierRadio.checked = true;
        graphRadio.checked = false;

        // Update display values
        zValue.textContent = '2.0';
        xValue.textContent = '0.0';

        updateUI();
    }

    // Initialize the simulation
    function init() {
        // Create light rays
        createLightRays();

        // Set up event listeners
        powerToggle.addEventListener('change', function () {
            powerOn = this.checked;
            updateUI();
        });

        fiberSelect.addEventListener('change', function () {
            fiberType = this.value;
            updateUI();
        });

        laserSelect.addEventListener('change', function () {
            laserColor = this.value;
            updateUI();
        });

        zDistance.addEventListener('input', function () {
            detectorZ = parseFloat(this.value);
            zValue.textContent = detectorZ.toFixed(1);
            updateUI();
        });

        xDistance.addEventListener('input', function () {
            detectorX = parseFloat(this.value);
            xValue.textContent = detectorX.toFixed(1);
            updateUI();
        });

        vernierRadio.addEventListener('change', function () {
            if (this.checked) {
                showVernier = true;
                updateUI();
            }
        });

        graphRadio.addEventListener('change', function () {
            if (this.checked) {
                showVernier = false;
                updateUI();
            }
        });

        resetBtn.addEventListener('click', resetSimulation);

        upBtn.addEventListener('click', function () {
            updateDetectorPosition(0.1, 0);
        });

        downBtn.addEventListener('click', function () {
            updateDetectorPosition(-0.1, 0);
        });

        helpBtn.addEventListener('click', function () {
            helpModal.style.display = 'flex';
        });

        closeHelp.addEventListener('click', function () {
            helpModal.style.display = 'none';
        });

        fullscreenBtn.addEventListener('click', function () {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });

        panelToggle.addEventListener('click', function () {
            const controlContent = document.querySelector('.control-content');
            if (controlContent.style.display === 'none') {
                controlContent.style.display = 'block';
                this.textContent = '▼';
            } else {
                controlContent.style.display = 'none';
                this.textContent = '▲';
            }
        });

        // Close modal when clicking outside
        window.addEventListener('click', function (event) {
            if (event.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });

        // Handle window resize
        window.addEventListener('resize', function () {
            if (!showVernier) {
                updateGraph();
            }
        });

        // Initial UI update
        updateUI();
    }

    // Start the simulation
    init();
});