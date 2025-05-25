document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const photoCanvas = document.getElementById('photo-canvas');
    const startCameraBtn = document.getElementById('start-camera');
    const captureBtn = document.getElementById('capture');
    const uploadBtn = document.getElementById('upload-btn');
    const photoUpload = document.getElementById('photo-upload');
    const uploadedPhoto = document.getElementById('uploaded-photo');
    const eyewearList = document.getElementById('eyewear-list');
    const resultsContainer = document.getElementById('results-container');
    
    // Variables
    let stream = null;
    let selectedEyewear = null;
    let faceDetectionActive = false;
    let currentMode = 'camera'; // 'camera' or 'photo'
    
    // Initialize eyewear list
    initEyewearList();
    
    // Event Listeners
    startCameraBtn.addEventListener('click', startCamera);
    captureBtn.addEventListener('click', captureImage);
    uploadBtn.addEventListener('click', () => photoUpload.click());
    photoUpload.addEventListener('change', handlePhotoUpload);
    
    // Tab change handler
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            currentMode = event.target.id === 'camera-tab' ? 'camera' : 'photo';
            stopCamera();
        });
    });
    
    // Filter change handlers
    document.querySelectorAll('#eyewear-category, #frame-type, #frame-color').forEach(select => {
        select.addEventListener('change', filterEyewear);
    });
    
    // Initialize eyewear list
    function initEyewearList() {
        eyewearList.innerHTML = '';
        window.eyewearData.forEach(eyewear => {
            const item = document.createElement('div');
            item.className = 'col-6 col-md-4 eyewear-item';
            item.dataset.id = eyewear.id;
            item.dataset.category = eyewear.category;
            item.dataset.type = eyewear.type;
            item.dataset.color = eyewear.color;
            item.innerHTML = `
                <img src="${eyewear.image}" alt="${eyewear.name}">
                <div class="eyewear-name text-center small">${eyewear.name}</div>
            `;
            item.addEventListener('click', () => selectEyewear(eyewear));
            eyewearList.appendChild(item);
        });
    }
    
    // Filter eyewear based on selections
    function filterEyewear() {
        const category = document.getElementById('eyewear-category').value;
        const type = document.getElementById('frame-type').value;
        const color = document.getElementById('frame-color').value;
        
        document.querySelectorAll('.eyewear-item').forEach(item => {
            const showItem = 
                (category === 'all' || item.dataset.category === category) &&
                (type === 'all' || item.dataset.type === type) &&
                (color === 'all' || item.dataset.color === color);
            
            item.style.display = showItem ? 'block' : 'none';
        });
    }
    
    // Select eyewear to try on
    function selectEyewear(eyewear) {
        selectedEyewear = eyewear;
        
        // Update UI
        document.querySelectorAll('.eyewear-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.eyewear-item[data-id="${eyewear.id}"]`).classList.add('active');
        
        // Apply to current view
        if (currentMode === 'camera' && faceDetectionActive) {
            applyEyewearToVideo();
        } else if (currentMode === 'photo' && uploadedPhoto.src) {
            applyEyewearToPhoto();
        }
    }
    
    // Start camera
    function startCamera() {
        if (stream) {
            stopCamera();
            return;
        }
        
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(function(s) {
                stream = s;
                video.srcObject = stream;
                startCameraBtn.innerHTML = '<i class="fas fa-stop me-2"></i>Stop Camera';
                captureBtn.disabled = false;
                startFaceDetection();
            })
            .catch(function(err) {
                console.error("Error accessing camera: ", err);
                alert("Could not access the camera. Please make sure you've granted camera permissions.");
            });
    }
    
    // Stop camera
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            video.srcObject = null;
            startCameraBtn.innerHTML = '<i class="fas fa-camera me-2"></i>Start Camera';
            captureBtn.disabled = true;
            stopFaceDetection();
        }
    }
    
    // Start face detection
    function startFaceDetection() {
        if (faceDetectionActive) return;
        
        const tracker = new tracking.ObjectTracker('face');
        tracker.setInitialScale(4);
        tracker.setStepSize(2);
        tracker.setEdgesDensity(0.1);
        
        tracking.track('#video', tracker, { camera: true });
        faceDetectionActive = true;
        
        tracker.on('track', function(event) {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            event.data.forEach(function(rect) {
                if (selectedEyewear) {
                    // Position eyewear overlay on detected face
                    const scale = rect.width / 200; // Adjust based on typical face width
                    const offsetX = rect.x + (rect.width / 2);
                    const offsetY = rect.y + (rect.height / 3);
                    
                    // Draw eyewear overlay
                    const img = new Image();
                    img.src = selectedEyewear.overlay;
                    img.onload = function() {
                        context.drawImage(
                            img, 
                            offsetX - (img.width * scale / 2), 
                            offsetY - (img.height * scale / 2), 
                            img.width * scale, 
                            img.height * scale
                        );
                    };
                }
            });
        });
        
        // Set canvas dimensions to match video
        function resizeCanvas() {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
        
        video.addEventListener('loadedmetadata', resizeCanvas);
        window.addEventListener('resize', resizeCanvas);
    }
    
    // Stop face detection
    function stopFaceDetection() {
        faceDetectionActive = false;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Capture image from camera
    function captureImage() {
        if (!stream) return;
        
        // Create a temporary canvas to draw the final image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Set dimensions
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        
        // Draw video frame
        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw eyewear overlay if selected
        if (selectedEyewear) {
            const img = new Image();
            img.src = selectedEyewear.overlay;
            img.onload = function() {
                // Find face position (simplified - in real app use face detection data)
                const faceWidth = tempCanvas.width / 3;
                const scale = faceWidth / 200;
                const offsetX = tempCanvas.width / 2;
                const offsetY = tempCanvas.height / 3;
                
                tempCtx.drawImage(
                    img, 
                    offsetX - (img.width * scale / 2), 
                    offsetY - (img.height * scale / 2), 
                    img.width * scale, 
                    img.height * scale
                );
                
                // Add to results
                addResult(tempCanvas.toDataURL('image/png'));
            };
        } else {
            // Add to results even without eyewear
            addResult(tempCanvas.toDataURL('image/png'));
        }
    }
    
    // Handle photo upload
    function handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedPhoto.src = e.target.result;
            uploadedPhoto.classList.remove('d-none');
            document.getElementById('upload-placeholder').classList.add('d-none');
            
            // Process the image for face detection
            processUploadedPhoto();
        };
        reader.readAsDataURL(file);
    }
    
    // Process uploaded photo for face detection
    function processUploadedPhoto() {
        photoCanvas.width = uploadedPhoto.width;
        photoCanvas.height = uploadedPhoto.height;
        
        const tracker = new tracking.ObjectTracker('face');
        tracker.setInitialScale(4);
        tracker.setStepSize(2);
        tracker.setEdgesDensity(0.1);
        
        tracking.track(uploadedPhoto, tracker);
        
        tracker.on('track', function(event) {
            const context = photoCanvas.getContext('2d');
            context.clearRect(0, 0, photoCanvas.width, photoCanvas.height);
            
            event.data.forEach(function(rect) {
                if (selectedEyewear) {
                    // Position eyewear overlay on detected face
                    const scale = rect.width / 200;
                    const offsetX = rect.x + (rect.width / 2);
                    const offsetY = rect.y + (rect.height / 3);
                    
                    // Draw eyewear overlay
                    const img = new Image();
                    img.src = selectedEyewear.overlay;
                    img.onload = function() {
                        context.drawImage(
                            img, 
                            offsetX - (img.width * scale / 2), 
                            offsetY - (img.height * scale / 2), 
                            img.width * scale, 
                            img.height * scale
                        );
                        
                        // Show the canvas with overlay
                        photoCanvas.classList.remove('d-none');
                        
                        // Add to results
                        addResult(photoCanvas.toDataURL('image/png'));
                    };
                }
            });
        });
    }
    
    // Apply eyewear to live video
    function applyEyewearToVideo() {
        if (!faceDetectionActive) return;
        // The face detection tracker will handle this in its callback
    }
    
    // Apply eyewear to uploaded photo
    function applyEyewearToPhoto() {
        if (!uploadedPhoto.src) return;
        processUploadedPhoto();
    }
    
    // Add try-on result to results section
    function addResult(imageData) {
        const resultId = Date.now();
        const resultCard = document.createElement('div');
        resultCard.className = 'col-md-4 mb-3';
        resultCard.innerHTML = `
            <div class="result-card h-100">
                <div class="result-image-container">
                    <img src="${imageData}" alt="Try-on result" class="img-fluid">
                </div>
                <div class="card-body">
                    ${selectedEyewear ? `
                        <h6>${selectedEyewear.name}</h6>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-primary fw-bold">$${selectedEyewear.price.toFixed(2)}</span>
                            <div>
                                <button class="btn btn-sm btn-outline-primary me-1">
                                    <i class="fas fa-shopping-cart"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-secondary">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        </div>
                    ` : '<p>No eyewear selected</p>'}
                </div>
            </div>
        `;
        
        // Prepend to results container
        if (resultsContainer.firstChild.classList.contains('text-center')) {
            resultsContainer.innerHTML = '';
        }
        resultsContainer.prepend(resultCard);
    }
});