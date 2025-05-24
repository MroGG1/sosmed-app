import { login } from "../data/api";

class LoginPresenter {
  #view = null;
  #api = null;

  constructor({ view, api }) {
    this.#view = view;
    this.#api = api;
  }

  async handleLoginAttempt(email, password) {
    if (!email || !password) {
      this.#view.showLoginError("Email dan Password tidak boleh kosong.");
      return;
    }
    this.#view.showLoading();
    this.#view.disableSubmitButton();

    try {
      const loginResult = await this.#api.login({ email, password });

      localStorage.setItem("authToken", loginResult.token);
      localStorage.setItem("authName", loginResult.name);
      localStorage.setItem("authUserId", loginResult.userId);

      this.#view.showLoginSuccess(
        `Selamat datang kembali, ${loginResult.name}!`
      );
      setTimeout(() => {
        this.#view.navigateToHome();
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      this.#view.showLoginError(
        error.message || "Terjadi kesalahan saat login."
      );
    } finally {
      this.#view.hideLoading();
      this.#view.enableSubmitButton();
    }
  }
}

export default LoginPresenter;
