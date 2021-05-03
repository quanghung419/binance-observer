const LatestNotifyTelegram = require('/opt/nodejs/utils/latest-notify-telegram');

const DateUtilities = require("/opt/nodejs/utils/date-utilities");
const TelegramUtilities = require("/opt/nodejs/utils/telegram-utilities");

const { getPercentDiff, formatNumber, generateEmojiNumber, getQuoteBaseAsset, convertSymbolToPairId } = require("/opt/nodejs/utils/common");
const { BOT_TOKEN, PRICE_UP_CHANNEL_ID, PRICE_DOWN_CHANNEL_ID, BTC_TREND_CHANNEL_ID } = process.env;

const SUB_KEY = {
    _15m: "PRICE_UP_15m",
}

const checkVolumeAndPriceUpCondition = async (symbol, alarmState, coinInfo, latestPrice) => {
    console.log("PRICE_UP_CHANNEL_ID", PRICE_UP_CHANNEL_ID);
    console.log("SYMBOL", symbol, "alarmState", alarmState, "latestPrice", latestPrice);

    const chart15m = alarmState.chart15m.current;

    // const { chart1h, chart4h, chart15m } = currentCandle;

    // const latestPrice = chart15m.latestPrice;
    // const latestPrice = latestPriceFromApi;

    console.log("latestPrice", chart15m.latestPrice);

    console.log("symbol:", symbol, "latest price:", latestPrice, "chart15m", chart15m);

    const latestNotifyTelegramchart15m = await LatestNotifyTelegram.getLatestNotifyTime(symbol, SUB_KEY._15m);

    const part1m15 = chart15m.isAboveMA && parseFloat(latestPrice) >= parseFloat(chart15m.highestPriceInClosedCandle);
    const part2m15 = latestNotifyTelegramchart15m.currentCandleCloseTime < chart15m.closeTime;

    const isAlarmPrice15m = part1m15 && part2m15;

    console.log(symbol, "SYMBOL PRICE UP", "part1m15", part1m15, "part2m15", part2m15, "isAlarmPrice15m", isAlarmPrice15m, "highestPriceInClosedCandle", chart15m.highestPriceInClosedCandle, "chart15m", chart15m);

    if (isAlarmPrice15m) {
        const data = {
            latestPrice,
            chart15m: {
                volume: chart15m.volume,
                maVolume: chart15m.maVolume,
                isVolumeAboveMA: chart15m.isAboveMA,
                isPriceAboveHighestPrice: latestPrice >= chart15m.highestPriceInClosedCandle,
                isAlarm: chart15m.isAboveMA && latestPrice >= chart15m.highestPriceInClosedCandle,
                highestPriceInClosedCandle: chart15m.highestPriceInClosedCandle,
            },
        }

        console.log("symbol:", symbol, "latest price:", latestPrice);
        const { thumbnailUp: photoUrl, rank } = coinInfo;

        const finalMessage = generateAlarmMessage(symbol, rank, data);
        console.log("finalMessage PRICE", finalMessage);

        console.log("sendTelegramPhoto START");
        const teleSendResult = await TelegramUtilities.sendTelegramPhoto(BOT_TOKEN, PRICE_UP_CHANNEL_ID, photoUrl, finalMessage);
        console.log("sendTelegramPhoto STOP", teleSendResult);

        // if (symbol === "BTC/USDT") {
        //     const btcDownImageUrl = "https://cct-static-public.s3-ap-southeast-1.amazonaws.com/logo/btc-up-1.png";
        //     const teleSendResultBtcUp = await TelegramUtilities.sendTelegramPhoto(BOT_TOKEN, BTC_TREND_CHANNEL_ID, btcDownImageUrl, finalMessage);
        //     console.log("teleSendResultBtcUp", teleSendResultBtcUp);
        // }

        const now = DateUtilities.getNowUtcTimestamp();

        if (isAlarmPrice15m) {
            await LatestNotifyTelegram.addLatestNotifyTime(symbol, SUB_KEY._15m, now, chart15m.closeTime);
        }
    }
}

const generateAlarmMessage = (symbol, rank, data) => {
    const now = DateUtilities.getNowDateString();
    const { quoteAsset, baseAsset } = getQuoteBaseAsset(symbol);
    const { latestPrice, chart15m } = data;

    const rankMessage = `*${baseAsset}* - rank ${generateEmojiNumber(rank)}`;
    const headingMessage = `Vol and Price (UP) Alarm 🔔\n\n*${symbol}* - ${now}\nCurrent Price: 1 ${baseAsset} = ${parseFloat(latestPrice)} ${quoteAsset}\n${rank ? rankMessage + "\n" : ""}`;
    const chart15mMessage = `${chart15m.isAlarm ? "🔥" : "🧊"} *15m* - *MA15*: ${chart15m.isAlarm ? "IN ALARM" : "NOT YET"}\n├ Highest Price: ${chart15m.highestPriceInClosedCandle}\n├ Price is ${chart15m.isPriceAboveHighestPrice ? "🔺" : "🔽"} highest: ${getPercentDiff(latestPrice, chart15m.highestPriceInClosedCandle)}%\n└ Volume ${chart15m.isVolumeAboveMA ? "🔺" : "🔽"} MA15: ${getPercentDiff(chart15m.volume, chart15m.maVolume)}%`;

    return encodeURI(`${headingMessage}\n${chart15mMessage}`);
}

module.exports = {
    checkVolumeAndPriceUpCondition
}