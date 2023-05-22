export class ResonseDataDTO {
    sessionHash: string
    sessionId: number
    serverTime: number
    constructor(sessionHash: string, sessionId: number, serverTime: number) {
        this.sessionHash = sessionHash
        this.sessionId = sessionId
        this.serverTime = serverTime
    }
}
