const { responseTemplate } = require("/opt/nodejs/utils/response.template");
const { getVolumeMovingStatus } = require('./volume-calculator');
// const { addVolumeState } = require('./save-statistic-data');
// const { checkVolumeAndAlarmToTelegramChannel } = require('./volume-condition');
const { checkVolumeAndPriceUpCondition } = require('./price-up-condition');
const { checkVolumeAndPriceDownCondition } = require('./price-down-condition');

const BinaceExchange = require('/opt/nodejs/service/binance.exchange.service');
const { convertSymbolToPairId } = require("/opt/nodejs/utils/common");

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

        const ma15 = 15;
        const intervalMinuteUnit = "m";
        const interval15m = 15;

        const chart15mStatus = await getVolumeMovingStatus(symbol, ma15, interval15m, intervalMinuteUnit);
        const alarmState = { chart15m: chart15mStatus };

        // await checkVolumeAndAlarmToTelegramChannel(symbol, alarmState, coinInfo);

        const latestPrice = await getLatestPrices(symbol);
        console.log("latestPriceFromApi", latestPrice);

        await checkVolumeAndPriceDownCondition(symbol, alarmState, coinInfo, latestPrice);
        await checkVolumeAndPriceUpCondition(symbol, alarmState, coinInfo, latestPrice);

        return responseTemplate(200, alarmState);
    } catch (error) {
        console.error("An error occur when observe Binance volume", error);
        return responseTemplate(500, error);
    }
};
