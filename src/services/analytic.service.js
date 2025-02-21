import {KinesisClient, PutRecordCommand} from '@aws-sdk/client-kinesis';
import {AnalyticsEvent} from "../models/amalytic_schema.model.js";

// Instanciation du client Kinesis avec la région définie dans les variables d'environnement
const kinesisClient = new KinesisClient({ region: process.env.AWS_REGION });

export const sendAnalyticsEvent = async (analyticsEvent) => {
    const streamName = process.env.KINESIS_STREAM_NAME;
    const dataString = JSON.stringify(analyticsEvent);

    const params = {
        StreamName: streamName,
        Data: dataString + "\n",
        // Utiliser par exemple l'IP anonymisée comme clé de partition
        PartitionKey: analyticsEvent.hashedIp || 'default'
    };

    try {
        const command = new PutRecordCommand(params);
        return await kinesisClient.send(command);
    } catch (error) {
        console.error('Erreur lors de l’envoi vers Kinesis :', error);
        throw error;
    }
};

export const getAggregatedAnalytics = async () => {
    try {
        // 1. Nombre total de visiteurs (distinct hashedIp)
        const totalVisitorsResult = await AnalyticsEvent.distinct("hashedIp");
        const totalVisitors = totalVisitorsResult.length;

        // 2. Nombre total d'articles vus (somme des occurrences de chaque article dans articleIds)
        const articlesResult = await AnalyticsEvent.aggregate([
            { $unwind: "$articleIds" },
            { $group: { _id: null, count: { $sum: 1 } } }
        ]);
        const totalArticlesSeen = articlesResult.length > 0 ? articlesResult[0].count : 0;

        // 3. Nombre total de partages (pour chaque réseau)
        const sharesResult = await AnalyticsEvent.aggregate([
            {
                $group: {
                    _id: null,
                    facebook: { $sum: "$actions.shares.facebook" },
                    linkedin: { $sum: "$actions.shares.linkedin" },
                    x: { $sum: "$actions.shares.x" }
                }
            }
        ]);
        const totalShares = sharesResult.length > 0 ? {
            facebook: sharesResult[0].facebook,
            linkedin: sharesResult[0].linkedin,
            twitter: sharesResult[0].twitter,
            total: sharesResult[0].facebook + sharesResult[0].linkedin + sharesResult[0].twitter
        } : { facebook: 0, linkedin: 0, twitter: 0, total: 0 };

        // 4. Nombre total de pays différents (en excluant les valeurs nulles)
        const countriesResult = await AnalyticsEvent.distinct("country", { country: { $ne: null } });
        const distinctCountries = countriesResult.length;

        // 5. Nombre de visiteurs uniques sur les 30 derniers jours
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const uniqueVisitorsLast30DaysResult = await AnalyticsEvent.distinct("hashedIp", { timestamp: { $gte: thirtyDaysAgo } });
        const uniqueVisitorsLast30Days = uniqueVisitorsLast30DaysResult.length;

        // 6. Les 5 articles les plus vus
        const topArticlesResult = await AnalyticsEvent.aggregate([
            { $unwind: "$articleIds" },
            { $group: { _id: "$articleIds", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, articleId: "$_id", count: 1 } }
        ]);

        return {
            totalVisitors,
            totalArticlesSeen,
            totalShares,
            distinctCountries,
            uniqueVisitorsLast30Days,
            top5Articles: topArticlesResult
        };
    } catch (error) {
        console.error("Erreur lors de l'agrégation :", error);
        throw error;
    }
};
