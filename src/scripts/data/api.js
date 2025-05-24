import CONFIG from "../config";

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  GET_STORY_DETAIL: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
};

async function register({ name, email, password }) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });
  const responseJson = await response.json();

  if (responseJson.error) {
    console.error("Register failed:", responseJson.message);
    throw new Error(responseJson.message);
  }

  return responseJson;
}

async function login({ email, password }) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const responseJson = await response.json();

  if (responseJson.error) {
    console.error("Login failed:", responseJson.message);
    throw new Error(responseJson.message);
  }

  return responseJson.loginResult;
}

async function getAllStories(token) {
  if (!token) {
    throw new Error("Authentication token is required.");
  }

  try {
    const response = await fetch(ENDPOINTS.STORIES, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const responseJson = await response.json();

    if (responseJson.error) {
      console.error("Get stories failed:", responseJson.message);
      throw new Error(responseJson.message);
    }

    return responseJson.listStory;
  } catch (error) {
    console.error("Error fetching stories:", error);
    throw error;
  }
}

async function addNewStory(token, { description, photo, lat, lon }) {
  if (!token) {
    throw new Error("Authentication token is required.");
  }

  const formData = new FormData();
  formData.append("description", description);
  formData.append("photo", photo);
  if (lat !== undefined && lat !== null) formData.append("lat", lat);
  if (lon !== undefined && lon !== null) formData.append("lon", lon);

  const response = await fetch(ENDPOINTS.STORIES, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const responseJson = await response.json();

  if (responseJson.error) {
    console.error("Add story failed:", responseJson.message);
    throw new Error(responseJson.message);
  }

  return responseJson;
}

async function getStoryDetail(token, id) {
  if (!token) {
    throw new Error("Authentication token is required.");
  }
  if (!id) {
    throw new Error("Story ID is required.");
  }

  try {
    const response = await fetch(ENDPOINTS.GET_STORY_DETAIL(id), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const responseJson = await response.json();

    if (responseJson.error) {
      console.error("Get story detail failed:", responseJson.message);
      throw new Error(responseJson.message);
    }

    if (!responseJson.story) {
      console.error(
        "Get story detail failed: 'story' object not found in response.",
        responseJson
      );
      throw new Error("Failed to retrieve story details.");
    }

    return responseJson.story;
  } catch (error) {
    console.error("Error fetching story detail:", error);
    throw error;
  }
}

export { register, login, getAllStories, addNewStory, getStoryDetail };
