import HomePage from "../pages/home/home-page";
import AboutPage from "../pages/about/about-page";
import LoginPage from "../pages/login/login-page";
import RegisterPage from "../pages/register/register-page.js";
import AddStoryPage from "../pages/add/story-page.js";
import DetailPage from "../pages/detail/detail-page.js";

const routes = {
  "/": new HomePage(),
  "/about": new AboutPage(),
  "/login": new LoginPage(),
  "/register": new RegisterPage(),
  "/add": new AddStoryPage(),
  "/story/:id": new DetailPage(),
};

export default routes;
