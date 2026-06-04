import app from '../hono/hono';
import potatoService from '../service/potato-service';

app.get('/potato/getEmail/:token', async (c) => {
	const content = await potatoService.getEmailContent(c, c.req.param());
	c.header('Cache-Control', 'public, max-age=604800, immutable');
	return c.html(content)
});

