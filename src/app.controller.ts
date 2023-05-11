import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern } from '@nestjs/microservices';
import { ResponseDTO } from './DTO/ResponseDTO';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @EventPattern('to_session_service')
    async getHello(data: any): Promise<ResponseDTO> {
        return await this.appService.sessionResponser(data)
    }

    @EventPattern('validate_session')
    async sessionValidator(data: any): Promise<any> {
        return await this.appService.sessionValidatorResponser(data)
    }

}
