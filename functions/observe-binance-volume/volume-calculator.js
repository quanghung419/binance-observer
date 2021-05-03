const { getCandleStickData } = require('./binance-candle');
const { convertSymbolToPairId } = require("/opt/nodejs/utils/common");

const Big = require('big.js');
const _ = require('lodash');

const getVolumeMovingStatus = async (symbol, maNumber, interval, intervalUnit) => {
    const allCandleStickDataInRange = await getCandleStickData(convertSymbolToPairId(symbol), maNumber, interval, intervalUnit);
    console.log(`candleStickData ${interval}${intervalUnit}`, allCandleStickDataInRange);

    const { currentCandle, nLatestClosedCandles, highestPriceInClosedCandle, lowestPriceInClosedCandle } = prepareCandleAndPriceData(allCandleStickDataInRange, maNumber, 0, symbol, interval); // 0 mean current candle
    const { nLatestClosedCandle: _1LatestClosedCandle, nLatestClosedCandles: nLatestClosedCandles_from_1Latest, highestPriceInClosedCandle: _1LatestClosedCandle_highestPriceInClosedCandle, lowestPriceInClosedCandle: _1LatestClosedCandle_lowestPriceInClosedCandle } = prepareCandleAndPriceData(allCandleStickDataInRange, maNumber, 1, symbol, interval); // 1 mean the latest closed candle

    console.log(`${symbol} getVolumeMovingStatus highestPriceInClosedCandle`, highestPriceInClosedCandle);
    console.log("currentCandle", currentCandle);
    console.log("nLatestClosedCandles", nLatestClosedCandles);

    const maDataForCurrent = calculateAverageVolume(nLatestClosedCandles);
    const maDataFor1Latest = calculateAverageVolume(nLatestClosedCandles_from_1Latest);

    return {
        current: {
            isAboveMA: parseFloat(currentCandle.volume) > maDataForCurrent.volumeAverage,
            volume: currentCandle.volume,
            quoteAssetVolume: currentCandle.quoteAssetVolume,
            maVolume: maDataForCurrent.volumeAverage,
            maQuoteAssetVolume: maDataForCurrent.quoteAssetVolumeAverage,
            closeTime: currentCandle.closeTime,
            highestPriceInClosedCandle,
            lowestPriceInClosedCandle,
            latestPrice: currentCandle.close,
        },
        _1LatestClosedCandle: {
            isAboveMA: parseFloat(_1LatestClosedCandle.volume) > maDataFor1Latest.volumeAverage,
            volume: _1LatestClosedCandle.volume,
            quoteAssetVolume: _1LatestClosedCandle.quoteAssetVolume,
            maVolume: maDataFor1Latest.volumeAverage,
            maQuoteAssetVolume: maDataFor1Latest.quoteAssetVolumeAverage,
            closeTime: _1LatestClosedCandle.closeTime,
            highestPriceInClosedCandle: _1LatestClosedCandle_highestPriceInClosedCandle,
            lowestPriceInClosedCandle: _1LatestClosedCandle_lowestPriceInClosedCandle,
            latestPrice: currentCandle.close,
        },
    };
}

const prepareCandleAndPriceData = (allCandleStickDataInRange, maNumber, candleIndexFromCurrentCandle, symbol, interval) => {
    const allCandleStickData = [...allCandleStickDataInRange];
    if (candleIndexFromCurrentCandle === 0) {
        const currentCandle = allCandleStickData.splice(0, 1)[0];
        console.log("currentCandle", currentCandle);

        const nLatestClosedCandles = allCandleStickData.slice(0, maNumber);
        console.log("nLatestClosedCandles", nLatestClosedCandles.length);

        const priceHighArr = _.map(nLatestClosedCandles, (item) => { return parseFloat(item.high) });
        const highestPriceInClosedCandle = Math.max(...priceHighArr);

        const priceLowArr = _.map(nLatestClosedCandles, (item) => { return parseFloat(item.low) });
        const lowestPriceInClosedCandle = Math.min(...priceLowArr);

        console.log(`${symbol} ${interval}h CURRENT highestPriceInClosedCandle`, highestPriceInClosedCandle, `${symbol} priceHighArr`, JSON.stringify(priceHighArr));
        console.log(`${symbol} ${interval}h CURRENT lowestPriceInClosedCandle`, lowestPriceInClosedCandle, `${symbol} priceLowArr`, JSON.stringify(priceLowArr));

        return {
            currentCandle,
            nLatestClosedCandles,
            highestPriceInClosedCandle,
            lowestPriceInClosedCandle,
        };
    } else {
        const nLatestClosedCandle = allCandleStickData[candleIndexFromCurrentCandle]; // The n latest closed candle
        const nLatestClosedCandles = allCandleStickData.slice(0, maNumber); // Include nLatestClosedCandle because it had already closed

        const priceArr = _.map(nLatestClosedCandles, (item) => { return parseFloat(item.high) });
        const highestPriceInClosedCandle = Math.max(...priceArr);
        const lowestPriceInClosedCandle = Math.min(...priceArr);
        console.log(`${symbol} ${interval}h CLOSED highestPriceInClosedCandle`, highestPriceInClosedCandle, `${symbol} priceArr`, JSON.stringify(priceArr));

        return {
            nLatestClosedCandle,
            nLatestClosedCandles,
            highestPriceInClosedCandle,
            lowestPriceInClosedCandle,
        };
    }
}

const calculateAverageVolume = (nLatestClosedCandles) => {
    let sumVolume = new Big(0);
    let sumQuoteAssetVolume = new Big(0);
    const n = nLatestClosedCandles.length;
    for (const candle of nLatestClosedCandles) {
        sumVolume = sumVolume.plus(candle.volume || 0);
        sumQuoteAssetVolume = sumQuoteAssetVolume.plus(candle.quoteAssetVolume || 0);
    }
    console.log(`Total ${n} candle volume`, sumVolume.valueOf());
    const volumeAverage = sumVolume.div(n).valueOf();
    const quoteAssetVolumeAverage = sumQuoteAssetVolume.div(n).valueOf();

    console.log(`Volume MA${n} timeframe 4h`, sumVolume.div(n).valueOf());
    console.log(`quoteAssetVolume MA${n} timeframe 4h`,);

    return {
        volumeAverage: parseFloat(volumeAverage),
        quoteAssetVolumeAverage: parseFloat(quoteAssetVolumeAverage)
    }
}

module.exports = {
    getVolumeMovingStatus
}