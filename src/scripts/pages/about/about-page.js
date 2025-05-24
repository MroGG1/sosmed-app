import CONFIG from "../../config";
import dbService from "../../data/DbService";
import Swal from "sweetalert2";

export default class AboutPage {
  #currentSubscription = null;

  async render() {
    return `
      <section class="container about-container">
        <h1 style="text-align: center; margin-bottom: 30px;">Tentang Sosmed</h1>

        <article class="about-section">
          <h2>Apa itu Sosmed?</h2>
          <p>Sosmed adalah platform sederhana yang memungkinkan Anda berbagi momen dan cerita visual dengan mudah. Abadikan pengalaman Anda melalui foto, tambahkan deskripsi, dan tandai lokasi di peta untuk berbagi dengan komunitas.</p>
        </article>

        <article class="about-section">
          <h2>Fitur Utama</h2>
          <ul>
            <li>Unggah cerita dengan foto dan deskripsi.</li>
            <li>Tambahkan geotag (lokasi) pada cerita Anda.</li>
            <li>Lihat feed cerita dari pengguna lain.</li>
            <li>Visualisasikan lokasi cerita di peta interaktif.</li>
            <li>Autentikasi pengguna (Registrasi & Login).</li>
            <li>Notifikasi Push (jika diaktifkan).</li>
            <li>Dukungan Offline (PWA).</li>
          </ul>
        </article>

        <article class="about-section">
          <h2>Notifikasi Push & Data Offline</h2>
          <p>Dapatkan pemberitahuan tentang cerita baru atau aktivitas penting lainnya.</p>
          <button id="pushButton" class="btn-gradient" style="margin-bottom: 10px;" disabled>
            Kelola Notifikasi
          </button>
          <p id="notificationStatus" style="margin-top: 5px; margin-bottom: 15px;"></p>

          <p>Anda juga dapat menghapus data cerita yang tersimpan di perangkat ini untuk mode offline.</p>
          <button id="clearOfflineDataButton" class="btn btn-danger" style="background-color: #dc3545; border-color: #dc3545;">
            Hapus Data Cerita Offline
          </button>
          <p id="clearDataStatus" style="margin-top: 10px;"></p>
        </article>

        <article class="about-section">
          <h2>Dikembangkan Oleh</h2>
          <p>Aplikasi Sosmed ini dikembangkan oleh <strong>Saya sendiri</strong> sebagai Proyek Pembelajaran Web Intermediate.</p>
          </article>

        <article class="about-section">
          <h2>Teknologi & Sumber</h2>
          <p>Aplikasi ini memanfaatkan beberapa teknologi hebat:</p>
          <ul>
            <li>Vanilla JavaScript (ES6+)</li>
            <li>Webpack (Bundler)</li>
            <li>Leaflet & OpenStreetMap Contributors (Peta)</li>
            <li><a href="https://story-api.dicoding.dev/" target="_blank" rel="noopener noreferrer">Story API</a> (disediakan oleh Dicoding)</li>
            <li>SweetAlert2 (Notifikasi)</li>
            <li>HTML5 & CSS3</li>
            <li>IndexedDB untuk penyimpanan offline.</li>
          </ul>
        </article>
      </section>
    `;
  }

  async afterRender() {
    console.log("About page rendered");
    this._setupPushButton();
    this._setupClearDataButton();
  }

  _setupClearDataButton() {
    const clearButton = document.querySelector("#clearOfflineDataButton");
    const clearDataStatusElement = document.querySelector("#clearDataStatus");

    if (!clearButton || !clearDataStatusElement) {
      console.error("Clear data button or status element not found");
      return;
    }

    clearButton.addEventListener("click", async () => {
      Swal.fire({
        title: "Anda yakin?",
        text: "Semua data cerita yang tersimpan offline akan dihapus. Ini tidak akan menghapus cerita dari server.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ya, hapus!",
        cancelButtonText: "Batal",
      }).then(async (result) => {
        if (result.isConfirmed) {
          clearButton.disabled = true;
          clearDataStatusElement.textContent = "Menghapus data...";
          try {
            await dbService.clearAllStories();
            clearDataStatusElement.textContent =
              "Semua data cerita offline berhasil dihapus.";
            Swal.fire(
              "Dihapus!",
              "Data cerita offline telah dihapus.",
              "success"
            );
          } catch (error) {
            console.error("Failed to clear offline stories:", error);
            clearDataStatusElement.textContent = `Gagal menghapus data: ${error.message}`;
            Swal.fire(
              "Gagal!",
              `Gagal menghapus data offline: ${error.message}`,
              "error"
            );
          } finally {
            clearButton.disabled = false;
          }
        }
      });
    });
  }

  _setupPushButton() {
    const pushButton = document.querySelector("#pushButton");
    const notificationStatusElement = document.querySelector(
      "#notificationStatus"
    );

    if (!pushButton || !notificationStatusElement) {
      console.error("Push button or status element not found");
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      notificationStatusElement.textContent =
        "Push Notifications tidak didukung oleh browser ini.";
      pushButton.disabled = true;
      return;
    }

    pushButton.disabled = false;

    const vapidPublicKey =
      "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

    navigator.serviceWorker.ready.then((registration) => {
      if (!registration.pushManager) {
        notificationStatusElement.textContent =
          "Push Notifications tidak didukung oleh browser ini.";
        pushButton.disabled = true;
        return;
      }

      registration.pushManager.getSubscription().then((subscription) => {
        this.#currentSubscription = subscription;
        const isSubscribed = !(subscription === null);
        this._updateSubscriptionButton(
          pushButton,
          notificationStatusElement,
          isSubscribed
        );
      });
    });

    pushButton.addEventListener("click", () => {
      pushButton.disabled = true;
      notificationStatusElement.textContent = "Memproses...";

      navigator.serviceWorker.ready.then((registration) => {
        if (this.#currentSubscription) {
          this._handleUnsubscribe(
            this.#currentSubscription,
            pushButton,
            notificationStatusElement
          );
        } else {
          const applicationServerKey = this._urlB64ToUint8Array(vapidPublicKey);
          registration.pushManager
            .subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey,
            })
            .then((newSubscription) => {
              console.log("User is subscribed (local):", newSubscription);
              this.#currentSubscription = newSubscription;
              this._sendSubscriptionToDicodingAPI(
                newSubscription,
                pushButton,
                notificationStatusElement
              );
            })
            .catch((err) => {
              console.error("Failed to subscribe user (local): ", err);
              let userMessage = `Gagal subscribe: ${err.message}`;
              if (err.name === "NotAllowedError") {
                userMessage =
                  "Anda tidak mengizinkan notifikasi. Silakan izinkan melalui pengaturan browser jika ingin subscribe.";
              }
              notificationStatusElement.textContent = userMessage;
              this._updateSubscriptionButton(
                pushButton,
                notificationStatusElement,
                false
              );
              pushButton.disabled = false;
            });
        }
      });
    });
  }

  async _sendSubscriptionToDicodingAPI(subscription, button, statusElement) {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      statusElement.textContent =
        "Anda harus login untuk subscribe notifikasi.";
      if (subscription && typeof subscription.unsubscribe === "function") {
        await subscription.unsubscribe();
        this.#currentSubscription = null;
      }
      this._updateSubscriptionButton(button, statusElement, false);
      return;
    }

    const SUBSCRIBE_ENDPOINT = `${CONFIG.BASE_URL}/notifications/subscribe`;
    const subscriptionJSON = subscription.toJSON();
    const requestBody = {
      endpoint: subscriptionJSON.endpoint,
      keys: {
        p256dh: subscriptionJSON.keys.p256dh,
        auth: subscriptionJSON.keys.auth,
      },
    };

    try {
      const response = await fetch(SUBSCRIBE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: response.statusText,
          code: response.status,
        }));
        console.error("Error data from server (subscribe):", errorData);
        throw new Error(
          errorData.message ||
            `Gagal mengirim langganan. Status: ${
              errorData.code || response.status
            }`
        );
      }
      const responseData = await response.json();
      console.log(
        "Subscription sent to Dicoding API successfully:",
        responseData
      );
      this._updateSubscriptionButton(
        button,
        statusElement,
        true,
        "Berhasil subscribe notifikasi!"
      );
    } catch (error) {
      console.error("Failed to send subscription to Dicoding API:", error);
      statusElement.textContent = `Gagal mengirim langganan: ${error.message}`;
      if (subscription && typeof subscription.unsubscribe === "function") {
        await subscription.unsubscribe();
        this.#currentSubscription = null;
      }
      this._updateSubscriptionButton(button, statusElement, false);
    }
  }

  async _handleUnsubscribe(subscription, button, statusElement) {
    try {
      const unsubscribedLocally = await subscription.unsubscribe();
      if (unsubscribedLocally) {
        console.log("User unsubscribed locally.");
        const oldEndpoint = subscription.endpoint;
        this.#currentSubscription = null;
        await this._sendUnsubscriptionToDicodingAPI(
          oldEndpoint,
          button,
          statusElement
        );
      } else {
        console.warn("Local unsubscription failed.");
        statusElement.textContent = "Gagal unsubscribe lokal.";
        this._updateSubscriptionButton(button, statusElement, true);
      }
    } catch (err) {
      console.error("Error during local unsubscription: ", err);
      statusElement.textContent = `Error unsubscribe: ${err.message}`;
      this._updateSubscriptionButton(button, statusElement, true);
    }
  }

  async _sendUnsubscriptionToDicodingAPI(endpoint, button, statusElement) {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      this._updateSubscriptionButton(
        button,
        statusElement,
        false,
        "Berhasil unsubscribe (lokal). Login untuk sinkronisasi server."
      );
      return;
    }
    const UNSUBSCRIBE_ENDPOINT = `${CONFIG.BASE_URL}/notifications/subscribe`;
    try {
      const response = await fetch(UNSUBSCRIBE_ENDPOINT, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ endpoint: endpoint }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: response.statusText,
          code: response.status,
        }));
        console.error("Error data from server (unsubscribe):", errorData);
        throw new Error(
          errorData.message ||
            `Gagal mengirim pemberitahuan unsubscribe. Status: ${
              errorData.code || response.status
            }`
        );
      }
      const responseData = await response.json();
      console.log(
        "Unsubscription notification sent to Dicoding API successfully:",
        responseData
      );
      this._updateSubscriptionButton(
        button,
        statusElement,
        false,
        "Berhasil unsubscribe notifikasi."
      );
    } catch (error) {
      console.error("Failed to send unsubscription to Dicoding API:", error);
      statusElement.textContent = `Unsubscribe lokal berhasil, tapi gagal sinkronisasi server: ${error.message}`;
      this._updateSubscriptionButton(button, statusElement, false);
    }
  }

  _updateSubscriptionButton(
    button,
    statusElement,
    isSubscribed,
    statusMessage = ""
  ) {
    if (!button || !statusElement) return;
    if (isSubscribed) {
      button.textContent = "Unsubscribe Notifikasi Push";
      statusElement.textContent =
        statusMessage || "Anda saat ini subscribe notifikasi.";
    } else {
      button.textContent = "Subscribe Notifikasi Push";
      statusElement.textContent =
        statusMessage || "Anda saat ini tidak subscribe notifikasi.";
    }
    button.disabled = false;
  }

  _urlB64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
