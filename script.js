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

    // DOM elements - using more reliable selectors to find buttons even if IDs change
    const powerToggle = document.getElementById('power-toggle') || document.querySelector('input[type="checkbox"][name="power"]');
    const fiberSelect = document.getElementById('fiber-select') || document.querySelector('select[name="fiber-type"]');
    const laserSelect = document.getElementById('laser-select') || document.querySelector('select[name="laser-color"]');
    const zDistance = document.getElementById('z-distance') || document.querySelector('input[type="range"][name="z-pos"]');
    const xDistance = document.getElementById('x-distance') || document.querySelector('input[type="range"][name="x-pos"]');
    const vernierRadio = document.getElementById('vernier-reading-radio') || document.querySelector('input[type="radio"][name="display"][value="vernier"]');
    const graphRadio = document.getElementById('graph-radio') || document.querySelector('input[type="radio"][name="display"][value="graph"]');
    const resetBtn = document.getElementById('reset-btn') || document.querySelector('button.reset');
    const intensityDisplay = document.getElementById('intensity-display') || document.querySelector('.intensity-value');
    const zValue = document.getElementById('z-value') || document.querySelector('.z-value-display');
    const xValue = document.getElementById('x-value') || document.querySelector('.x-value-display');

    // Button elements with multiple fallback selectors
    const upBtn = document.getElementById('up-btn') || document.querySelector('.up-button') || document.querySelector('button[data-direction="up"]');
    const downBtn = document.getElementById('down-btn') || document.querySelector('.down-button') || document.querySelector('button[data-direction="down"]');
    const forwardBtn = document.getElementById('forward-btn') || document.querySelector('.forward-button') || document.querySelector('button[data-direction="forward"]');
    const backBtn = document.getElementById('back-btn') || document.querySelector('.back-button') || document.querySelector('button[data-direction="back"]');

    const laserBeam = document.getElementById('laser-beam') || document.querySelector('.laser-beam');
    const fiberLight = document.getElementById('fiber-light') || document.querySelector('.fiber-light');
    const vernierReadingDisplay = document.getElementById('vernier-reading') || document.querySelector('.vernier-display');
    const graphContainer = document.getElementById('graph-container') || document.querySelector('.graph-container');
    const graphCanvas = document.getElementById('graph-canvas') || document.querySelector('canvas.graph');
    const ctx = graphCanvas ? graphCanvas.getContext('2d') : null;
    const helpBtn = document.getElementById('help-btn') || document.querySelector('.help-button');
    const helpModal = document.getElementById('help-modal') || document.querySelector('.help-modal');
    const closeHelp = document.getElementById('close-help') || document.querySelector('.close-help');
    const fullscreenBtn = document.getElementById('fullscreen-btn') || document.querySelector('.fullscreen-button');
    const panelToggle = document.getElementById('panel-toggle') || document.querySelector('.panel-toggle');
    const lightRaysContainer = document.getElementById('light-rays-container') || document.querySelector('.light-rays');

    // Check if required elements are missing and create them if needed
    function createMissingElements() {
        // Create buttons if they don't exist
        if (!upBtn) {
            const newUpBtn = document.createElement('button');
            newUpBtn.id = 'up-btn';
            newUpBtn.textContent = 'Up (X+)';
            newUpBtn.className = 'control-button up-button';

            // Find a good place to append this button
            const controlPanel = document.querySelector('.controls') || document.body;
            controlPanel.appendChild(newUpBtn);

            // Update our reference
            window.upBtn = newUpBtn;
        }

        if (!downBtn) {
            const newDownBtn = document.createElement('button');
            newDownBtn.id = 'down-btn';
            newDownBtn.textContent = 'Down (X-)';
            newDownBtn.className = 'control-button down-button';

            const controlPanel = document.querySelector('.controls') || document.body;
            controlPanel.appendChild(newDownBtn);

            window.downBtn = newDownBtn;
        }

        if (!forwardBtn) {
            const newForwardBtn = document.createElement('button');
            newForwardBtn.id = 'forward-btn';
            newForwardBtn.textContent = 'Forward (Z+)';
            newForwardBtn.className = 'control-button forward-button';

            const controlPanel = document.querySelector('.controls') || document.body;
            controlPanel.appendChild(newForwardBtn);

            window.forwardBtn = newForwardBtn;
        }

        if (!backBtn) {
            const newBackBtn = document.createElement('button');
            newBackBtn.id = 'back-btn';
            newBackBtn.textContent = 'Back (Z-)';
            newBackBtn.className = 'control-button back-button';

            const controlPanel = document.querySelector('.controls') || document.body;
            controlPanel.appendChild(newBackBtn);

            window.backBtn = newBackBtn;
        }

        // Re-get all elements to ensure we have the new ones
        return {
            upBtn: document.getElementById('up-btn') || document.querySelector('.up-button'),
            downBtn: document.getElementById('down-btn') || document.querySelector('.down-button'),
            forwardBtn: document.getElementById('forward-btn') || document.querySelector('.forward-button'),
            backBtn: document.getElementById('back-btn') || document.querySelector('.back-button')
        };
    }

    // Create light rays
    function createLightRays() {
        // If container doesn't exist, try to create it
        if (!lightRaysContainer) {
            const newContainer = document.createElement('div');
            newContainer.id = 'light-rays-container';
            newContainer.className = 'light-rays';

            // Append to some sensible parent
            const simulationArea = document.querySelector('.simulation-area') || document.body;
            simulationArea.appendChild(newContainer);

            lightRaysContainer = newContainer;
        }

        // Clear existing rays
        if (lightRaysContainer) {
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
    }

    // Update light rays visibility
    function updateLightRays() {
        if (!lightRaysContainer) return;

        const rays = lightRaysContainer.querySelectorAll('.light-ray');
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

        // Apply inverse square law for distance (z-axis)
        // Use a reference distance of 1.0 for normalization
        const referenceDistance = 1.0;
        result *= Math.pow(referenceDistance / detectorZ, 2);

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
        if (!graphCanvas || !ctx) return;

        // Set canvas size
        graphCanvas.width = graphCanvas.offsetWidth || 400;
        graphCanvas.height = graphCanvas.offsetHeight || 300;

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

        if (intensityDisplay) {
            intensityDisplay.textContent = intensity.toFixed(2);
            intensityDisplay.classList.toggle('detector-off', !powerOn);
            intensityDisplay.classList.toggle('detector-powered', powerOn);
        }

        // Update fiber light
        if (fiberLight) {
            fiberLight.classList.toggle('powered', powerOn);
        }

        // Update laser beam
        if (laserBeam) {
            laserBeam.classList.toggle('powered', powerOn);

            // Change laser color
            switch (laserColor) {
                case 'red':
                    laserBeam.style.backgroundColor = '#f00';
                    laserBeam.style.boxShadow = '0 0 10px rgba(255,0,0,0.7)';
                    if (fiberLight) fiberLight.style.backgroundColor = '#f55';
                    break;
                case 'green':
                    laserBeam.style.backgroundColor = '#0f0';
                    laserBeam.style.boxShadow = '0 0 10px rgba(0,255,0,0.7)';
                    if (fiberLight) fiberLight.style.backgroundColor = '#5f5';
                    break;
                case 'blue':
                    laserBeam.style.backgroundColor = '#00f';
                    laserBeam.style.boxShadow = '0 0 10px rgba(0,0,255,0.7)';
                    if (fiberLight) fiberLight.style.backgroundColor = '#55f';
                    break;
            }
        }

        // Update vernier reading
        if (vernierReadingDisplay) {
            vernierReadingDisplay.textContent = `Angle: ${angle.toFixed(1)}°`;
            vernierReadingDisplay.classList.toggle('visible', showVernier && powerOn);
        }

        // Update graph visibility
        if (graphContainer) {
            graphContainer.classList.toggle('visible', !showVernier && powerOn);
        }

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

        // Update display values
        if (zValue) zValue.textContent = detectorZ.toFixed(1);
        if (xValue) xValue.textContent = detectorX.toFixed(1);

        // Update sliders to match the current values
        if (zDistance) zDistance.value = detectorZ;
        if (xDistance) xDistance.value = detectorX;
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

        // Update display values
        if (xValue) xValue.textContent = newX.toFixed(1);
        if (zValue) zValue.textContent = newZ.toFixed(1);

        // Update sliders
        if (xDistance) xDistance.value = newX;
        if (zDistance) zDistance.value = newZ;

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
        if (powerToggle) powerToggle.checked = false;
        if (fiberSelect) fiberSelect.value = 'glass-glass';
        if (laserSelect) laserSelect.value = 'red';
        if (zDistance) zDistance.value = 2;
        if (xDistance) xDistance.value = 0;
        if (vernierRadio) vernierRadio.checked = true;
        if (graphRadio) graphRadio.checked = false;

        updateUI();
    }

    // Initialize the simulation
    function init() {
        // Create missing elements if needed
        const buttons = createMissingElements();

        // Create light rays
        createLightRays();

        // Set up event listeners with safety checks
        if (powerToggle) {
            powerToggle.addEventListener('click', function () {
                powerOn = this.checked;
                updateUI();
            });
        }

        if (fiberSelect) {
            fiberSelect.addEventListener('change', function () {
                fiberType = this.value;
                updateUI();
            });
        }

        if (laserSelect) {
            laserSelect.addEventListener('change', function () {
                laserColor = this.value;
                updateUI();
            });
        }

        if (zDistance) {
            zDistance.addEventListener('input', function () {
                detectorZ = parseFloat(this.value);
                updateUI();
            });
        }

        if (xDistance) {
            xDistance.addEventListener('input', function () {
                detectorX = parseFloat(this.value);
                updateUI();
            });
        }

        if (vernierRadio) {
            vernierRadio.addEventListener('change', function () {
                if (this.checked) {
                    showVernier = true;
                    updateUI();
                }
            });
        }

        if (graphRadio) {
            graphRadio.addEventListener('change', function () {
                if (this.checked) {
                    showVernier = false;
                    updateUI();
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', resetSimulation);
        }

        // X-axis buttons - using the possibly newly created buttons
        const upButton = buttons.upBtn || upBtn;
        if (upButton) {
            // Remove any existing event listeners to prevent duplicates
            const newUpBtn = upButton.cloneNode(true);
            if (upButton.parentNode) {
                upButton.parentNode.replaceChild(newUpBtn, upButton);
            }

            newUpBtn.addEventListener('click', function () {
                updateDetectorPosition(0.1, 0);
                console.log("Up button clicked, X:", detectorX, "Z:", detectorZ);
            });
        }

        const downButton = buttons.downBtn || downBtn;
        if (downButton) {
            const newDownBtn = downButton.cloneNode(true);
            if (downButton.parentNode) {
                downButton.parentNode.replaceChild(newDownBtn, downButton);
            }

            newDownBtn.addEventListener('click', function () {
                updateDetectorPosition(-0.1, 0);
                console.log("Down button clicked, X:", detectorX, "Z:", detectorZ);
            });
        }

        // Z-axis buttons
        const forwardButton = buttons.forwardBtn || forwardBtn;
        if (forwardButton) {
            const newForwardBtn = forwardButton.cloneNode(true);
            if (forwardButton.parentNode) {
                forwardButton.parentNode.replaceChild(newForwardBtn, forwardButton);
            }

            newForwardBtn.addEventListener('click', function () {
                updateDetectorPosition(0, 0.1);
                console.log("Forward button clicked, X:", detectorX, "Z:", detectorZ);
            });
        }

        const backButton = buttons.backBtn || backBtn;
        if (backButton) {
            const newBackBtn = backButton.cloneNode(true);
            if (backButton.parentNode) {
                backButton.parentNode.replaceChild(newBackBtn, backButton);
            }

            newBackBtn.addEventListener('click', function () {
                updateDetectorPosition(0, -0.1);
                console.log("Back button clicked, X:", detectorX, "Z:", detectorZ);
            });
        }

        if (helpBtn && helpModal && closeHelp) {
            helpBtn.addEventListener('click', function () {
                helpModal.style.display = 'flex';
            });

            closeHelp.addEventListener('click', function () {
                helpModal.style.display = 'none';
            });
        }

        if (fullscreenBtn) {
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
        }

        if (panelToggle) {
            panelToggle.addEventListener('click', function () {
                const controlContent = document.querySelector('.control-content');
                if (controlContent) {
                    if (controlContent.style.display === 'none') {
                        controlContent.style.display = 'block';
                        this.textContent = '▼';
                    } else {
                        controlContent.style.display = 'none';
                        this.textContent = '▲';
                    }
                }
            });
        }

        // Close modal when clicking outside
        if (helpModal) {
            window.addEventListener('click', function (event) {
                if (event.target === helpModal) {
                    helpModal.style.display = 'none';
                }
            });
        }

        // Handle window resize
        window.addEventListener('resize', function () {
            if (!showVernier) {
                updateGraph();
            }
        });

        // Initial UI update
        updateUI();

        console.log("Simulation initialized");
        console.log("Button references:", {
            upBtn: buttons.upBtn || upBtn,
            downBtn: buttons.downBtn || downBtn,
            forwardBtn: buttons.forwardBtn || forwardBtn,
            backBtn: buttons.backBtn || backBtn
        });
    }

    // Add debugging to help identify any issues
    console.log("DOM ready, starting simulation setup");

    // Start the simulation
    try {
        init();
    } catch (error) {
        console.error("Error initializing simulation:", error);
    }
});
