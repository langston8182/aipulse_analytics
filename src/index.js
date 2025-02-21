import { analyticsController, analyticsGetController } from './controllers/analytic.controller.js';
import { connectToDatabase } from './db.js';

const MONGODB_URI = process.env.MONGODB_URI;

export const handler = async (event, context) => {
    try {
        await connectToDatabase(MONGODB_URI);

        if (event.requestContext.http.method === "GET") {
            // Appel pour récupérer les statistiques agrégées
            const response = await analyticsGetController();
            return {
                statusCode: 200,
                body: JSON.stringify(response)
            };
        } else if (event.requestContext.http.method === "POST") {
            // Pour POST, on parse le payload et on l'envoie
            const payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
            const response = await analyticsController(payload);
            return {
                statusCode: 200,
                body: JSON.stringify(response)
            };
        } else {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: 'Méthode non autorisée' })
            };
        }
    } catch (error) {
        console.error('Erreur dans le handler :', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erreur interne du serveur' })
        };
    }
};
