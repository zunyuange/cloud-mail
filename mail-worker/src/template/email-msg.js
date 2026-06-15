import emailUtils from '../utils/email-utils';

const POTATO_MESSAGE_LIMIT = 3500;
const TRUNCATED_SUFFIX = '...';

function escapeHtml(text = '') {
	if (!text) return '';
	return text
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function truncateText(text, maxLength) {
	if (!text || text.length <= maxLength) {
		return text || '';
	}

	if (maxLength <= TRUNCATED_SUFFIX.length) {
		return TRUNCATED_SUFFIX.slice(0, maxLength);
	}

	return text.slice(0, maxLength - TRUNCATED_SUFFIX.length) + TRUNCATED_SUFFIX;
}

export default function emailMsgTemplate(email, tgMsgTo, tgMsgFrom, tgMsgText) {

	let template = `<b>${escapeHtml(email.subject || '')}</b>`

	if (tgMsgFrom === 'only-name') {
		template += `

发件人：${escapeHtml(email.name || '')}`
	}

	if (tgMsgFrom === 'show') {
		template += `

发件人：${escapeHtml(email.name || '')}
发件邮箱：${escapeHtml(email.sendEmail || '')}`
	}

	if(tgMsgTo === 'show') {
		template += `

收件邮箱：${escapeHtml(email.toEmail || '')}`
	}

	if(tgMsgText === 'show') {
		const text = emailUtils.formatText(email.text) || emailUtils.htmlToText(email.content);
		if (text) {
			const prefix = `${template}\n`;
			const maxTextLength = Math.max(0, POTATO_MESSAGE_LIMIT - prefix.length);
			template += `

${truncateText(text, maxTextLength)}`
		}
	}

	return template;

}
