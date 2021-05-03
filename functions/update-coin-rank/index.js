const AwsDynamoService = require('/opt/nodejs/aws-sdk/dynamodb.service');
const { WATCH_LIST_TABLE, COINMAKETCAP_API_KEY } = process.env;
const { responseTemplate } = require("/opt/nodejs/utils/response.template");

const axios = require('axios');
const _ = require('lodash');

// const COINMAKETCAP_API_KEY = "b028e5e5-6444-4e80-82c2-2924eb322769";


exports.handler = async (event) => {
    try {

        const watchList = await getAllWatchListItems();
        console.log("watchList", watchList);
        console.log("COINMAKETCAP_API_KEY", COINMAKETCAP_API_KEY);

        const mapWatchList = _.keyBy(watchList, "coinmarketcapSymbol");

        const coinmarketcapSymbols = _.map(watchList, "coinmarketcapSymbol");
        console.log("coinmarketcapSymbols", coinmarketcapSymbols);

        const requestItems = [], size = 100;

        while (coinmarketcapSymbols.length > 0) {
            requestItems.push(coinmarketcapSymbols.splice(0, size));
        }

        console.log("requestItems", requestItems);

        for (const subArray of requestItems) {
            const data = await fetchCoinInfo(subArray);
            console.log("fetchCoinInfo", data);
            const keys = Object.keys(data);

            for (const key of keys) {
                console.log("key", key, "rank", data[key]["cmc_rank"]);
                mapWatchList[key].rank = data[key]["cmc_rank"];
                // finalMap[key].logo = data[key]["logo"];
                await updateCoinRank(mapWatchList[key]);
            }
            // keys.forEach(function (key) {
                
            // });
        }

        // requestItems.forEach(async (subArray) => {

        // });

        // await clearData();
        // const awsDynamoService = new AwsDynamoService();

        // const filteredArr = coinArr.filter((item) => { return item.coinKey !== '' });
        // console.log("filteredArr", filteredArr);

        // for (let i = 0; i < filteredArr.length; i++) {
        //     const coin = filteredArr[i];
        //     const requestParams = {
        //         TableName: WATCH_LIST_TABLE,
        //         Item: {
        //             coinKey: {
        //                 S: coin.coinKey
        //             },
        //             symbol: {
        //                 S: coin.symbol
        //             },
        //             logoUrl: {
        //                 S: coin.logoUrl
        //             },
        //             thumbnail: {
        //                 S: coin.thumbnail
        //             }
        //         }
        //     };
        //     console.log("coin", coin, "requestParams", requestParams);
        //     const result = await awsDynamoService.addItem(requestParams);
        //     console.log("Add DynamoDB", result);
        // }
        return responseTemplate(200, mapWatchList);
    } catch (error) {
        console.log("An error occur when sync list", error);
        return responseTemplate(500, error);
    }
};

const getAllWatchListItems = async () => {
    const awsDynamoService = new AwsDynamoService();
    const scanParams = {
        ProjectionExpression: "coinKey, coinmarketcapSymbol, exchangeSymbol, logoUrl, thumbnail",
        TableName: WATCH_LIST_TABLE,
    };
    const scanResult = await awsDynamoService.scanItem(scanParams);
    return scanResult.Items;
    // for (let item of scanResult.Items) {
    //     await deleteItem(item, awsDynamoService);
    // }
};

const updateCoinRank = async (item) => {
    const { coinKey, rank } = item;
    const awsDynamoService = new AwsDynamoService();
    const updateParams = {
        // ProjectionExpression: "coinKey, coinmarketcapSymbol, exchangeSymbol, logoUrl, thumbnail",
        TableName: WATCH_LIST_TABLE,
        Key: {
            coinKey: {
                S: coinKey
            }
        },
        ExpressionAttributeNames: {
            "#r": "rank",
        },
        ExpressionAttributeValues: {
            ":r": {
                N: `${rank}`
            }
        },
        UpdateExpression: "SET #r = :r",
        ReturnValues: "ALL_NEW",
    };
    
    const updateResult = await awsDynamoService.updateItem(updateParams);
    console.log("update coin rank result", updateResult);
    return updateResult.Items;
    // for (let item of scanResult.Items) {
    //     await deleteItem(item, awsDynamoService);
    // }
};



// #################################
// const { responseTemplate } = require('/opt/nodejs/utils/response.template');
// const { COINMAKETCAP_API_KEY } = process.env;
// const SqsService = require('/opt/nodejs/aws-sdk/sqs.service');
// const symbols = require('./symbols.json');
// const BinaceExchange = require('/opt/nodejs/service/binance.exchange.service');

// exports.handler = async (event) => {
//     try {

//         await fetchCoinInfoFromCoinmarketcap();

//         return responseTemplate(200, symbols);
//     } catch (error) {
//         return responseTemplate(500, error);
//     }
// };



// const fetchCoinInfoFromCoinmarketcap = async () => {
//     const listCoinIdFetched = [];
//     const listNewCoinUpdate = [];
//     const coinMap = await fetchCoinMap();
//     const finalMap = {};

//     coinMap.forEach(function (entry) {
//         const coinKey = `${entry.symbol} - ${entry.name}`;
//         const isNotExist = listCoinIdFetched.indexOf(coinKey) < 0;
//         if (isNotExist) {
//             listNewCoinUpdate.push(entry.id);
//             finalMap[entry.id] = {
//                 "coinmaketcapId": entry.id,
//                 "symbol": entry.symbol,
//                 "name": entry.name,
//                 "slug": entry.slug,
//                 "key": coinKey
//             };
//         }
//     });

//     const arrays = [], size = 200;

//     while (listNewCoinUpdate.length > 0) {
//         arrays.push(listNewCoinUpdate.splice(0, size));
//     }

//     arrays.forEach(function (subArray) {
//         const data = fetchCoinInfo(subArray);
//         const keys = Object.keys(data);
//         keys.forEach(function (key) {
//             finalMap[key].logo = data[key]["logo"];
//         });
//     });

//     const arr = _.values(finalMap);
//     return arr;
// }

const fetchCoinInfo = async (coinSymbolArr) => {
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?CMC_PRO_API_KEY=${COINMAKETCAP_API_KEY}&symbol=${coinSymbolArr.join()}`;
    const { data } = await axios.get(url);
    return data.data;
}

// fetchCoinInfoFromCoinmarketcap();