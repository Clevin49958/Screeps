const {Logger} = require('./Logger');

/**
 * this will attempt to sell any resource that is in excess
 * @param {StructureTerminal} terminal terminal
 * @returns {number} ERR_* / OK
 */
function autoDealExcess(terminal) {
  const THRESHOLD = 100000;
  const MAX_PER_SELL = 10000;
  const TRANSITION_COST_RATIO = 1;


  if (terminal.cooldown > 0) {
    return ERR_TIRED;
  }
  let resourceType;
  for (const srcType in terminal.store) {
    if (Object.hasOwnProperty.call(terminal.store, srcType)) {
      const amount = terminal.store[srcType];
      if (srcType != RESOURCE_ENERGY && amount > THRESHOLD) {
        resourceType = srcType;
      }
    }
  }
  if (!resourceType) {
    return OK;
  }

  const orders = Game.market.getAllOrders({type: ORDER_BUY, resourceType: resourceType})
      .sort((a, b) => b.price - a.price);
  const minPrice = _.max([
    orders[0].price * 0.7,
    _.sum(orders.map((o) => o.price)) / orders.length,
  ]);
  for (const order of orders) {
    const amountToBuy = _.min([MAX_PER_SELL, order.amount]);
    const transferEnergyCost = Game.market.calcTransactionCost(
        amountToBuy, terminal.room.name, order.roomName);
    if (transferEnergyCost / amountToBuy < TRANSITION_COST_RATIO && order.price > minPrice) {
      if (terminal.store.energy < transferEnergyCost) {
        return ERR_NOT_ENOUGH_ENERGY;
      }
      const res = Game.market.deal(order.id, amountToBuy, terminal.room.name);
      const msg = `Sell ${order.roomName} for ${order.resourceType} @${amountToBuy}x$${order.price} res ${res}`;
      Logger.info(msg);
      Game.notify(msg);
      return res;
    }
  }

  return OK;
}

module.exports = {
  autoDealExcess,

};
