const helper = require('./helper');
const {Logger} = require('./Logger');

module.exports = {
  /**
   * Miner will harvest mineral from creep.memory.target (room), and store in a terminal if in reach
   * @param {Creep} creep 
   */
  run: function(creep) {
    if (Game.rooms[creep.memory.target]) {
      if (!creep.memory.source) {
        if (Game.rooms[creep.memory.target]) {
          const mineral = Game.rooms[creep.memory.target].find(FIND_MINERALS)[0];
          creep.memory.source = mineral.id;
          creep.memory.mineralType = mineral.mineralType;
        } else {
          return helper.moveTargetRoom(creep);
        }
      }
      if (!creep.memory.extractor) {
        const extractors = Game.rooms[creep.memory.target].find(
            FIND_STRUCTURES, {filter: (s) =>
              s.structureType == STRUCTURE_EXTRACTOR,
            });
        if (extractors.length) {
          creep.memory.extractor = extractors[0].id;
        } else {
          Logger.warn(creep.memory.target, 'no extractor found');
          return;
        }
      }
    }
    
    // console.log(creep.name,JSON.stringify(Game.getObjectById(creep.memory.source)))
    const source = Game.getObjectById(creep.memory.source);
    const extractor = Game.getObjectById(creep.memory.extractor);
    const terminal = Game.getObjectById(creep.memory.terminal);
    // if arrived
    if (creep.memory.arrived == true) {
      creep.say(extractor.cooldown);
      if (!creep.memory.terminal) {
        const terminals = creep.pos.findInRange(
            FIND_STRUCTURES, 1, {filter: (s) =>
              s.structureType == STRUCTURE_TERMINAL,
            });
        if (terminals.length) {
          creep.memory.terminal = terminals[0].id;
          terminal = terminals[0];
        } 
      }
      if (source.mineralAmount > 0 && extractor.cooldown === 0) {
        creep.harvest(source);
      } else {
        if (terminal && creep.store.getUsedCapacity(creep.memory.mineralType) > 0){
          creep.transfer(terminal, creep.memory.mineralType);
        }
      }
    } else if (creep.pos.inRangeTo(source, 2)) {
      let container = creep.pos.findInRange(FIND_STRUCTURES,
          2, {
            filter: (s) => s.structureType ==
                        STRUCTURE_CONTAINER,
          });
      if (container.length == 0) {
        container = creep.pos.findInRange(
            FIND_CONSTRUCTION_SITES, 2);
      }
      if (container.length == 0) {
        if (creep.pos.isNearTo(source)) {
          creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
        } else {
          creep.myMoveTo(source);
          return true;
        }
      }
      if (creep.pos.isEqualTo(container[0])) {
        creep.memory.arrived = true;
        creep.harvest(source);
      } else {
        creep.myMoveTo(container[0]);
      }
    } else {
      // TODO: error will occur when creep has no vision to source
      creep.myMoveTo(source);
    }
  },
};
