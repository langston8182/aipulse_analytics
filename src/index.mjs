import { analyticsController, analyticsGetController } from './controllers/analytic.controller.mjs';
import { connectToDatabase } from './db.mjs';

export const handler = async (event, context) => {
    try {
        // 1. Connexion MongoDB
        const env = process.env.ENVIRONMENT || "preprod";
        const dbUri = env === "prod" ? process.env.MONGODB_URI_PROD : process.env.MONGODB_URI_PREPROD;

        if (!dbUri) {
            throw new Error(`Aucune URI MongoDB définie pour l'environnement ${env}`);
        }
        await connectToDatabase(dbUri);

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
