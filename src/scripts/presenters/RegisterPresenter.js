import { register } from "../data/api";

class RegisterPresenter {
  #view = null;
  #api = null;

  constructor({ view, api }) {
    this.#view = view;
    this.#api = api;
  }

  async handleRegistrationAttempt(name, email, password) {
    if (!name || !email || !password) {
      this.#view.showRegistrationError(
        "Nama, Email, dan Password tidak boleh kosong."
      );
      return;
    }
    if (password.length < 8) {
      this.#view.showRegistrationError("Password minimal harus 8 karakter.");
      return;
    }
    this.#view.showLoading();
    this.#view.disableSubmitButton();

    try {
      await this.#api.register({ name, email, password });

      this.#view.showRegistrationSuccess();
      setTimeout(() => {
        this.#view.navigateToLogin();
      }, 1500);
    } catch (error) {
      console.error("Register error:", error);
      this.#view.showRegistrationError(
        error.message || "Terjadi kesalahan saat registrasi."
      );
    } finally {
      this.#view.hideLoading();
      this.#view.enableSubmitButton();
    }
  }
}

export default RegisterPresenter;
