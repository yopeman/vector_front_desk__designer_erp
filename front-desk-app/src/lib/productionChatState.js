let openProductionOrderId = null;

export function setOpenProductionChat(productionOrderId) {
  openProductionOrderId = productionOrderId;
}

export function getOpenProductionChat() {
  return openProductionOrderId;
}