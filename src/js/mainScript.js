import { getAppData, saveAppData, updateAppData } from "./localStorage.js";
import {
  userInfo,
  workouts,
  lat,
  lng,
  calcDistance,
  calcCalories,
  updateTotalCalories,
} from "./userInforamation.js";

let appData = getAppData();
let { settings } = appData;
let { markers, trackPoints, tracking } = settings;
let trackingPolyline;
let activeTrackingSession = null;
let watchId = null;

//8) Map initialization
const map = L.map("map").setView([lat, lng], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

// 10) sidebar & form
const sidebar = document.getElementById("sidebar");
const formContainer = document.createElement("div");
formContainer.id = "form-container";
sidebar.appendChild(formContainer);

// 10) save & load workout
function saveWorkoutsToLocalStorage() {
  const cleanWorkouts = workouts.map((workout) => {
    const { marker, polyline, ...cleanWorkouts } = workout;
    return cleanWorkouts;
  });
  updateAppData("workouts", cleanWorkouts);
  console.log(appData);
}
console.log(appData);

function createWorkoutMarker(workout) {
  const { lat, lng } = workout.lastClickedLocation || {
    lat: 30.0444,
    lng: 31.2357,
  };

  const distanceText = workout.distanceInMeters
    ? `${(workout.distanceInMeters / 1000).toFixed(2)} km (${
        workout.distanceInMeters
      }m)`
    : `${workout.distance} km`;

  const marker = L.marker([lat, lng]).addTo(map).bindPopup(`
    <strong class="text-main">${
      workout.type.charAt(0).toUpperCase() + workout.type.slice(1)
    } Workout</strong>
    <br>🗺 Distance: ${distanceText}
    <br>⏳ Time: ${workout.time} min
    <br>⚡ Speed: ${workout.speed} km/h
    <br>🔥 Calories: ${workout.calories} cal
  `);

  return marker;
}

function loadWorkoutsFromLocalStorage() {
  if (Array.isArray(workouts)) {
    workouts.forEach((workout) => {
      // Create marker for each workout
      workout.marker = createWorkoutMarker(workout);

      // Recreate polyline if workout has track points
      if (workout.trackPoints && workout.trackPoints.length > 0) {
        workout.polyline = L.polyline(workout.trackPoints, {
          color: "#1E88E5",
          opacity: 0.6,
        }).addTo(map);
      }
    });
  }
}

// Map click handler - move after tracking functions
let isFormVisible = false;

map.on("click", (e) => {
  // Only handle map clicks if not actively tracking
  if (!tracking) {
    const { lat, lng } = e.latlng;
    window.currentClickLocation = { lat, lng };

    // Toggle form visibility
    if (isFormVisible) {
      formContainer.innerHTML = "";
      isFormVisible = false;
    } else {
      createForm();
      isFormVisible = true;
    }
  }
});

// Create workout form
function createForm() {
  formContainer.innerHTML = `
    <form id="workout-form" class="bg-card shadow-md rounded-lg p-4 grid grid-cols-4 gap-0 text-base">
      <div class="col-span-4 flex justify-center items-center mb-5 gap-4">
        <label for="type">Activity Type:</label>
        <select id="type" class="bg-re1 rounded-lg py-1 px-2" required>
          <option value="running">Running</option>
          <option value="cycling">Cycling</option>
        </select>
      </div>
      <div class="col-span-2 grid grid-cols-2 justify-center items-center mx-1 ">
        <label for="distance">Distance:</label>
        <input type="number" placeholder="km" id="distance" class="outline-none col-span-1 px-2 rounded-md text-main" required />
      </div>
      <div class="col-span-2 grid grid-cols-2 justify-center items-center mx-1">
        <label for="time">Time:</label>
        <input type="number" placeholder="min" class="outline-none col-span-1 px-2 rounded-md text-main" id="time" required />
      </div>
      <button type="submit" class="col-start-2 col-span-2 w-full bg-action hover:bg-action/80 transition-colors rounded-lg p-1 mt-5 text-white">
        Add Activity
      </button>
    </form>
  `;

  const form = document.getElementById("workout-form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const type = document.getElementById("type").value;
    const distance = parseFloat(document.getElementById("distance").value);
    const time = parseFloat(document.getElementById("time").value);
    const speed = (distance / (time / 60)).toFixed(2);
    const calories = calcCalories(type, distance, time);

    const workout = {
      type,
      distance: distance.toFixed(1),
      time,
      speed,
      calories,
      date: new Date().toLocaleDateString(),
      lastClickedLocation: window.currentClickLocation || {
        lat: 30.0444,
        lng: 31.2357,
      },
    };
    isFormVisible = false;
    workout.marker = createWorkoutMarker(workout);
    workouts.unshift(workout);
    updateTotalCalories();
    saveWorkoutsToLocalStorage();
    renderWorkoutList();
    formContainer.innerHTML = "";
  });
}

// Render workout list
function renderWorkoutList() {
  const workoutList = document.getElementById("workout-list");
  sidebar.appendChild(workoutList);
  if (!workoutList) return;

  workoutList.innerHTML = "";

  workouts.forEach((workout, index) => {
    const listItem = document.createElement("li");
    listItem.className = `item grid grid-cols-4 justify-between items-center text-center bg-card m-2 rounded-lg shadow-md text-main text-sm workout--${workout.type}`;

    listItem.innerHTML = `
      <span class="block col-span-2 py-2 font-semibold">${
        workout.type.charAt(0).toUpperCase() + workout.type.slice(1)
      } on ${workout.date}</span>
      <span class="block col-span-2 py-2 px-4 text-end">
        <button class="edit-workout bg-action text-white rounded-md p-1 mr-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-pencil"
          >
            <path
              d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
            />
            <path d="m15 5 4 4" />
          </svg>
        </button>
        <button class="delete-workout bg-out text-white rounded-md p-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
        </button>
      </span>
      <span class="col-span-2 text-xs md:text-xs p-2">🗺 Distance: ${
        workout.distance
      } km</span>
      <span class="col-span-2 text-xs md:text-xs p-2">🕐 Time: ${
        workout.time
      } min</span>
      <span class="col-span-2 text-xs md:text-xs p-2">⚡ Speed: ${
        workout.speed
      } km/h</span>
      <span class="col-span-2 text-xs md:text-xs p-2">🔥 Calories: ${
        workout.calories
      } cal</span>
    `;

    // Delete workout handler
    const deleteButton = listItem.querySelector(".delete-workout");
    deleteButton.addEventListener("click", () => {
      if (workout.marker) {
        map.removeLayer(workout.marker);
      }
      if (workout.polyline) {
        map.removeLayer(workout.polyline);
      }
      workouts.splice(index, 1);
      saveWorkoutsToLocalStorage();
      renderWorkoutList();
      updateTotalCalories();
    });

    // Edit workout handler
    const editButton = listItem.querySelector(".edit-workout");
    editButton.addEventListener("click", () => {
      const type = prompt(
        "Enter activity type (running/cycling):",
        workout.type
      );
      const distance = parseFloat(
        prompt("Enter distance (km):", workout.distance)
      );
      const time = parseFloat(prompt("Enter time (min):", workout.time));

      if (type && !isNaN(distance) && !isNaN(time)) {
        workout.type = type;
        workout.distance = distance.toFixed(1);
        workout.time = time;
        workout.speed = (distance / (time / 60)).toFixed(2);
        workout.calories = calcCalories(type, distance, time);

        if (workout.marker) {
          map.removeLayer(workout.marker);
        }
        workout.marker = createWorkoutMarker(workout);

        saveWorkoutsToLocalStorage();
        renderWorkoutList();
        updateTotalCalories();
      }
    });

    // Workout item click handler
    listItem.addEventListener("click", (e) => {
      // Prevent triggering when clicking edit/delete buttons
      if (!e.target.closest("button")) {
        if (workout.marker) {
          map.setView(
            [workout.marker._latlng.lat, workout.marker._latlng.lng],
            16,
            {
              animate: true,
              duration: 1,
            }
          );
          workout.marker.openPopup();
        }
      }
    });

    workoutList.appendChild(listItem);
  });
}

// Tracking functionality
// Reset tracking state
function resetTrackingState() {
  tracking = false;
  activeTrackingSession = null;
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (trackingPolyline) {
    map.removeLayer(trackingPolyline);
    trackingPolyline = null;
  }
  // Reset form visibility state when tracking ends
  isFormVisible = false;
  formContainer.innerHTML = "";
}

// Start tracking function
function startTracking() {
  if (tracking) {
    console.log("Already tracking");
    return;
  }

  // Reset any existing tracking state
  resetTrackingState();

  // Clear any existing forms
  formContainer.innerHTML = "";
  isFormVisible = false;

  tracking = true;
  activeTrackingSession = {
    startTime: Date.now(),
    points: [],
    distance: 0,
    polyline: L.polyline([], { color: "red" }).addTo(map),
  };
  trackingPolyline = activeTrackingSession.polyline;

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  };

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const currentPoint = [latitude, longitude];

      if (activeTrackingSession.points.length > 0) {
        const lastPoint =
          activeTrackingSession.points[activeTrackingSession.points.length - 1];
        const segmentDistance = calcDistance(
          lastPoint[0],
          lastPoint[1],
          latitude,
          longitude
        );
        activeTrackingSession.distance += segmentDistance;
      }

      activeTrackingSession.points.push(currentPoint);
      activeTrackingSession.polyline.setLatLngs(activeTrackingSession.points);
      map.setView(currentPoint, 16);
    },
    (error) => {
      console.error("Location tracking error:", error);
      let errorMessage = "Failed to get your location. ";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage += "Please enable location permissions in your browser.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage += "Location information is unavailable.";
          break;
        case error.TIMEOUT:
          errorMessage += "Location request timed out. Please try again.";
          break;
        default:
          errorMessage += "Please check your location settings and try again.";
      }
      alert(errorMessage);
      resetTrackingState();
      trackBtn.textContent = "Start Tracking";
    },
    options
  );

  trackBtn.textContent = "Stop Tracking";
  updateAppData("settings", { ...appData.settings, trackingState: true });
}

// Stop tracking function
function stopTracking() {
  if (!tracking || !activeTrackingSession) return;

  const endTime = Date.now();
  const durationInMinutes = (endTime - activeTrackingSession.startTime) / 60000;

  if (activeTrackingSession.points.length > 0) {
    const distanceInKm = activeTrackingSession.distance / 1000;

    const workout = {
      type: "running",
      distance: distanceInKm.toFixed(2),
      distanceInMeters: activeTrackingSession.distance,
      time: durationInMinutes.toFixed(2),
      speed: ((distanceInKm / durationInMinutes) * 60).toFixed(2),
      calories: calcCalories("running", distanceInKm, durationInMinutes),
      date: new Date().toLocaleDateString(),
      lastClickedLocation: {
        lat: activeTrackingSession.points[
          activeTrackingSession.points.length - 1
        ][0],
        lng: activeTrackingSession.points[
          activeTrackingSession.points.length - 1
        ][1],
      },
      trackPoints: activeTrackingSession.points,
    };

    workout.marker = createWorkoutMarker(workout);
    activeTrackingSession.polyline.setStyle({ color: "#00E676", opacity: 0.6 });
    workout.polyline = activeTrackingSession.polyline;

    workouts.unshift(workout);
    saveWorkoutsToLocalStorage();
    renderWorkoutList();
    updateTotalCalories();
  }
  updateTotalCalories();

  // Ensure complete reset of tracking state
  resetTrackingState();
  trackBtn.textContent = "Start Tracking";
  updateAppData("settings", { ...appData.settings, trackingState: false });
}

// Add tracking button
const mapContainer = document.getElementById("mapContainer");
const trackBtn = document.createElement("button");
trackBtn.textContent = "Start Tracking";
trackBtn.className =
  "absolute top-4 right-4 bg-black/50 hover:bg-black text-white p-2 rounded z-10 text-xs transition-colors";

trackBtn.addEventListener("click", () => {
  if (tracking) {
    stopTracking();
  } else {
    startTracking();
  }
});

mapContainer.appendChild(trackBtn);

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in

  if (userInfo.name === "Unknown") {
    window.location.href = "./../../index.html";
    return;
  }

  // Load workouts and markers
  loadWorkoutsFromLocalStorage();
  renderWorkoutList();

  // Resume tracking if it was active
  if (appData.settings.trackingState) {
    startTracking();
  }
});
