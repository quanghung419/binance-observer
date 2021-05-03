const axios = require('axios');

module.exports = class TelegramUtilities {

    static async sendTelegramMessage(botToken, chatId, message) {
        const url = `https://api.telegram.org/${botToken}/sendMessage?chat_id=${chatId}&text=${message}&parse_mode=Markdown`;
        return await axios(
            {
                method: 'get',
                url,
            }
        );
    }

    static async sendTelegramPhoto(botToken, chatId, photo, caption) {
        const url = `https://api.telegram.org/${botToken}/sendPhoto?chat_id=${chatId}&photo=${photo}&caption=${caption}&parse_mode=Markdown`;
        console.log("Telegram Send", url);
        return await axios(
            {
                method: 'get',
                url,
            }
        );
    }
}


// const demo = async (botToken, chatId) => {
//     // const url = `https://api.telegram.org/${botToken}/sendPhoto?chat_id=${chatId}&photo=${photo}&caption=${caption}&parse_mode=Markdown`;
    
//     const message = `demo`;
//     const url = `https://api.telegram.org/${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURI(message)}&parse_mode=HTML`;

//     return await axios(
//         {
//             method: 'get',
//             url,
//         }
//     );
// }

// demo("bot1614135689:AAEpNvGmVu5D6IRc_lI1VZsMzeuy1XBHl9c", "-1001165354966");