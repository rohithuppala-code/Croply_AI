const API_BASE_URL = 'http://localhost:8000';

export const api = {
  // Predict disease from image
  async predict(file, language = 'English') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Prediction failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Chat with AI about plant diseases
  async chat(message, language = 'English', history = null) {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language, history }),
    });

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Get plant care tips
  async getCareTips(plantName, language = 'English') {
    const response = await fetch(`${API_BASE_URL}/care-tips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plant_name: plantName, language }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get care tips: ${response.statusText}`);
    }

    return response.json();
  },
};

export default api;
