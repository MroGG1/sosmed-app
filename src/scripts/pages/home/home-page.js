import * as Api from "../../data/api";
import L from "leaflet";
import HomePresenter from "../../presenters/HomePresenter";
import LocationService from "../../data/LocationService";

export default class HomePage {
  #presenter = null;
  #map = null;
  #storiesListElement = null;
  #mapElement = null;

  async render() {
    return `
      <section class="container">
        <h1>Maps</h1>
      
        <div id="map" style="height: 400px; width: 100%; margin-bottom: 20px; display: block;">
        </div>
        <h2>Story List</h2>
        <div id="stories-list" class="stories-list">
          
           <p>Memuat cerita...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#storiesListElement = document.querySelector("#stories-list");
    this.#mapElement = document.querySelector("#map");

    if (!this.#storiesListElement || !this.#mapElement) {
      console.error("Required elements not found (#stories-list or #map)");
      return;
    }

    this.#presenter = new HomePresenter({
      view: this,
      api: Api,
      locationService: LocationService,
    });
    await this.#presenter.loadHomePageContent();
  }

  showLoading() {
    if (this.#storiesListElement) {
      this.#storiesListElement.innerHTML = "<p>Loading stories...</p>";
    }
  }

  showEmptyStories() {
    if (this.#storiesListElement) {
      this.#storiesListElement.innerHTML =
        "<p>Tidak ada cerita yang ditemukan.</p>";
    }
  }

  showStories(stories) {
    if (!this.#storiesListElement) return;
    this.#storiesListElement.innerHTML = "";

    if (stories && stories.length > 0) {
      stories.forEach((story) => {
        const storyItem = this._createStoryItemElement(story);
        this.#storiesListElement.appendChild(storyItem);
      });
    } else {
      this.showEmptyStories();
    }
  }

  _createStoryItemElement(story) {
    const storyItem = document.createElement("article");
    storyItem.classList.add("story-item");
    storyItem.dataset.storyId = story.id;

    const createdAtDate = new Date(story.createdAt);
    const formattedDate = createdAtDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const locationText =
      story.lat && story.lon
        ? `<p class="story-location"><small> Mencari lokasi...</small></p>`
        : "";

    storyItem.innerHTML = `
      <a href="#/story/${story.id}" class="story-item-link-wrapper">
        <img src="${story.photoUrl}" alt="Foto oleh ${
      story.name
    }: ${story.description.substring(0, 50)}..." class="story-item-image">
      </a>
      <div class="story-content">
        <h3><a href="#/story/${story.id}">${story.name}</a></h3>
        <p class="story-date">${formattedDate}</p>
        <p>${story.description}</p>
        ${locationText} 
      </div>
    `;
    return storyItem;
  }

  updateStoryLocation(storyId, locationName) {
    if (!this.#storiesListElement) return;
    const storyItemElement = this.#storiesListElement.querySelector(
      `.story-item[data-story-id="${storyId}"]`
    );
    if (storyItemElement) {
      const locationElement = storyItemElement.querySelector(".story-location");
      if (locationElement) {
        locationElement.innerHTML = `<small>Lokasi: ${locationName}</small>`;
      }
    }
  }

  updateStoryLocationError(storyId, errorMessage) {
    if (!this.#storiesListElement) return;
    const storyItemElement = this.#storiesListElement.querySelector(
      `.story-item[data-story-id="${storyId}"]`
    );
    if (storyItemElement) {
      const locationElement = storyItemElement.querySelector(".story-location");
      if (locationElement) {
        locationElement.innerHTML = `<small> ${errorMessage}</small>`;
      }
    }
  }

  showError(message) {
    if (this.#storiesListElement) {
      this.#storiesListElement.innerHTML = `<p>Gagal memuat cerita: ${message}. Coba <a href="#/login">login</a> kembali.</p>`;
    }
    this.hideMap();
  }

  showLoginPrompt() {
    if (this.#storiesListElement) {
      this.#storiesListElement.innerHTML = `<p>Anda harus <a href="#/login">login</a> terlebih dahulu untuk melihat cerita.</p>`;
    }
  }

  hideMap() {
    if (this.#mapElement) {
      this.#mapElement.style.display = "none";
    }
    if (this.#map) {
      this.#map.remove();
      this.#map = null;
    }
  }

  showMap() {
    if (this.#mapElement) {
      this.#mapElement.style.display = "block";
    }
  }

  initializeMap() {
    if (!this.#mapElement) {
      console.error("Map element not found in DOM for initialization.");
      return;
    }
    if (this.#map) {
      this.#map.remove();
      this.#map = null;
      console.log("Previous map instance removed.");
    }

    const defaultCoords = [-2.5489, 118.0149];
    const defaultZoom = 5;

    this.#map = L.map(this.#mapElement, { scrollWheelZoom: false }).setView(
      defaultCoords,
      defaultZoom
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    setTimeout(() => {
      if (this.#map) {
        this.#map.invalidateSize();
      }
    }, 100);
  }

  addMarkerToMap(story) {
    if (!this.#map || !story.lat || !story.lon) return;

    const marker = L.marker([story.lat, story.lon]).addTo(this.#map);

    const popupContent = `
      <div style="max-width: 200px;">
        <img src="${story.photoUrl}" alt="${
      story.name
    }" style="width:100%; height:auto; margin-bottom:5px;">
        <strong>${story.name}</strong>
        <p>${story.description.substring(0, 50)}...</p>
        <a href="#/story/${story.id}">Lihat Detail</a>
      </div>
    `;
    marker.bindPopup(popupContent);
  }
}
