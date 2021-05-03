const ccxt = require('ccxt');

const {
    BINANCE_EXCHANGE_API_KEY,
    BINANCE_EXCHANGE_SECRET_KEY
} = process.env;

const binance = new ccxt.binance({
    apiKey: BINANCE_EXCHANGE_API_KEY,
    secret: BINANCE_EXCHANGE_SECRET_KEY,
    enableRateLimit: true,
    timeout: 30000,
});

module.exports = {
    binance,
};