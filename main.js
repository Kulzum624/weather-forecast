const API_KEY = "ee374649a1f7eb0729fe5acbc5ad402d";
const DEFAULT_CITY = "Islamabad";

// DOM Elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const locationNameEl = document.getElementById("location-name");
const currentTempEl = document.getElementById("current-temp");
const weatherDescEl = document.getElementById("weather-desc");
const tempHighEl = document.getElementById("temp-high");
const tempLowEl = document.getElementById("temp-low");
const currentDateEl = document.getElementById("current-date");
const currentIconEl = document.getElementById("current-icon");

// Gauges Elements
const windArrow = document.getElementById("wind-dot-container");
const windDirText = document.getElementById("wind-dir-text");
const speedNeedle = document.getElementById("speed-needle-container");
const windSpeedText = document.getElementById("wind-speed");

// Forecast
const forecastListEl = document.getElementById("forecast-list");
const hourlyListEl = document.getElementById("hourly-list");
const weekTitleEl = document.getElementById("week-title");
const prevWeekBtn = document.getElementById("prev-week");
const nextWeekBtn = document.getElementById("next-week");

// Background
const bgImageEl = document.getElementById("bg-image");

// Icon Mapping
const iconMap = {
    // day
    "01d": "day-sunny-color-icon.svg",
    "02d": "day-cloudy-color-icon.svg",
    "03d": "day-cloudy-color-icon.svg",
    "04d": "day-cloudy-color-icon.svg",
    "09d": "day-cloud-rain-color-icon.svg",
    "10d": "day-cloud-rain-color-icon.svg",
    "11d": "day-cloud-lightning-color-icon.svg",
    "13d": "day-cloud-snow-color-icon.svg",
    "50d": "day-cloud-fog-color-icon.svg",

    // night
    "01n": "night-cloudy-color-icon.svg", 
    "02n": "night-cloudy-color-icon.svg",
    "03n": "night-cloudy-color-icon.svg",
    "04n": "night-cloudy-color-icon.svg",
    "09n": "night-cloud-rain-color-icon.svg",
    "10n": "night-cloud-rain-color-icon.svg",
    "11n": "night-cloud-lightning-color-icon.svg",
    "13n": "night-cloud-snow-color-icon.svg",
    "50n": "night-cloud-fog-color-icon.svg"
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    initApp();

    searchBtn.addEventListener("click", () => {
        const city = searchInput.value.trim();
        if (city) fetchWeatherData(city);
    });

    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const city = searchInput.value.trim();
            if (city) fetchWeatherData(city);
        }
    });
});

async function initApp() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                console.warn("Geolocation denied or failed:", error.message);
                fetchWeatherData(DEFAULT_CITY);
            }
        );
    } else {
        fetchWeatherData(DEFAULT_CITY);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        const geoRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
        if (!geoRes.ok) throw new Error("Could not find location name");
        
        const geoData = await geoRes.json();
        locationNameEl.textContent = `${geoData.name}, ${geoData.sys.country}`;
        
        await fetchFullWeatherData(lat, lon);
    } catch (error) {
        console.error("Error in fetchWeatherByCoords:", error);
        fetchWeatherData(DEFAULT_CITY);
    }
}

async function fetchWeatherData(city) {
    try {
        // Get Coordinates
        const geoRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`);
        if (!geoRes.ok) {
            if (geoRes.status === 401) alert("API Key Error on Geo Lookup. Please check key.");
            else alert("City not found");
            return;
        }
        const geoData = await geoRes.json();
        const { lat, lon } = geoData.coord;
        locationNameEl.textContent = `${geoData.name}, ${geoData.sys.country}`;

        await fetchFullWeatherData(lat, lon);

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

async function fetchFullWeatherData(lat, lon) {
    try {
        const oneCallRes = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${API_KEY}`);
        
        if (!oneCallRes.ok) {
            console.error("OneCall API Error:", oneCallRes.status);
            if (oneCallRes.status === 401) {
                alert("API Key not activated for One Call 3.0.");
            }
            return;
        }

        const data = await oneCallRes.json();
        
        const processedData = {
            current: {
                temp: data.current.temp,
                high: data.daily[0].temp.max,
                low: data.daily[0].temp.min,
                dt: data.current.dt,
                weather: data.current.weather,
                wind_speed: data.current.wind_speed,
                wind_deg: data.current.wind_deg,
                pop: data.daily[0].pop, 
                uvi: data.current.uvi,
                humidity: data.current.humidity,
                pressure: data.current.pressure,
                visibility: data.current.visibility,
                clouds: data.current.clouds,
                dew_point: data.current.dew_point,
                sunrise: data.current.sunrise,
                sunset: data.current.sunset,
                timezone_offset: data.timezone_offset,
                timezone: data.timezone // city name
            },
            hourlyRaw: data.hourly.slice(0, 24),
            daily: processDailyOneCall(data.daily)
        };

        updateUI(processedData);
    } catch (error) {
        console.error("Error in fetchFullWeatherData:", error);
    }
}

function processDailyOneCall(dailyList) {
    return dailyList.slice(0, 8).map(d => ({
        dt: d.dt,
        temp: { 
            min: d.temp.min, 
            max: d.temp.max 
        },
        weather: d.weather,
        pop: d.pop,
        dateStr: new Date(d.dt * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    }));
}

function updateUI(data) {
    const current = data.current;
    window.lastFetchedCurrent = current;
    
    // Main Weather Info
    currentTempEl.textContent = Math.round(current.temp) + "°";
    weatherDescEl.textContent = current.weather[0].description;

    // high/low values
    tempHighEl.textContent = Math.round(current.high);
    tempLowEl.textContent = Math.round(current.low);
    
    // Date
    const date = new Date(current.dt * 1000);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = date.toLocaleDateString('en-US', options);

    // Icon
    const iconCode = current.weather[0].icon;
    const iconFile = iconMap[iconCode] || "day-sunny-color-icon.svg";
    currentIconEl.src = `assets/weatherIcons/${iconFile}`;
    currentIconEl.style.display = "block";

    // Gauges

    // Wind Direction (Compass)
    const windDeg = current.wind_deg;

    switch(true){
        case (windDeg >= 0 && windDeg <= 20 || windDeg >= 340 && windDeg <= 359):
            windArrow.style.transform = `rotate(${windDeg-1}deg)`;
            break;
        case (windDeg >= 21 && windDeg <= 40):
            windArrow.style.transform = `rotate(${windDeg+5}deg) translateY(-1px)`;
            break;
        case(windDeg >= 320 && windDeg <= 339):
            windArrow.style.transform = `rotate(${windDeg-5}deg) translateY(-2.5px)`;
            break;
        case (windDeg >= 41 && windDeg <= 60):
            windArrow.style.transform = `rotate(${windDeg+10}deg) translateY(-7px)`;
            break;
        case(windDeg >= 300 && windDeg <= 319):
            windArrow.style.transform = `rotate(${windDeg-8}deg) translateY(-6px)`;
            break;
        case (windDeg >= 61 && windDeg <= 80):
            windArrow.style.transform = `rotate(${windDeg+7}deg) translateY(-9px)`;
            break;
        case(windDeg >= 280 && windDeg <= 299):
            windArrow.style.transform = `rotate(${windDeg-10}deg) translateY(-9px)`;
            break;
        case (windDeg >= 81 && windDeg <= 100):
            windArrow.style.transform = `rotate(${windDeg+8}deg) translateY(-13px)`;
            break;
        case(windDeg >= 260 && windDeg <= 279):
            windArrow.style.transform = `rotate(${windDeg-11}deg) translateY(-13px)`;
            break;
        case (windDeg >= 101 && windDeg <= 120):
            windArrow.style.transform = `rotate(${windDeg+7}deg) translateY(-16px)`;
            break;
        case(windDeg >= 240 && windDeg <= 259):
            windArrow.style.transform = `rotate(${windDeg-7}deg) translateY(-16px)`;
            break;
        case (windDeg >= 121 && windDeg <= 140):
            windArrow.style.transform = `rotate(${windDeg+7}deg) translateY(-19px)`;
            break;
        case(windDeg >= 220 && windDeg <= 239):
            windArrow.style.transform = `rotate(${windDeg-6}deg) translateY(-19px)`;
            break;
        case (windDeg >= 141 && windDeg <= 160 ):
            windArrow.style.transform = `rotate(${windDeg+5}deg) translateY(-21px)`;
            break;
        case(windDeg >= 200 && windDeg <= 219):
            windArrow.style.transform = `rotate(${windDeg-4}deg) translateY(-21px)`;
            break;
        case (windDeg >= 161 && windDeg <= 180):
            windArrow.style.transform = `rotate(${windDeg+2}deg) translateY(-22px)`;
            break;
        case(windDeg >= 181 && windDeg <= 199):
            windArrow.style.transform = `rotate(${windDeg-3}deg) translateY(-22px)`;
            break;
        default:
            windArrow.style.transform = `rotate(${windDeg+10}deg)`;
            break;
    }

    windDirText.textContent = windDeg;

    // Wind Speed
    const speed = current.wind_speed;
    windSpeedText.textContent = speed;
    
    const minAngle = -120;
    const maxAngle = 120;
    const maxSpeed = 30;
    
    // Clamp speed to maxSpeed
    const clampedSpeed = Math.min(speed, maxSpeed);
    const speedFraction = clampedSpeed / maxSpeed;
    const speedRot = minAngle + (speedFraction * (maxAngle - minAngle));
    
    // Select the new needle class
    const needleEl = document.querySelector('.gauge-needle');
    if (needleEl) {
        const needleOffset = -59;
        
        needleEl.style.transform = `translate(-17.8%, -58.7%) rotate(${speedRot + needleOffset}deg)`;
    }

    // Update Mask for Gradient
    const mask = document.getElementById('gauge-mask');
    if (mask) {
        const startAngleDeg = 230; 
        const totalRangeDeg = 400; 
        const currentFillDeg = speedFraction * totalRangeDeg;
        
        const gradientValue = `conic-gradient(from ${startAngleDeg}deg at 50% 60%, white 0deg, white ${currentFillDeg}deg, transparent ${currentFillDeg}deg)`;
        
        mask.style.mask = gradientValue;
        mask.style.webkitMask = gradientValue;
    }

    // Rain Chance
    const pop = Math.round(current.pop * 100);

    // UV Index
    const uvi = current.uvi || 0;
    const uvDesc = getUVDescription(uvi);

    // Weather Details Panel Updates (Desktop)
    document.getElementById('detail-humidity').textContent = `${current.humidity}%`;
    document.getElementById('detail-pressure').textContent = `${current.pressure} hPa`;
    document.getElementById('detail-rain').textContent = `${pop}%`;
    document.getElementById('detail-uv').textContent = `${Math.round(uvi)} (${uvDesc})`;
    
    document.getElementById('detail-visibility').textContent = `${(current.visibility / 1000).toFixed(1)} km`;
    document.getElementById('detail-clouds').textContent = `${current.clouds}%`;
    document.getElementById('detail-dew').textContent = `${Math.round(current.dew_point)}°`;
    document.getElementById('detail-precipitation').textContent = `${current.pop}%`;

    // Weather Details Panel Updates (Mobile)
    const humidity600 = document.getElementById('detail-humidity-600');
    if (humidity600) humidity600.textContent = `${current.humidity}%`;

    const pressure600 = document.getElementById('detail-pressure-600');
    if (pressure600) pressure600.textContent = `${current.pressure} hPa`;

    const rain600 = document.getElementById('detail-rain-600');
    if (rain600) rain600.textContent = `${pop}%`;

    const uv600 = document.getElementById('detail-uv-600');
    if (uv600) uv600.textContent = `${Math.round(uvi)} (${uvDesc})`;

    const visibility600 = document.getElementById('detail-visibility-600');
    if (visibility600) visibility600.textContent = `${(current.visibility / 1000).toFixed(1)} km`;

    const clouds600 = document.getElementById('detail-clouds-600');
    if (clouds600) clouds600.textContent = `${current.clouds}%`;
    
    const dew600 = document.getElementById('detail-dew-600');
    if (dew600) dew600.textContent = `${Math.round(current.dew_point)}°`;

    const precip600 = document.getElementById('detail-precipitation-600');
    if (precip600) precip600.textContent = `${current.pop}%`;

    // Background Logic (Weather Card)
    const condition = current.weather[0].main.toLowerCase();
    const dt = current.dt;
    const sunrise = current.sunrise;
    const sunset = current.sunset;
    
    // Time threshold in seconds ,45 mins
    const threshold = 45 * 60; 

     // default fallback
    let timeState = 'day';

    // Determine Time State (Sunrise or Evening or Night or Day)
    if (Math.abs(dt - sunrise) <= threshold) {
        timeState = 'sunrise';
    } else if (Math.abs(dt - sunset) <= threshold) {
        timeState = 'evening';
    } else {
        const isNight = iconCode.includes('n');
        timeState = isNight ? 'night' : 'day';
    }

    // Weather Condition category
    let weatherState = 'clear';
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('storm') || condition.includes('thunder')) {
        weatherState = 'raining';
    } else if (condition.includes('cloud') || condition.includes('overcast') || condition.includes('mist') || condition.includes('fog') || condition.includes('haze') || condition.includes('smoke')) {
        weatherState = 'cloudy';
    }

    let cardBg = "day.png";

    if (timeState === 'sunrise') {
        cardBg = "sunrise.png";
    } else {
        if (weatherState === 'clear') {
            cardBg = `${timeState}.png`;
        } else {
            cardBg = `${timeState}-${weatherState}.png`;
        }
    }

    const weatherCard = document.querySelector('.current-weather-card');
    weatherCard.style.backgroundImage = `url('assets/day/${cardBg}')`;

    // Forecast
    renderHourly(data.hourlyRaw);
    renderForecast(data.daily);
}

// Toggle Sidebar Logic
const navToggleBtn = document.getElementById('nav-toggle');
const sidebarNav = document.getElementById('sidebar-nav');
const weatherDetailsPanel = document.getElementById('weather-details-panel');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

let isNavOpen = false; // Default state for desktop toggle (Nav vs Details)

// Mobile Menu Open
if (mobileMenuBtn && sidebar && sidebarOverlay) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
        
        // Ensure Nav is visible on mobile open, not details
        if (window.innerWidth <= 1000) {
           sidebarNav.style.display = 'block';
           // Update the toggle button icon to 'X' (Close)
           navToggleBtn.innerHTML = `
                <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;
        }
    });
}

// Close on Overlay Click
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });
}

if (navToggleBtn && sidebarNav && weatherDetailsPanel) {
    navToggleBtn.addEventListener('click', () => {
        
        // Mobile Specific Logic: Toggle Button acts as Close Button
        if (window.innerWidth <= 1000) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
            return; 
        }

        // Desktop Specific Logic: Toggle between Nav and Details
        isNavOpen = !isNavOpen;
        
        if (isNavOpen) {
            // Show Nav, Hide Details
            sidebarNav.style.display = 'block';
            weatherDetailsPanel.style.display = 'none';
            // Set Icon to cross
            navToggleBtn.innerHTML = `
                <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;
            navToggleBtn.setAttribute('aria-label', 'Close Navigation');
        } else {
            // Hide Nav, Show Details
            sidebarNav.style.display = 'none';
            weatherDetailsPanel.style.display = 'flex';
            // Set Icon to hamburger
            navToggleBtn.innerHTML = `
                <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            `;
            navToggleBtn.setAttribute('aria-label', 'Open Navigation');
        }
    });
}

function renderHourly(hourlyData) {
    hourlyListEl.innerHTML = "";
    hourlyData.forEach((item, index) => {
        const date = new Date(item.dt * 1000);
        const time = index === 0 ? "Now" : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const iconCode = item.weather[0].icon;
        const iconFile = iconMap[iconCode] || "day-sunny-color-icon.svg";

        const div = document.createElement("div");
        div.className = `hourly-item ${index === 0 ? 'active' : ''}`;
        div.innerHTML = `
            <span class="hourly-time">${time}</span>
            <div class="hourly-icon"><img src="assets/weatherIcons/${iconFile}"></div>
            <span class="hourly-temp">${Math.round(item.temp)}°</span>
        `;
        hourlyListEl.appendChild(div);
    });
}

function renderForecast(dailyData) {
    forecastListEl.innerHTML = "";
    
    dailyData.forEach((day, index) => {
        if (index === 0) return; // Skip today

        const date = new Date(day.dt * 1000);
        let dayName = index === 1 ? "Tomorrow" : date.toLocaleDateString('en-US', { weekday: 'long' });
        const iconCode = day.weather[0].icon;
        const iconFile = iconMap[iconCode] || "day-sunny-color-icon.svg";

        const item = document.createElement("div");
        item.className = "forecast-item";
        item.innerHTML = `
            <div class="forecast-1300">
                <div class="forecast-day-info">
                    <span class="forecast-day">${dayName}</span>
                    <span class="forecast-date">${day.dateStr}</span>
                </div>
                <div class="forecast-temp-main">
                    ${Math.round(day.temp.min)}° - ${Math.round(day.temp.max)}°
                </div>
            </div>
            <div class="forecast-icon">
                <img src="assets/weatherIcons/${iconFile}" alt="${day.weather[0].main}">
            </div>
        `;
        forecastListEl.appendChild(item);
    });
}

// function getCardinalDirection(deg) {
//     const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
//     return directions[Math.round(deg / 45) % 8];
// }

function getUVDescription(uvi) {
    if (uvi <= 2) return "Low";
    if (uvi <= 5) return "Moderate";
    if (uvi <= 7) return "High";
    if (uvi <= 10) return "Very High";
    return "Extreme";
}
// Saved Locations Logic
const saveLocationBtn = document.getElementById("save-location-btn");
const savedLocationsView = document.getElementById("saved-locations-view");
const savedGrid = document.getElementById("saved-grid");
const emptySavedState = document.getElementById("empty-saved-state");
const dashboardView = document.querySelector(".weather-dashboard");

let savedLocations = JSON.parse(localStorage.getItem("savedLocations")) || [];

// Check if current city is saved
function isLocationSaved(cityName) {
    return savedLocations.some(loc => loc.name.toLowerCase() === cityName.toLowerCase());
}

function updateHeartIcon(cityName) {
    if (isLocationSaved(cityName)) {
        saveLocationBtn.classList.add("active");
    } else {
        saveLocationBtn.classList.remove("active");
    }
}

// Toggle Save
saveLocationBtn.addEventListener("click", () => {
    const cityName = locationNameEl.textContent.split(',')[0].trim();
    
    if (isLocationSaved(cityName)) {
        // Remove
        savedLocations = savedLocations.filter(loc => loc.name.toLowerCase() !== cityName.toLowerCase());
        localStorage.setItem("savedLocations", JSON.stringify(savedLocations));
        updateHeartIcon(cityName);
    } else {
        // Save
        if (savedLocations.length >= 100) {
            alert("You can only save up to 100 locations.");
            return;
        }

        // Creating a simplified object for the card
        const currentTemp = parseInt(currentTempEl.textContent);
        const condition = weatherDescEl.textContent;
        const bgImage = document.querySelector('.current-weather-card').style.backgroundImage;
        // Clean bg url
        const cleanBg = bgImage.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
        
        const newLoc = {
            id: Date.now(),
            name: cityName,
            temp: currentTemp,
            condition: condition,
            bg: cleanBg,
            timezone_offset: window.lastFetchedCurrent?.timezone_offset || 0,
            timezone: window.lastFetchedCurrent?.timezone || "", 
            date: new Date().toLocaleDateString(),
            icon: window.lastFetchedCurrent?.weather[0]?.icon || "01d"
        };

        savedLocations.push(newLoc);
        localStorage.setItem("savedLocations", JSON.stringify(savedLocations));
        updateHeartIcon(cityName);
    }
});

// Navigation Logic
const navItems = document.querySelectorAll('.nav-item');
const weatherDetailsMobile = document.querySelector('.weather-details-panel-600');
const rightPanel = document.querySelector('.right-panel');
const divider = document.querySelector('.divider');
const heartBtn = document.getElementById('save-location-btn');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Active state
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        const navText = item.querySelector('.nav-text').textContent.trim();

        if (navText === 'Dashboard') {
            dashboardView.classList.remove('hidden');
            savedLocationsView.classList.add('hidden');
            
            // Show extra content
            if(weatherDetailsMobile) weatherDetailsMobile.classList.remove('hidden');
            if(rightPanel) rightPanel.classList.remove('hidden');
            if(divider) divider.classList.remove('hidden');
            if(heartBtn) heartBtn.classList.remove('hidden');

            // Ensure search bar and heart are visible/enabled if needed
        } else if (navText === 'Saved Location') {
            dashboardView.classList.add('hidden');
            savedLocationsView.classList.remove('hidden');
            
            // Hide extra content
            if(weatherDetailsMobile) weatherDetailsMobile.classList.add('hidden');
            if(rightPanel) rightPanel.classList.add('hidden');
            if(divider) divider.classList.add('hidden');
            if(heartBtn) heartBtn.classList.add('hidden');
            
            renderSavedLocations();
        }
    });
});

function renderSavedLocations() {
    savedGrid.innerHTML = "";
    
    if (savedLocations.length === 0) {
        emptySavedState.classList.remove('hidden');
        return;
    } else {
        emptySavedState.classList.add('hidden');
    }

    savedLocations.forEach(loc => {
        const card = document.createElement("div");
        card.className = "saved-card";
        
        const localTime = getLocalTime(loc.timezone_offset, loc.timezone);
        
        let iconCode = loc.icon;
        if (!iconCode) {
            // Fallback for old saved locations without icon code
            const cond = (loc.condition || "").toLowerCase();
            if (cond.includes("clear")) iconCode = "01d";
            else if (cond.includes("few clouds")) iconCode = "02d";
            else if (cond.includes("clouds")) iconCode = "03d";
            else if (cond.includes("shower") || cond.includes("drizzle")) iconCode = "09d";
            else if (cond.includes("rain")) iconCode = "10d";
            else if (cond.includes("thunder")) iconCode = "11d";
            else if (cond.includes("snow")) iconCode = "13d";
            else if (cond.includes("mist") || cond.includes("fog") || cond.includes("haze")) iconCode = "50d";
            else iconCode = "01d";
        }

        const iconFile = iconMap[iconCode] || "day-sunny-color-icon.svg";

        card.innerHTML = `
            <img src="${loc.bg}" class="saved-card-bg" alt="Weather Background">
            <div class="saved-card-overlay"></div>
            <div class="saved-card-content">
                <div class="saved-card-header">
                    <div class="saved-info">
                        <h3>${loc.name}</h3>
                        <div class="saved-condition-row">
                             <img src="assets/weatherIcons/${iconFile}" class="saved-weather-icon" alt="Icon">
                             <p>${loc.condition}</p>
                        </div>
                        <span class="saved-time">${localTime}</span>
                    </div>
                    <button class="delete-saved-btn" onclick="event.stopPropagation(); removeSavedLocation(${loc.id})">
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="saved-temp">${loc.temp}°</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            fetchWeatherData(loc.name);
            // Switch to dashboard
            navItems[0].click();
        });

        savedGrid.appendChild(card);
    });
}

window.removeSavedLocation = function(id) {
    savedLocations = savedLocations.filter(loc => loc.id !== id);
    localStorage.setItem("savedLocations", JSON.stringify(savedLocations));
    renderSavedLocations();
    
    // Update heart if we just removed the currently viewed city
    const currentCity = locationNameEl.textContent.split(',')[0].trim();
    updateHeartIcon(currentCity);
};

function updateUVHeart(city) {
    // Helper to run on updateUI
    updateHeartIcon(city);
}

const observer = new MutationObserver(() => {
    const city = locationNameEl.textContent.split(',')[0].trim();
    if (city && city !== "Loading...") {
        updateUVHeart(city);
    }
});

observer.observe(locationNameEl, { childList: true, characterData: true, subtree: true });

// Initial check
setTimeout(() => {
    const city = locationNameEl.textContent.split(',')[0].trim();
    if (city) updateUVHeart(city);
}, 1000);

function getLocalTime(offset, timezone) {
    if (offset === undefined || offset === null || isNaN(offset)) {
        return ""; 
    }
    
    try {
        if (timezone) {
            return new Date().toLocaleTimeString('en-US', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
    } catch (e) {
        console.warn("Invalid timezone string, falling back to offset calculation:", timezone);
    }

    // offset is shift in seconds from UTC
    const localDate = new Date(Date.now() + (offset * 1000));
    
    const hours = localDate.getUTCHours();
    const minutes = localDate.getUTCMinutes();
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    const minStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours12}:${minStr} ${ampm}`;
}

// Update saved location times
setInterval(() => {
    if (savedLocationsView && !savedLocationsView.classList.contains('hidden')) {
        renderSavedLocations();
    }
}, 60000);