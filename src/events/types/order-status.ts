export enum OrderStatus {
  // When the order has been created, but the ticket it is trying to order has not been reserved
  Created = "created",
  // The ticket the order is trying to reserve is already reserved or the user has canceled the order or the order expires before payment
  Canceled = "canceled",
  // The order has successfully reserved the ticket
  AwaitingPayment = "awaiting:payment",
  // The order has reserved the ticket and the user has successfully provided payment
  Complete = "complete",
}
