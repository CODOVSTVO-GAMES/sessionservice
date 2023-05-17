import { Global, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { timeout } from 'rxjs';
import { MonitoringDTO } from 'src/DTO/MonitoringDTO';
import { RequestServiceDTO } from 'src/DTO/RequestServiceDTO';

@Global()
@Injectable()
export class RabbitService {
    constructor(@Inject('monitoring-module') private readonly monitoringClient: ClientProxy) { }

    sendLog(service: string, requestName: string, status: number, msg: string, data: string, time = 0) {
        const monitoringDTO = new MonitoringDTO(service, requestName, status, msg, data, time)
        this.questionerMonitoring(new RequestServiceDTO(monitoringDTO), 'send_log')
    }

    private async questionerMonitoring(data: RequestServiceDTO, queue: string) {
        try {
            this.monitoringClient.send(queue, data).pipe(timeout(10000))
        } catch (e) {
            if (e.message == 'Timeout has occurred') {
                throw "timeout"
            }
            else if (e.err.code == 'ECONNREFUSED') {
                this.monitoringClient.close()
                throw "ECONNREFUSED"
            } else {
                console.log("Ошибка не обрабатывается")
                console.log(e)
                throw "unkown"
            }
        }
    }
}
