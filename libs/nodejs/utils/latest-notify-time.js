const AwsDynamoService = require('../aws-sdk/dynamodb.service');
const { LATEST_NOTIFY_TIME_TABLE } = process.env;

module.exports = class LatestNotifyTime {

    /**
     * 
     * @param {*} symbol 
     * @param {*} chartTimeFrame : 4h, 1h
     * @returns 
     */
    static async getLatestNotifyTime(symbol, chartTimeFrame) {
        const requestParams = {
            TableName: LATEST_NOTIFY_TIME_TABLE,
            KeyConditionExpression: "symbol = :s and chart = :c",
            // FilterExpression: "chart = :c",
            ExpressionAttributeValues: {
                ":s": symbol,
                ":c": chartTimeFrame,
            }

        };
        console.log("getLatestNotifyTime requestParams", requestParams);
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

    static async addLatestNotifyTime(symbol, chartTimeFrame, latestNotifyTime, currentCandleCloseTime) {
        const requestParams = {
            TableName: LATEST_NOTIFY_TIME_TABLE,
            Item: {
                symbol: {
                    S: symbol,
                },
                chart: {
                    S: chartTimeFrame,
                },
                latestNotifyTime: {
                    N: `${latestNotifyTime}`,
                },
                currentCandleCloseTime: {
                    N: `${currentCandleCloseTime}`,
                },
            },
        };
        console.log("addLatestNotifyTime requestParams", requestParams);
        const awsDynamoService = new AwsDynamoService();
        const result = await awsDynamoService.addItem(requestParams);
        console.log("addLatestNotifyTime", result);
    };
}
