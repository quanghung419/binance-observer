const { responseTemplate } = require("/opt/nodejs/utils/response.template");
const { getVolumeMovingStatus } = require('./volume-calculator');
const { addVolumeState } = require('./save-statistic-data');
const { checkVolumeAndAlarmToTelegramChannel } = require('./volume-condition');
const { checkVolumeAndPriceUpCondition } = require('./price-up-condition');
const { checkVolumeAndPriceDownCondition } = require('./price-down-condition');

const BinaceExchange = require('/opt/nodejs/service/binance.exchange.service');
const { getPercentDiff, formatNumber, generateEmojiNumber, getQuoteBaseAsset, convertSymbolToPairId } = require("/opt/nodejs/utils/common");

const getLatestPrices = async (symbol) => {
    const exchangeApi = new BinaceExchange();
    const mapPrices = await exchangeApi.getLatestPrices();
    const { price: latestPrice } = mapPrices[convertSymbolToPairId(symbol)];
    return latestPrice;
}

exports.handler = async (event) => {
    try {
        const body = event.body ? JSON.parse(event.body) : JSON.parse(event.Records[0].body).data;
        const { symbol, coinInfo } = body;
        console.log("symbol", symbol, "coinInfo", coinInfo);

        const ma20 = 20;
        const ma15 = 15;
        const intervalHourUnit = "h";
        const intervalMinuteUnit = "m";
        const interval4h = 4;
        const interval1h = 1;
        const interval30m = 30;

        const chart4hStatus = await getVolumeMovingStatus(symbol, ma20, interval4h, intervalHourUnit);
        const chart1hStatus = await getVolumeMovingStatus(symbol, ma20, interval1h, intervalHourUnit);
        const chart30mStatus = await getVolumeMovingStatus(symbol, ma15, interval30m, intervalMinuteUnit);
        const alarmState = { chart4h: chart4hStatus, chart1h: chart1hStatus, chart30m: chart30mStatus };

        await checkVolumeAndAlarmToTelegramChannel(symbol, alarmState, coinInfo);

        const latestPrice = await getLatestPrices(symbol);
        console.log("latestPriceFromApi", latestPrice);

        await checkVolumeAndPriceUpCondition(symbol, alarmState, coinInfo, latestPrice);
        await checkVolumeAndPriceDownCondition(symbol, alarmState, coinInfo, latestPrice);

        await addVolumeState(symbol, chart1hStatus, chart4hStatus, chart30mStatus);

        return responseTemplate(200, alarmState);
    } catch (error) {
        console.error("An error occur when observe Binance volume", error);
        return responseTemplate(500, error);
    }
};
