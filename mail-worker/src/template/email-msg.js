import emailUtils from '../utils/email-utils';

const POTATO_MESSAGE_LIMIT = 3500;
const TRUNCATED_SUFFIX = '...';

function escapeHtml(text = '') {
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

	let template = `标题：${escapeHtml(email.subject || '')}`

	if (tgMsgFrom === 'only-name') {
		template += `
发件人：${escapeHtml(email.name || '')}`
	}

	if (tgMsgFrom === 'show') {
		template += `
发件人：${escapeHtml(email.name || '')}
发件邮箱：${escapeHtml(email.sendEmail || '')}`
	}

	if(tgMsgTo === 'show' && tgMsgFrom === 'hide') {
		template += `
收件邮箱：${escapeHtml(email.toEmail || '')}`

	} else if(tgMsgTo === 'show') {
		template += `
收件邮箱：${escapeHtml(email.toEmail || '')}`
	}

	const text = escapeHtml(emailUtils.formatText(email.text) || emailUtils.htmlToText(email.content));

	if(tgMsgText === 'show') {
		const prefix = `${template}
`;
		const maxTextLength = Math.max(0, POTATO_MESSAGE_LIMIT - prefix.length);
		template += `
邮箱内容：${truncateText(text, maxTextLength)}`
	}

	return template;

}
