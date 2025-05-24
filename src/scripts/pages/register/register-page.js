import * as Api from "../../data/api";
import Swal from "sweetalert2";
import RegisterPresenter from "../../presenters/RegisterPresenter";

export default class RegisterPage {
  #presenter = null;
  #registerForm = null;
  #nameInput = null;
  #emailInput = null;
  #passwordInput = null;
  #errorElement = null;
  #submitButton = null;
  #loadingOverlay = null;

  async render() {
    return `
      <section class="container auth-page">
        <div class="auth-form-container">
           
           <div id="registerLoadingOverlay" class="loading-overlay" style="display: none;">
             <div class="spinner"></div>
           </div>
           <div class="auth-header">
             <h2>Form Registrasi</h2>
           </div>
           <div class="auth-body">
             <form id="registerFormPage">
               <div class="form-group">
                 <label for="registerNamePage">Name:</label>
                 <input type="text" id="registerNamePage" placeholder="Masukan Nama" required aria-label="Name">
               </div>
               <div class="form-group">
                 <label for="registerEmailPage">Email:</label>
                 <input type="email" id="registerEmailPage" placeholder="Masukan Email" required aria-label="Email">
               </div>
               <div class="form-group">
                 <label for="registerPasswordPage">Password:</label>
                 <input type="password" id="registerPasswordPage" placeholder="Masukan Password (min. 8 karakter)" required minlength="8" aria-label="Password">
               </div>
               <button type="submit" class="btn btn-gradient">Register</button>
               <p id="registerErrorPage" class="error-message"></p>
             </form>
           </div>
           <div class="auth-footer">
              <p>Sudah punya akun? <a href="#/login">Login Sekarang</a></p>
           </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new RegisterPresenter({ view: this, api: Api });
    this.#registerForm = document.querySelector("#registerFormPage");
    this.#nameInput = this.#registerForm.querySelector("#registerNamePage");
    this.#emailInput = this.#registerForm.querySelector("#registerEmailPage");
    this.#passwordInput = this.#registerForm.querySelector(
      "#registerPasswordPage"
    );
    this.#errorElement = this.#registerForm.querySelector("#registerErrorPage");
    this.#submitButton = this.#registerForm.querySelector(
      'button[type="submit"]'
    );
    this.#loadingOverlay = document.querySelector("#registerLoadingOverlay");

    if (
      !this.#registerForm ||
      !this.#nameInput ||
      !this.#emailInput ||
      !this.#passwordInput ||
      !this.#errorElement ||
      !this.#submitButton
    ) {
      console.error("One or more register form elements not found.");
      return;
    }

    this.#registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = this.#nameInput.value;
      const email = this.#emailInput.value;
      const password = this.#passwordInput.value;
      this.#errorElement.textContent = "";

      await this.#presenter.handleRegistrationAttempt(name, email, password);
    });
  }

  showLoading() {
    if (this.#loadingOverlay) {
      this.#loadingOverlay.style.display = "flex";
    }
    if (this.#submitButton) {
      this.#submitButton.textContent = "Registering...";
    }
  }

  hideLoading() {
    if (this.#loadingOverlay) {
      this.#loadingOverlay.style.display = "none";
    }
    if (this.#submitButton) {
      this.#submitButton.textContent = "Register";
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

  showRegistrationError(message) {
    Swal.fire({
      title: "Registrasi Gagal",
      text: message,
      icon: "error",
      confirmButtonText: "OK",
    });
  }

  showRegistrationSuccess() {
    Swal.fire({
      title: "Registrasi Berhasil!",
      text: "Akun Anda telah dibuat. Silakan login.",
      icon: "success",
      confirmButtonText: "Menuju Login",
    });
  }

  navigateToLogin() {
    window.location.hash = "#/login";
  }
}
