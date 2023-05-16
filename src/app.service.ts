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

    async sessionResponser(data: any){
        const responseDTO = new ResponseDTO()
        let status = 200

        try{
            const resonseDataDTO = await this.sessionHandler(data)
            responseDTO.data = resonseDataDTO
        }
        catch (e){
            if (e == 'sessions not found' || e == 'session expired'){
                status = 403//перезапуск клиента
            }
            else if (e == 'server hash bad' || e == 'server DTO bad'){
                status = 401//активно сигнализировать в логи
            }else if(e == 'too many requests'){
                status = 429//повторить запрос позже
            }else if (e == 'parsing data error'){
                status = 400 //сервер не знает что делать
            }else{
                status = 400
            }
            console.log("Ошибка " + e)
        }
        responseDTO.status = status

        return responseDTO
    }

    async sessionHandler(data: any) : Promise<ResonseDataDTO>{
        let requestDTO;
        try {
            requestDTO = new RequestDTO(data.data, data.serverHash)
        } catch (e) {
            throw "server DTO bad"
        }

        if (this.isServerHashBad(requestDTO.serverHash)) {
            throw "server hash bad"
        }

        let dataDTO
        try {
            const obj = JSON.parse(JSON.stringify(requestDTO.data))
            dataDTO = new DataDTO(obj.userId, obj.sessionHash, obj.sessionId)
        } catch (e) {
            throw "parsing data error"
        }

        return this.sessionLogic(dataDTO)
    }


    async sessionLogic(dataDTO: DataDTO) : Promise<ResonseDataDTO>{

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
                    throw "too many requests"
                }
                await this.deactivateOldSession(sessions)
            }

            const session = await this.createSessionByUserId(userId)
            return new ResonseDataDTO(session.sessionHash, session.sessionId)
        }
        else{//проверка активной сессии
            //если сессия существует прислать айди сессии,  хэш
            const session = await this.findActiveSessionBySessionId(sessionId)

            if (session){
                if (session.sessionHash = sessionHash){
                    const updatedSession = await this.updateLastActiveDateAndHashBySession(session)
                    return new ResonseDataDTO(updatedSession.sessionHash, updatedSession.sessionId)
                }
                else{
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
                    createDate: Date.now(),
                    lastActive: Date.now(),
                }
            )
        )
        return session
    }

    isSessionCreatedRecently(sessions : Array<ActiveSession>) : boolean{
        for(let l = 0; l < sessions.length; l++ ){
            if (Date.now() - sessions[l].createDate < 1000){
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

    async updateLastActiveDateAndHashBySession(session: ActiveSession) : Promise<ActiveSession> {
        session.lastActive = Date.now()
        session.sessionHash = this.getRandomMd5Hash()
        await this.activeSessionRepo.save(session)
        return session
    }

    isServerHashBad(serverHash: string) : boolean{
        if (serverHash == '89969458273-the-main-prize-in-the-show-psychics'){
            return false
        }
        return true
    }


    //------------Перенести в другой сервис!!!------------>

    async sessionValidatorResponser(data: any){
        const responseDTO = new ResponseDTO()
        let status = 200

        try{
            const resonseDataDTO = await this.sessionValidatorHandler(data)
            responseDTO.data = resonseDataDTO
        }
        catch (e){//прописать разные статусы
            status = 400
            console.log("Ошибка " + e)
        }
        responseDTO.status = status

        return responseDTO
    }

    async sessionValidatorHandler(data: any) : Promise<ResonseDataDTO>{
        let requestDTO;
        try {
            requestDTO = new RequestDTO(data.data, data.serverHash)
        } catch (e) {
            throw "parsing error"
        }

        if (this.isServerHashBad(requestDTO.serverHash)) {
            throw "server hash bad"
        }

        let dataDTO
        try {
            const obj = JSON.parse(JSON.stringify(requestDTO.data))
            dataDTO = new DataDTO(obj.userId, obj.sessionHash, obj.sessionId)
        } catch (e) {
            throw "parsing error"
        }

        return this.sessionValidatorLogic(dataDTO)
    }

    async sessionValidatorLogic(dataDTO : DataDTO) : Promise<ResonseDataDTO>{

        const session = await this.findActiveSessionBySessionId(dataDTO.sessionId)

        console.log(dataDTO)
        console.log(session?.sessionHash)

        if (session && session.sessionHash == dataDTO.sessionHash){
            return new ResonseDataDTO(session.sessionHash, session.sessionId)
        }
        else{
            throw "bad"
        }
    }
    
}


