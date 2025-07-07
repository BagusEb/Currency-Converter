const API_BASE_URL = 'http://localhost:5000';

// DOM Elements
const converterForm = document.getElementById('converterForm');
const amountInput = document.getElementById('amount');
const fromCurrencySelect = document.getElementById('fromCurrency');
const toCurrencySelect = document.getElementById('toCurrency');
const swapBtn = document.getElementById('swapBtn');
const convertBtn = document.getElementById('convertBtn');
const convertBtnText = document.getElementById('convertBtnText');
const loadingSpinner = document.getElementById('loadingSpinner');

const resultContainer = document.getElementById('resultContainer');
const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');

const originalAmount = document.getElementById('originalAmount');
const originalCurrency = document.getElementById('originalCurrency');
const convertedAmount = document.getElementById('convertedAmount');
const convertedCurrency = document.getElementById('convertedCurrency');
const exchangeRate = document.getElementById('exchangeRate');
const timestamp = document.getElementById('timestamp');

const popularGrid = document.getElementById('popularGrid');
const apiStatus = document.getElementById('apiStatus');

// Global variables
let supportedCurrencies = {};
let isLoading = false;

// Popular currency pairs for quick access
const popularPairs = [
    { from: 'USD', to: 'IDR' },
    { from: 'EUR', to: 'USD' },
    { from: 'GBP', to: 'USD' },
    { from: 'JPY', to: 'USD' },
    { from: 'AUD', to: 'USD' },
    { from: 'SGD', to: 'IDR' }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Currency Converter initialized');
    checkAPIStatus();
    loadSupportedCurrencies();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Form submission
    converterForm.addEventListener('submit', handleConvert);
    
    // Swap currencies
    swapBtn.addEventListener('click', swapCurrencies);
    
    // Input validation
    amountInput.addEventListener('input', validateAmount);
    
    // Auto-convert on currency change (optional)
    fromCurrencySelect.addEventListener('change', () => {
        if (amountInput.value && toCurrencySelect.value) {
            // Auto convert after small delay
            setTimeout(() => {
                if (!isLoading) handleConvert();
            }, 500);
        }
    });
    
    toCurrencySelect.addEventListener('change', () => {
        if (amountInput.value && fromCurrencySelect.value) {
            // Auto convert after small delay
            setTimeout(() => {
                if (!isLoading) handleConvert();
            }, 500);
        }
    });
}

// Check API status
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
            apiStatus.textContent = 'Online';
            apiStatus.className = 'status-indicator online';
        } else {
            throw new Error('API not responding');
        }
    } catch (error) {
        console.error('API Status Check Failed:', error);
        apiStatus.textContent = 'Offline';
        apiStatus.className = 'status-indicator offline';
        showError('Backend API is not available. Please check if the server is running.');
    }
}

// Load supported currencies from backend
async function loadSupportedCurrencies() {
    try {
        const response = await fetch(`${API_BASE_URL}/currencies`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        supportedCurrencies = data.currencies;
        
        populateCurrencySelects();
        loadPopularConversions();
        
        console.log('Loaded currencies:', Object.keys(supportedCurrencies).length);
        
    } catch (error) {
        console.error('Failed to load currencies:', error);
        showError('Failed to load supported currencies. Please refresh the page.');
        
        // Fallback currencies
        supportedCurrencies = {
            'USD': 'US Dollar',
            'EUR': 'Euro',
            'IDR': 'Indonesian Rupiah',
            'JPY': 'Japanese Yen',
            'GBP': 'British Pound'
        };
        populateCurrencySelects();
    }
}

// Populate currency select dropdowns
function populateCurrencySelects() {
    const currencyOptions = Object.entries(supportedCurrencies)
        .map(([code, name]) => `<option value="${code}">${code} - ${name}</option>`)
        .join('');
    
    fromCurrencySelect.innerHTML = '<option value="">Select currency</option>' + currencyOptions;
    toCurrencySelect.innerHTML = '<option value="">Select currency</option>' + currencyOptions;
    
    // Set default values
    fromCurrencySelect.value = 'USD';
    toCurrencySelect.value = 'IDR';
}

// Handle form submission
async function handleConvert(event) {
    if (event) event.preventDefault();
    
    // Validate inputs
    if (!validateInputs()) return;
    
    const amount = parseFloat(amountInput.value);
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    
    // Show loading state
    setLoadingState(true);
    hideError();
    
    try {
        const response = await fetch(`${API_BASE_URL}/convert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount,
                from_currency: fromCurrency,
                to_currency: toCurrency
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Conversion failed');
        }
        
        displayResult(data);
        
    } catch (error) {
        console.error('Conversion failed:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showError('Unable to connect to the server. Please check if the backend is running.');
        } else {
            showError(error.message || 'Failed to convert currency. Please try again.');
        }
    } finally {
        setLoadingState(false);
    }
}

// Validate form inputs
function validateInputs() {
    const amount = amountInput.value;
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        showError('Please enter a valid amount greater than 0');
        amountInput.focus();
        return false;
    }
    
    if (!fromCurrency) {
        showError('Please select a currency to convert from');
        fromCurrencySelect.focus();
        return false;
    }
    
    if (!toCurrency) {
        showError('Please select a currency to convert to');
        toCurrencySelect.focus();
        return false;
    }
    
    if (fromCurrency === toCurrency) {
        showError('Please select different currencies for conversion');
        return false;
    }
    
    return true;
}

// Validate amount input
function validateAmount() {
    const amount = amountInput.value;
    
    if (amount && (isNaN(amount) || parseFloat(amount) < 0)) {
        amountInput.setCustomValidity('Please enter a valid positive number');
    } else {
        amountInput.setCustomValidity('');
    }
}

// Set loading state
function setLoadingState(loading) {
    isLoading = loading;
    
    if (loading) {
        convertBtn.disabled = true;
        convertBtnText.style.display = 'none';
        loadingSpinner.style.display = 'block';
    } else {
        convertBtn.disabled = false;
        convertBtnText.style.display = 'block';
        loadingSpinner.style.display = 'none';
    }
}

// Display conversion result
function displayResult(data) {
    // Hide error and show result
    hideError();
    
    // Update result display
    originalAmount.textContent = formatNumber(data.amount);
    originalCurrency.textContent = data.from_currency;
    convertedAmount.textContent = formatNumber(data.converted_amount);
    convertedCurrency.textContent = data.to_currency;
    exchangeRate.textContent = `1 ${data.from_currency} = ${formatNumber(data.exchange_rate)} ${data.to_currency}`;
    
    // Format timestamp
    const date = new Date(data.timestamp);
    timestamp.textContent = `Updated: ${date.toLocaleTimeString()}`;
    
    // Show result container
    resultContainer.style.display = 'block';
    
    // Smooth scroll to result
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Swap currencies
function swapCurrencies() {
    const fromValue = fromCurrencySelect.value;
    const toValue = toCurrencySelect.value;
    
    fromCurrencySelect.value = toValue;
    toCurrencySelect.value = fromValue;
    
    // Auto-convert if amount is entered
    if (amountInput.value && fromValue && toValue) {
        setTimeout(() => {
            if (!isLoading) handleConvert();
        }, 300);
    }
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    
    // Auto-hide error after 5 seconds
    setTimeout(hideError, 5000);
}

// Hide error message
function hideError() {
    errorContainer.style.display = 'none';
}

// Load popular conversions
async function loadPopularConversions() {
    try {
        const conversions = [];
        
        for (const pair of popularPairs.slice(0, 6)) { // Limit to 6 items
            try {
                const response = await fetch(`${API_BASE_URL}/convert`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: 1,
                        from_currency: pair.from,
                        to_currency: pair.to
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    conversions.push({
                        from: pair.from,
                        to: pair.to,
                        rate: data.converted_amount,
                        exchange_rate: data.exchange_rate
                    });
                }
            } catch (error) {
                console.warn(`Failed to load rate for ${pair.from}/${pair.to}:`, error);
            }
        }
        
        displayPopularConversions(conversions);
        
    } catch (error) {
        console.error('Failed to load popular conversions:', error);
    }
}

// Display popular conversions
function displayPopularConversions(conversions) {
    if (conversions.length === 0) {
        popularGrid.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">Popular rates unavailable</p>';
        return;
    }
    
    const items = conversions.map(conv => `
        <div class="popular-item" onclick="setConversion('${conv.from}', '${conv.to}')">
            <div class="conversion">${conv.from} → ${conv.to}</div>
            <div class="rate">1 ${conv.from} = ${formatNumber(conv.rate)} ${conv.to}</div>
        </div>
    `).join('');
    
    popularGrid.innerHTML = items;
}

// Set conversion from popular items
function setConversion(from, to) {
    fromCurrencySelect.value = from;
    toCurrencySelect.value = to;
    
    if (!amountInput.value) {
        amountInput.value = '1';
    }
    
    amountInput.focus();
    
    // Auto-convert
    setTimeout(() => {
        if (!isLoading) handleConvert();
    }, 200);
}

// Format number for display
function formatNumber(num, decimals = 2) {
    if (typeof num !== 'number') {
        num = parseFloat(num);
    }
    
    if (isNaN(num)) return '0.00';
    
    // For very small numbers, show more decimal places
    if (num < 0.01 && num > 0) {
        return num.toFixed(6);
    }
    
    // For large numbers, use thousand separators
    return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + Enter to convert
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isLoading) handleConvert();
    }
    
    // Ctrl/Cmd + S to swap currencies
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        swapCurrencies();
    }
});

