import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { AnalyticsEvent } from "../models/analytic_schema.model.mjs";

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

export const sendAnalyticsEvent = async (analyticsEvent) => {
    const queueUrl = process.env.SQS_QUEUE_URL;
    const dataString = JSON.stringify(analyticsEvent);

    const params = {
        QueueUrl: queueUrl,
        MessageBody: dataString,
    };

    try {
        const command = new SendMessageCommand(params);
        return await sqsClient.send(command);
    } catch (error) {
        console.error('Erreur lors de l’envoi vers SQS :', error);
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
            x: sharesResult[0].x,
            total: sharesResult[0].facebook + sharesResult[0].linkedin + sharesResult[0].x
        } : { facebook: 0, linkedin: 0, x: 0, total: 0 };

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

        // 7. Visites uniques par jour sur les 30 derniers jours
        const dailyUniqueVisitsResult = await AnalyticsEvent.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    uniqueVisitors: { $addToSet: "$hashedIp" }
                }
            },
            {
                $project: {
                    date: "$_id",
                    uniqueCount: { $size: "$uniqueVisitors" },
                    _id: 0
                }
            },
            { $sort: { date: 1 } }
        ]);

        return {
            totalVisitors,
            totalArticlesSeen,
            totalShares,
            distinctCountries,
            uniqueVisitorsLast30Days,
            top5Articles: topArticlesResult,
            dailyUniqueVisits: dailyUniqueVisitsResult
        };
    } catch (error) {
        console.error("Erreur lors de l'agrégation :", error);
        throw error;
    }
};
