from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from datetime import datetime

app = Flask(__name__)
CORS(app) 


EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/"


SUPPORTED_CURRENCIES = {
    'USD': 'US Dollar',
    'EUR': 'Euro',
    'IDR': 'Indonesian Rupiah',
    'JPY': 'Japanese Yen',
    'GBP': 'British Pound',
    'AUD': 'Australian Dollar',
    'CAD': 'Canadian Dollar',
    'CHF': 'Swiss Franc',
    'CNY': 'Chinese Yuan',
    'SGD': 'Singapore Dollar',
    'MYR': 'Malaysian Ringgit',
    'THB': 'Thai Baht',
    'KRW': 'South Korean Won',
    'INR': 'Indian Rupee',
    'PHP': 'Philippine Peso'
}

@app.route('/', methods=['GET'])
def home():
    """Home endpoint untuk testing"""
    return jsonify({
        'message': 'Currency Converter API',
        'status': 'running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/currencies', methods=['GET'])
def get_currencies():
    """Endpoint untuk mendapatkan daftar mata uang yang didukung"""
    return jsonify({
        'currencies': SUPPORTED_CURRENCIES,
        'total': len(SUPPORTED_CURRENCIES)
    })

@app.route('/convert', methods=['POST'])
def convert_currency():
    """
    Endpoint untuk konversi mata uang
    Expected JSON body:
    {
        "amount": 100,
        "from_currency": "USD",
        "to_currency": "IDR"
    }
    """
    try:
        # Validasi request body
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        amount = data.get('amount')
        from_currency = data.get('from_currency', '').upper()
        to_currency = data.get('to_currency', '').upper()
        
        # Validasi input
        if not amount or not from_currency or not to_currency:
            return jsonify({
                'error': 'Missing required fields: amount, from_currency, to_currency'
            }), 400
        
        try:
            amount = float(amount)
            if amount < 0:
                return jsonify({'error': 'Amount must be positive'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Amount must be a valid number'}), 400
        
        if from_currency not in SUPPORTED_CURRENCIES:
            return jsonify({'error': f'Currency {from_currency} not supported'}), 400
        
        if to_currency not in SUPPORTED_CURRENCIES:
            return jsonify({'error': f'Currency {to_currency} not supported'}), 400
        
 
        if from_currency == to_currency:
            return jsonify({
                'amount': amount,
                'from_currency': from_currency,
                'to_currency': to_currency,
                'converted_amount': amount,
                'exchange_rate': 1.0,
                'timestamp': datetime.now().isoformat()
            })
        

        response = requests.get(f"{EXCHANGE_API_URL}{from_currency}", timeout=10)
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch exchange rates'}), 503
        
        exchange_data = response.json()
        
 
        if to_currency not in exchange_data['rates']:
            return jsonify({'error': f'Exchange rate for {to_currency} not available'}), 400
        
        exchange_rate = exchange_data['rates'][to_currency]
        converted_amount = amount * exchange_rate
        
        return jsonify({
            'amount': amount,
            'from_currency': from_currency,
            'to_currency': to_currency,
            'converted_amount': round(converted_amount, 2),
            'exchange_rate': exchange_rate,
            'timestamp': datetime.now().isoformat(),
            'from_currency_name': SUPPORTED_CURRENCIES[from_currency],
            'to_currency_name': SUPPORTED_CURRENCIES[to_currency]
        })
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'External API service unavailable'}), 503
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/rates/<currency>', methods=['GET'])
def get_rates(currency):

    try:
        currency = currency.upper()
        
        if currency not in SUPPORTED_CURRENCIES:
            return jsonify({'error': f'Currency {currency} not supported'}), 400
        
        response = requests.get(f"{EXCHANGE_API_URL}{currency}", timeout=10)
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch exchange rates'}), 503
        
        exchange_data = response.json()
        
        filtered_rates = {
            curr: rate for curr, rate in exchange_data['rates'].items() 
            if curr in SUPPORTED_CURRENCIES
        }
        
        return jsonify({
            'base_currency': currency,
            'rates': filtered_rates,
            'last_updated': exchange_data.get('date'),
            'timestamp': datetime.now().isoformat()
        })
        
    except requests.exceptions.RequestException:
        return jsonify({'error': 'External API service unavailable'}), 503
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method not allowed'}), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)