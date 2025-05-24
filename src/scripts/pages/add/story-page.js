import * as Api from "../../data/api";
import Swal from "sweetalert2";
import AddStoryPresenter from "../../presenters/AddStoryPresenter";

export default class AddStoryPage {
  #presenter = null;
  #map = null;
  #locationMarker = null;
  #videoStream = null;
  #capturedBlob = null;

  #videoElement = null;
  #canvasElement = null;
  #captureButton = null;
  #imagePreview = null;
  #previewPlaceholder = null;
  #descriptionInput = null;
  #locationMapElement = null;
  #selectedCoordsElement = null;
  #addStoryForm = null;
  #submitButton = null;
  #errorMessageElement = null;

  async render() {
    return `
      <section class="container add-story-container">
        <h1>Add New Story</h1>
        <form id="addStoryForm" class="add-story-form" novalidate>

          <div class="form-grid">
             <fieldset class="form-section camera-section">
              <legend>1. Take Picture</legend>
              <div class="camera-area">
                <video id="cameraVideo" autoplay playsinline></video>
                <canvas id="cameraCanvas" style="display:none;"></canvas>
                <button type="button" id="captureButton" class="btn btn-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-fill" viewBox="0 0 16 16"><path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"/></svg>
                  Capture Photo
                </button>
              </div>
              <div class="preview-area">
                <img id="imagePreview" src="#" alt="Captured Image Preview" style="display: none;"/>
                <p id="previewPlaceholder" style="display: block;">Image preview will appear here</p>
              </div>
            </fieldset>

            <div class="details-location-section">
              
               <fieldset class="form-section">
                <legend>2. Story Details</legend>
                <div class="form-group">
                  <label for="storyDescription">Description:</label>
                  <textarea id="storyDescription" name="description" rows="5" required placeholder="Write your story description..."></textarea>
                
                </div>
              </fieldset>

        
              <fieldset class="form-section location-section">
                <legend>3. Location (Optional)</legend>
                 <label>Select Location (Click on Map):</label>
                 <div id="locationMap"></div>
                 <p class="coords-display">Selected Coordinates: <span id="selectedCoords">None</span></p>
              </fieldset>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" id="submitStoryButton" class="btn btn-gradient">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-upload-fill" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 0a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 4.095 0 5.555 0 7.318 0 9.366 1.708 11 3.781 11H7.5V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11h4.188C14.502 11 16 9.57 16 7.773c0-1.636-1.242-2.969-2.834-3.194C12.923 1.99 10.69 0 8 0m-.354 15.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 14.793V11.5a.5.5 0 0 0-1 0v3.293l-2.146-2.147a.5.5 0 0 0-.708.708z"/></svg>
                Upload Story
            </button>
           
            <p id="add-story-error" class="error-message"></p>
          
          </div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new AddStoryPresenter({ view: this, api: Api });

    this.#videoElement = document.querySelector("#cameraVideo");
    this.#canvasElement = document.querySelector("#cameraCanvas");
    this.#captureButton = document.querySelector("#captureButton");
    this.#imagePreview = document.querySelector("#imagePreview");
    this.#previewPlaceholder = document.querySelector("#previewPlaceholder");
    this.#descriptionInput = document.querySelector("#storyDescription");
    this.#locationMapElement = document.querySelector("#locationMap");
    this.#selectedCoordsElement = document.querySelector("#selectedCoords");
    this.#addStoryForm = document.querySelector("#addStoryForm");
    this.#submitButton = document.querySelector("#submitStoryButton");
    this.#errorMessageElement = document.querySelector("#add-story-error");

    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("You must be logged in to add a story.");
      window.location.hash = "#/login";
      return;
    }

    this._setupImagePreviewObserver();
    this._initCamera();
    this._initLocationMap();
    this._setupFormSubmitHandler();

    window.addEventListener("hashchange", this._cleanupCameraOnNavigate, {
      once: true,
    });
  }

  _setupImagePreviewObserver() {
    if (!this.#imagePreview || !this.#previewPlaceholder) return;
    const observer = new MutationObserver((mutations) => {});
    observer.observe(this.#imagePreview, {
      attributes: true,
      attributeFilter: ["src"],
    });
    const initialSrc = this.#imagePreview.getAttribute("src");
    if (initialSrc && initialSrc !== "#") {
      this.#imagePreview.style.display = "block";
      this.#previewPlaceholder.style.display = "none";
    } else {
      this.#imagePreview.style.display = "none";
      this.#previewPlaceholder.style.display = "block";
    }
  }

  async _initCamera() {
    if (!this.#videoElement || !this.#captureButton || !this.#canvasElement)
      return;
    this.#captureButton.disabled = true;
    try {
      this.#videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      this.#videoElement.srcObject = this.#videoStream;
      this.#videoElement.style.backgroundColor = "transparent";
      this.#captureButton.disabled = false;

      this.#captureButton.onclick = () => {
        if (!this.#videoElement.videoWidth || !this.#videoElement.videoHeight) {
          console.error("Video dimensions not available yet.");
          this.showValidationError("Kamera belum siap, coba sesaat lagi.");
          return;
        }
        this.#canvasElement.width = this.#videoElement.videoWidth;
        this.#canvasElement.height = this.#videoElement.videoHeight;
        const context = this.#canvasElement.getContext("2d");
        context.drawImage(
          this.#videoElement,
          0,
          0,
          this.#canvasElement.width,
          this.#canvasElement.height
        );

        this.#canvasElement.toBlob((blob) => {
          if (blob) {
            this.#capturedBlob = blob;
            const objectURL = URL.createObjectURL(blob);
            this.updatePreview(objectURL);
            this.#presenter.setPhoto(blob);
            this.clearValidationError();
          } else {
            this.showValidationError(
              "Gagal mengambil foto. Silakan coba lagi."
            );
            this.#presenter.setPhoto(null);
          }
        }, "image/jpeg");
      };
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert(
        `Error accessing camera: ${error.message}. Pastikan Anda memberikan izin dan menggunakan HTTPS.`
      );
    }
  }

  _initLocationMap() {
    if (!this.#locationMapElement || !this.#selectedCoordsElement) return;
    const defaultCoords = [-6.2088, 106.8456];
    this.#map = L.map(this.#locationMapElement, {}).setView(defaultCoords, 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {}).addTo(
      this.#map
    );

    this.#map.on("click", (e) => {
      const latlng = e.latlng;
      const coordsText = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;

      this.displayCoordinates(coordsText);
      this.displayMapMarker(latlng, `Selected Location: ${coordsText}`);

      this.#presenter.setLocation(latlng);
    });

    setTimeout(() => {
      if (this.#map) this.#map.invalidateSize();
    }, 100);
  }

  _setupFormSubmitHandler() {
    if (!this.#addStoryForm || !this.#descriptionInput) return;

    this.#addStoryForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      this.clearValidationError();

      const description = this.#descriptionInput.value;

      await this.#presenter.handleSubmitAttempt(description);
    });
  }

  showLoading() {
    if (this.#submitButton) {
      this.#submitButton.disabled = true;
      this.#submitButton.textContent = "Uploading...";
    }
  }

  hideLoading() {
    if (this.#submitButton) {
      this.#submitButton.disabled = false;
      this.#submitButton.innerHTML = `<svg...></svg> Upload Story`;
    }
  }

  disableSubmitButton() {
    if (this.#submitButton) {
      this.#submitButton.disabled = true;
    }
  }

  enableSubmitButton() {
    if (this.#submitButton) {
      this.#submitButton.disabled = false;
    }
  }

  showValidationError(message) {
    if (this.#errorMessageElement) {
      this.#errorMessageElement.textContent = message;
    }
  }

  clearValidationError() {
    if (this.#errorMessageElement) {
      this.#errorMessageElement.textContent = "";
    }
  }

  showSubmitError(message) {
    Swal.fire({
      title: "Upload Gagal",
      text: message,
      icon: "error",
      confirmButtonText: "OK",
    });
  }

  showSubmitSuccess(message) {
    Swal.fire({
      title: "Upload Berhasil!",
      text: message,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  navigateToHome() {
    window.location.hash = "#/";
    this._cleanupCamera();
  }

  resetForm() {
    if (this.#addStoryForm) this.#addStoryForm.reset();
    this.#capturedBlob = null;
    this.clearPreview();
    this.displayCoordinates("None");
    this.removeMapMarker();
    this.clearValidationError();
  }

  updatePreview(objectURL) {
    if (this.#imagePreview && this.#previewPlaceholder) {
      this.#imagePreview.src = objectURL;
      this.#imagePreview.style.display = "block";
      this.#previewPlaceholder.style.display = "none";
    }
  }

  clearPreview() {
    if (this.#imagePreview && this.#previewPlaceholder) {
      if (this.#imagePreview.src.startsWith("blob:")) {
        URL.revokeObjectURL(this.#imagePreview.src);
      }
      this.#imagePreview.src = "#";
      this.#imagePreview.style.display = "none";
      this.#previewPlaceholder.style.display = "block";
    }
  }

  displayCoordinates(text) {
    if (this.#selectedCoordsElement) {
      this.#selectedCoordsElement.textContent = text;
    }
  }

  displayMapMarker(latlng, text) {
    if (!this.#map) return;
    this.removeMapMarker();
    this.#locationMarker = L.marker(latlng)
      .addTo(this.#map)
      .bindPopup(text)
      .openPopup();
  }

  removeMapMarker() {
    if (this.#map && this.#locationMarker) {
      this.#map.removeLayer(this.#locationMarker);
      this.#locationMarker = null;
    }
  }

  _cleanupCamera() {
    if (this.#videoStream) {
      this.#videoStream.getTracks().forEach((track) => track.stop());
      this.#videoStream = null;
      console.log("Camera stream stopped.");
      if (this.#videoElement) this.#videoElement.srcObject = null;
      this.clearPreview();
      this.#capturedBlob = null;
    }
  }

  _cleanupCameraOnNavigate = () => {
    this._cleanupCamera();
    console.log(
      "Hashchange listener for camera cleanup triggered and removed."
    );
  };
}
