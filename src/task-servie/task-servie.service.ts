import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveSession } from 'src/models/activeSession';
import { OldSession } from 'src/models/oldSession';
import { Repository, LessThan } from 'typeorm';

@Injectable()
export class TaskServieService {

    constructor(
        @InjectRepository(ActiveSession) private activeSessionRepo: Repository<ActiveSession>,
        @InjectRepository(OldSession) private oldSessionRepo: Repository<OldSession>
    ){}

    @Cron(CronExpression.EVERY_5_MINUTES)
    async closeSessionByOffline5min(){
        const sessions = await this.findAllSessionByLastActiveLong5minAndIsActive()
        for( let l = 0; l < sessions.length; l++ ){
            sessions[l].isActive = false
            await this.activeSessionRepo.save(sessions[l])
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async closeSessionLongDay(){
        const sessions = await this.findAllSessionByLastActiveLongDAYAndIsActive()
        for( let l = 0; l < sessions.length; l++ ){
            sessions[l].isActive = false
            await this.activeSessionRepo.save(sessions[l])
        }
        //log закрыта сессия открытая сутки!!!! ПОЧЕМУ?
    }
    @Cron(CronExpression.EVERY_MINUTE)
    async movieOldSession(){
        const sessions = await this.findAllSessionByIsActiveFalse()
        await this.saveOldSessionByYongSession(sessions)
    }

    async findAllSessionByIsActiveFalse() : Promise<ActiveSession[]>{
        const sessions = await this.activeSessionRepo.find(
            {
                where: {
                    isActive: false
                }
            }
        )
        return sessions
    }

    async saveOldSessionByYongSession(sessions: Array<ActiveSession>){
        for(let l = 0; l < sessions.length; l++ ){
            const session = sessions[l]

            const sessionId = session.sessionId
            const userId = session.userId
            const startDate = session.createDate
            const endDate = session.lastActive
            const length = startDate - endDate
            await this.createOldSession(sessionId, userId, length, startDate, endDate)
            await this.activeSessionRepo.delete(session)
        }
    }

    async createOldSession(sessionId: number, userId: string, length: number, startDate: number, endDate: number){
        const session = await this.oldSessionRepo.save(
            this.oldSessionRepo.create(
                {
                    sessionId: sessionId,
                    userId: userId,
                    length: length,
                    startDate: startDate,
                    endDate: endDate
                }
            )
        )
        return session
    }

    async findAllSessionByLastActiveLong5minAndIsActive() {
        const borderDate = Date.now() - 300000
        const sessions = await this.activeSessionRepo.find(
            {
                where: {
                    isActive: true,
                    lastActive: LessThan(borderDate)
                }
            }
        )
        return sessions
    }

    async findAllSessionByLastActiveLongDAYAndIsActive() {
        const borderDate = Date.now() - 86400000
        const sessions = await this.activeSessionRepo.find(
            {
                where: {
                    isActive: true,
                    lastActive: LessThan(borderDate)
                }
            }
        )
        return sessions
    }
}
