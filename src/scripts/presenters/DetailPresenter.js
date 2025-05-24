import { getStoryDetail } from "../data/api";
import dbService from "../data/DbService";

class DetailPresenter {
  #view = null;
  #api = null;
  #dbService = null;

  constructor({ view, api }) {
    this.#view = view;
    this.#api = api;
    this.#dbService = dbService;
  }

  async loadStoryDetails(storyId) {
    const token = localStorage.getItem("authToken");

    if (!storyId) {
      this.#view.showError("ID Cerita tidak ditemukan.");
      return;
    }

    try {
      if (!token && !navigator.onLine) {
        console.log(
          "No token and offline, attempting to load story detail from IndexedDB..."
        );
        await this._loadStoryDetailFromDb(storyId);
        return;
      }

      if (!token && navigator.onLine) {
        this.#view.showError("Anda harus login untuk melihat detail cerita.");
        return;
      }

      const storyFromApi = await this.#api.getStoryDetail(token, storyId); //

      if (storyFromApi) {
        this.#view.showStoryDetails(storyFromApi);
        if (storyFromApi.lat && storyFromApi.lon) {
          this.#view.initializeMap(
            storyFromApi.lat,
            storyFromApi.lon,
            storyFromApi.name
          );
        }
        await this.#dbService.putStories(storyFromApi);
        console.log(
          `Story detail for ID '${storyId}' from API saved to IndexedDB.`
        );
      } else {
        console.log(
          `Story with ID '${storyId}' not found via API, trying IndexedDB...`
        );
        await this._loadStoryDetailFromDb(storyId);
      }
    } catch (error) {
      console.error(
        `Failed to fetch story detail for ID '${storyId}' from API:`,
        error
      );
      this.#view.showError(
        error.message ||
          "Terjadi kesalahan saat mengambil data cerita dari API."
      );
      console.log(
        `Attempting to load story detail for ID '${storyId}' from IndexedDB due to API error...`
      );
      await this._loadStoryDetailFromDb(storyId);
    } finally {
    }
  }

  async _loadStoryDetailFromDb(storyId) {
    try {
      const storyFromDb = await this.#dbService.getStoryById(storyId);

      if (storyFromDb) {
        console.log(
          `Story detail for ID '${storyId}' loaded from IndexedDB:`,
          storyFromDb
        );
        this.#view.showStoryDetails(storyFromDb);
        if (storyFromDb.lat && storyFromDb.lon) {
          this.#view.initializeMap(
            storyFromDb.lat,
            storyFromDb.lon,
            storyFromDb.name
          );
        }
      } else {
        console.log(`Story with ID '${storyId}' not found in IndexedDB.`);
        this.#view.showError(
          `Detail cerita untuk ID '${storyId}' tidak ditemukan di database lokal.`
        );
      }
    } catch (dbError) {
      console.error(
        `Failed to load story detail for ID '${storyId}' from IndexedDB:`,
        dbError
      );
      this.#view.showError(
        dbError.message ||
          "Terjadi kesalahan saat memuat detail cerita dari database lokal."
      );
    }
  }
}

export default DetailPresenter;
