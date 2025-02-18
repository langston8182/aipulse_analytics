export class AnalyticsEvent {
    constructor(payload) {
        this.eventType = payload.eventType;
        this.hashedIp = payload.hashedIp;
        this.timestamp = payload.timestamp || new Date().toISOString();
        this.page = payload.page;
        this.articleId = payload.articleId;
        this.referrer = payload.referrer;
        this.deviceType = payload.deviceType;
        this.browser = payload.browser;
        this.country = payload.country;
        this.timeOnPage = payload.timeOnPage;
        this.actions = payload.actions;
    }
}
