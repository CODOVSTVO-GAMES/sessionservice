import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class OldSession {
    @PrimaryGeneratedColumn({type: "bigint"})
    sessionId: number;

    @Column()
    userId: string

    @Column({type: "bigint"})
    length: number

    @Column({type:"time with time zone"})
    startDate: Date

    @Column({type:"time with time zone"})
    endDate : Date
}