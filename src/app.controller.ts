import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('user_created')
  getHello(data:any): any {
    console.log(data)
    //{"status": 200, "msg":"", "sessionId":"feefef", "hash": "session.hash"}
    return {"status": 200, "msg":"", "sessionId":"feefef", "hash": "session.hash"};
  }
}
