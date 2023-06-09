import { Injectable, Inject } from '@nestjs/common';
import { ResponseDTO } from './DTO/ResponseDTO';
import { DataDTO } from './DTO/DataDTO';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveSession } from './models/activeSession';
import { ResonseDataDTO } from './DTO/ResponseDataDTO';
import * as crypto from 'crypto';
import { LoggerService } from './logger/logger.service';


@Injectable()
export class AppService {

    constructor(
        @InjectRepository(ActiveSession) private activeSessionRepo: Repository<ActiveSession>,
    ) { }

    @Inject(LoggerService)
    private readonly loggerService: LoggerService

    async sessionResponser(data: any) {
        const responseDTO = new ResponseDTO()
        let status = 200

        try {
            const dataDTO = new DataDTO(data.accountId, data.sessionHash, data.sessionId)
            responseDTO.data = await this.sessionLogic(dataDTO)
        }
        catch (e) {
            if (e == 'sessions not found' || e == 'session expired') {
                status = 403//перезапуск клиента
            }
            else if (e == 'too many requests') {
                status = 429//повторить запрос позже
            } else if (e == 'parsing data error') {
                status = 400 //сервер не знает что делать
            } else {
                status = 400
            }
            console.log("Ошибка " + e)
        }
        responseDTO.status = status

        return responseDTO
    }

    async sessionLogic(dataDTO: DataDTO): Promise<ResonseDataDTO> {

        const accountId = dataDTO.accountId;
        const sessionHash = dataDTO.sessionHash;
        const sessionId = dataDTO.sessionId;

        if (sessionId == 0) {//выполняется при запуске/перезапуске игры
            //если сессии нет создать новую сессию
            //если сессия существует закрыть старые создать новую

            const sessions = await this.findAllSessionByAccountId(accountId)

            if (sessions.length > 0) {
                //LOG у пользователя больше 1 сессии

                if (this.isSessionCreatedRecently(sessions)) {
                    // LOG кто то часто стучится
                    throw "too many requests"
                }
                await this.deactivateOldSession(sessions)
            }

            const session = await this.createSessionByAccountId(accountId)
            return new ResonseDataDTO(session.sessionHash, session.sessionId, Date.now())
        }
        else {//проверка активной сессии
            //если сессия существует прислать айди сессии,  хэш
            const session = await this.findActiveSessionBySessionId(sessionId)

            if (session) {
                if (session.sessionHash == sessionHash) {
                    const updatedSession = await this.updateLastActiveDateAndHashBySession(session)
                    console.log('сессия обновлена')
                    return new ResonseDataDTO(updatedSession.sessionHash, updatedSession.sessionId, updatedSession.lastActive)
                }
                else {
                    //LOG
                    throw "session expired"
                }
            }
            else {
                //LOG
                throw "sessions not found"
            }
        }
    }

    async findAllSessionByAccountId(accountId: string) {
        return this.activeSessionRepo.find(
            {
                where: {
                    accountId: accountId
                }
            }
        )
    }

    async createSessionByAccountId(accountId: string) {
        const session = this.activeSessionRepo.save(
            this.activeSessionRepo.create(
                {
                    accountId: accountId,
                    sessionHash: this.getRandomMd5Hash(),
                    isActive: true,
                    createDate: Date.now(),
                    lastActive: Date.now(),
                }
            )
        )
        return session
    }

    isSessionCreatedRecently(sessions: Array<ActiveSession>): boolean {
        for (let l = 0; l < sessions.length; l++) {
            if (Date.now() - sessions[l].createDate < 1000) {
                return true
            }
        }
        return false
    }

    async deactivateOldSession(sessions: Array<ActiveSession>) {
        sessions.forEach(async element => {
            element.isActive = false
            await this.activeSessionRepo.save(element)
        })
    }

    getRandomMd5Hash() {
        return crypto.createHash('md5').update(Math.random().toString()).digest('hex')
    }

    async findActiveSessionBySessionId(sessionId: number) {
        const session = await this.activeSessionRepo.findOne(
            {
                where: {
                    sessionId: sessionId,
                    isActive: true
                }
            }
        )
        if (session) {
            await this.updateLastActiveDateBySession(session)
        }
        return session
    }

    async updateLastActiveDateAndHashBySession(session: ActiveSession): Promise<ActiveSession> {
        session.sessionHash = this.getRandomMd5Hash()
        session = await this.updateLastActiveDateBySession(session)
        this.activeSessionRepo.save(session)
        return session
    }

    async updateLastActiveDateBySession(session: ActiveSession): Promise<ActiveSession> {
        session.lastActive = Date.now()
        await this.activeSessionRepo.save(session)
        return session
    }

    //------------Перенести в другой сервис!!!------------>

    async sessionValidatorResponser(data: any) {
        const responseDTO = new ResponseDTO()
        let status = 200

        try {
            const dataDTO = new DataDTO(data.accountId, data.sessionHash, data.sessionId)
            const resonseDataDTO = await this.sessionValidatorLogic(dataDTO)
            responseDTO.data = resonseDataDTO
        }
        catch (e) {
            status = 400
            console.log("Ошибка " + e)
        }
        responseDTO.status = status

        return responseDTO
    }

    async sessionValidatorLogic(dataDTO: DataDTO): Promise<ResonseDataDTO> {
        const session = await this.findActiveSessionBySessionId(dataDTO.sessionId)
        if (session && session.sessionHash == dataDTO.sessionHash) {
            this.updateLastActiveDateBySession(session)
            return new ResonseDataDTO(session.sessionHash, session.sessionId, session.lastActive)
        }
        else {
            console.log(session?.sessionHash)
            console.log(dataDTO.sessionHash)
            //переписать сессии по другому
            throw "bad"
        }
    }

}


