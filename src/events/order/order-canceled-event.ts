import { Subjects } from "../subjects";

export interface OrderCanceledEvent {
  subject: Subjects.OrderCanceled;
  data: {
    id: string;
    version: number;
    ticket: {
      id: string;
    };
  };
}
