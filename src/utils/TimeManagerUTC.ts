export default class TimeManagerUTC {
    private currentTime: Date;

    constructor() {
        this.currentTime = new Date();
    }

    getCurrentTime(): Date {
        return this.currentTime;
    }

    addTime(hours: number = 0, minutes: number = 0, seconds: number = 0): void {
        this.currentTime.setUTCHours(this.currentTime.getUTCHours() + hours);
        this.currentTime.setUTCMinutes(this.currentTime.getUTCMinutes() + minutes);
        this.currentTime.setUTCSeconds(this.currentTime.getUTCSeconds() + seconds);
    }

    subtractTime(hours: number = 0, minutes: number = 0, seconds: number = 0): void {
        this.currentTime.setUTCHours(this.currentTime.getUTCHours() - hours);
        this.currentTime.setUTCMinutes(this.currentTime.getUTCMinutes() - minutes);
        this.currentTime.setUTCSeconds(this.currentTime.getUTCSeconds() - seconds);
    }

    formatTime(format: string = 'HH:mm:ss'): string {
        const hours = this.currentTime.getUTCHours().toString().padStart(2, '0');
        const minutes = this.currentTime.getUTCMinutes().toString().padStart(2, '0');
        const seconds = this.currentTime.getUTCSeconds().toString().padStart(2, '0');

        return format.replace('HH', hours).replace('mm', minutes).replace('ss', seconds);
    }
    isFirstDateLessThanSecond(date1: Date, date2: Date): boolean {
        return date1.getTime() < date2.getTime();
    }
}
