// localStorage
export function getData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error retrieving data:", error);
    return null;
  }
}

export function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving data:", error);
    return false;
  }
}

export function clearAllData() {
  try {
    localStorage.clear();
    console.log("All data has been cleared.");
  } catch (error) {
    console.error("Error clearing all data:", error);
  }
}

// Initial app data structure
export const initialAppData = {
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

// Get app data with fallback to initial data
export function getAppData() {
  const savedData = getData("appData");
  return savedData || initialAppData;
}

// Save complete app data
export function saveAppData(data) {
  return saveData("appData", data);
}

// Update specific section of app data
export function updateAppData(section, newData) {
  const currentData = getAppData();
  currentData[section] = newData;
  return saveAppData(currentData);
}
