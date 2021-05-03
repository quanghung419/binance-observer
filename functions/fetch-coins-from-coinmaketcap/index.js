// const { responseTemplate } = require('/opt/nodejs/utils/response.template');
// const { COINMAKETCAP_API_KEY } = process.env;
// const SqsService = require('/opt/nodejs/aws-sdk/sqs.service');
// const symbols = require('./symbols.json');
// const BinaceExchange = require('/opt/nodejs/service/binance.exchange.service');
const axios = require('axios');
const _ = require('lodash');

const COINMAKETCAP_API_KEY = "";

exports.handler = async (event) => {
    try {

        await fetchCoinInfoFromCoinmarketcap();

        return responseTemplate(200, symbols);
    } catch (error) {
        return responseTemplate(500, error);
    }
};



const fetchCoinInfoFromCoinmarketcap = async () => {
    const listCoinIdFetched = [];
    const listNewCoinUpdate = [];
    const coinMap = await fetchCoinMap();
    const finalMap = {};

    coinMap.forEach(function (entry) {
        const coinKey = `${entry.symbol} - ${entry.name}`;
        const isNotExist = listCoinIdFetched.indexOf(coinKey) < 0;
        if (isNotExist) {
            listNewCoinUpdate.push(entry.id);
            finalMap[entry.id] = {
                "coinmaketcapId": entry.id,
                "symbol": entry.symbol,
                "name": entry.name,
                "slug": entry.slug,
                "key": coinKey
            };
        }
    });

    const arrays = [], size = 200;

    while (listNewCoinUpdate.length > 0) {
        arrays.push(listNewCoinUpdate.splice(0, size));
    }

    arrays.forEach(function (subArray) {
        const data = fetchCoinInfo(subArray);
        const keys = Object.keys(data);
        keys.forEach(function (key) {
            finalMap[key].logo = data[key]["logo"];
        });
    });

    const arr = _.values(finalMap);
    return arr;
}

const fetchCoinMap = async () => {
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?CMC_PRO_API_KEY=${COINMAKETCAP_API_KEY}`;
    const { data } = await axios.get(url);
    return data.data;
}

const fetchCoinInfo = async (coinIdArr) => {
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?CMC_PRO_API_KEY=${COINMAKETCAP_API_KEY}&id=${coinIdArr.join()}`;
    const { data } = await axios.get(url);
    return data.data;
}

// fetchCoinInfoFromCoinmarketcap();