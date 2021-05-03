const { binance } = require('../config/exchanges.config');
const _ = require('lodash');
module.exports = class BinaceExchange {
    constructor() {
    }

    async getLatestPrices() {
        const result = await binance.publicGetTickerPrice();
        const map = _.keyBy(result, (item) => { return item.symbol });
        return map;
    }

    async getAllPair() {
        const result = await binance.fetchTickers();
        return Object.keys(result);
    }

    async fetchTickers() {
        try {
            const result = await binance.fetchTickers();
            console.info("fetchTickers", result);
            return result;
        } catch (error) {
            console.log('fetch distribution error', error);
            throw error;
        }
    }

}
