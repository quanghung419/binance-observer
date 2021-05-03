const AwsDynamoService = require('/opt/nodejs/aws-sdk/dynamodb.service');
const { WATCH_LIST_TABLE } = process.env;
const { responseTemplate } = require("/opt/nodejs/utils/response.template");

exports.handler = async (event) => {
    try {
        const coinArr = JSON.parse(event.body);
        console.log("coinArr", coinArr);
        await clearData();
        const awsDynamoService = new AwsDynamoService();

        const filteredArr = coinArr.filter((item) => { return item.coinKey !== '' });
        console.log("filteredArr", filteredArr);

        for (let i = 0; i < filteredArr.length; i++) {
            const coin = filteredArr[i];
            const requestParams = {
                TableName: WATCH_LIST_TABLE,
                Item: {
                    coinKey: {
                        S: coin.coinKey
                    },
                    exchangeSymbol: {
                        S: coin.exchangeSymbol
                    },
                    coinmarketcapSymbol: {
                        S: coin.coinmarketcapSymbol
                    },
                    logoUrl: {
                        S: coin.logoUrl
                    },
                    thumbnail: {
                        S: coin.thumbnail
                    },
                    thumbnailUp: {
                        S: coin.thumbnailUp
                    },
                    thumbnailDown: {
                        S: coin.thumbnailDown
                    }
                }
            };
            console.log("coin", coin, "requestParams", requestParams);
            const result = await awsDynamoService.addItem(requestParams);
            console.log("Add DynamoDB", result);
        }
        return responseTemplate(200, "done");
    } catch (error) {
        console.log("An error occur when sync list", error);
        return responseTemplate(500, error);
    }
};

const clearData = async () => {
    const awsDynamoService = new AwsDynamoService();
    const scanParams = {
        ProjectionExpression: "coinKey",
        TableName: WATCH_LIST_TABLE,
    };
    const scanResult = await awsDynamoService.scanItem(scanParams);
    for (let item of scanResult.Items) {
        await deleteItem(item, awsDynamoService);
    }
};

const deleteItem = async (item, awsDynamoService) => {
    const params = {
        Key: {
            "coinKey": {
                S: item.coinKey
            }
        },
        TableName: WATCH_LIST_TABLE
    };
    await awsDynamoService.deleteItem(params);
}