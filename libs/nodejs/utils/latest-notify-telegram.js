const AwsDynamoService = require('../aws-sdk/dynamodb.service');
const { LATEST_NOTIFY_TELEGRAM_TABLE } = process.env;

module.exports = class LatestNotifyTelegram {

    /**
     * 
     * @param {*} symbol 
     * @param {*} chartTimeFrame : 4h, 1h
     * @returns 
     */
    static async getLatestNotifyTime(symbol, subKey) {
        const requestParams = {
            TableName: LATEST_NOTIFY_TELEGRAM_TABLE,
            KeyConditionExpression: "symbol = :s and subKey = :c",
            // FilterExpression: "chart = :c",
            ExpressionAttributeValues: {
                ":s": symbol,
                ":c": subKey,
            }

        };
        // console.log("LATEST_NOTIFY_TELEGRAM_TABLE getLatestNotifyTime requestParams", requestParams);
        const awsDynamoService = new AwsDynamoService();
        const result = await awsDynamoService.queryItem(requestParams);
        const { Items } = result;
        if (Items.length === 0) {
            return {
                latestNotifyTime: 0,
                currentCandleCloseTime: 0
            };
        }
        return Items[0];
    }

    static async addLatestNotifyTime(symbol, subKey, latestNotifyTime, currentCandleCloseTime) {
        const requestParams = {
            TableName: LATEST_NOTIFY_TELEGRAM_TABLE,
            Item: {
                symbol: {
                    S: symbol,
                },
                subKey: {
                    S: subKey,
                },
                latestNotifyTime: {
                    N: `${latestNotifyTime}`,
                },
                currentCandleCloseTime: {
                    N: `${currentCandleCloseTime}`,
                },
            },
        };
        // console.log("addLatestNotifyTime requestParams LATEST_NOTIFY_TELEGRAM_TABLE", requestParams);
        const awsDynamoService = new AwsDynamoService();
        const result = await awsDynamoService.addItem(requestParams);
        // console.log("addLatestNotifyTime", result);
    };
}
