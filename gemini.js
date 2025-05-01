const geminiApiKey = "AIzaSyDloD5tLNu0GzdsScP_dXDoEODpe6fU1dU";

async function generateAISummary(weatherData, airQualityData = null, uvIndex = 0, season = "Unknown") {
  const aiSummary = document.getElementById('aiSummary');

  // Get local time in the city
  const localTime = new Date();
  const timeOfDay = getTimeOfDay(localTime.getHours());
  
  // Get weather condition category
  const condition = weatherData.weather[0].main.toLowerCase();
  const temperature = weatherData.main.temp;
  
  // Extract air quality information
  let airQuality = "Not available";
  if (airQualityData && airQualityData.list && airQualityData.list.length > 0) {
    const aqiValue = airQualityData.list[0].main.aqi;
    airQuality = getAirQualityText(aqiValue);
  }

  // Create a comprehensive prompt with all data
  const prompt = `
    Create a detailed and personalized weather report for:
    
    Location: ${weatherData.name}, ${weatherData.sys.country}
    Current weather: ${temperature}°C, ${weatherData.weather[0].description}
    Feels like: ${weatherData.main.feels_like}°C
    Humidity: ${weatherData.main.humidity}%
    Wind: ${weatherData.wind.speed} m/s
    Air Quality: ${airQuality}
    UV Index: ${uvIndex}
    Time of day: ${timeOfDay}
    Current season: ${season}
    
    Include in your response:
    1. A greeting appropriate for the time of day
    2. A brief description of current weather conditions
    3. Seasonal-specific clothing recommendations
    4. Activity suggestions based on the conditions
    5. Health recommendations (UV protection, hydration, etc.)
    6. Outlook for the next few hours
    
    Keep your response friendly and conversational, under 4 sentences.
  `;

  try {
    // First try using the Google AI API
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const botReply = data.candidates[0].content.parts[0].text;
        displayAiSummary(botReply, condition, timeOfDay, season);
        return; // Successfully generated summary
      } else {
        console.warn('Unexpected API response format:', data);
        throw new Error('Invalid response format');
      }
    } catch (apiError) {
      console.warn('Gemini API error, using fallback method:', apiError);
      throw apiError; // Rethrow to handle in the fallback
    }

  } catch (error) {
    console.error('AI Error:', error);
    
    // Fallback to a manually generated weather summary
    const fallbackSummary = generateFallbackSummary(weatherData, timeOfDay, season, airQuality, uvIndex);
    displayAiSummary(fallbackSummary, condition, timeOfDay, season);
  }
}

function generateFallbackSummary(data, timeOfDay, season, airQuality, uvIndex) {
  const temp = Math.round(data.main.temp);
  const condition = data.weather[0].description;
  const windSpeed = data.wind.speed;
  let summary = '';
  
  // Time-of-day greeting
  let greeting = "";
  if (timeOfDay === 'morning') {
    greeting = "Good morning! ";
  } else if (timeOfDay === 'daytime') {
    greeting = "Good day! ";
  } else if (timeOfDay === 'evening') {
    greeting = "Good evening! ";
  } else {
    greeting = "Hello! ";
  }
  
  // Weather condition description
  let weatherDesc = `${greeting}It's currently ${temp}°C with ${condition} in ${data.name}.`;
  
  // Generate clothing advice
  let clothingAdvice = "";
  if (temp < 0) {
    clothingAdvice = `For this ${season.toLowerCase()} day, wear warm layers, heavy coat, gloves, and a hat.`;
  } else if (temp < 10) {
    clothingAdvice = `This ${season.toLowerCase()} day calls for a warm jacket, gloves and scarf.`;
  } else if (temp < 18) {
    clothingAdvice = `For this ${season.toLowerCase()} weather, a light jacket or sweater should be comfortable.`;
  } else if (temp < 25) {
    clothingAdvice = `Enjoy this ${season.toLowerCase()} day with light clothing, perhaps a light layer for evening.`;
  } else {
    clothingAdvice = `For this hot ${season.toLowerCase()} weather, wear light, breathable clothing.`;
  }
  
  // Activity recommendations based on weather
  let activityAdvice = "";
  if (condition.includes('rain') || condition.includes('shower') || condition.includes('drizzle')) {
    activityAdvice = "Indoor activities are recommended; bring an umbrella if you must go out.";
  } else if (condition.includes('snow')) {
    activityAdvice = "Drive carefully on snowy roads; consider indoor activities.";
  } else if (condition.includes('thunderstorm')) {
    activityAdvice = "Stay indoors and away from windows during this thunderstorm.";
  } else if (condition.includes('clear') && temp > 20) {
    activityAdvice = "Perfect weather for outdoor activities like hiking, picnics or beach time.";
  } else if (condition.includes('clear') && temp <= 20) {
    activityAdvice = "Great conditions for outdoor walks, running or cycling.";
  } else if (condition.includes('cloud')) {
    activityAdvice = "Good weather for outdoor activities, but keep an eye on the clouds.";
  } else {
    activityAdvice = "Consider both indoor and outdoor activities based on your comfort level.";
  }
  
  // Health advisories based on UV and air quality
  let healthAdvice = "";
  if (uvIndex > 5) {
    healthAdvice = "Apply sunscreen and wear a hat due to high UV levels.";
  }
  
  if (airQuality === "Poor" || airQuality === "Very Poor") {
    healthAdvice += " Consider limiting outdoor activities due to poor air quality.";
  }
  
  if (temp > 30) {
    healthAdvice += " Stay hydrated and seek shade in this heat.";
  }
  
  // Put it all together
  summary = `${weatherDesc} ${clothingAdvice} ${activityAdvice}`;
  
  if (healthAdvice) {
    summary += ` ${healthAdvice.trim()}`;
  }
  
  return summary;
}

function displayAiSummary(text, condition, timeOfDay, season = "") {
  const aiSummary = document.getElementById('aiSummary');
  
  // Select appropriate icon based on weather condition and time
  let icon = '🤖';
  
  if (condition.includes('clear') && timeOfDay === 'daytime') {
    icon = '☀️';
  } else if (condition.includes('clear') && timeOfDay !== 'daytime') {
    icon = '🌙';
  } else if (condition.includes('cloud')) {
    icon = '☁️';
  } else if (condition.includes('rain')) {
    icon = '🌧️';
  } else if (condition.includes('snow') || condition.includes('ice')) {
    icon = '❄️';
  } else if (condition.includes('thunderstorm')) {
    icon = '⛈️';
  } else if (condition.includes('mist') || condition.includes('fog')) {
    icon = '🌫️';
  }
  
  // Add seasonal icon
  let seasonIcon = '';
  switch(season.toLowerCase()) {
    case 'spring':
      seasonIcon = '🌱';
      break;
    case 'summer':
      seasonIcon = '🌞';
      break;
    case 'fall':
    case 'autumn':
      seasonIcon = '🍂';
      break;
    case 'winter':
      seasonIcon = '❄️';
      break;
  }
  
  // Create summary with seasonal tag
  aiSummary.innerHTML = `
    <h2><span class="ai-icon">${icon}</span> AI Weather Report</h2>
    ${season ? `<div class="season-tag"><span class="season-icon">${seasonIcon}</span> ${season} Season</div>` : ''}
    <p>${text}</p>
    <div class="ai-suggestions">
      <h3>Weather-Based Suggestions</h3>
      <div class="suggestion-grid">
        ${getSuggestions(condition, parseFloat(text.match(/\d+°C/) || '0'), season, timeOfDay)}
      </div>
    </div>
  `;
}

function getSuggestions(condition, temperature, season, timeOfDay) {
  // Activity suggestions based on weather conditions, season and time
  const suggestions = [];
  
  // Outdoor activities
  if (condition.includes('clear') || (condition.includes('cloud') && !condition.includes('heavy'))) {
    if (temperature > 15 && temperature < 30) {
      suggestions.push(`<div class="suggestion"><i class="fas fa-hiking"></i> Outdoor hiking</div>`);
      suggestions.push(`<div class="suggestion"><i class="fas fa-bicycle"></i> Cycling</div>`);
    }
    
    if (temperature > 23) {
      suggestions.push(`<div class="suggestion"><i class="fas fa-swimmer"></i> Swimming</div>`);
      suggestions.push(`<div class="suggestion"><i class="fas fa-umbrella-beach"></i> Beach visit</div>`);
    }
    
    if (temperature < 25 && temperature > 5) {
      suggestions.push(`<div class="suggestion"><i class="fas fa-running"></i> Jogging</div>`);
    }
  }
  
  // Seasonal activities
  if (season.toLowerCase() === 'winter') {
    suggestions.push(`<div class="suggestion"><i class="fas fa-mug-hot"></i> Hot drinks</div>`);
    if (condition.includes('snow')) {
      suggestions.push(`<div class="suggestion"><i class="fas fa-skiing"></i> Skiing</div>`);
    }
  } else if (season.toLowerCase() === 'summer') {
    suggestions.push(`<div class="suggestion"><i class="fas fa-ice-cream"></i> Ice cream</div>`);
    suggestions.push(`<div class="suggestion"><i class="fas fa-cocktail"></i> Cold drinks</div>`);
  } else if (season.toLowerCase() === 'spring') {
    suggestions.push(`<div class="suggestion"><i class="fas fa-seedling"></i> Gardening</div>`);
  } else if (season.toLowerCase() === 'fall' || season.toLowerCase() === 'autumn') {
    suggestions.push(`<div class="suggestion"><i class="fas fa-leaf"></i> Leaf peeping</div>`);
  }
  
  // Indoor activities for bad weather
  if (condition.includes('rain') || condition.includes('storm') || condition.includes('snow') || temperature > 35 || temperature < -5) {
    suggestions.push(`<div class="suggestion"><i class="fas fa-film"></i> Movie time</div>`);
    suggestions.push(`<div class="suggestion"><i class="fas fa-book"></i> Reading</div>`);
    suggestions.push(`<div class="suggestion"><i class="fas fa-coffee"></i> Café visit</div>`);
  }
  
  // Night activities
  if (timeOfDay === 'night') {
    suggestions.push(`<div class="suggestion"><i class="fas fa-moon"></i> Stargazing</div>`);
    if (condition.includes('clear')) {
      suggestions.push(`<div class="suggestion"><i class="fas fa-campground"></i> Camping</div>`);
    }
  }
  
  // Return a subset of suggestions (max 6)
  return suggestions.slice(0, 6).join('');
}

function getTimeOfDay(hour) {
  if (hour >= 5 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 17) {
    return 'daytime';
  } else if (hour >= 17 && hour < 20) {
    return 'evening';
  } else {
    return 'night';
  }
}

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
