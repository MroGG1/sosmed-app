import * as Api from "../../data/api";
import { parseActivePathname } from "../../routes/url-parser";
import { showFormattedDate } from "../../utils";
import L from "leaflet";
import Swal from "sweetalert2";
import DetailPresenter from "../../presenters/DetailPresenter";

export default class DetailPage {
  #presenter = null;
  #storyDetailContainer = null;
  #map = null;

  async render() {
    return `
      <section class="container detail-page-container">
        <h1>Detail Cerita</h1>
        <div id="storyDetailContainer" class="story-detail-content">
          <p>Memuat detail cerita...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new DetailPresenter({ view: this, api: Api });

    this.#storyDetailContainer = document.querySelector(
      "#storyDetailContainer"
    );
    if (!this.#storyDetailContainer) {
      console.error("Story detail container not found!");
      return;
    }

    const urlParams = parseActivePathname();
    const storyId = urlParams.id;
    await this.#presenter.loadStoryDetails(storyId);
  }

  _renderStoryDetailsUI(story) {
    if (!story || !this.#storyDetailContainer) return;

    const { name, description, photoUrl, createdAt, lat, lon } = story;
    const formattedDate = showFormattedDate(createdAt, "id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    this.#storyDetailContainer.innerHTML = `
      <img src="${photoUrl}" alt="Foto oleh ${name}" class="story-detail-image">
      <div class="story-detail-info">
        <h2>${name}</h2>
        <p class="story-detail-date">Diupload pada: ${formattedDate}</p>
        <p class="story-detail-description">${description}</p>
        ${
          lat && lon
            ? '<div id="detailMap" class="story-detail-map"></div><p>Lokasi:</p>'
            : "<p>Tidak ada data lokasi.</p>"
        }
      </div>
    `;
  }

  showStoryDetails(story) {
    this._renderStoryDetailsUI(story);
  }

  showError(message) {
    if (this.#storyDetailContainer) {
      this.#storyDetailContainer.innerHTML = `<p class="error-message">Gagal memuat detail cerita: ${message}</p>`;
    }
  }
  initializeMap(lat, lon, name) {
    const mapElement = document.querySelector("#detailMap");
    if (!mapElement) {
      console.error("Detail map element (#detailMap) not found!");
      return;
    }

    if (this.#map) {
      this.#map.remove();
      this.#map = null;
    }

    this.#map = L.map(mapElement, { scrollWheelZoom: false }).setView(
      [lat, lon],
      15
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker([lat, lon])
      .addTo(this.#map)
      .bindPopup(`Lokasi cerita oleh ${name}`)
      .openPopup();

    setTimeout(() => {
      if (this.#map) {
        this.#map.invalidateSize();
      }
    }, 100);
  }
}
