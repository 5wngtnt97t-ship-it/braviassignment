// Bravin Morara API Client
class BravinMoraraAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { ...options, headers });
    return response.json();
  }

  // Auth methods
  async register(name, email, password) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  }

  async login(email, password) {
    const data = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async getProfile() {
    return this.request('/profile');
  }

  // Order methods
  async calculatePrice(serviceType, academicLevel, deadline, wordCount) {
    return this.request('/calculate-price', {
      method: 'POST',
      body: JSON.stringify({ serviceType, academicLevel, deadline, wordCount })
    });
  }

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getOrders() {
    return this.request('/orders');
  }
}

// Initialize API
const api = new BravinMoraraAPI();

// Update order form to use backend
document.addEventListener('DOMContentLoaded', function() {
  const calculateBtn = document.querySelector('button[onclick="calculatePrice()"]');
  if (calculateBtn) {
    calculateBtn.setAttribute('onclick', 'calculatePriceWithBackend()');
  }
});

async function calculatePriceWithBackend() {
  const wordCount = parseInt(document.getElementById('wordCount').value) || 250;
  const level = document.getElementById('academicLevel').value;
  const deadline = document.getElementById('deadline').value;
  const serviceType = document.getElementById('serviceType').value;
  
  try {
    const result = await api.calculatePrice(serviceType, level, deadline, wordCount);
    document.getElementById('finalPrice').textContent = result.price.toFixed(2);
    
    const whatsappLink = document.getElementById('whatsappBtn');
    if (whatsappLink) {
      whatsappLink.href = `https://wa.me/254714030732?text=Hello%20Bravin%20Morara%2C%20I%20would%20like%20to%20place%20an%20order.%20My%20estimated%20price%20is%20%24${result.price}`;
    }
    
    document.getElementById('priceResult').classList.remove('d-none');
  } catch (error) {
    console.error('Price calculation error:', error);
    // Fallback to client-side calculation
    calculatePrice();
  }
}

// Update login form to use backend
async function handleLogin(e) {
  e.preventDefault();
  const email = document.querySelector('#loginForm input[type="email"]').value;
  const password = document.querySelector('#loginForm input[type="password"]').value;
  
  try {
    const result = await api.login(email, password);
    if (result.token) {
      location.reload();
    } else {
      alert(result.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
  }
}