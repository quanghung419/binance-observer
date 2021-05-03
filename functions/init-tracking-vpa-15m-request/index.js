const { responseTemplate } = require('/opt/nodejs/utils/response.template');
const { SQS_VPA_CHART15M_TRACKING_REQUEST_QUEUE_URL } = process.env;
const SqsService = require('/opt/nodejs/aws-sdk/sqs.service');
// const symbols = require('./symbols.json');
const BinaceExchange = require('/opt/nodejs/service/binance.exchange.service');
const { getCoinInfo } = require("/opt/nodejs/utils/get-coin-info");
const { getQuoteBaseAsset } = require("/opt/nodejs/utils/common");
const _ = require('lodash');

const getSymbols = (coinList) => {
    const symbols = _.map(coinList, "exchangeSymbol");
    const pairArr = [];
    for (const symbol of symbols) {
        pairArr.push(`${symbol}/USDT`);
    }
    // console.log("pairArr", pairArr);
    return pairArr;
}

exports.handler = async (event) => {
    try {
        const TOP = 50;
        const {coinMap, coinList} = await getCoinInfo(TOP);
        const symbols = await getSymbols(coinList);

        // console.log(`symbol top ${TOP}`, symbols, coinMap);

        const allValidSymbol = await getAllValidSymbol(symbols);
        // console.log("allValidSymbol", allValidSymbol);

        for (const symbol of allValidSymbol) {
            const { baseAsset } = getQuoteBaseAsset(symbol);

            const request = {
                symbol,
                coinInfo: coinMap[baseAsset]
            }
            const sendResult = await sendOrderToSqs(request, SQS_VPA_CHART15M_TRACKING_REQUEST_QUEUE_URL);
            // console.log("sendResult", sendResult);
        }

        return responseTemplate(200, symbols);
    } catch (error) {
        return responseTemplate(500, error);
    }
};

const sendOrderToSqs = async (request, sqsQueueUrl) => {
    const sqsService = new SqsService();
    // console.log("sendOrderToSqs - request", request);
    return await sqsService.sendMessage(sqsQueueUrl, {
        data: request
    });
}

const getAllValidSymbol = async (symbols) => {
    const symbolArr = [...new Set(symbols)];
    // console.log('symbolArr', symbolArr);
    const exchangeApi = new BinaceExchange();
    const allPairArr = await exchangeApi.getAllPair();
    // console.log("allPairArr", JSON.stringify(allPairArr));
    const validBaseAssetArr = [];

    for (const symbol of symbolArr) {
        if (allPairArr.includes(symbol)) {
            validBaseAssetArr.push(symbol);
        }
    }
    return validBaseAssetArr;
}