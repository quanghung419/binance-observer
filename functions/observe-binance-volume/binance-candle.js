const axios = require('axios');
const momentTz = require('moment-timezone');
const moment = require('moment');

/**
 * 
 * @param {*} symbol 
 * @param {*} startTime 
 * @param {*} interval allow value [1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M]
 * @returns 
 */
const binanceFetchKlines = async (symbol, startTime, interval) => {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}`;
    console.log("binanceFetchKlines", url);
    return await axios.get(url);
}

/**
 * 
 * @param {*} pairId 
 * @param {*} maNumber ex: MA20 => maNumber = 20, MA50 => maNumber = 50
 * @param {*} interval ex: 1, 2, 30
 * @param {*} intervalUnit ex: m (minute), h (hour), d (day), w (week), M (month)
 * @returns 
 */
const getCandleStickData = async (pairId, maNumber, interval, intervalUnit) => {
    console.log("getCandleStickData", pairId, maNumber, interval, intervalUnit);
    const startTime = getStartTime(interval, intervalUnit, maNumber);
    console.log("startTime", startTime);
    const result = await binanceFetchKlines(pairId, startTime, `${interval}${intervalUnit}`);
    console.log("result", result);
    const { data } = result;
    data.sort(function (a, b) {
        return b[0] - a[0];
    });
    const candleStickData = [];
    for (const item of data) {
        candleStickData.push({
            openTime: item[0],
            open: item[1],
            high: item[2],
            low: item[3],
            close: item[4],
            volume: item[5],
            closeTime: item[6],
            quoteAssetVolume: item[7],
            numberOfTrade: item[8],
            takerBuyBaseAssetVolume: item[9],
            takerBuyQuoteAssetVolume: item[10],
            ignore: item[11],
            openDateStr: moment(item[0]),
            closeDateStr: moment(item[6])
        });
    }

    return candleStickData;
}

/**
 * Generate start time to collect candle from Binance API
 * @param {*} interval : 30 (m), 1 (h)
 * @param {*} intervalUnit : m, h
 * @param {*} maNumber : ex 20
 * @returns 
 */
const getStartTime = (interval, intervalUnit, maNumber) => {
    const buffer = 6;
    const diff = -1 * (interval * (maNumber + buffer));
    switch (intervalUnit) {
        case "m":
            return momentTz.utc().add(diff, "minutes").valueOf();
        case "h":
            return momentTz.utc().add(diff, "hours").valueOf();
        case "d":
            return momentTz.utc().add(diff, "days").valueOf();
        case "w":
            return momentTz.utc().add(diff, "weeks").valueOf();
        case "M":
            return momentTz.utc().add(diff, "months").valueOf();
        default:
            return momentTz.utc().valueOf();
    }
}

module.exports = {
    getCandleStickData
}