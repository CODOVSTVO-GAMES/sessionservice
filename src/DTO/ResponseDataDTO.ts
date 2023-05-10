export class ResonseDataDTO {
    sessionHash: string;
    sessionId: number;
    constructor( sessionHash: string, sessionId: number) {
        this.sessionHash = sessionHash
        this.sessionId = sessionId
    }
}
