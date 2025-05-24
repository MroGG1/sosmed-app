import { addNewStory } from "../data/api";

class AddStoryPresenter {
  #view = null;
  #api = null;

  #currentPhotoBlob = null;
  #currentLocation = null;

  constructor({ view, api }) {
    this.#view = view;
    this.#api = api;
  }

  setPhoto(blob) {
    this.#currentPhotoBlob = blob;
  }

  setLocation(latlng) {
    this.#currentLocation = latlng
      ? { lat: latlng.lat, lng: latlng.lng }
      : null;
  }

  async handleSubmitAttempt(description) {
    const photo = this.#currentPhotoBlob;
    const location = this.#currentLocation;

    if (!description || !photo) {
      this.#view.showValidationError(
        "Deskripsi dan foto (hasil capture) tidak boleh kosong."
      );
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      this.#view.showSubmitError("Otentikasi gagal. Silakan login kembali.");
      return;
    }

    const storyData = {
      description,
      photo,
      ...(location && { lat: location.lat }),
      ...(location && { lon: location.lng }),
    };

    this.#view.showLoading();
    this.#view.disableSubmitButton();

    try {
      const result = await this.#api.addNewStory(token, storyData);

      this.#view.showSubmitSuccess("Cerita Anda telah berhasil diupload.");

      this.#currentPhotoBlob = null;
      this.#currentLocation = null;
      this.#view.resetForm();

      setTimeout(() => {
        this.#view.navigateToHome();
      }, 1500);
    } catch (error) {
      console.error("Add story failed:", error);
      this.#view.showSubmitError(
        error.message || "Terjadi kesalahan saat mengupload cerita."
      );
    } finally {
      this.#view.hideLoading();
      this.#view.enableSubmitButton();
    }
  }
}

export default AddStoryPresenter;
