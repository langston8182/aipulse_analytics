import {KinesisClient, PutRecordCommand} from '@aws-sdk/client-kinesis';

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
