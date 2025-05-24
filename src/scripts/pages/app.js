import routes from "../routes/routes";
import { getActiveRoute, getActivePathname } from "../routes/url-parser";
import Swal from "sweetalert2";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #navList = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#navList = this.#navigationDrawer.querySelector("#nav-list");

    this._setupDrawer();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = this.#navigationDrawer.classList.contains("open");
      if (isOpen) {
        this.#navigationDrawer.classList.remove("open");
        document.body.classList.remove("drawer-push-active");
      } else {
        this.#navigationDrawer.classList.add("open");
        document.body.classList.add("drawer-push-active");
      }
    });

    document.body.addEventListener("click", (event) => {
      const isOpen = this.#navigationDrawer.classList.contains("open");
      if (
        isOpen &&
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
        document.body.classList.remove("drawer-push-active");
      }
    });

    if (this.#navigationDrawer) {
      this.#navigationDrawer.addEventListener("click", (event) => {
        const targetLink = event.target.closest("a");
        if (!targetLink) return;

        if (!targetLink.id || targetLink.id !== "logoutButton") {
          this.#navigationDrawer.classList.remove("open");
          document.body.classList.remove("drawer-push-active");
        } else if (targetLink.id === "logoutButton") {
          event.preventDefault();
          Swal.fire({
            title: "Apakah Anda yakin ingin logout?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Ya, logout!",
            cancelButtonText: "Batal",
          }).then((result) => {
            if (result.isConfirmed) {
              this._performLogout();
              this.#navigationDrawer.classList.remove("open");
              document.body.classList.remove("drawer-push-active");
            }
          });
        }
      });
    } else {
      console.error(
        "Navigation drawer element not found for event listener setup."
      );
    }
  }

  _performLogout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authName");
    localStorage.removeItem("authUserId");

    Swal.fire({
      title: "Logout Berhasil",
      icon: "success",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });

    window.location.hash = "#/login";
  }

  _updateNavigation() {
    const token = localStorage.getItem("authToken");
    if (!this.#navList) {
      console.error("Navigation list element not found for update.");
      return;
    }

    let navItemsHTML = `
      <li><a href="#/">Beranda</a></li>
      <li><a href="#/about">About</a></li>
    `;

    if (token) {
      const userName = localStorage.getItem("authName") || "User";
      navItemsHTML += `
        <li><a href="#/add">Add Story</a></li>
        <li><a href="#" id="logoutButton" class="nav-link">Logout</a></li>
         `;
    } else {
      navItemsHTML += `
        <li><a href="#/login">Login</a></li>
        <li><a href="#/register">Register</a></li>
      `;
    }

    this.#navList.innerHTML = navItemsHTML;
  }

  async renderPage() {
    const currentPath = getActivePathname();
    console.log(`Current path: ${currentPath}`);

    if (currentPath === "/login" || currentPath === "/register") {
      document.body.classList.add("auth-active");
    } else {
      document.body.classList.remove("auth-active");
    }

    this._updateNavigation();

    const url = getActiveRoute() || "/";
    const page = routes[url];
    if (!page) {
      console.error(`No route found for ${url}`);
      window.location.hash = "#/";
      return;
    }

    const updateDOM = async () => {
      if (
        typeof page.render !== "function" ||
        typeof page.afterRender !== "function"
      ) {
        console.error(
          `Page object for route ${url} does not have render or afterRender methods.`
        );
        this.#content.innerHTML = "<p>Error: Page cannot be loaded.</p>";
        return;
      }

      this.#content.innerHTML = await page.render();
      await page.afterRender();
    };

    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        await updateDOM();
      });
    } else {
      console.log("View Transitions not supported, updating DOM directly.");
      await updateDOM();
    }
  }
}

export default App;
