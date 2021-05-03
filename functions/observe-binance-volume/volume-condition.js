// const LatestNotifyTime = require('/opt/nodejs/utils/latest-notify-time');
const LatestNotifyTelegram = require('/opt/nodejs/utils/latest-notify-telegram');

const DateUtilities = require("/opt/nodejs/utils/date-utilities");
const TelegramUtilities = require("/opt/nodejs/utils/telegram-utilities");

const { getPercentDiff, formatNumber, generateEmojiNumber, getQuoteBaseAsset } = require("/opt/nodejs/utils/common");
const { BOT_TOKEN, VOLUME_CHANNEL_ID } = process.env;

const SUB_KEY = {
    _30m: "VOLUME_30m",
    _1h: "VOLUME_1h",
    _4h: "VOLUME_4h",
}

const checkVolumeAndAlarmToTelegramChannel = async (symbol, alarmState, coinInfo) => {
    console.log("alarmTelegramChannel alarmState", alarmState);
    // const chart1hTimeFrame = "1h";
    // const chart4hTimeFrame = "4h";
    // const chart30TimeFrame = "30m";

    const latestNotifyTimeChart30m = await LatestNotifyTelegram.getLatestNotifyTime(symbol, SUB_KEY._30m);
    // const latestNotifyTimeChart30m = await LatestNotifyTime.getLatestNotifyTime(symbol, chart30TimeFrame);
    const latestNotifyTimeChart1h = await LatestNotifyTelegram.getLatestNotifyTime(symbol, SUB_KEY._1h);
    // const latestNotifyTimeChart1h = await LatestNotifyTime.getLatestNotifyTime(symbol, chart1hTimeFrame);
    const latestNotifyTimeChart4h = await LatestNotifyTelegram.getLatestNotifyTime(symbol, SUB_KEY._4h);
    // const latestNotifyTimeChart4h = await LatestNotifyTime.getLatestNotifyTime(symbol, chart4hTimeFrame);

    const { chart4h, chart1h, chart30m } = alarmState;

    const { current: currentCandleChart30m } = chart30m;
    const { current: currentCandleChart1h } = chart1h;
    const { current: currentCandleChart4h } = chart4h;

    const isNotifyChart30m = currentCandleChart30m.isAboveMA && latestNotifyTimeChart30m.currentCandleCloseTime < currentCandleChart30m.closeTime;
    const isNotifyChart1h = currentCandleChart1h.isAboveMA && latestNotifyTimeChart1h.currentCandleCloseTime < currentCandleChart1h.closeTime;
    const isNotifyChart4h = currentCandleChart4h.isAboveMA && latestNotifyTimeChart4h.currentCandleCloseTime < currentCandleChart4h.closeTime;

    console.log(`${symbol} alarm status`, "latestNotifyTimeChart1h", latestNotifyTimeChart1h, "latestNotifyTimeChart4h", latestNotifyTimeChart4h, "currentCandleChart1h", currentCandleChart1h, "currentCandleChart4h", currentCandleChart4h, "latestNotifyTimeChart1h.currentCandleCloseTime", latestNotifyTimeChart1h.currentCandleCloseTime, "latestNotifyTimeChart4h.currentCandleCloseTime", latestNotifyTimeChart4h.currentCandleCloseTime);
    console.log(`${symbol} alarm status`, "isNotifyChart30m", isNotifyChart30m, "isNotifyChart1h", isNotifyChart1h, "isNotifyChart4h", isNotifyChart4h);

    if (isNotifyChart30m || isNotifyChart1h || isNotifyChart4h) {
        const { thumbnail: photoUrl, rank } = coinInfo;

        const finalMessage = generateAlarmMessage(symbol, rank, alarmState);
        console.log("finalMessage", finalMessage);
        console.log("sendTelegramPhoto START", photoUrl, BOT_TOKEN, VOLUME_CHANNEL_ID);
        const teleSendResult = await TelegramUtilities.sendTelegramPhoto(BOT_TOKEN, VOLUME_CHANNEL_ID, photoUrl, finalMessage);
        const now = DateUtilities.getNowUtcTimestamp();
        console.log("sendTelegramPhoto STOP", teleSendResult);

        if (isNotifyChart30m) {
            await LatestNotifyTelegram.addLatestNotifyTime(symbol, SUB_KEY._30m, now, currentCandleChart30m.closeTime);
            // await LatestNotifyTime.addLatestNotifyTime(symbol, chart30TimeFrame, now, currentCandleChart30m.closeTime);
        }

        if (isNotifyChart1h) {
            await LatestNotifyTelegram.addLatestNotifyTime(symbol, SUB_KEY._1h, now, currentCandleChart1h.closeTime);
            // await LatestNotifyTime.addLatestNotifyTime(symbol, chart1hTimeFrame, now, currentCandleChart1h.closeTime);
        }

        if (isNotifyChart4h) {
            await LatestNotifyTelegram.addLatestNotifyTime(symbol, SUB_KEY._4h, now, currentCandleChart4h.closeTime);
            // await LatestNotifyTime.addLatestNotifyTime(symbol, chart4hTimeFrame, now, currentCandleChart4h.closeTime);
        }

    }
}

const generateAlarmMessage = (symbol, rank, alarmState) => {
    console.log("generateAlarmMessage", alarmState);
    const now = DateUtilities.getNowDateString();
    const { baseAsset, quoteAsset } = getQuoteBaseAsset(symbol);

    const { chart4h, chart1h, chart30m } = alarmState;
    const rankMessage = `*${baseAsset}* - rank ${generateEmojiNumber(rank)}`;

    const headingMessage = `Current Vol/MA 20 Vol Alarm 🔔\n\n*${symbol}* - ${now}\n${rank ? rankMessage + "\n" : ""}`;
    const chart4hMessage = `${chart4h.current.isAboveMA ? "📈" : "📉"} 4H: ${chart4h.current.isAboveMA ? "ABOVE" : "BELOW"}\n├ Current Vol = ${formatNumber(chart4h.current.volume)} ${baseAsset}\n├ MA20 (4h) = ${formatNumber(chart4h.current.maVolume)} ${baseAsset}\n└ Current is ${chart4h.current.isAboveMA ? "🔺" : "🔽"} MA 20: ${getPercentDiff(chart4h.current.volume, chart4h.current.maVolume)}%`;
    const chart1hMessage = `${chart1h.current.isAboveMA ? "📈" : "📉"} 1H: ${chart1h.current.isAboveMA ? "ABOVE" : "BELOW"}\n├ Current Vol = ${formatNumber(chart1h.current.volume)} ${baseAsset}\n├ MA20 (1h) = ${formatNumber(chart1h.current.maVolume)} ${baseAsset}\n└ Current is ${chart1h.current.isAboveMA ? "🔺" : "🔽"} MA 20: ${getPercentDiff(chart1h.current.volume, chart1h.current.maVolume)}%`;
    const chart30mMessage = `${chart30m.current.isAboveMA ? "📈" : "📉"} 30m: ${chart30m.current.isAboveMA ? "ABOVE" : "BELOW"}\n├ Current Vol = ${formatNumber(chart30m.current.volume)} ${baseAsset}\n├ MA15 (30m) = ${formatNumber(chart30m.current.maVolume)} ${baseAsset}\n└ Current is ${chart30m.current.isAboveMA ? "🔺" : "🔽"} MA 20: ${getPercentDiff(chart30m.current.volume, chart30m.current.maVolume)}%`;

    return encodeURI(`${headingMessage}\n${chart4hMessage}\n${chart1hMessage}\n${chart30mMessage}`);
}

module.exports = {
    checkVolumeAndAlarmToTelegramChannel
}