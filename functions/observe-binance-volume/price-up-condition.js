const LatestNotifyTelegram = require('/opt/nodejs/utils/latest-notify-telegram');

const DateUtilities = require("/opt/nodejs/utils/date-utilities");
const TelegramUtilities = require("/opt/nodejs/utils/telegram-utilities");

const { getPercentDiff, formatNumber, generateEmojiNumber, getQuoteBaseAsset, convertSymbolToPairId } = require("/opt/nodejs/utils/common");
const { BOT_TOKEN, PRICE_UP_CHANNEL_ID, PRICE_DOWN_CHANNEL_ID, BTC_TREND_CHANNEL_ID } = process.env;

const SUB_KEY = {
    _30m: "PRICE_UP_30m",
    _1h: "PRICE_UP_1h",
    _4h: "PRICE_UP_4h",
}

const checkVolumeAndPriceUpCondition = async (symbol, alarmState, coinInfo, latestPrice) => {
    console.log("SYMBOL", symbol, "alarmState", alarmState, "latestPrice", latestPrice);

    const chart30m = alarmState.chart30m.current;
    const chart1h = alarmState.chart1h.current;
    const chart4h = alarmState.chart4h.current;

    // const { chart1h, chart4h, chart30m } = currentCandle;

    // const latestPrice = chart30m.latestPrice;
    // const latestPrice = latestPriceFromApi;

    console.log("latestPrice", chart30m.latestPrice, chart1h.latestPrice, chart4h.latestPrice);

    console.log("symbol:", symbol, "latest price:", latestPrice, "chart30m", chart30m, "chart1h", chart1h, "chart4h", chart4h);

    const latestNotifyTelegramChart30m = await LatestNotifyTelegram.getLatestNotifyTime(symbol, SUB_KEY._30m);
    const latestNotifyTelegramChart1h = await LatestNotifyTelegram.getLatestNotifyTime(symbol, SUB_KEY._1h);
    const latestNotifyTelegramChart4h = await LatestNotifyTelegram.getLatestNotifyTime(symbol, SUB_KEY._4h);

    const part1m30 = chart30m.isAboveMA && latestPrice >= chart30m.highestPriceInClosedCandle;
    const part2m30 = latestNotifyTelegramChart30m.currentCandleCloseTime < chart30m.closeTime;

    const part1H1 = chart1h.isAboveMA && latestPrice >= chart1h.highestPriceInClosedCandle;
    const part2H1 = latestNotifyTelegramChart1h.currentCandleCloseTime < chart1h.closeTime;

    const part1H4 = chart4h.isAboveMA && latestPrice >= chart4h.highestPriceInClosedCandle;
    const part2H4 = latestNotifyTelegramChart4h.currentCandleCloseTime < chart4h.closeTime;

    const isAlarmPrice30m = part1m30 && part2m30;
    const isAlarmPrice1h = part1H1 && part2H1;
    const isAlarmPrice4h = part1H4 && part2H4;

    console.log("SYMBOL PRICE UP", symbol, "part1m30", part1m30, "part2m30", part2m30, "isAlarmPrice30m", isAlarmPrice30m);
    console.log("SYMBOL PRICE UP", symbol, "part1H1", part1H1, "part2H1", part2H1, "isAlarmPrice1h", isAlarmPrice1h);
    console.log("SYMBOL PRICE UP", symbol, "part1H4", part1H1, "part2H1", part2H4, "isAlarmPrice4h", isAlarmPrice4h);

    if (isAlarmPrice30m || isAlarmPrice1h || isAlarmPrice4h) {
        const data = {
            latestPrice,
            chart30m: {
                volume: chart30m.volume,
                maVolume: chart30m.maVolume,
                isVolumeAboveMA: chart30m.isAboveMA,
                isPriceAboveHighestPrice: latestPrice >= chart30m.highestPriceInClosedCandle,
                isAlarm: chart30m.isAboveMA && latestPrice >= chart30m.highestPriceInClosedCandle,
                highestPriceInClosedCandle: chart30m.highestPriceInClosedCandle,
            },
            chart1h: {
                volume: chart1h.volume,
                maVolume: chart1h.maVolume,
                isVolumeAboveMA: chart1h.isAboveMA,
                isPriceAboveHighestPrice: latestPrice >= chart1h.highestPriceInClosedCandle,
                isAlarm: chart1h.isAboveMA && latestPrice >= chart1h.highestPriceInClosedCandle,
                highestPriceInClosedCandle: chart1h.highestPriceInClosedCandle,
            },
            chart4h: {
                volume: chart4h.volume,
                maVolume: chart4h.maVolume,
                isVolumeAboveMA: chart4h.isAboveMA,
                isPriceAboveHighestPrice: latestPrice >= chart4h.highestPriceInClosedCandle,
                isAlarm: chart4h.isAboveMA && latestPrice >= chart4h.highestPriceInClosedCandle,
                highestPriceInClosedCandle: chart4h.highestPriceInClosedCandle,
            }
        }

        console.log("symbol:", symbol, "latest price:", latestPrice);
        const { thumbnail: photoUrl, rank } = coinInfo;

        const finalMessage = generateAlarmMessage(symbol, rank, data);
        console.log("finalMessage PRICE", finalMessage);

        console.log("sendTelegramPhoto START");
        const teleSendResult = await TelegramUtilities.sendTelegramPhoto(BOT_TOKEN, PRICE_UP_CHANNEL_ID, photoUrl, finalMessage);
        console.log("sendTelegramPhoto STOP", teleSendResult);

        if (symbol === "BTC/USDT") {
            const btcDownImageUrl = "https://cct-static-public.s3-ap-southeast-1.amazonaws.com/logo/btc-up-1.png";
            const teleSendResultBtcUp = await TelegramUtilities.sendTelegramPhoto(BOT_TOKEN, BTC_TREND_CHANNEL_ID, btcDownImageUrl, finalMessage);
            console.log("teleSendResultBtcUp", teleSendResultBtcUp);
        }

        const now = DateUtilities.getNowUtcTimestamp();

        if (isAlarmPrice30m) {
            await LatestNotifyTelegram.addLatestNotifyTime(symbol, SUB_KEY._30m, now, chart30m.closeTime);
        }
        if (isAlarmPrice1h) {
            await LatestNotifyTelegram.addLatestNotifyTime(symbol, SUB_KEY._1h, now, chart1h.closeTime);
        }
        if (isAlarmPrice4h) {
            await LatestNotifyTelegram.addLatestNotifyTime(symbol, SUB_KEY._4h, now, chart4h.closeTime);
        }
    }
}

const generateAlarmMessage = (symbol, rank, data) => {
    const now = DateUtilities.getNowDateString();
    const { quoteAsset, baseAsset } = getQuoteBaseAsset(symbol);
    const { latestPrice, chart30m, chart1h, chart4h } = data;

    const rankMessage = `*${baseAsset}* - rank ${generateEmojiNumber(rank)}`;
    const headingMessage = `Vol and Price (UP) Alarm 🔔\n\n*${symbol}* - ${now}\nCurrent Price: 1 ${baseAsset} = ${parseFloat(latestPrice)} ${quoteAsset}\n${rank ? rankMessage + "\n" : ""}`;
    const chart4hMessage = `${chart4h.isAlarm ? "🔥" : "🧊"} *4H* - *MA20*: ${chart4h.isAlarm ? "IN ALARM" : "NOT YET"}\n├ Highest Price: ${chart4h.highestPriceInClosedCandle}\n├ Price is ${chart4h.isPriceAboveHighestPrice ? "🔺" : "🔽"} highest: ${getPercentDiff(latestPrice, chart4h.highestPriceInClosedCandle)}%\n└ Volume ${chart4h.isVolumeAboveMA ? "🔺" : "🔽"} MA20: ${getPercentDiff(chart4h.volume, chart4h.maVolume)}%`;
    const chart1hMessage = `${chart1h.isAlarm ? "🔥" : "🧊"} *1H* - *MA20*: ${chart1h.isAlarm ? "IN ALARM" : "NOT YET"}\n├ Highest Price: ${chart1h.highestPriceInClosedCandle}\n├ Price is ${chart1h.isPriceAboveHighestPrice ? "🔺" : "🔽"} highest: ${getPercentDiff(latestPrice, chart1h.highestPriceInClosedCandle)}%\n└ Volume ${chart1h.isVolumeAboveMA ? "🔺" : "🔽"} MA20: ${getPercentDiff(chart1h.volume, chart1h.maVolume)}%`;
    const chart30mMessage = `${chart30m.isAlarm ? "🔥" : "🧊"} *30m* - *MA15*: ${chart30m.isAlarm ? "IN ALARM" : "NOT YET"}\n├ Highest Price: ${chart30m.highestPriceInClosedCandle}\n├ Price is ${chart30m.isPriceAboveHighestPrice ? "🔺" : "🔽"} highest: ${getPercentDiff(latestPrice, chart30m.highestPriceInClosedCandle)}%\n└ Volume ${chart30m.isVolumeAboveMA ? "🔺" : "🔽"} MA15: ${getPercentDiff(chart30m.volume, chart30m.maVolume)}%`;

    return encodeURI(`${headingMessage}\n${chart4hMessage}\n${chart1hMessage}\n${chart30mMessage}`);
}

module.exports = {
    checkVolumeAndPriceUpCondition
}