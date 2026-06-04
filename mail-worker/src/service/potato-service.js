import orm from '../entity/orm';
import email from '../entity/email';
import settingService from './setting-service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);
import { eq } from 'drizzle-orm';
import jwtUtils from '../utils/jwt-utils';
import emailMsgTemplate from '../template/email-msg';
import emailTextTemplate from '../template/email-text';
import emailHtmlTemplate from '../template/email-html';
import verifyUtils from '../utils/verify-utils';
import domainUtils from "../utils/domain-uitls";

const potatoService = {

	async getEmailContent(c, params) {

		const { token } = params

		const result = await jwtUtils.verifyToken(c, token);

		if (!result) {
			return emailTextTemplate('Access denied')
		}

		const emailRow = await orm(c).select().from(email).where(eq(email.emailId, result.emailId)).get();

		if (emailRow) {

			if (emailRow.content) {
				const { r2Domain } = await settingService.query(c);
				return emailHtmlTemplate(emailRow.content || '', r2Domain)
			} else {
				return emailTextTemplate(emailRow.text || '')
			}

		} else {
			return emailTextTemplate('The email does not exist')
		}

	},

	async sendEmailToBot(c, email) {

		const { tgBotToken, tgChatId, customDomain, tgMsgTo, tgMsgFrom, tgMsgText } = await settingService.query(c);

		const tgChatIds = tgChatId.split(',');

		const jwtToken = await jwtUtils.generateToken(c, { emailId: email.emailId })

		const webAppUrl = customDomain ? `${domainUtils.toOssDomain(customDomain)}/api/potato/getEmail/${jwtToken}` : 'https://www.cloudflare.com/404'
		
		// Potato API inline_keyboard format
		// type: 4 means inline keyboard
		// buttons structure: [{ buttons: [{ text, callback_data/url }] }]
		const inlineKeyboard = {
			type: 4,
			inline_keyboard: [
				{
					buttons: [
						{
							text: 'View',
							url: webAppUrl
						}
					]
				}
			]
		};

		if (email.code) {
			inlineKeyboard.inline_keyboard.push({
				buttons: [
					{
						text: email.code,
						callback_data: email.code
					}
				]
			});
		}

		await Promise.all(tgChatIds.map(async chatId => {
			try {
				// Potato Bot API: https://api.rct2008.com:8443/<bot_token>/sendTextMessage
				// chat_type: 1 = private chat, 2 = group chat
				const chatType = chatId.startsWith('-') ? 2 : 1;
				const res = await fetch(`https://api.rct2008.com:8443/${tgBotToken}/sendTextMessage`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						chat_type: chatType,
						chat_id: Number(chatId),
						text: emailMsgTemplate(email, tgMsgTo, tgMsgFrom, tgMsgText),
						reply_markup: inlineKeyboard
					})
				});
				if (!res.ok) {
					console.error(`转发 Potato 失败 status: ${res.status} response: ${await res.text()}`);
				}
			} catch (e) {
				console.error(`转发 Potato 失败:`, e.message);
			}
		}));

	}

}

export default potatoService
