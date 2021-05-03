// const coinInfo = require('./coin-info.json');
const AwsDynamoService = require('../aws-sdk/dynamodb.service');
const { WATCH_LIST_TABLE } = process.env;
const _ = require('lodash');

module.exports.getCoinInfo = async (topRank) => {
    console.log("getCoinInfo: topRank=", topRank);
    const coinInfoFromDynamoDB = await getAllCoinInfo();

    console.log("coinInfoFromDynamoDB", coinInfoFromDynamoDB);

    const filtered = coinInfoFromDynamoDB.filter((coin) => {
        return parseInt(coin.rank) <= parseInt(topRank);
    });

    const coinMap = _.keyBy(topRank ? filtered : coinInfoFromDynamoDB, "exchangeSymbol");
    console.log("coinMap", coinMap);
    return {
        coinMap,
        coinList: filtered
    };
}

module.exports.getSymbols = async (topRank) => {
    const coinInfoFromDynamoDB = await getAllCoinInfo();
    console.log("coinInfoFromDynamoDB", coinInfoFromDynamoDB);
    // return coinInfo;
    const filtered = coinInfoFromDynamoDB.filter((coin) => {
        return parseInt(coin.rank) <= parseInt(topRank);
    });
    console.log("filtered", filtered);

    const symbols = _.map(filtered, "exchangeSymbol");
    const pairArr = [];
    for (const symbol of symbols) {
        pairArr.push(`${symbol}/USDT`);
    }
    console.log("pairArr", pairArr);
    return pairArr;
}

const getAllCoinInfo = async () => {
    const awsDynamoService = new AwsDynamoService();
    const scanParams = {
        ProjectionExpression: "coinKey, coinmarketcapSymbol, exchangeSymbol, logoUrl, thumbnail, #r, thumbnailDown, thumbnailUp",
        ExpressionAttributeNames: {
            "#r": "rank",
        },
        TableName: WATCH_LIST_TABLE,
    };
    const scanResult = await awsDynamoService.scanItem(scanParams);
    return scanResult.Items;
    // for (let item of scanResult.Items) {
    //     await deleteItem(item, awsDynamoService);
    // }
};