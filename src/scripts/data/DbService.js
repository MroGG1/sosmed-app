const DB_NAME = "sosmed-db";
const DB_VERSION = 1;
const STORY_STORE_NAME = "stories";

class DbService {
  constructor() {
    this.dbPromise = this._openDb();
  }

  _openDb() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        console.error("IndexedDB not supported by this browser.");
        return reject(new Error("IndexedDB not supported."));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject(new Error(`IndexedDB error: ${event.target.errorCode}`));
      };

      request.onsuccess = (event) => {
        console.log("Database opened successfully.");
        resolve(event.target.result);
      };

      request.onupgradeneeded = (event) => {
        console.log("Upgrading database...");
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORY_STORE_NAME)) {
          const store = db.createObjectStore(STORY_STORE_NAME, {
            keyPath: "id",
          });
          console.log(`Object store '${STORY_STORE_NAME}' created.`);
        }
      };
    });
  }

  async putStories(stories) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORY_STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORY_STORE_NAME);
      let itemsToProcess = Array.isArray(stories) ? stories.length : 1;
      let itemsProcessed = 0;

      const storyArray = Array.isArray(stories) ? stories : [stories];

      storyArray.forEach((story) => {
        const request = store.put(story);
        request.onsuccess = () => {
          itemsProcessed++;
          if (itemsProcessed === itemsToProcess) {
          }
        };
        request.onerror = (event) => {
          console.error(
            "Error putting story in IndexedDB:",
            event.target.error
          );
        };
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (event) => {
        console.error("Transaction error in putStories:", event.target.error);
        reject(new Error(`Transaction error: ${event.target.error}`));
      };
    });
  }

  async getAllStories() {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORY_STORE_NAME, "readonly");
      const store = transaction.objectStore(STORY_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result || []);
      };

      request.onerror = (event) => {
        console.error(
          "Error getting all stories from IndexedDB:",
          event.target.error
        );
        reject(new Error(`Error getting stories: ${event.target.error}`));
      };
    });
  }

  async getStoryById(id) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORY_STORE_NAME, "readonly");
      const store = transaction.objectStore(STORY_STORE_NAME);
      const request = store.get(id);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error(
          `Error getting story by ID '${id}' from IndexedDB:`,
          event.target.error
        );
        reject(new Error(`Error getting story: ${event.target.error}`));
      };
    });
  }

  async deleteStory(id) {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORY_STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORY_STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`Story with ID '${id}' deleted from IndexedDB.`);
        resolve();
      };
      request.onerror = (event) => {
        console.error(
          `Error deleting story with ID '${id}' from IndexedDB:`,
          event.target.error
        );
        reject(new Error(`Error deleting story: ${event.target.error}`));
      };
    });
  }

  async clearAllStories() {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORY_STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORY_STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log("All stories cleared from IndexedDB.");
        resolve();
      };
      request.onerror = (event) => {
        console.error(
          "Error clearing all stories from IndexedDB:",
          event.target.error
        );
        reject(new Error(`Error clearing stories: ${event.target.error}`));
      };
    });
  }
}

const dbService = new DbService();
export default dbService;
