import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @EventPattern('to_session_service')
    getHello(data: any): any {
        return this.appService.session(data)
    }

}
