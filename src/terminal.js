const {Logger} = require('./Logger');
const MAX_ORDERS_PER_REPORT = 40;

/**
 * Send a report to user containing information on the last ${MAX_ORDERS_PER_REPORT} orders
 * 
 * The reports contain info on: amount, price per order and min,max,avg of each type
 * @param {string} tradeType type of trade, should be one of 'sell' or 'buy'
 */
function sendTradeReport(tradeType) {
  let msg, trades;

  /**
   * @type {Object.<string, Array.<{amount: number, price: number}>>} 
   */
  let details = {};

  // get orders
  if (tradeType == 'sell') {
    trades = Game.market.outgoingTransactions.filter(t => t.order);
  } else {
    trades = Game.market.incomingTransactions.filter(t => t.order);
  }
  
  // init msg
  if (trades.length > MAX_ORDERS_PER_REPORT) {
    trades.splice(MAX_ORDERS_PER_REPORT, trades.length - MAX_ORDERS_PER_REPORT);
  }
  msg = `Last ${trades.length} ${tradeType} orders: \n`;

  // extract amount and price info
  trades.forEach((sell => {
    if (!details[sell.resourceType]) {
      details[sell.resourceType] = [];
    }

    details[sell.resourceType].push(({
      amount: sell.amount,
      price: sell.order.price
    }))
  }));

  // format message
  for (const resourceType in details) {
    if (Object.hasOwnProperty.call(details, resourceType)) {
      // sort orders by price then amount in descending order
      const orders = _.sortByOrder(details[resourceType], ['price', 'amount'], ['desc', 'desc']);

      msg += `\t${resourceType}: \n`;

      // each order
      orders.forEach((order) => {
        msg += `\t\t${order.amount.toString().padStart(5, ' ')} @ ${order.price.toFixed(3)}\n`;
      })

      // min, max, avg
      const minPrice = _.min(orders.map(o => o.price));
      const maxPrice = _.max(orders.map(o => o.price));
      const totalPrice = _.sum(orders.map(o => o.price * o.amount));
      const totalAmount = _.sum(orders.map(o => o.amount));
      msg += `\tMin: ${minPrice.toFixed(3)} Max: ${maxPrice.toFixed(3)} Avg: ${(totalPrice / totalAmount).toFixed(4)}\n\n`;
    }
  }
  console.log(msg);
  Game.notify(msg);
}

/**
 * this will increase Memory.stats.stackedSellOrder by 1
 * and for every ${MAX_ORDERS_PER_REPORT} orders, push a notification to user
 */
function trackSellOrder() {

  if (Memory.stats.stackedSellOrder === undefined) {
    Memory.stats.stackedSellOrder = 0;
  } else {
    Memory.stats.stackedSellOrder += 1;
  }
  if (!Memory.stats.stackedSellOrder % MAX_ORDERS_PER_REPORT) {
    sendTradeReport('sell');
  }
}

/**
 * this will attempt to sell any resource that is in excess
 * @param {StructureTerminal} terminal terminal
 * @returns {number} ERR_* / OK
 */
function autoDealExcess(terminal) {
  const THRESHOLD = 80000;
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

  // // if we intend to unclaim the room
  // if (terminal.room.name == 'W36N9' && terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 100000) {
  //   terminal.send(RESOURCE_ENERGY, 95000, 'W35N12');
  // }

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
      trackSellOrder();
      // Game.notify(msg);
      return res;
    }
  }

  return OK;
}

module.exports = {
  autoDealExcess,
  sendTradeReport
};
