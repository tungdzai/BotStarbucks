const axios = require('axios');
const Mailjs = require("@cemalgnlts/mailjs");
const cheerio = require('cheerio');
const fs = require('fs');
const mailjs = new Mailjs();
const TelegramBot = require('node-telegram-bot-api');
const keep_alive = require('./keep_alive.js');
const token = '7524330221:AAEFtVz3YKniVY2aN0XkfF4PwpvMPMD4EA8';
const bot = new TelegramBot(token, {polling: true});
let accountList = [];
let chatIds = [];

async function sendTelegramMessage(message) {
    for (const id of chatIds) {
        try {
            await bot.sendMessage(id, message);
        } catch (error) {
            console.error(`Lỗi gửi tin nhắn đến Telegram (chatId: ${id}):`, error);
        }
    }
}

async function delay(minSeconds, maxSeconds) {
    const randomDelay = Math.floor(Math.random() * (maxSeconds - minSeconds + 1) * 1000) + (minSeconds * 1000);
    await new Promise(resolve => setTimeout(resolve, randomDelay));
    return randomDelay / 1000;
}


async function randomPhoneNumber() {
    const prefixes = ['090', '091', '092', '093', '094', '095', '096', '097', '098', '099'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 1000000).toString().padStart(7, '0');
    return `${prefix}${number}`;
}

async function generateRandomString() {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'thuhien';
    let usedCharacters = new Set();

    while (usedCharacters.size < 4) {
        let char = characters.charAt(Math.floor(Math.random() * characters.length));
        if (!usedCharacters.has(char)) {
            usedCharacters.add(char);
            result += char;
        }
    }

    return result;
}

async function randomEmail() {
    try {
        const domainsResponse = await mailjs.getDomains();
        const domains = domainsResponse.data;
        if (!Array.isArray(domains) || domains.length === 0) {
            throw new Error('No domains available or data format is incorrect');
        }

        const randomDomain = domains[Math.floor(Math.random() * domains.length)].domain;
        if (!randomDomain) {
            throw new Error('Unable to find a valid domain');
        }
        const randomAddress = await generateRandomString();
        const emailAddress = `${randomAddress}@${randomDomain}`;

        const password = 'Thuhien1234@';
        const accountResponse = await mailjs.register(emailAddress, password);
        const account = accountResponse.data;
        return {
            address: account.address,
            password: password
        };
    } catch (error) {
        console.error('Error creating random email:', error.message);
        throw error;
    }
}

async function randomDateOfBirth() {
    const year = Math.floor(Math.random() * (2002 - 1980 + 1)) + 1980;
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const day = Math.floor(Math.random() * 31) + 15;
    const formattedDay = day.toString().padStart(2, '0');
    return `${year}-${month.toString().padStart(2, '0')}-${formattedDay}`;
}

async function randomName() {
    const firstNames = ['Tuan', 'Anh', 'Binh', 'Chau', 'Dung', 'Hanh', 'Hieu', 'Hoa', 'Khoa', 'Linh', 'Minh', 'Nam', 'Ngoc', 'Phuong', 'Quang', 'Son', 'Tuan', 'Trang', 'Vinh'];
    const lastNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Phan', 'Vu', 'Vo', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly'];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return {firstName, lastName};
}

async function signUp(phone, email, dateOfBirth, firstName, lastName, retries = 2) {
    if (retries < 0) {
        return null;
    }
    if (retries < 2) {
        await delay(2, 5);
    }
    try {
        const data = {
            "mobileNo": phone,
            "email": email,
            "password": "Thuhien1234@",
            "confirmPassword": "Thuhien1234@",
            "registerType": 0,
            "firstName": firstName,
            "lastName": lastName,
            "dob": dateOfBirth,
            "nationality": "VN",
            "salutation": "Mr",
            "subscription": {"email": true},
            "cardLists": [{"cardNo": "", "passcode": ""}],
            "gender": ""
        }

        const response = axios.post('https://sbvn.wrapper.vifb.vn/ms-customer/api/Member/SignUp', data, {
            headers: {
                'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                'sec-ch-ua-mobile': '?0',
                'Authorization': 'undefined',
                'x-language-key': 'en',
                'x-issuer': 'PORTAL',
                'Content-Type': 'application/json;charset=UTF-8',
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'sec-ch-ua-platform': '"Windows"',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'host': 'sbvn.wrapper.vifb.vn'
            }
        });
        return (await response).data;
    } catch (error) {
        console.error('Lỗi tạo tài khoản:', error.message);
        return await signUp(phone, email, dateOfBirth, firstName, lastName, retries - 1)

    }
}

async function verifyRegistration(mid, cn, ts) {
    const url = "https://card.starbucks.vn/api/account/verifyRegistration";
    const headers = {
        'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        'sec-ch-ua-mobile': '?0',
        'Authorization': 'undefined',
        'x-language-key': 'en',
        'x-issuer': 'PORTAL',
        'Content-Type': 'application/json;charset=UTF-8',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'host': 'card.starbucks.vn'
    };
    const data = {
        "mid": mid,
        "cn": cn,
        "ts": ts
    }
    const response = await axios.post(url, data, {headers: headers});
    return response.data;
}

async function waitForMail(address, password, retries = 10) {
    if (retries < 0) {
        return null;
    }
    if (retries < 10) {
        await delay(8, 15);
    }
    try {
        await mailjs.login(address, password);
        const dataMail = await mailjs.getMessages();
        if (dataMail && dataMail.data && dataMail.data.length > 0) {
            return dataMail;
        }
        console.log("Đang kiểm tra dữ liệu mail ....")
        return await waitForMail(address, password, retries - 1)
    } catch (error) {
        console.error('Lỗi đăng nhập mail:', error.message);
        return null;
    }
}

async function main() {
    try {
        const {address, password} = await randomEmail();
        const phone = await randomPhoneNumber();
        const dateOfBirth = await randomDateOfBirth();
        const {firstName, lastName} = await randomName();
        const result = await signUp(phone, address, dateOfBirth, firstName, lastName);
        if (!result) {
            return main()
        }
        const dataMail = await waitForMail(address, password);
        if (!dataMail) {
            return main();
        }
        const idMessages = dataMail.data[0].id;
        const messages = await mailjs.getMessage(idMessages);
        if (!messages.status) {
            return main();
        }
        const links = [];
        const $ = cheerio.load(messages.data.html.join(''));
        $('a').each((index, element) => {
            links.push($(element).attr('href'));
        });
        const secondUrl = links[1];
        const regex = /\/verification\/([^\/]+)\/([^\/]+)\/([^\/]+)/;
        const matches = secondUrl.match(regex);
        if (matches) {
            const mid = matches[1];
            const cn = matches[2];
            const ts = matches[3];

            const statusVerify = await verifyRegistration(mid, cn, ts);
            console.log(statusVerify)
            if (statusVerify.message === "Congratulations! You've successfully confirmed your new account.") {
                const resultRef = `${address} ${password} ${dateOfBirth}`;
                accountList.push(resultRef);
            }
        } else {
            console.error('Không tìm thấy url verify !');
        }
    } catch (error) {
        const message = `Lỗi xử lý logic code:${error.message}`
        await sendTelegramMessage(message);
    }
}

async function executeMains(n) {
    const promises = [];
    for (let i = 0; i < n; i++) {
        promises.push(main());
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    await Promise.all(promises);
}


bot.on('message', async (msg) => {
    const messageChatId = msg.chat.id;
    const text = msg.text;


    console.log(messageChatId);
    if (!chatIds.includes(messageChatId)) {
        chatIds.push(messageChatId);
    }

    if (typeof text === 'string') {
        const param = parseInt(text.trim());
        if (!isNaN(param) && param > 0 && param <= 10) {
            await executeMains(param);
            if (accountList.length > 0) {
                await sendTelegramMessage(`Danh sách ${accountList.length} tài khoản Starbucks:\n` + accountList.join('\n'));
                accountList = [];
            } else {
                await sendTelegramMessage('Không có tài khoản nào');
            }
        } else {
            await sendTelegramMessage('Vợ vui lòng nhập sổ nguyên dương và nhỏ hơn hoặc bằng 10 ');
        }

    } else {
        await sendTelegramMessage('Vui lòng nhập số nguyên');
    }
});