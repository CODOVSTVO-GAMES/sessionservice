import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ActiveSession {
    @PrimaryGeneratedColumn({type: "bigint"})
    sessionId: number;

    @Column()
    userId: string

    @Column()
    sessionHash: string

    @Column({type: "bigint"})
    lastActive: number

    @Column()
    isActive: boolean

    @Column({type: "bigint"})
    createDate: number
}