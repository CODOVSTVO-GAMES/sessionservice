import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitService } from './rabbit.service';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'monitoring-module',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://test:test@rabbit:5672'],
                    queue: 'to_monitoring_service',
                },
            },
        ]),
    ],
    controllers: [],
    providers: [RabbitService],
    exports: [RabbitService]
})
export class RabbitModule { }
