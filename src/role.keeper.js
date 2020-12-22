const helper = require('./helper');
const { Logger } = require('./Logger');


/**
 * find a list of structures of specific type near creep
 * @param {Creep} creep the creep to find
 * @param {number} structureType one of the STRUCTURE_* constants
 */
function findStructureNearCreep(creep, structureType) {
  return creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: s => 
    s.structureType == structureType
  });
}

module.exports = {
  /**
   * 
   * @param {Creep} creep creep
   */
  run: function(creep) {
    
    // if arrived
    if (creep.memory.arrived == true) {
      
      let withdrawList = creep.memory.withdrawList;
      withdrawList = withdrawList ? withdrawList.map(s => Game.getObjectById(s)) : [];
      let payList = creep.memory.payList;
      payList = payList ? payList.map(s => Game.getObjectById(s)) : [];

      if (withdrawList.length == 0) {
        /* withdraw from: 
         * link
         * storage
        */
        const links = findStructureNearCreep(creep, STRUCTURE_LINK);
        const storages = findStructureNearCreep(creep, STRUCTURE_STORAGE);
        // probs only one each
        links.forEach(l => withdrawList.push(l));
        storages.forEach(s => withdrawList.push(s));
      }

      if (payList.length == 0) {
        /* pay to:
        - A spawn
        - An extension / a second tower?
        - A tower
        - A power spawn
        - The Storage
        */
        findStructureNearCreep(creep, STRUCTURE_SPAWN).forEach(s => payList.push(s));
        findStructureNearCreep(creep, STRUCTURE_EXTENSION).forEach(s => payList.push(s));
        findStructureNearCreep(creep, STRUCTURE_TOWER).forEach(s => payList.push(s));
        findStructureNearCreep(creep, STRUCTURE_POWER_SPAWN).forEach(s => payList.push(s));
        findStructureNearCreep(creep, STRUCTURE_STORAGE).forEach(s => payList.push(s));
      }

      if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
        for (const structure of payList) {
          if (structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            creep.transfer(structure, RESOURCE_ENERGY);
            break;
          }
        }
      } else {
        for (const structure of withdrawList) {
          if (structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
            creep.withdraw(structure, RESOURCE_ENERGY);
            break;
          }
        }
      }
    } else {
      // detect flag
      const flag = Game.flags[`keeper-${creep.room.name}`];
      if (flag) {
        if (creep.pos.isEqualTo(flag)) {
          creep.memory.arrived = true;
        } else {
          // move to flag
          if (creep.getActiveBodyparts(MOVE) == 0) {
            Logger.error('Creep is not arrived and is unable to move', creep.name);
          } else {
            creep.myMoveTo(flag);
          }
        }
      } else {
        // keeper spawned but no flag found
        Logger.error('no flag detected for ', creep.name);
      }
    }
  }
};
