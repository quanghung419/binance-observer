const { VOLUME_STATE_TABLE } = process.env;
const { getNowInVnDateString } = require("/opt/nodejs/utils/common");
const AwsDynamoService = require('/opt/nodejs/aws-sdk/dynamodb.service');

const generateCandleStatusDynamodb = (candleStatus) => {
    return {
        isAboveMA: {
            BOOL: candleStatus.isAboveMA
        },
        volume: {
            N: `${candleStatus.volume}`
        },
        quoteAssetVolume: {
            N: `${candleStatus.quoteAssetVolume}`
        },
        maVolume: {
            N: `${candleStatus.maVolume}`
        },
        maQuoteAssetVolume: {
            N: `${candleStatus.maQuoteAssetVolume}`
        },
        closeTime: {
            N: `${candleStatus.closeTime}`
        },
        highestPriceInClosedCandle: {
            N: `${candleStatus.highestPriceInClosedCandle}`
        },
    }
}

const addVolumeState = async (symbol, chart1hStatus, chart4hStatus, chart30mStatus) => {
    const requestParams = {
        TableName: VOLUME_STATE_TABLE,
        Item: {
            symbol: {
                S: symbol,
            },
            latestUpdatedDate: {
                S: getNowInVnDateString(),
            },
            current: {
                M: {
                    chart30m: {
                        M: generateCandleStatusDynamodb(chart30mStatus.current)
                    },
                    chart1h: {
                        M: generateCandleStatusDynamodb(chart1hStatus.current)
                    },
                    chart4h: {
                        M: generateCandleStatusDynamodb(chart4hStatus.current)
                    }
                }
            },
            _1LatestClosedCandle: {
                M: {
                    chart30m: {
                        M: generateCandleStatusDynamodb(chart30mStatus._1LatestClosedCandle)
                    },
                    chart1h: {
                        M: generateCandleStatusDynamodb(chart1hStatus._1LatestClosedCandle)
                    },
                    chart4h: {
                        M: generateCandleStatusDynamodb(chart4hStatus._1LatestClosedCandle)
                    }
                }
            },
        },
    };
    console.log("Add volume state requestParams", JSON.stringify(requestParams));
    const awsDynamoService = new AwsDynamoService();
    const result = await awsDynamoService.addItem(requestParams);
    console.log("Add volume state result", result);
};

module.exports = {
    addVolumeState
}