import {
  getAppData,
  saveAppData,
  updateAppData,
  clearAllData,
} from "./localStorage.js";

//  2) User Info
let appData = getAppData("appData");
let { userInfo, workouts } = appData;

// 3) DOm Element
const userImg = document.getElementById("user__image");
const uploadImg = document.getElementById("upload__image");
const userName = document.getElementById("user__name");
const userDetails = document.getElementById("user__details");
const editUserInfo = document.getElementById("edit__userInfo");

const weatherContent = document.getElementById("weatherContent");
const caloriesTotal = document.getElementById("calories__total");

// Load User Information
export function loadUserInfo() {
  if (!userInfo) return;

  userName.textContent = userInfo.name;
  userDetails.textContent = `Age: ${userInfo.age} | Height: ${userInfo.height}cm | Weight: ${userInfo.weight}kg`;
  userImg.src = userInfo.image || "assets/icons/user.png";
}

// Image upload handler
if (uploadImg) {
  uploadImg.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        userInfo.image = userImg.src = e.target.result;
        updateAppData("userInfo", userInfo);
      };
      reader.readAsDataURL(file);
    }
  });
}

// Edit user info handler
if (editUserInfo) {
  editUserInfo.addEventListener("click", () => {
    const updates = {
      name: prompt("Enter your name:", userInfo.name),
      age: prompt("Enter your age:", userInfo.age),
      height: prompt("Enter your height (cm):", userInfo.height),
      weight: prompt("Enter your weight (kg):", userInfo.weight),
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        userInfo[key] = value;
      }
    });

    updateAppData("userInfo", userInfo);
    loadUserInfo();
  });
}

// init location
let lat, lng;
// 5) Weather : show user real weather
if (userInfo.location) {
  let coords = userInfo.location.split(",");
  lat = coords[0].trim();
  lng = coords[1].trim();
}
function getWeather(lat, lng) {
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=50d4aa487c253b5d7d9e00b0dd13d341`
  )
    .then((res) => res.json())
    .then((data) => {
      const temperature = Math.round(data.main.temp);
      const weather = data.weather[0].description;
      const icon = data.weather[0].icon;
      weatherContent.innerHTML = `
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="Weather Icon" class="w-24 h-24 mb-1">
      <div class="text-main text-center">
      <p class="text-xl font-bold">${temperature}°C</p>
      <p class="text-black/50 capitalize">${weather}</p>
      </div>
      `;
    })
    .catch((error) => {
      console.error("Error fetching weather data:", error);
      weatherContent.innerHTML = `<p class="text-red-500">Unable to fetch weather data.</p>`;
    });
}

// Workout calculations
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function calcCalories(type, distance, time, weight = userInfo.weight || 70) {
  const METrates = {
    running: {
      slow: 7.0,
      medium: 9.0,
      fast: 11.0,
    },
    cycling: {
      slow: 4.0,
      medium: 6.0,
      fast: 8.0,
    },
  };

  const speed = distance / (time / 60);
  let intensity = "medium";

  if (type === "running") {
    if (speed < 8) intensity = "slow";
    if (speed > 11) intensity = "fast";
  } else {
    if (speed < 15) intensity = "slow";
    if (speed > 25) intensity = "fast";
  }

  const timeInHours = time / 60;
  const MET = METrates[type][intensity];
  return Math.round(MET * weight * timeInHours * 3.5);
}

// Update total calories display
function updateTotalCalories() {
  if (!caloriesTotal) return;

  const total = workouts.reduce((sum, workout) => sum + workout.calories, 0);
  caloriesTotal.innerHTML = `
  <h5 class="text-main font-bold">Total Calories</h5>
  <span class="text-black/50">${total} cal</span>`;
}

// Add new workout
export function addWorkout(workout) {
  workouts.unshift(workout);
  updateAppData("workouts", workouts);
  updateTotalCalories();
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadUserInfo();
  getWeather(lat, lng);
  updateTotalCalories();

  // Redirect if user is not logged in
  if (userInfo.name === "Unknown") {
    window.location.href = "./../../index.html";
  }
});

const signOutBtn = document.getElementById("sign__out");
if (signOutBtn) {
  signOutBtn.addEventListener("click", () => {
    try {
      clearAllData();
      window.location.href = "./index.html";
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error signing out. Please try again.");
    }
  });
}

export {
  userInfo,
  workouts,
  lat,
  lng,
  calcDistance,
  calcCalories,
  updateTotalCalories,
};
