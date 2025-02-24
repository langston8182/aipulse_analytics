import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
    eventType: String,
    hashedIp: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    page: String,
    articleId: String,
    articleIds: { type: [String], default: [] }, // Liste d'articles vus
    referrer: String,
    deviceType: String,
    browser: String,
    country: String,
    actions: {
        shares: {
            facebook: { type: Number, default: 0 },
            linkedin: { type: Number, default: 0 },
            x: { type: Number, default: 0 }
        },
        clicks: { type: Number, default: 0 },
    }
});

// Création du modèle basé sur le schéma
export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsSchema);
