import { db, rtdb, onValue,auth } from "./firebase-config.js"
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
import { ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js"

const databaseRef = ref(rtdb)
console.log("file is initialized\n")

// DOM Elements with error handling
const getElement = (id) => {
  const element = document.getElementById(id)
  if (!element) {
    console.warn(`Element with id "${id}" not found`)
  }
  return element
}
const getElements = (selector) => {
  const elements = document.querySelectorAll(selector)
  if (elements.length === 0) {
    console.warn(`No elements found with selector "${selector}"`)
  }
  return elements
}

// Core UI Elements
const dashboard = document.querySelector(".dashboard")
const sidebarToggle = getElement("sidebar-toggle")
const sidebar = document.querySelector(".sidebar")
const currentDateEl = getElement("current-date")
const currentTimeEl = getElement("current-time")

// Status Card Elements
const moistureValueEl = getElement("moisture-value")?.querySelector(".value")
const moistureStatusEl = getElement("moisture-status")
const moistureProgressEl = getElement("moisture-progress")
const moistureAlertEl = getElement("moisture-alert")
const refreshMoistureBtn = getElement("refresh-moisture")

const temperatureValueEl = getElement("temperature-value")?.querySelector(".value")
const temperatureStatusEl = getElement("temperature-status")
const temperatureProgressEl = getElement("temperature-progress")
const temperatureAlertEl = getElement("temperature-alert")


const irrigationValueEl = getElement("irrigation-value")?.querySelector(".value")
const irrigationUnitEl = getElement("irrigation-unit")
const irrigationScheduleEl = getElement("irrigation-schedule")
const irrigationStatusEl = getElement("irrigation-status")
const irrigationProgressEl = getElement("irrigation-progress")


const weatherConditionEl = getElement("weather-condition")
const weatherIconEl = getElement("weather-icon")
const precipitationInfoEl = getElement("precipitation-info")
const refreshWeatherBtn = getElement("refresh-weather")

// Chart Elements
const moistureChartEl = getElement("moisture-chart")
const temperatureChartEl = getElement("temperature-chart")


// Tab Elements
const tabBtns = getElements(".tab-btn")
const tabPanes = getElements(".tab-pane")

// Irrigation Control Elements
const irrigationStatusDotEl = getElement("irrigation-status-dot")
const irrigationStatusTextEl = getElement("irrigation-status-text")

// Weather Elements 
const extendedForecastEl = getElement("extended-forecast")
const precipitationGaugeEl = getElement("precipitation-gauge")
const precipitationPercentageEl = getElement("precipitation-percentage")
const precipitationLabelEl = getElement("precipitation-label")
const windSpeedEl = getElement("wind-speed")
const humidityEl = getElement("humidity")
const pressureEl = getElement("pressure")
const visibilityEl = getElement("visibility")
const cloudCoverEl = getElement("cloud-cover")

// Crops Elements
const cropsContainerEl = getElement("crops-container")
const activeCropsEl = getElement("active-crops")

// Analytics Elements
const avgMoistureEl = getElement("avg-moisture")
const avgTemperatureEl = getElement("avg-temperature")
const irrigationEventsEl = getElement("irrigation-events")

// Settings Elements
const userSettingsForm = getElement("user-settings-form")

// Toast Container
const toastContainerEl = getElement("toast-container")

// Modal Elements
const modalOverlayEl = getElement("modal-overlay")
const modalEl = getElement("modal")
const modalTitleEl = getElement("modal-title")
const modalBodyEl = getElement("modal-body")
const modalFooterEl = getElement("modal-footer")
const modalCloseBtn = getElement("modal-close")

// Menu Links
const menuLinks = getElements(".menu-link")

// Global State
const state = {
  moisture: null,
  moistureHistory: [],
  moistureTimeRange: "24h", 
  temperature: null,
  temperatureHistory: [],
  temperatureTimeRange: "24h", 
  precipitation: 0,
  weatherCondition: "Loading...",
  weatherForecast: [],
  irrigationStatus: "idle", 
  crops: [],
  selectedZones: ["zone1"],
  weatherDetails: {
    windSpeed: 0,
    humidity: 0,
    pressure: 0,
    visibility: 0,
    uvIndex: 0,
    cloudCover: 0,
  },
  darkMode: false,
  settings: {
    refreshRate: 60,
    temperatureUnit: "celsius",
    theme: "light",
    notifications: {
      moisture: true,
      temperature: true,
      irrigation: true,
      weather: true,
    },
  },
  analytics: {
    avgMoisture: 0,
    avgTemperature: 0,
    waterEfficiency: 0,
    irrigationEvents: 0,
  },
  cropInfo: {
    sowingDate: null, 
    daysAfterSowing: 0,
  },
}

// To calculate days after sowing
function calculateDaysAfterSowing() {
  if (!state.cropInfo.sowingDate) {
    // default sowing date if not set 
    const defaultSowingDate = new Date()
    defaultSowingDate.setDate(defaultSowingDate.getDate() - 60)
    state.cropInfo.sowingDate = defaultSowingDate
  }

  const today = new Date()
  const sowingDate = new Date(state.cropInfo.sowingDate)

  // Difference in days
  const diffTime = Math.abs(today - sowingDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  state.cropInfo.daysAfterSowing = diffDays

  return diffDays
}

// Function to fetch irrigation status from Firebase
function fetchIrrigationStatus() {
  const irrigationStatusRef = ref(rtdb, "irrigation_control/switch") 

  onValue(
    irrigationStatusRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const status = snapshot.val() 
        console.log("Irrigation status from Firebase:", status)


        state.irrigationStatus = status === "ON" ? "ON" : "OFF";

        console.log(status)


        updateIrrigationUI()
      } else {
        console.log("No irrigation status found in Firebase, defaulting to off")
        state.irrigationStatus = "idle"
        updateIrrigationUI()
      }
    },
    {
      onlyOnce: false, 
    },
  )
}

// Function to send sowing date to Firebase
function sendSowingDateToFirebase(sowingDate) {
  try {
    const sowingDateRef = ref(rtdb, "sowing_date")

    set(sowingDateRef, sowingDate.toISOString())
      .then(() => {
        console.log("Sowing date sent to Firebase:", sowingDate.toISOString())
        showToast({
          type: "success",
          title: "Sowing Date Updated",
          message: "Sowing date has been updated in the database.",
        })
      })
      .catch((error) => {
        console.error("Error sending sowing date:", error)
        showToast({
          type: "error",
          title: "Update Failed",
          message: "Failed to update sowing date in the database.",
        })
      })
  } catch (error) {
    console.error("Error in sendSowingDateToFirebase:", error)
  }
}


function initDashboard() {
  console.log("Initializing Ezcrop dashboard...")

  loadSettings()

  loadTemperatureHistory()
  loadMoistureHistory()

  initCropInfo()

  setupEventListeners()

  showToast({
    type: "success",
    title: "Welcome to Ezcrop",
    message: "Your smart farming dashboard is ready to help you optimize your crops.",
  })

  fetchUserLocation()
  fetchMoistureData()
  fetchWeatherData()
  fetchIrrigationStatus()
  fetchCropData()

  initCharts()

  initAllTabs()
  updateDateTime()
  setInterval(updateDateTime, 1000)

  addAnimations()

  console.log("Dashboard initialization complete")
}

//Sowing date from Firebase
function initCropInfo() {
  const sowingDateRef = ref(rtdb, "sowing_date")

  onValue(
    sowingDateRef,
    (snapshot) => {
      if (snapshot.exists()) {
        
        state.cropInfo.sowingDate = new Date(snapshot.val())
        console.log(`Loaded sowing date from Firebase: ${state.cropInfo.sowingDate}`)

        calculateDaysAfterSowing()

        updateCropUI()
      } else {

        const savedSowingDate = localStorage.getItem("ezcrop-sowing-date")

        if (savedSowingDate) {
          state.cropInfo.sowingDate = new Date(savedSowingDate)
        } else {
          const defaultSowingDate = new Date()
          defaultSowingDate.setDate(defaultSowingDate.getDate() - 6)
          state.cropInfo.sowingDate = defaultSowingDate

          localStorage.setItem("ezcrop-sowing-date", defaultSowingDate.toISOString())
        }

        calculateDaysAfterSowing()

        sendSowingDateToFirebase(state.cropInfo.sowingDate)
      }
    },
    {
      onlyOnce: true, 
    },
  )

  console.log(`Crop initialized: ${state.cropInfo.daysAfterSowing} days after sowing`)
}

function setupEventListeners() {
  // Sidebar toggle
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      dashboard.classList.toggle("sidebar-collapsed")

      if (window.innerWidth <= 768) {
        sidebar.classList.toggle("active")
      }
      
    })
  }

  // Tab 
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab")

      tabBtns.forEach((b) => b.classList.remove("active"))
      tabPanes.forEach((p) => p.classList.remove("active"))

      btn.classList.add("active")

      const tabPane = document.getElementById(`${tabId}-tab`)
      if (tabPane) {
        tabPane.classList.add("active")

        refreshTabContent(tabId)
      }
    })
  })

  // Refresh buttons
  if (refreshMoistureBtn) {
    refreshMoistureBtn.addEventListener("click", () => {
      const icon = refreshMoistureBtn.querySelector("i")
      if (icon) icon.classList.add("fa-spin")
      fetchMoistureData()
      setTimeout(() => {
        if (icon) icon.classList.remove("fa-spin")
        showToast({
          type: "info",
          title: "Data Refreshed",
          message: "Soil moisture data has been updated.",
        })
      }, 1000)
    })
  }

  if (refreshWeatherBtn) {
    refreshWeatherBtn.addEventListener("click", () => {
      const icon = refreshWeatherBtn.querySelector("i")
      if (icon) icon.classList.add("fa-spin")
      fetchWeatherData()
      setTimeout(() => {
        if (icon) icon.classList.remove("fa-spin")
        showToast({
          type: "info",
          title: "Data Refreshed",
          message: "Weather data has been updated.",
        })
      }, 1000)
    })
  }

  // Menu links 
  menuLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()

      menuLinks.forEach((l) => l.classList.remove("active"))

      link.classList.add("active")

      const linkText = link.querySelector(".menu-text").textContent.trim().toLowerCase()
      const tabBtn = document.querySelector(`.tab-btn[data-tab="${linkText}"]`)

      if (tabBtn) {
        tabBtn.click()
      }
    })
  })

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeModal)
  }

  // User settings form submission
  if (userSettingsForm) {
    userSettingsForm.addEventListener("submit", (e) => {
      e.preventDefault()
      saveUserSettings()
    })
  }
}

function updateDateTime() {
  if (!currentDateEl || !currentTimeEl) return

  const now = new Date()

  // Format date: Month, Date, Year
  const dateOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  currentDateEl.textContent = now.toLocaleDateString("en-US", dateOptions)

  // 12 hours format
  const timeOptions = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }
  currentTimeEl.textContent = now.toLocaleTimeString("en-US", timeOptions)
}
//FETCH Moisture
function fetchMoistureData() {
  const moistureRef = ref(rtdb, "irrigation_control/SensorReading") 

  onValue(
    moistureRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const moisture = snapshot.val() 
        console.log(snapshot.val())

        state.moisture = moisture

        const now = new Date()
        const timeString = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

        const savedMoistureHistory = localStorage.getItem("ezcrop-moisture-history")
        if (savedMoistureHistory) {
          state.moistureHistory = JSON.parse(savedMoistureHistory)
        }

        state.moistureHistory.push({
          time: timeString,
          value: moisture,
          timestamp: now.getTime(),
        })

        const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000
        state.moistureHistory = state.moistureHistory.filter((item) => item.timestamp && item.timestamp > oneWeekAgo)

        localStorage.setItem("ezcrop-moisture-history", JSON.stringify(state.moistureHistory))

        updateMoistureUI()

        updateMoistureChart()
      } else {
        console.error("No moisture data found in Firebase.")
      }
    },
    {
      onlyOnce: false, 
    },
  )
}

// moisture chart with stored data
function updateMoistureChart() {
  if (!moistureChartEl || !window.moistureChart || !ensureChartIsAvailable()) return

  const now = new Date().getTime()

  let filteredData
  if (state.moistureTimeRange === "24h") {
    const oneDayAgo = now - 24*60 * 60 * 1000
    filteredData = state.moistureHistory.filter((item) => item.timestamp && item.timestamp > oneDayAgo)
  } else {
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
    filteredData = state.moistureHistory.filter((item) => item.timestamp && item.timestamp > oneWeekAgo)
  }
  const last12Data = filteredData.slice(-12);

  window.moistureChart.data.labels = last12Data.map((item) => item.time)
  window.moistureChart.data.datasets[0].data = last12Data.map((item) => item.value)
  window.moistureChart.update()

  console.log(`Moisture chart updated with ${filteredData.length} data points for ${state.moistureTimeRange} view`)
}

function loadMoistureHistory() {
  const savedMoistureHistory = localStorage.getItem("ezcrop-moisture-history")
  if (savedMoistureHistory) {
    try {
      state.moistureHistory = JSON.parse(savedMoistureHistory)
      console.log(`Loaded ${state.moistureHistory.length} moisture history records`)
    } catch (error) {
      console.error("Error parsing moisture history:", error)
      state.moistureHistory = []
    }
  }
}

//  moisture UI
function updateMoistureUI() {
  if (!moistureValueEl || !moistureStatusEl || !moistureProgressEl) return

  moistureValueEl.textContent = state.moisture

  moistureProgressEl.style.width = `${state.moisture}%`

  if (state.moisture < 30) {
    moistureStatusEl.textContent = "Low"
    moistureStatusEl.className = "status-badge danger"
    moistureProgressEl.style.backgroundColor = "#ef4444"

    if (moistureAlertEl) {
      moistureAlertEl.innerHTML = `
        <div class="alert danger">
          <i class="fas fa-exclamation-triangle"></i>
          <div>
            <strong>Low Moisture Alert</strong>
            <p>Moisture level is below recommended threshold.</p>
          </div>
        </div>
      `
    }
  } else if (state.moisture < 60) {
    moistureStatusEl.textContent = "Moderate"
    moistureStatusEl.className = "status-badge warning"
    moistureProgressEl.style.backgroundColor = "#f59e0b"
    if (moistureAlertEl) moistureAlertEl.innerHTML = ""
  } else {
    moistureStatusEl.textContent = "Optimal"
    moistureStatusEl.className = "status-badge optimal"
    moistureProgressEl.style.backgroundColor = "#4ecca3"
    if (moistureAlertEl) moistureAlertEl.innerHTML = ""
  }
}

const uid = "0PauRrLp8YdrVECXG0bG5Lt5BOl1"
async function fetchUserLocation() {
  try {
    const userDocRef = doc(db, "users/0PauRrLp8YdrVECXG0bG5Lt5BOl1") 
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      throw new Error("User not found!")
    }

    const userData = userDocSnap.data()
    const district = userData.district // Safely access nested field
    console.log(district)

    if (!district) {
      throw new Error("User has no district data!")
    }

    return district 
  } catch (error) {
    console.error("Failed to fetch district:", error.message)
    throw error 
  }
}

async function fetchWeatherData() {
  const location = await fetchUserLocation()
  const apiKey = "7a795218d8876d63d69adb8a45f3d361"
  const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=metric`

  try {
    const response = await fetch(weatherUrl)
    if (!response.ok) throw new Error("Weather data not available.")

    const data = await response.json()

    // Extract relevant data (current weather)
    const temperature = data.list[0].main.temp
    const weatherCondition = data.list[0].weather[0].main
    const precipitation = data.list[0].pop * 100 // Probability of precipitation

    // Update state
    state.temperature = temperature
    state.weatherCondition = weatherCondition
    state.precipitation = precipitation
    
    // Set the data in Firebase
    try {
        const precipitationRef = ref(rtdb, "irrigation_control/precipitation")
        
        set(precipitationRef, precipitation)
          .then(() => {
            console.log("Precipitation command sent to Firebase:",precipitation)
        
          })
          .catch((error) => {
            console.error("Error sending Precipitation:", error)
                 })
      } catch (error) {
        console.error("Error in PrecipitaionRef:", error)
      }

    // Update weather details
    state.weatherDetails = {
      windSpeed: data.list[0].wind.speed,
      humidity: data.list[0].main.humidity,
      pressure: data.list[0].main.pressure,
      visibility: data.list[0].visibility / 1000, // Convert to km
      uvIndex: Math.floor(Math.random() * 11), 
      cloudCover: data.list[0].clouds.all,
    }
    console.log("Updated weather details:", state.weatherDetails)
    // Add to history with timestamp
    const now = new Date()
    const timeString = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

    // Load existing temperature history from localStorage
    const savedTempHistory = localStorage.getItem("ezcrop-temperature-history")
    if (savedTempHistory) {
      state.temperatureHistory = JSON.parse(savedTempHistory)
    }

    // Add new temperature data
    state.temperatureHistory.push({
      time: timeString,
      value: temperature,
      timestamp: now.getTime(),
    })

    // Keep only data from the last 7 days (168 hours)
    const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000
    state.temperatureHistory = state.temperatureHistory.filter((item) => item.timestamp && item.timestamp > oneWeekAgo)

    // Save temperature history to localStorage
    localStorage.setItem("ezcrop-temperature-history", JSON.stringify(state.temperatureHistory))

    // Extract 3-day forecast
    state.weatherForecast = []
    for (let i = 0; i < 3; i++) {
      const forecastData = data.list[i * 8] 
      const forecastTemp = forecastData.main.temp
      const forecastCondition = forecastData.weather[0].main
      const forecastPrecipitation = forecastData.pop * 100

      const date = new Date()
      date.setDate(date.getDate() + i + 1)

      state.weatherForecast.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        temp: forecastTemp,
        condition: forecastCondition,
        precipitation: forecastPrecipitation,
      })
    }

    // Update UI
    updateTemperatureUI()
    updateWeatherUI()
    updateExtendedForecast()
    updateWeatherDetails()
    updateTemperatureChart()
  } catch (error) {
    console.error("Error fetching weather data:", error)
  }
  

}

// Update the updateTemperatureChart function to check for Chart availability
function updateTemperatureChart() {
  if (!temperatureChartEl || !window.temperatureChart || !ensureChartIsAvailable()) return

  // Get the current time
  const now = new Date().getTime()

  // Filter data based on selected time range
  let filteredData
  if (state.temperatureTimeRange === "24h") {
    // Last 24 hours
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    filteredData = state.temperatureHistory.filter((item) => item.timestamp && item.timestamp > oneDayAgo)
  } else {
    // Last 7 days
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
    filteredData = state.temperatureHistory.filter((item) => item.timestamp && item.timestamp > oneWeekAgo)
  }
  const last12Data = filteredData.slice(-12);
  // Update chart with filtered data
  window.temperatureChart.data.labels = last12Data.map((item) => item.time)
  window.temperatureChart.data.datasets[0].data = last12Data.map((item) => item.value)
  window.temperatureChart.update()

  console.log(
    `Temperature chart updated with ${filteredData.length} data points for ${state.temperatureTimeRange} view`,
  )
}

// Load temperature history from localStorage
function loadTemperatureHistory() {
  const savedTempHistory = localStorage.getItem("ezcrop-temperature-history")
  if (savedTempHistory) {
    try {
      state.temperatureHistory = JSON.parse(savedTempHistory)
      console.log(`Loaded ${state.temperatureHistory.length} temperature history records`)
    } catch (error) {
      console.error("Error parsing temperature history:", error)
      state.temperatureHistory = []
    }
  }
}

// Update extended forecast UI
function updateExtendedForecast() {
  if (!extendedForecastEl) return

  let forecastHTML = ""

  if (state.weatherForecast.length === 0) {
    forecastHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading weather forecast...</span>
      </div>
    `
  } else {
    //  7-day forecast 
    const extendedForecast = [...state.weatherForecast]

    for (let i = 0; i < 4; i++) {
      const lastDay = extendedForecast[extendedForecast.length - 1]
      const date = new Date()
      date.setDate(date.getDate() + i + 4) 

      extendedForecast.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        temp: lastDay.temp + (Math.random() * 4 - 2), 
        condition: lastDay.condition,
        precipitation: Math.min(100, Math.max(0, lastDay.precipitation + (Math.random() * 20 - 10))),
      })
    }

    extendedForecast.forEach((forecast, index) => {
      let iconClass = "fas fa-sun"
      let iconColor = "#f59e0b"

      if (forecast.condition === "Clouds" || forecast.condition === "Cloudy") {
        iconClass = "fas fa-cloud"
        iconColor = "#6b7280"
      } else if (forecast.condition === "Rain") {
        iconClass = "fas fa-cloud-rain"
        iconColor = "#3b82f6"
      }

      forecastHTML += `
        <div class="forecast-item" style="animation: fadeInUp ${0.2 + index * 0.05}s ease">
          <div class="forecast-day-name">${forecast.day}</div>
          <i class="${iconClass}" style="color: ${iconColor}"></i>
          <div class="forecast-temp">${Math.round(forecast.temp)}°C</div>
          <div class="forecast-condition">${forecast.condition}</div>
        </div>
      `
    })
  }

  extendedForecastEl.innerHTML = forecastHTML
}

// Update weather details UI
function updateWeatherDetails() {
  if (!windSpeedEl || !humidityEl || !pressureEl || !visibilityEl || !cloudCoverEl) return

  // Update precipitation gauge
  if (precipitationGaugeEl && precipitationPercentageEl && precipitationLabelEl) {
    // Set the gauge border color based on precipitation percentage
    const borderColor = state.precipitation > 70 ? "#3b82f6" : state.precipitation > 30 ? "#f59e0b" : "#e5e7eb"

    precipitationGaugeEl.style.borderColor = borderColor
    precipitationPercentageEl.textContent = Math.round(state.precipitation)
    precipitationLabelEl.textContent = `Chance of rain in the next 24 hours`
  }

  // Update weather details
  windSpeedEl.textContent = `${state.weatherDetails.windSpeed} km/h`
  humidityEl.textContent = `${state.weatherDetails.humidity}%`
  pressureEl.textContent = `${state.weatherDetails.pressure} hPa`
  visibilityEl.textContent = `${state.weatherDetails.visibility} km`
  cloudCoverEl.textContent = `${state.weatherDetails.cloudCover}%`
  
}


// Update temperature UI
function updateTemperatureUI() {
  if (!temperatureValueEl || !temperatureStatusEl || !temperatureProgressEl) return

  // Convert temperature if needed
  let displayTemp = state.temperature
  if (state.settings.temperatureUnit === "fahrenheit") {
    displayTemp = Math.round((state.temperature * 9) / 5 + 32)
  }

  temperatureValueEl.textContent = displayTemp

  // Set status badge
  if (state.temperature < 20) {
    temperatureStatusEl.textContent = "Cool"
    temperatureStatusEl.className = "status-badge"
    temperatureProgressEl.style.backgroundColor = "#3b82f6"
  } else if (state.temperature <= 28) {
    temperatureStatusEl.textContent = "Optimal"
    temperatureStatusEl.className = "status-badge optimal"
    temperatureProgressEl.style.backgroundColor = "#4ecca3"
  } else {
    temperatureStatusEl.textContent = "Hot"
    temperatureStatusEl.className = "status-badge danger"
    temperatureProgressEl.style.backgroundColor = "#ef4444"
  }
  // Show temperature status and alert
if (state.temperature > 40) {
    temperatureStatusEl.textContent = "High";
    temperatureStatusEl.className = "status-badge danger";
    temperatureProgressEl.style.backgroundColor = "#ef4444"; // red
  
    // Show alert
    if (temperatureAlertEl) {
      temperatureAlertEl.innerHTML = `
        <div class="alert danger">
          <i class="fas fa-temperature-high"></i>
          <div>
            <strong>High Temperature Alert</strong>
            <p>Temperature is above the safe threshold for crops.</p>
          </div>
        </div>
      `;
    }
  
  } else if (state.temperature < 15) {
    temperatureStatusEl.textContent = "cold";
    temperatureStatusEl.className = "status-badge warning";
    temperatureProgressEl.style.backgroundColor = "#f59e0b"; // orange
  
    if (temperatureAlertEl) {
      temperatureAlertEl.innerHTML = `
        <div class="alert warning">
          <i class="fas fa-thermometer-quarter"></i>
          <div>
            <strong>Low Temperature Alert</strong>
            <p>Temperature is below the recommended level for healthy growth.</p>
          </div>
        </div>
      `;
    }
  
  } else {
    temperatureStatusEl.textContent = "Optimal";
    temperatureStatusEl.className = "status-badge optimal";
    temperatureProgressEl.style.backgroundColor = "#4ecca3"; // green
  
    if (temperatureAlertEl) temperatureAlertEl.innerHTML = "";
  }
  
}

// Update weather UI
function updateWeatherUI() {
  if (!weatherConditionEl || !weatherIconEl || !precipitationInfoEl) return

  weatherConditionEl.textContent = state.weatherCondition

  // Set weather icon
  if (state.weatherCondition === "Clear" || state.weatherCondition === "Sunny") {
    weatherIconEl.className = "fas fa-sun weather-icon"
    weatherIconEl.style.color = "#f59e0b"
  } else if (state.weatherCondition === "Clouds" || state.weatherCondition === "Cloudy") {
    weatherIconEl.className = "fas fa-cloud weather-icon"
    weatherIconEl.style.color = "#6b7280"
  } else if (state.weatherCondition === "Rain") {
    weatherIconEl.className = "fas fa-cloud-rain weather-icon"
    weatherIconEl.style.color = "#3b82f6"
  }

  // Set precipitation info
  if (state.precipitation > 0) {
    precipitationInfoEl.textContent = `Precipitation: ${state.precipitation}%`
  } else {
    precipitationInfoEl.textContent = "No rain expected for 48h"
  }

  // Update forecast
  for (let i = 0; i < Math.min(3, state.weatherForecast.length); i++) {
    const forecast = state.weatherForecast[i]
    const dayEl = getElement(`forecast-day-${i + 1}`)
    const iconEl = getElement(`forecast-icon-${i + 1}`)
    const tempEl = getElement(`forecast-temp-${i + 1}`)

    if (dayEl) dayEl.textContent = forecast.day

    if (iconEl) {
      if (forecast.condition === "Clear" || forecast.condition === "Sunny") {
        iconEl.className = "fas fa-sun"
        iconEl.style.color = "#f59e0b"
      } else if (forecast.condition === "Clouds" || forecast.condition === "Cloudy") {
        iconEl.className = "fas fa-cloud"
        iconEl.style.color = "#6b7280"
      } else if (forecast.condition === "Rain") {
        iconEl.className = "fas fa-cloud-rain"
        iconEl.style.color = "#3b82f6"
      }
    }

    if (tempEl) {
      let displayTemp = forecast.temp
      if (state.settings.temperatureUnit === "fahrenheit") {
        displayTemp = Math.round((forecast.temp * 9) / 5 + 32)
      }
      tempEl.textContent = `${Math.round(displayTemp)}°${state.settings.temperatureUnit === "celsius" ? "C" : "F"}`
    }
  }
}

// Simplify the updateIrrigationUI function to just show on/off status
function updateIrrigationUI() {
  if (!irrigationValueEl || !irrigationUnitEl || !irrigationScheduleEl || !irrigationStatusEl || !irrigationProgressEl)
    return

  if (state.irrigationStatus === "ON") {
    irrigationValueEl.textContent = "ON"
    irrigationUnitEl.textContent = ""
    irrigationScheduleEl.textContent = "Irrigation system is currently active"
    irrigationStatusEl.textContent = "Active"
    irrigationStatusEl.className = "status-badge optimal"
    irrigationProgressEl.style.width = "100%"
    irrigationProgressEl.style.backgroundColor = "#4ecca3"

    // Update status indicator
    if (irrigationStatusDotEl) irrigationStatusDotEl.classList.add("active")
    if (irrigationStatusTextEl) irrigationStatusTextEl.textContent = "ON"
  } else {
    irrigationValueEl.textContent = "OFF"
    irrigationUnitEl.textContent = ""
    irrigationScheduleEl.textContent = "Irrigation system is currently inactive"
    irrigationStatusEl.textContent = "Inactive"
    irrigationStatusEl.className = "status-badge"
    irrigationProgressEl.style.width = "0%"

    // Update status indicator
    if (irrigationStatusDotEl) irrigationStatusDotEl.classList.remove("active")
    if (irrigationStatusTextEl) irrigationStatusTextEl.textContent = "OFF"
  }
}

// Fetch crop data 
function fetchCropData() {
  // Update the state.crops array to only include wheat
  state.crops = [
    {
      id: 1,
      name: "Wheat",
      variety: "Common Wheat",
      plantedDate: state.cropInfo.sowingDate || new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      growthStage: "Vegetative",
      optimalMoisture: { min: 40, max: 75 },
      irrigationFrequency: "Based on growth stage",
      active: true,
    },
  ]

  // Update the selectedZones to only have one zone
  state.selectedZones = ["zone1"]

  // Update UI
  updateCropUI()

  // Update summary stats
  updateSummaryStats()
}

// Update the updateCropUI function to show irrigation schedule with status
function updateCropUI() {
  if (!cropsContainerEl) return

  let cropsHTML = ""

  if (state.crops.length === 0) {
    cropsHTML = `
      <div class="text-center py-8 text-gray-500">
        No crop data available
      </div>
    `
  } else {
    const crop = state.crops[0] // We only have wheat now
    const currentDAS = getDaysAfterSowing(state.cropInfo.sowingDate)

    cropsHTML += `
      <div class="crop-card" style="animation: fadeInUp 0.3s ease">
        <div class="crop-header">
          <div class="crop-name">${crop.name}</div>
          <div class="crop-status active">
            Active
          </div>
        </div>
        <div class="crop-details">
          <div class="crop-detail">
            <div class="detail-key">Variety:</div>
            <div class="detail-value">${crop.variety}</div>
          </div>
          <div class="crop-detail">
            <div class="detail-key">Planted:</div>
            <div class="detail-value">${new Date(state.cropInfo.sowingDate).toLocaleDateString()}</div>
          </div>
          <div class="crop-detail">
            <div class="detail-key">Days After Sowing:</div>
            <div class="detail-value">${currentDAS} days</div>
          </div>
          <div class="crop-detail">
            <div class="detail-key">Optimal Moisture:</div>
            <div class="detail-value">${crop.optimalMoisture.min}% - ${crop.optimalMoisture.max}%</div>
          </div>
        </div>
        
        <div class="irrigation-schedule-section">
          <h4 class="schedule-title">Irrigation Schedule</h4>
          <div class="schedule-list">
    `

    // Add each irrigation stage with status
    state.cropInfo.irrigationSchedule.forEach((schedule) => {
      const status = getStatus(currentDAS, schedule.das)
      cropsHTML += `
        <div class="schedule-item ${status.class}">
          <div class="schedule-stage">${schedule.stage}</div>
          <div class="schedule-days">DAS ${schedule.das[0]}-${schedule.das[1]}</div>
          <div class="schedule-crop-stage">${schedule.cropStage}</div>
          <div class="schedule-status">${status.status}</div>
        </div>
      `
    })

    cropsHTML += `
          </div>
        </div>
      </div>
    `
  }

  cropsContainerEl.innerHTML = cropsHTML
}

// Update summary stats
function updateSummaryStats() {
  // Count active crops
  const activeCount = state.crops.filter((crop) => crop.active).length
  if (activeCropsEl) activeCropsEl.textContent = activeCount

  // Count irrigations today
  const today = new Date().toLocaleDateString()
  const irrigationsToday = 0
  const irrigationCountEl = getElement("irrigation-count")
  if (irrigationCountEl) irrigationCountEl.textContent = irrigationsToday

  // Calculate water usage (liters)
  const waterUsage = 0
  const waterUsageEl = getElement("water-usage")
  if (waterUsageEl) waterUsageEl.textContent = `${waterUsage.toLocaleString()} L`

  // Calculate daylight hours
  const daylightHoursEl = getElement("daylight-hours")
  if (daylightHoursEl) {
    const hours = Math.floor(Math.random() * 6) + 10 // 10-15 hours
    daylightHoursEl.textContent = `${hours} hours`
  }
}

// Add this check to ensure Chart is available
function ensureChartIsAvailable() {
  if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded. Please include Chart.js in your HTML.")
    return false
  }
  return true
}

// Update the initCharts function to check for Chart availability
function initCharts() {
  if (!ensureChartIsAvailable()) return

  // Moisture chart
  if (moistureChartEl) {
    window.moistureChart = new Chart(moistureChartEl, {
      type: "line",
      data: {
        labels: state.moistureHistory.map((item) => item.time),
        datasets: [
          {
            label: "Soil Moisture (%)",
            data: state.moistureHistory.map((item) => item.value),
            borderColor: "#4ecca3",
            backgroundColor: "rgba(78, 204, 163, 0.1)",
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: "#4ecca3",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            titleColor: "#1f2937",
            bodyColor: "#4b5563",
            borderColor: "#e5e7eb",
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (context) => `Moisture: ${context.raw}%`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 10,
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
        },
      },
    })

    // Initialize with the correct time range data
    updateMoistureChart()
  }

  // Temperature chart
  if (temperatureChartEl) {
    window.temperatureChart = new Chart(temperatureChartEl, {
      type: "line",
      data: {
        labels: state.temperatureHistory.map((item) => item.time),
        datasets: [
          {
            label: "Temperature (°C)",
            data: state.temperatureHistory.map((item) => item.value),
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: "#f59e0b",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            titleColor: "#1f2937",
            bodyColor: "#4b5563",
            borderColor: "#e5e7eb",
            borderWidth: 1,
            padding: 10,
            displayColors: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            min: 10,
            max: 50,
            ticks: {
              stepSize: 5,
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
        },
      },
    })

    // Initialize with the correct time range data
    updateTemperatureChart()
  }
}

// Update analytics data
function updateAnalytics() {
  // Calculate average moisture
  const avgMoisture =
    state.moistureHistory.length > 0
      ? Math.round(state.moistureHistory.reduce((sum, item) => sum + item.value, 0) / state.moistureHistory.length)
      : 0

  // Calculate average temperature
  const avgTemperature =
    state.temperatureHistory.length > 0
      ? Math.round(
          state.temperatureHistory.reduce((sum, item) => sum + item.value, 0) / state.temperatureHistory.length,
        )
      : 0

  // Count irrigation events
  const irrigationEvents = 0

  // Update UI
  if (avgMoistureEl) avgMoistureEl.textContent = `${avgMoisture}%`
  if (avgTemperatureEl) avgTemperatureEl.textContent = `${avgTemperature}°C`
//   if (waterEfficiencyEl) waterEfficiencyEl.textContent = `${waterEfficiency} L/event`
  if (irrigationEventsEl) irrigationEventsEl.textContent = irrigationEvents
}

// Add this call to the refreshTabContent function for the irrigation tab
function refreshTabContent(tabId) {
  switch (tabId) {
    case "overview":
      // Refresh charts
      if (window.moistureChart) updateMoistureChart()
      if (window.temperatureChart) updateTemperatureChart()
      updateSummaryStats()
      break

    case "irrigation":
      fetchIrrigationStatus()
      break

    case "weather":
      updateWeatherUI()
      updateExtendedForecast()
      updateWeatherDetails()
      break

    case "crops":
      // Refresh crop data
      updateCropUI()
      break

    case "analytics":
      // Refresh analytics data
      updateAnalytics()
      break

    case "settings":
      // Refresh settings
      updateSowingDateSettings()
      break
  }
}

// Show toast notification
function showToast({ type, title, message }) {
  if (!toastContainerEl) return

  const toast = document.createElement("div")
  toast.className = `toast ${type}`

  let icon = ""
  switch (type) {
    case "success":
      icon = '<i class="fas fa-check-circle toast-icon"></i>'
      break
    case "error":
      icon = '<i class="fas fa-exclamation-circle toast-icon"></i>'
      break
    case "warning":
      icon = '<i class="fas fa-exclamation-triangle toast-icon"></i>'
      break
    case "info":
      icon = '<i class="fas fa-info-circle toast-icon"></i>'
      break
  }

  toast.innerHTML = `
    ${icon}
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
    <div class="toast-progress"></div>
  `

  // Add to container
  toastContainerEl.appendChild(toast)

  // Add event listener to close button
  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.classList.add("fade-out")
    setTimeout(() => {
      toast.remove()
    }, 300)
  })

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.add("fade-out")
    setTimeout(() => {
      toast.remove()
    }, 300)
  }, 5000)
}

// Show modal
function showModal({ title, content, buttons }) {
  if (!modalTitleEl || !modalBodyEl || !modalFooterEl || !modalOverlayEl) return

  modalTitleEl.textContent = title
  modalBodyEl.innerHTML = content

  // Add buttons
  modalFooterEl.innerHTML = ""
  buttons.forEach((button) => {
    const btn = document.createElement("button")
    btn.className = `btn ${button.class || "btn-outline"}`
    btn.textContent = button.text
    btn.addEventListener("click", () => {
      if (button.action) button.action()
      closeModal()
    })
    modalFooterEl.appendChild(btn)
  })

  // Show modal
  modalOverlayEl.classList.add("active")
}

// Close modal
function closeModal() {
  if (!modalOverlayEl) return
  modalOverlayEl.classList.remove("active")
}

// Load settings from localStorage
function loadSettings() {
  const savedSettings = localStorage.getItem("ezcrop-settings")
  if (savedSettings) {
    state.settings = JSON.parse(savedSettings)

    // Apply theme
    if (state.settings.theme === "dark") {
      if (!state.darkMode) toggleDarkMode()
    } else if (state.settings.theme === "light") {
      if (state.darkMode) toggleDarkMode()
    }
  }
}

// Save settings to localStorage
function saveSettings() {
  localStorage.setItem("ezcrop-settings", JSON.stringify(state.settings))
}

// Add animations to elements
function addAnimations() {
  const animatedElements = document.querySelectorAll(".animate")
  animatedElements.forEach((element, index) => {
    element.style.animationDelay = `${index * 0.1}s`
    element.classList.add("animated")
  })
}



// Initialize all tabs
function initAllTabs() {
  // Trigger the first tab to be active by default
  const firstTabBtn = document.querySelector(".tab-btn")
  if (firstTabBtn) {
    firstTabBtn.click()
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", initDashboard)

// Add a function to update the sowing date settings UI with improved design
function updateSowingDateSettings() {
  const userSettingsForm = document.getElementById("user-settings-form")
  if (!userSettingsForm) return

  // Check if the sowing date input already exists
  let sowingDateSection = userSettingsForm.querySelector(".sowing-date-section")

  if (!sowingDateSection) {
    // Create the sowing date section with improved UI
    sowingDateSection = document.createElement("div")
    sowingDateSection.className = "sowing-date-section card mb-4"
    sowingDateSection.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">Crop Sowing Date</h3>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label for="sowing-date" class="form-label">Wheat Sowing Date</label>
          <input type="date" id="sowing-date" class="form-control" value="${state.cropInfo.sowingDate ? new Date(state.cropInfo.sowingDate).toISOString().split("T")[0] : ""}">
          <small class="form-text text-muted">This date will be used to calculate irrigation schedules.</small>
        </div>
        <div class="mt-3">
          <div class="current-sowing-info">
            <div class="info-item">
              <span class="info-label">Current Sowing Date:</span>
              <span class="info-value">${state.cropInfo.sowingDate ? new Date(state.cropInfo.sowingDate).toLocaleDateString() : "Not set"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Days After Sowing:</span>
              <span class="info-value">${state.cropInfo.daysAfterSowing} days</span>
            </div>
          </div>
        </div>
        <button type="button" id="update-sowing-date" class="btn btn-primary mt-3">Update Sowing Date</button>
      </div>
    `

    // Insert at the beginning of the form
    userSettingsForm.insertBefore(sowingDateSection, userSettingsForm.firstChild)

    // Add event listener to the update button
    const updateSowingDateBtn = sowingDateSection.querySelector("#update-sowing-date")
    updateSowingDateBtn.addEventListener("click", () => {
      const sowingDateInput = sowingDateSection.querySelector("#sowing-date")
      const newSowingDate = new Date(sowingDateInput.value)

      if (isNaN(newSowingDate.getTime())) {
        showToast({
          type: "error",
          title: "Invalid Date",
          message: "Please select a valid date.",
        })
        return
      }

      // Update state
      state.cropInfo.sowingDate = newSowingDate

      // Save to localStorage
      localStorage.setItem("ezcrop-sowing-date", newSowingDate.toISOString())

      // Send to Firebase
      sendSowingDateToFirebase(newSowingDate)

      // Update the planted date in the crop data
      if (state.crops.length > 0) {
        state.crops[0].plantedDate = newSowingDate
      }

      // Recalculate days after sowing
      calculateDaysAfterSowing()

      // Update the info display
      const infoValue = sowingDateSection.querySelectorAll(".info-value")
      infoValue[0].textContent = newSowingDate.toLocaleDateString()
      infoValue[1].textContent = `${state.cropInfo.daysAfterSowing} days`

      // Show toast notification
      showToast({
        type: "success",
        title: "Sowing Date Updated",
        message: `Wheat sowing date has been set to ${newSowingDate.toLocaleDateString()}.`,
      })

      // Update UI that depends on sowing date
      updateCropUI()
    })
  } else {
    // Update the existing section with current values
    const infoValue = sowingDateSection.querySelectorAll(".info-value")
    infoValue[0].textContent = state.cropInfo.sowingDate
      ? new Date(state.cropInfo.sowingDate).toLocaleDateString()
      : "Not set"
    infoValue[1].textContent = `${state.cropInfo.daysAfterSowing} days`

    const sowingDateInput = sowingDateSection.querySelector("#sowing-date")
    sowingDateInput.value = state.cropInfo.sowingDate
      ? new Date(state.cropInfo.sowingDate).toISOString().split("T")[0]
      : ""
  }
}

