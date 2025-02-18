import { analyticsController } from './controllers/analytic.controller.js';

export const handler = async (event, context) => {
    try {
        const payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const response = await analyticsController(payload);
        return {
            statusCode: 200,
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error('Erreur dans le handler :', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erreur interne du serveur' })
        };
    }
};
