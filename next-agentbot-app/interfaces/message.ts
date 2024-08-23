export interface IMessage {
  user_type: UserType;
  message: string;
  send_date: Date;
}

export enum UserType {
  USER = "User",
  BOT = "Bot",
}

export interface ISendMessage {
  role: string;
  message: string;
}

//대화이력챗봇 전용 메시지 타입 정의: 기본메시지타입 상속받아 기능확장함
export interface IMemberMessage extends IMessage {
  nick_name: string;
}
