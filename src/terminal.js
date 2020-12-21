
/**
 * this will attempt to sell any resource that is in excess
 * @param {StructureTerminal} terminal terminal
 */
function autoDealExcess(terminal) {
    const THRESHOLD = 100000;
    const MAX_PER_SELL = 10000;
    const TRANSITION_COST_RATIO = 0.75;


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

    const orders = Game.market.getAllOrders({type: ORDER_SELL, resourceType: srcType});
    for (const order of orders) {
        const amountToBuy = _.max([MAX_PER_SELL, order.amount]);
        const transferEnergyCost = Game.market.calcTransactionCost(
            amountToBuy, terminal.room.name, order.roomName);
    
        if(transferEnergyCost / amountToBuy < TRANSITION_COST_RATIO) {
            return Game.market.deal(order.id, amountToBuy, terminal.room.name);
        }
    }
}

module.exports = {
    autoDealExcess,
    
}