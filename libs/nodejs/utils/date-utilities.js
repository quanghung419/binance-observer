const momentTz = require('moment-timezone');

const timezone = "Asia/Ho_Chi_Minh";
const formatDate = "YYYY/MM/DD HH:mm:ss";

module.exports = class DateUtilities {

    static getNowDateString() {
        const now = momentTz.utc().tz(timezone).format(formatDate);
        return now;
    }

    static getNowUtcTimestamp() {
        const now = momentTz.utc().valueOf();
        return now;
    }

}
