import { Injectable } from '@nestjs/common';
import { RequestDTO } from './DTO/RequestDTO';
import { ResponseDTO } from './DTO/ResponseDTO';
import { DataDTO } from './DTO/DataDTO';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActiveSession } from './models/activeSession';
import { ResonseDataDTO } from './DTO/ResponseDataDTO';
import * as crypto from 'crypto';


@Injectable()
export class AppService {
    
    constructor(
        @InjectRepository(ActiveSession) private activeSessionRepo: Repository<ActiveSession>
    ){}


    async session(data: any) {
        let requestDTO;
        try {
            const obj = JSON.parse(data)
            requestDTO = new RequestDTO(obj.data, obj.serverHash)
        } catch (e) {
            console.log("--->error! " + e)
            return new ResponseDTO({}, 400, 'json parse error')
        }

        //----------------------------------------------------------

        if (requestDTO.serverHash != '89969458273-the-main-prize-in-the-show-psychics') {
            return new ResponseDTO({}, 400, 'token is bad')
        }

        //----------------------------------------------------------

        let dataDTO
        try {
            const obj = JSON.parse(JSON.stringify(requestDTO.data))
            dataDTO = new DataDTO(obj.userId, obj.sessionHash, obj.sessionId)
        } catch (e) {
            console.log("error!2 " + e)
            return new ResponseDTO({}, 400, 'json parse error')
        }

        //----------------------------------------------------------

        console.log(dataDTO)

        const userId = dataDTO.userId;
        const sessionHash = dataDTO.sessionHash;
        const sessionId = dataDTO.sessionId;


        if (sessionId == 0) {//выполняется при запуске/перезапуске игры
            //если сессии нет создать новую сессию
            //если сессия существует закрыть старые создать новую

            const sessions = await this.findAllSessionByUserId(userId)

            if (sessions.length > 0){
                //LOG у пользователя больше 1 сессии

                if (this.isSessionCreatedRecently(sessions)){
                    // LOG кто то часто стучится
                    return new ResponseDTO({}, 403, 'Задержка, предохраняйтесь')
                }
                await this.deactivateOldSession(sessions)
            }

            const session = await this.createSessionByUserId(userId)

            const responseDataDto = new ResonseDataDTO(session.sessionHash, session.sessionId)

            return new ResponseDTO(responseDataDto)
        }
        else{//проверка активной сессии
            //если сессия существует прислать айди сессии,  хэш
            const session = await this.findActiveSessionBySessionId(sessionId)

            if (session){
                if (session.sessionHash = sessionHash){
                    const updatedSession = this.updateLastActiveDateAndHashBySession(session)
                    const responseDataDto = new ResonseDataDTO(updatedSession.sessionHash, updatedSession.sessionId)
                    return new ResponseDTO(responseDataDto)
                }
                else{
                    //LOG
                    return new ResponseDTO({}, 403, 'Сессия устарела')
                }
            }
            else {
                //LOG
                return new ResponseDTO({}, 403, 'Сессий н найдено')
            }
        }
    }

    async findAllSessionByUserId(userId : string) {
        return this.activeSessionRepo.find(
            {
                where: {
                    userId: userId
                }
            }
        )
    }

    async createSessionByUserId(userId: string){
        const session = this.activeSessionRepo.save(
            this.activeSessionRepo.create(
                {
                    userId: userId,
                    sessionHash: this.getRandomMd5Hash(),
                    isActive: true,
                    createDateLong: Date.now(),
                    lastActive: Date.now(),
                }
            )
        )
        return session
    }

    isSessionCreatedRecently(sessions : Array<ActiveSession>) : boolean{
        for(let l = 0; l < sessions.length; l++ ){
            if (Date.now() - sessions[l].createDateLong < 1000){
                return true
            }
        }
        return false
    }

    async deactivateOldSession(sessions : Array<ActiveSession>){
        sessions.forEach(async element => {
            element.isActive = false
            await this.activeSessionRepo.save(element)
        })
    }

    getRandomMd5Hash() {
        return crypto.createHash('md5').update(Math.random().toString()).digest('hex')
    }

    async findActiveSessionBySessionId(sessionId : number) {
        const session = await this.activeSessionRepo.findOne(
            {
                where: {
                    sessionId: sessionId,
                    isActive: true
                }
            }
        )
        return session
    }

    updateLastActiveDateAndHashBySession(session: ActiveSession) : ActiveSession {
        session.lastActive = Date.now()
        session.sessionHash = this.getRandomMd5Hash()
        this.activeSessionRepo.save(session)
        return session
    }
    
}


