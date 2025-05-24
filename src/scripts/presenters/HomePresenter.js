import { getAllStories } from "../data/api";
import LocationService from "../data/LocationService";
import dbService from "../data/DbService";

class HomePresenter {
  #view = null;
  #api = null;
  #locationService = null;
  #dbService = null;

  constructor({ view, api, locationService }) {
    this.#view = view;
    this.#api = api;
    this.#locationService = locationService;
    this.#dbService = dbService;
  }

  async loadHomePageContent() {
    const token = localStorage.getItem("authToken");

    if (!token) {
      this.#view.showLoginPrompt();
      this.#view.hideMap();
      return;
    }

    this.#view.showMap();
    this.#view.showLoading();
    this.#view.initializeMap();

    try {
      const storiesFromApi = await this.#api.getAllStories(token);

      if (storiesFromApi && storiesFromApi.length > 0) {
        this.#view.showStories(storiesFromApi);
        await this.#dbService.putStories(storiesFromApi);
        console.log("Stories from API saved to IndexedDB.");

        storiesFromApi.forEach((story) => {
          if (story.lat && story.lon) {
            this.#view.addMarkerToMap(story);
            this.#fetchAndShowLocation(story.id, story.lat, story.lon);
          }
        });
      } else {
        console.log("No stories from API, trying IndexedDB...");
        await this._loadStoriesFromDb();
      }
    } catch (error) {
      console.error("Failed to load stories from API:", error);
      this.#view.showError(
        error.message || "Terjadi kesalahan saat memuat cerita dari API."
      );
      console.log(
        "Attempting to load stories from IndexedDB due to API error..."
      );
      await this._loadStoriesFromDb();
    }
  }

  async _loadStoriesFromDb() {
    try {
      const storiesFromDb = await this.#dbService.getAllStories();
      if (storiesFromDb && storiesFromDb.length > 0) {
        console.log("Stories loaded from IndexedDB:", storiesFromDb);
        this.#view.showStories(storiesFromDb);
        storiesFromDb.forEach((story) => {
          if (story.lat && story.lon) {
            this.#view.addMarkerToMap(story);
            if (story.locationName) {
              this.#view.updateStoryLocation(story.id, story.locationName);
            } else if (story.lat && story.lon) {
              if (navigator.onLine) {
                this.#fetchAndShowLocation(story.id, story.lat, story.lon);
              } else {
                this.#view.updateStoryLocation(
                  story.id,
                  "Lokasi (Koordinat Tersedia)"
                );
              }
            }
          }
        });
      } else {
        console.log("No stories found in IndexedDB.");
        this.#view.showEmptyStories();
      }
    } catch (dbError) {
      console.error("Failed to load stories from IndexedDB:", dbError);
      this.#view.showError(
        dbError.message ||
          "Terjadi kesalahan saat memuat cerita dari database lokal."
      );
      this.#view.showEmptyStories();
    }
  }

  async #fetchAndShowLocation(storyId, lat, lon) {
    try {
      const locationName = await this.#locationService.getLocationName(
        lat,
        lon
      );
      this.#view.updateStoryLocation(storyId, locationName);
    } catch (error) {
      this.#view.updateStoryLocationError(storyId, error.message);
    }
  }
}

export default HomePresenter;
