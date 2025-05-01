const weatherApiKey = "fce707b2e42e0ad4bc610b2405603df3";

async function getWeather() {
  const city = document.getElementById('cityInput').value;
  if (!city) {
    showError("Please enter a city name");
    return;
  }

  const weatherResult = document.getElementById('weatherResult');
  const forecastResult = document.getElementById('forecastResult');
  const aiSummary = document.getElementById('aiSummary');

  setLoadingState(weatherResult, forecastResult, aiSummary);

  try {
    // Get basic weather data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${weatherApiKey}&units=metric`;

    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      throw new Error('City not found');
    }
    
    const weatherData = await weatherResponse.json();
    
    // Get forecast data
    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();
    
    // Get additional data (air quality, UV index)
    const lat = weatherData.coord.lat;
    const lon = weatherData.coord.lon;
    
    // Get air quality data
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${weatherApiKey}`;
    const airQualityResponse = await fetch(airQualityUrl);
    const airQualityData = await airQualityResponse.json();
    
    // Get one call data for UV Index and other details
    const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely&appid=${weatherApiKey}&units=metric`;
    let uvIndex = 0;
    let dailyForecast = [];
    
    try {
      const oneCallResponse = await fetch(oneCallUrl);
      if (oneCallResponse.ok) {
        const oneCallData = await oneCallResponse.json();
        uvIndex = oneCallData.current?.uvi || 0;
        dailyForecast = oneCallData.daily || [];
      }
    } catch (error) {
      console.warn("Could not fetch UV Index data:", error);
    }
    
    // Display all data
    displayCurrentWeather(weatherData, airQualityData, uvIndex);
    displayForecast(forecastData, dailyForecast);
    
    // Determine season for the location
    const season = getSeason(weatherData.coord.lat, new Date());
    
    // Generate AI summary with enhanced data
    generateAISummary(weatherData, airQualityData, uvIndex, season);

  } catch (error) {
    showError(error.message === 'City not found' ? 
      "City not found. Please check the spelling and try again." : 
      "Error fetching weather data. Please try again later.");
  }
}

function displayCurrentWeather(data, airQualityData, uvIndex) {
  const weatherResult = document.getElementById('weatherResult');
  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
  
  // Get air quality index (1-5) and level
  let aqiLevel = "Not available";
  let aqiValue = 0;
  
  if (airQualityData && airQualityData.list && airQualityData.list.length > 0) {
    aqiValue = airQualityData.list[0].main.aqi;
    aqiLevel = getAirQualityText(aqiValue);
  }
  
  // Get UV index level text
  const uvLevel = getUVIndexText(uvIndex);
  
  // Calculate additional info
  const sunriseTime = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const sunsetTime = new Date(data.sys.sunset * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const visibility = Math.round(data.visibility / 1000); // Convert to km
  
  weatherResult.innerHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <div class="weather-main-info">
      <img src="${iconUrl}" alt="${data.weather[0].description}" class="weather-icon">
      <div class="temperature">${temp}°C</div>
      <div class="weather-description">${data.weather[0].description}</div>
    </div>
    
    <div class="weather-details">
      <div class="detail-card">
        <div class="detail-title">Feels Like</div>
        <div class="detail-value">${feelsLike}°C</div>
      </div>
      <div class="detail-card">
        <div class="detail-title">Humidity</div>
        <div class="detail-value">${data.main.humidity}%</div>
      </div>
      <div class="detail-card">
        <div class="detail-title">Wind</div>
        <div class="detail-value">${Math.round(data.wind.speed * 3.6)} km/h</div>
      </div>
      <div class="detail-card">
        <div class="detail-title">Pressure</div>
        <div class="detail-value">${data.main.pressure} hPa</div>
      </div>
    </div>
    
    <div class="advanced-weather-details">
      <div class="detail-row">
        <div class="advanced-detail">
          <div class="detail-icon"><i class="fas fa-sun"></i></div>
          <div class="detail-info">
            <div class="detail-label">UV Index</div>
            <div class="detail-data">${uvIndex} (${uvLevel})</div>
          </div>
        </div>
        <div class="advanced-detail">
          <div class="detail-icon"><i class="fas fa-wind"></i></div>
          <div class="detail-info">
            <div class="detail-label">Air Quality</div>
            <div class="detail-data">${aqiLevel}</div>
          </div>
        </div>
      </div>
      <div class="detail-row">
        <div class="advanced-detail">
          <div class="detail-icon"><i class="fas fa-eye"></i></div>
          <div class="detail-info">
            <div class="detail-label">Visibility</div>
            <div class="detail-data">${visibility} km</div>
          </div>
        </div>
        <div class="advanced-detail">
          <div class="detail-icon"><i class="fas fa-cloud"></i></div>
          <div class="detail-info">
            <div class="detail-label">Cloudiness</div>
            <div class="detail-data">${data.clouds.all}%</div>
          </div>
        </div>
      </div>
      <div class="detail-row">
        <div class="advanced-detail">
          <div class="detail-icon"><i class="fas fa-sun"></i></div>
          <div class="detail-info">
            <div class="detail-label">Sunrise</div>
            <div class="detail-data">${sunriseTime}</div>
          </div>
        </div>
        <div class="advanced-detail">
          <div class="detail-icon"><i class="fas fa-moon"></i></div>
          <div class="detail-info">
            <div class="detail-label">Sunset</div>
            <div class="detail-data">${sunsetTime}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function displayForecast(data, dailyForecast) {
  const forecastResult = document.getElementById('forecastResult');
  forecastResult.innerHTML = '';
  
  // Get one forecast per day (every 8th item = 24 hours)
  const dailyForecasts = [];
  const processedDates = new Set();
  
  // Also store all forecasts by date for details view
  const forecastsByDate = {};
  
  for (const forecast of data.list) {
    const date = new Date(forecast.dt * 1000);
    const dateKey = date.toLocaleDateString('en-US');
    
    // Store all forecasts by date (for detailed view)
    if (!forecastsByDate[dateKey]) {
      forecastsByDate[dateKey] = [];
    }
    forecastsByDate[dateKey].push(forecast);
    
    // Only add if we don't already have this date for main forecasts
    if (!processedDates.has(dateKey)) {
      processedDates.add(dateKey);
      dailyForecasts.push(forecast);
      
      // Stop after 5 days
      if (dailyForecasts.length >= 5) break;
    }
  }
  
  // Create forecast container with title
  forecastResult.innerHTML = `
    <div class="forecast-container">
      <h2>5-Day Forecast</h2>
      <div class="forecast-grid" id="forecastGrid"></div>
    </div>
  `;
  
  const forecastGrid = document.getElementById('forecastGrid');
  
  // Create forecast cards
  dailyForecasts.forEach((day, index) => {
    const date = new Date(day.dt * 1000);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const fullDayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateKey = date.toLocaleDateString('en-US');
    const temp = Math.round(day.main.temp);
    
    // Get a better icon URL with higher resolution
    const weatherCode = day.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${weatherCode}@4x.png`;
    
    // Get extra data from One Call API if available
    let minTemp = null;
    let maxTemp = null;
    let precipProbability = null;
    
    if (dailyForecast && dailyForecast.length > index) {
      minTemp = Math.round(dailyForecast[index].temp.min);
      maxTemp = Math.round(dailyForecast[index].temp.max);
      precipProbability = Math.round(dailyForecast[index].pop * 100);
    }
    
    // Format day and month in the style shown in the design
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = date.getDate();
    
    // Create a forecast card that's clickable
    const forecastCard = document.createElement('div');
    forecastCard.className = 'forecast-card';
    forecastCard.setAttribute('data-date', dateKey);
    
    // Build HTML for the card
    let cardHTML = `
      <div class="forecast-day">${dayName}</div>
      <div class="forecast-date">${monthName} ${dayNum}</div>
      <img src="${iconUrl}" alt="${day.weather[0].description}">
      <div class="forecast-temp">${temp}°</div>
      <div class="forecast-desc">${day.weather[0].description}</div>
    `;
    
    // Add min/max temp if available
    if (minTemp !== null && maxTemp !== null) {
      cardHTML += `
        <div class="forecast-minmax">
          <span class="forecast-min">${minTemp}°</span>
          <span class="forecast-separator">/</span>
          <span class="forecast-max">${maxTemp}°</span>
        </div>
      `;
    }
    
    // Add details button
    cardHTML += `<div class="view-details-btn">View Details</div>`;
    
    forecastCard.innerHTML = cardHTML;
    
    // Add click event to open modal
    forecastCard.addEventListener('click', function() {
      openForecastModal(dateKey, forecastsByDate[dateKey], date, day.weather[0].icon);
    });
    
    forecastGrid.appendChild(forecastCard);
  });
  
  // Store the forecast data globally for use in detail views
  window.forecastsByDate = forecastsByDate;
  
  // Create the modal container if it doesn't exist yet
  if (!document.getElementById('forecastModal')) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'forecastModal';
    modalContainer.className = 'forecast-modal';
    modalContainer.innerHTML = `
      <div class="forecast-modal-content">
        <div class="forecast-modal-header">
          <h2 id="modalDate">Weather Details</h2>
          <button class="modal-close-btn" onclick="closeForecastModal()">×</button>
        </div>
        <div class="forecast-modal-body" id="modalBody">
          <div class="modal-loading">
            <div class="loading-spinner"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalContainer);
  }
}

// Function to open the forecast modal
function openForecastModal(dateKey, forecasts, date, iconCode) {
  const modal = document.getElementById('forecastModal');
  const modalDate = document.getElementById('modalDate');
  const modalBody = document.getElementById('modalBody');
  
  // Format the date for display
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Set the modal header date
  modalDate.innerHTML = `
    <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="Weather icon" class="modal-icon">
    <span>${formattedDate}</span>
  `;
  
  // Generate modal content
  let hourlyHTML = '';
  
  // Show summary stats first
  const maxTemp = Math.max(...forecasts.map(f => f.main.temp));
  const minTemp = Math.min(...forecasts.map(f => f.main.temp));
  const avgHumidity = Math.round(forecasts.reduce((sum, f) => sum + f.main.humidity, 0) / forecasts.length);
  const maxWindSpeed = Math.max(...forecasts.map(f => f.wind.speed)) * 3.6; // Convert to km/h
  
  hourlyHTML += `
    <div class="modal-summary">
      <div class="modal-summary-card">
        <i class="fas fa-temperature-high"></i>
        <div class="summary-value">${Math.round(maxTemp)}°C</div>
        <div class="summary-label">Max Temp</div>
      </div>
      <div class="modal-summary-card">
        <i class="fas fa-temperature-low"></i>
        <div class="summary-value">${Math.round(minTemp)}°C</div>
        <div class="summary-label">Min Temp</div>
      </div>
      <div class="modal-summary-card">
        <i class="fas fa-water"></i>
        <div class="summary-value">${avgHumidity}%</div>
        <div class="summary-label">Avg Humidity</div>
      </div>
      <div class="modal-summary-card">
        <i class="fas fa-wind"></i>
        <div class="summary-value">${Math.round(maxWindSpeed)} km/h</div>
        <div class="summary-label">Max Wind</div>
      </div>
    </div>
    
    <h3 class="modal-section-title">Hourly Forecast</h3>
    
    <div class="modal-hourly-container">
  `;
  
  // Group forecasts by time of day for better organization
  const morningForecasts = [];
  const afternoonForecasts = [];
  const eveningForecasts = [];
  const nightForecasts = [];
  
  forecasts.forEach(forecast => {
    const forecastHour = new Date(forecast.dt * 1000).getHours();
    
    if (forecastHour >= 5 && forecastHour < 12) {
      morningForecasts.push(forecast);
    } else if (forecastHour >= 12 && forecastHour < 17) {
      afternoonForecasts.push(forecast);
    } else if (forecastHour >= 17 && forecastHour < 21) {
      eveningForecasts.push(forecast);
    } else {
      nightForecasts.push(forecast);
    }
  });
  
  // Add time of day sections if there are forecasts
  if (morningForecasts.length > 0) {
    hourlyHTML += `
      <div class="time-section">
        <div class="time-section-header">
          <i class="fas fa-sun"></i>
          <h4>Morning</h4>
        </div>
        <div class="time-section-forecasts">
          ${generateHourlyItems(morningForecasts)}
        </div>
      </div>
    `;
  }
  
  if (afternoonForecasts.length > 0) {
    hourlyHTML += `
      <div class="time-section">
        <div class="time-section-header">
          <i class="fas fa-sun"></i>
          <h4>Afternoon</h4>
        </div>
        <div class="time-section-forecasts">
          ${generateHourlyItems(afternoonForecasts)}
        </div>
      </div>
    `;
  }
  
  if (eveningForecasts.length > 0) {
    hourlyHTML += `
      <div class="time-section">
        <div class="time-section-header">
          <i class="fas fa-cloud-sun"></i>
          <h4>Evening</h4>
        </div>
        <div class="time-section-forecasts">
          ${generateHourlyItems(eveningForecasts)}
        </div>
      </div>
    `;
  }
  
  if (nightForecasts.length > 0) {
    hourlyHTML += `
      <div class="time-section">
        <div class="time-section-header">
          <i class="fas fa-moon"></i>
          <h4>Night</h4>
        </div>
        <div class="time-section-forecasts">
          ${generateHourlyItems(nightForecasts)}
        </div>
      </div>
    `;
  }
  
  hourlyHTML += `</div>`; // Close modal-hourly-container
  
  // Add a section for weather tips based on conditions
  const primaryCondition = forecasts[0].weather[0].main.toLowerCase();
  const avgTemp = (maxTemp + minTemp) / 2;
  
  hourlyHTML += `
    <div class="modal-tips">
      <h3 class="modal-section-title">Weather Tips</h3>
      <div class="tips-container">
        ${getWeatherTips(primaryCondition, avgTemp)}
      </div>
    </div>
  `;
  
  modalBody.innerHTML = hourlyHTML;
  
  // Show the modal
  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

// Helper function to generate hourly items HTML
function generateHourlyItems(forecasts) {
  let html = '';
  
  forecasts.forEach(forecast => {
    const time = new Date(forecast.dt * 1000).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
    const temp = Math.round(forecast.main.temp);
    const feelsLike = Math.round(forecast.main.feels_like);
    const icon = forecast.weather[0].icon;
    const description = forecast.weather[0].description;
    const humidity = forecast.main.humidity;
    const windSpeed = Math.round(forecast.wind.speed * 3.6); // Convert to km/h
    const pop = forecast.pop ? Math.round(forecast.pop * 100) : 0;
    
    html += `
      <div class="modal-hourly-item">
        <div class="hourly-time">${time}</div>
        <div class="hourly-icon">
          <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}">
        </div>
        <div class="hourly-temp">${temp}°C</div>
        <div class="hourly-description">${description}</div>
        <div class="hourly-details-grid">
          <div class="hourly-detail-item" title="Feels Like">
            <i class="fas fa-thermometer-half"></i> ${feelsLike}°C
          </div>
          <div class="hourly-detail-item" title="Precipitation Chance">
            <i class="fas fa-tint"></i> ${pop}%
          </div>
          <div class="hourly-detail-item" title="Wind Speed">
            <i class="fas fa-wind"></i> ${windSpeed} km/h
          </div>
          <div class="hourly-detail-item" title="Humidity">
            <i class="fas fa-water"></i> ${humidity}%
          </div>
        </div>
      </div>
    `;
  });
  
  return html || '<p class="no-data">No forecast data available for this time period</p>';
}

// Generate weather tips based on conditions
function getWeatherTips(condition, temperature) {
  let tips = [];
  
  // Temperature-based tips
  if (temperature < 0) {
    tips.push('<div class="tip-item"><i class="fas fa-snowflake"></i> Protect yourself from freezing temperatures by wearing multiple layers.</div>');
    tips.push('<div class="tip-item"><i class="fas fa-car"></i> Watch for icy roads and reduced visibility while driving.</div>');
  } else if (temperature < 10) {
    tips.push('<div class="tip-item"><i class="fas fa-mitten"></i> Wear a warm jacket, gloves, and hat to stay comfortable.</div>');
  } else if (temperature > 30) {
    tips.push('<div class="tip-item"><i class="fas fa-tint"></i> Stay hydrated and seek shade during peak sunlight hours.</div>');
    tips.push('<div class="tip-item"><i class="fas fa-sun"></i> Apply sunscreen regularly if spending time outdoors.</div>');
  }
  
  // Condition-based tips
  if (condition.includes('rain') || condition.includes('drizzle')) {
    tips.push('<div class="tip-item"><i class="fas fa-umbrella"></i> Carry an umbrella and wear waterproof footwear.</div>');
    tips.push('<div class="tip-item"><i class="fas fa-car"></i> Drive carefully on wet roads as they may be slippery.</div>');
  } else if (condition.includes('snow')) {
    tips.push('<div class="tip-item"><i class="fas fa-boot"></i> Wear waterproof boots with good traction for snow.</div>');
    tips.push('<div class="tip-item"><i class="fas fa-home"></i> Keep emergency supplies if traveling in snowy conditions.</div>');
  } else if (condition.includes('thunderstorm')) {
    tips.push('<div class="tip-item"><i class="fas fa-bolt"></i> Stay indoors during thunderstorms and avoid open spaces.</div>');
    tips.push('<div class="tip-item"><i class="fas fa-plug"></i> Unplug sensitive electronic equipment during storms.</div>');
  } else if (condition.includes('clear')) {
    tips.push('<div class="tip-item"><i class="fas fa-hiking"></i> Great day for outdoor activities!</div>');
    if (temperature > 20) {
      tips.push('<div class="tip-item"><i class="fas fa-tshirt"></i> Light, breathable clothing is recommended.</div>');
    }
  } else if (condition.includes('cloud')) {
    tips.push('<div class="tip-item"><i class="fas fa-cloud"></i> Consider bringing a light jacket as temperatures may feel cooler.</div>');
  } else if (condition.includes('fog') || condition.includes('mist')) {
    tips.push('<div class="tip-item"><i class="fas fa-low-vision"></i> Drive with caution due to reduced visibility.</div>');
  }
  
  // If no specific tips, add general ones
  if (tips.length === 0) {
    tips.push('<div class="tip-item"><i class="fas fa-check-circle"></i> Check the forecast regularly as weather conditions may change.</div>');
    tips.push('<div class="tip-item"><i class="fas fa-cloud-sun-rain"></i> Be prepared for varying conditions throughout the day.</div>');
  }
  
  // Take up to 4 tips
  return tips.slice(0, 4).join('');
}

// Function to close the forecast modal
function closeForecastModal() {
  const modal = document.getElementById('forecastModal');
  modal.classList.remove('active');
  document.body.classList.remove('modal-open');
}

// Make these functions available globally
window.openForecastModal = openForecastModal;
window.closeForecastModal = closeForecastModal;

function setLoadingState(weatherEl, forecastEl, aiEl) {
  weatherEl.innerHTML = `
    <h2>Loading...</h2>
    <div class="loading-spinner"></div>
  `;
  
  forecastEl.innerHTML = `
    <div class="loading-spinner"></div>
  `;
  
  aiEl.innerHTML = `
    <h2>AI Weather Report</h2>
    <p>Generating your personalized report...</p>
    <div class="loading-spinner"></div>
  `;
}

function showError(message) {
  const weatherResult = document.getElementById('weatherResult');
  const forecastResult = document.getElementById('forecastResult');
  const aiSummary = document.getElementById('aiSummary');
  
  weatherResult.innerHTML = `
    <h2>Error</h2>
    <p>${message}</p>
    <i class="fas fa-exclamation-circle" style="font-size: 48px; margin: 20px; color: var(--accent-color);"></i>
  `;
  
  forecastResult.innerHTML = `<p>Please try searching for a valid city</p>`;
  aiSummary.innerHTML = `<h2>AI Weather Report</h2><p>Enter a valid location to get an AI-powered weather summary</p>`;
}

// Helper functions for additional data

function getAirQualityText(aqi) {
  switch(aqi) {
    case 1: return "Good";
    case 2: return "Fair";
    case 3: return "Moderate";
    case 4: return "Poor";
    case 5: return "Very Poor";
    default: return "Unknown";
  }
}

function getUVIndexText(uvi) {
  if (uvi <= 2) return "Low";
  if (uvi <= 5) return "Moderate";
  if (uvi <= 7) return "High";
  if (uvi <= 10) return "Very High";
  return "Extreme";
}

function getSeason(latitude, date) {
  // Get month and day
  const month = date.getMonth(); // 0-11
  const day = date.getDate();
  
  // Southern hemisphere has opposite seasons
  const isNorthernHemisphere = latitude >= 0;
  
  if (isNorthernHemisphere) {
    // Northern hemisphere seasons
    if (month < 2 || (month === 11 && day >= 21) || (month === 2 && day <= 20)) {
      return "Winter";
    } else if (month < 5 || (month === 2 && day >= 21) || (month === 5 && day <= 20)) {
      return "Spring";
    } else if (month < 8 || (month === 5 && day >= 21) || (month === 8 && day <= 22)) {
      return "Summer";
    } else {
      return "Fall";
    }
  } else {
    // Southern hemisphere seasons (opposite)
    if (month < 2 || (month === 11 && day >= 21) || (month === 2 && day <= 20)) {
      return "Summer";
    } else if (month < 5 || (month === 2 && day >= 21) || (month === 5 && day <= 20)) {
      return "Fall";
    } else if (month < 8 || (month === 5 && day >= 21) || (month === 8 && day <= 22)) {
      return "Winter";
    } else {
      return "Spring";
    }
  }
}
