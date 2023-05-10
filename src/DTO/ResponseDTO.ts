export class ResponseDTO {
    status: number;
    msg: string;
    data: object;
    constructor(data: object, status = 200, msg = '') {
        this.status = status
        this.msg = msg
        this.data = data
    }
}
