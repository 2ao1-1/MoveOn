"use strict";
import { saveData, getData } from "./localStorage.js";

// DOM Elements Selectors with null checks
const getId = (id) => document.getElementById(id);

// State management
const state = {
  isMenuOpen: false,
  isModalOpen: false,
};

// Default application data
const defaultAppData = {
  userInfo: {
    name: "Unknown",
    age: "N/A",
    height: "N/A",
    weight: "N/A",
    image: "assets/icons/user.png",
    location: null,
  },
  workouts: [],
  settings: {
    trackingState: false,
    markers: [],
    trackPoints: [],
  },
};

// Load or initialize app data
let appData = getData("appData") || defaultAppData;

// Initialize all DOM elements
function initializeElements() {
  const elements = {
    menuBtn: getId("menu-btn"),
    overlayMenu: getId("overlay-menu"),
    overlay: getId("overlay"),
    signForm: getId("sign"),
    joinBtns: [
      getId("nav-join-btn"),
      getId("mobile-join-btn"),
      getId("hero-join-btn"),
    ].filter(Boolean),
    closeModalBtn: getId("close-modal"),
    closeMenuBtn: getId("close-menu"),
    form: getId("userForm"),
    inputs: {
      name: getId("name"),
      age: getId("age"),
      weight: getId("weight"),
      height: getId("height"),
      location: getId("location"),
    },
    locationBtn: getId("getLocation"),
    locationStatus: getId("locationStatus"),
  };

  return elements;
}

// chick inputs
function areInputsValid(inputs) {
  return Object.values(inputs).every((input) => input.value.trim() !== "");
}

// Menu functions
function toggleMenu(elements) {
  const { overlayMenu } = elements;
  state.isMenuOpen = !state.isMenuOpen;

  overlayMenu.classList.toggle("hidden");
  overlayMenu.classList.toggle("flex");
}

// Modal functions
function openModal(elements) {
  const { signForm, overlay } = elements;
  state.isModalOpen = true;

  signForm.classList.remove("hidden");
  signForm.classList.add("flex");
  overlay.classList.remove("hidden");
  overlay.classList.add("flex");
}

function closeModal(elements) {
  const { signForm, overlay } = elements;
  state.isModalOpen = false;

  signForm.classList.add("hidden");
  signForm.classList.remove("flex");
  overlay.classList.add("hidden");
  overlay.classList.remove("flex");
}
function closeMenu(elements) {
  const { overlayMenu } = elements;
  state.isModalOpen = false;

  overlayMenu.classList.toggle("hidden");
  overlayMenu.classList.toggle("flex");
}

// Location functions
async function getLocation(elements) {
  const { inputs, locationStatus } = elements;

  try {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported");
    }

    locationStatus.textContent = "Getting location...";

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    });

    const { latitude, longitude } = position.coords;
    inputs.location.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    locationStatus.textContent = "Location found successfully!";
  } catch (error) {
    locationStatus.textContent =
      "Could not get location. Please enter manually.";
  }
}

// Form validation
function validateInputs(inputs) {
  const validations = {
    name: (value) => value.length >= 2 || "Name is too short",
    age: (value) => (value >= 1 && value <= 120) || "Invalid age",
    weight: (value) => (value >= 20 && value <= 200) || "Invalid weight",
    height: (value) => (value >= 50 && value <= 250) || "Invalid height",
  };

  for (const [field, validate] of Object.entries(validations)) {
    const result = validate(inputs[field].value);
    if (typeof result === "string") throw new Error(result);
  }
}

// Form submission
async function handleSubmit(e, elements) {
  e.preventDefault();
  const { inputs, form } = elements;

  try {
    if (!areInputsValid(inputs)) return;
    validateInputs(inputs);

    const updates = {
      name: inputs.name.value,
      age: parseInt(inputs.age.value),
      weight: parseFloat(inputs.weight.value),
      height: parseFloat(inputs.height.value),
      location: inputs.location.value,
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (value) appData.userInfo[key] = value;
    });

    // Save to localStorage
    saveData("appData", appData);

    // Show success message
    alert(`Welcome ${appData.userInfo.name}! Let's Start Your Journy.`);

    // Reset form
    form.reset();

    // Redirect with query params
    const queryString = new URLSearchParams({
      name: appData.userInfo.name,
    }).toString();
    window.location.href = `main.html?${queryString}`;
  } catch (error) {
    alert(error.message);
    console.error("Form error:", error);
  }
}

// Initialize event listeners
function initializeEventListeners(elements) {
  const {
    menuBtn,
    overlayMenu,
    joinBtns,
    overlay,
    closeModalBtn,
    closeMenuBtn,
    locationBtn,
    form,
  } = elements;

  // Menu events
  menuBtn?.addEventListener("click", () => toggleMenu(elements));
  overlayMenu?.addEventListener("click", (e) => {
    if (e.target === overlayMenu) toggleMenu(elements);
  });

  // Join button events
  joinBtns.forEach((btn) =>
    btn?.addEventListener("click", () => openModal(elements))
  );

  // Modal events
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal(elements);
  });

  closeModalBtn?.addEventListener("click", () => closeModal(elements));
  closeMenuBtn?.addEventListener("click", () => closeMenu(elements));

  // Form events
  locationBtn?.addEventListener("click", () => getLocation(elements));
  form?.addEventListener("submit", (e) => handleSubmit(e, elements));

  // Keyboard events
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (state.isModalOpen) closeModal(elements);
      if (state.isMenuOpen) toggleMenu(elements);
    }
  });
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const elements = initializeElements();
  initializeEventListeners(elements);
});
