import * as Api from "../../data/api";
import LoginPresenter from "../../presenters/LoginPresenter";
import Swal from "sweetalert2";

export default class LoginPage {
  #presenter = null;
  #loginForm = null;
  #emailInput = null;
  #passwordInput = null;
  #errorElement = null;
  #submitButton = null;
  #loadingOverlay = null;

  async render() {
    return `
      <section class="container auth-page">
        <div class="auth-form-container">
          <div id="loginLoadingOverlay" class="loading-overlay">
            <div class="spinner"></div>
          </div>
          <div class="auth-header">
            <h2>Login</h2>
          </div>
          <div class="auth-body">
            <form id="loginFormPage">
              <div class="form-group">
                <label for="loginEmailPage">Email:</label>
                <input type="email" id="loginEmailPage" placeholder="Masukan Email" required aria-label="Email">
              </div>
              <div class="form-group">
                 <label for="loginPasswordPage">Password:</label>
                <input type="password" id="loginPasswordPage" placeholder="Masukan Password" required aria-label="Password">
              </div>
              <div class="form-options">
                 <div class="form-check">
                     <input type="checkbox" id="rememberMePage">
                     <label for="rememberMePage">Ingatkan saya</label>
                 </div>
                 <a href="#" class="forgot-password">Lupa password?</a>
              </div>
              <button type="submit" class="btn btn-gradient">Login</button>
              <p id="loginErrorPage" class="error-message"></p>
            </form>
          </div>
          <div class="auth-footer">
            <p>Belum menjadi anggota? <a href="#/register">Daftar Sekarang</a></p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new LoginPresenter({ view: this, api: Api });
    this.#loginForm = document.querySelector("#loginFormPage");
    this.#emailInput = this.#loginForm.querySelector("#loginEmailPage");
    this.#passwordInput = this.#loginForm.querySelector("#loginPasswordPage");
    this.#errorElement = this.#loginForm.querySelector("#loginErrorPage");
    this.#submitButton = this.#loginForm.querySelector('button[type="submit"]');
    this.#loadingOverlay = document.querySelector("#loginLoadingOverlay");

    if (
      !this.#loginForm ||
      !this.#emailInput ||
      !this.#passwordInput ||
      !this.#errorElement ||
      !this.#submitButton ||
      !this.#loadingOverlay
    ) {
      console.error("One or more login form elements not found.");
      return;
    }

    this.#loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = this.#emailInput.value;
      const password = this.#passwordInput.value;
      this.#errorElement.textContent = "";

      await this.#presenter.handleLoginAttempt(email, password);
    });
  }

  showLoading() {
    if (this.#loadingOverlay) {
      this.#loadingOverlay.classList.add("visible");
    }
  }

  hideLoading() {
    if (this.#loadingOverlay) {
      this.#loadingOverlay.classList.remove("visible");
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

  showLoginError(message) {
    Swal.fire({
      title: "Login Gagal",
      text: message,
      icon: "error",
      confirmButtonText: "OK",
    });
  }

  showLoginSuccess(message) {
    Swal.fire({
      title: "Login Berhasil!",
      text: message,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  }

  navigateToHome() {
    window.location.hash = "#/";
  }
}
