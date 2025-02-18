import { sendAnalyticsEvent } from '../services/analytic.service.js';
import { AnalyticsEvent } from '../models/analytic.model.js';

export const analyticsController = async (payload) => {
    try {
        // Création d'une instance du modèle AnalyticsEvent
        const eventInstance = new AnalyticsEvent(payload);
        // Envoi de l'événement via le service
        const result = await sendAnalyticsEvent(eventInstance);
        return { message: 'Événement envoyé avec succès', result };
    } catch (error) {
        console.error('Erreur dans le contrôleur analytics :', error);
        throw error;
    }
};
