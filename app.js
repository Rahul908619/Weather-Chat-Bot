// DOM elements
const voiceButton = document.getElementById('voiceButton');
const cityInput = document.getElementById('cityInput');
const searchButton = document.getElementById('searchButton');

// Initialize search functionality on page load
document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners
  setupEventListeners();
  
  // Auto-focus the search input
  cityInput.focus();
});

function setupEventListeners() {
  // Voice recognition
  voiceButton.addEventListener('click', startVoiceRecognition);
  
  // Search on Enter key
  cityInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      getWeather();
    }
  });
  
  // Clear input on focus
  cityInput.addEventListener('focus', () => {
    if (cityInput.value === 'City not found' || cityInput.value === 'Error') {
      cityInput.value = '';
    }
  });
}

function startVoiceRecognition() {
  // Check browser support
  if (!('webkitSpeechRecognition' in window)) {
    alert('Voice recognition is not supported in your browser. Try Chrome or Edge.');
    return;
  }
  
  // Visual feedback for voice activation
  voiceButton.innerHTML = '<i class="fas fa-microphone-alt" style="color: var(--accent-color);"></i>';
  voiceButton.classList.add('active');
  
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  // Start listening
  recognition.start();
  
  // Process the voice input
  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    cityInput.value = transcript;
    
    // Reset button appearance
    resetVoiceButton();
    
    // Automatically search after voice input
    getWeather();
  };
  
  // Handle errors
  recognition.onerror = function(event) {
    console.error("Voice Recognition Error: " + event.error);
    
    if (event.error === 'no-speech') {
      cityInput.placeholder = 'No speech detected. Try again.';
    } else {
      cityInput.placeholder = 'Error: ' + event.error;
    }
    
    // Reset button appearance
    resetVoiceButton();
  };
  
  // Reset when recognition ends
  recognition.onend = function() {
    resetVoiceButton();
  };
}

function resetVoiceButton() {
  voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
  voiceButton.classList.remove('active');
}
