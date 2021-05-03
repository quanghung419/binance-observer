const { responseTemplate } = require('/opt/nodejs/utils/response.template');
const { VOLUME_STATE_TABLE } = process.env;
const AwsDynamoService = require('/opt/nodejs/aws-sdk/dynamodb.service');

exports.handler = async (event) => {
    try {
        const data = await getVolumeStatus();

        return responseTemplate(200, data);
    } catch (error) {
        return responseTemplate(500, error);
    }
};

const getVolumeStatus = async () => {
    const awsDynamoService = new AwsDynamoService();
    const scanParams = {
        ProjectionExpression: "symbol, chart1hStatus, chart4hStatus",
        TableName: VOLUME_STATE_TABLE,
    };
    const scanResult = await awsDynamoService.scanItem(scanParams);
    return scanResult.Items;
    // return _.keyBy(scanResult.Items, 'symbol');
}
