const Big = require('big.js');
const momentTz = require('moment-timezone');

const timezone = "Asia/Ho_Chi_Minh";
const formatDate = "YYYY/MM/DD HH:mm:ss";

const getNowInVnDateString = () => {
    return momentTz.utc().tz(timezone).format(formatDate);
}

const convertSymbolToPairId = (symbol) => {
    return symbol.replace("/", "");
}

const formatNumber = (number, fixedDigits) => {
    const digits = fixedDigits || 4;
    return parseFloat(number).toFixed(digits);
}

const getQuoteBaseAsset = (symbol) => {
    if (!symbol || !symbol.includes("/")) {
        return {};
    }
    const data = symbol.split("/");
    return {
        quoteAsset: data[1],
        baseAsset: data[0]
    }
}

const getPercentDiff = (value, baseValue) => {
    const percentValue = parseFloat(new Big(value - baseValue).div(baseValue).valueOf() * 100);
    return formatNumber(percentValue, 2);
}


const generateEmojiNumber = (number) => {
    if (!number) return "";
    const numStr = `${number}`;
    return numStr.replace(/0/g, '0️⃣')
        .replace(/1/g, '1️⃣')
        .replace(/2/g, '2️⃣')
        .replace(/3/g, '3️⃣')
        .replace(/4/g, '4️⃣')
        .replace(/5/g, '5️⃣')
        .replace(/6/g, '6️⃣')
        .replace(/7/g, '7️⃣')
        .replace(/8/g, '8️⃣')
        .replace(/9/g, '9️⃣');
}

module.exports = {
    convertSymbolToPairId,
    formatNumber,
    getQuoteBaseAsset,
    getPercentDiff,
    getNowInVnDateString,
    generateEmojiNumber,
}