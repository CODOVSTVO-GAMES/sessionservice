import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class OldSession {
    @PrimaryGeneratedColumn({type: "bigint"})
    sessionId: number;

    @Column()
    userId: string

    @Column({type: "bigint"})
    length: number

    @Column({type: "bigint"})
    startDate: number

    @Column({type: "bigint"})
    endDate : number
}