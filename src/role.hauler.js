const helper = require('./helper');

module.exports = {
  // a function to run the logic for this role
  /**
   * carry
   * @param {Creep} creep creep to work
   */
  run: function(creep) {
    // switch states
    // if creep is bringing energy to a structure but has no energy left
    if (creep.memory.working == true && _.sum(_.keys(creep.store), (srcType) =>
      creep.store.getUsedCapacity(srcType)) == 0) {
      // switch state
      creep.memory.working = false;
    } else if (creep.memory.working == false && creep.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getCapacity(RESOURCE_ENERGY) * 0.5) {
      // if creep is harvesting energy but is full
      // switch state
      creep.memory.working = true;
    }

    // if creep is supposed to transfer energy to a structure
    if (creep.memory.working == true) {
      if (creep.room.name != creep.memory.home) {
        let standingAt = creep.room.lookForAt(LOOK_STRUCTURES, creep.pos);
        // Logger.info(creep.name, standingAt);
        standingAt = _.find(standingAt, (s) => s.hits < s.hitsMax - 1600);
        if (standingAt) {
          creep.repair(standingAt);
        }
        helper.moveHome(creep);
        return;
      }
      const path = ['mine', 'links', creep.memory.home, 'sender', creep.memory.target];
      let link = _.get(Memory, path);
      link = link ? Game.getObjectById(link) : link;
      // if (creep.name == 'carry-W31N11-W32N11-12') return;
      if (creep.memory.home == creep.room.name) {
        if (link && link.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
          creep.pos.inRangeTo(link, 5)) {
          return helper.payStructure(creep, link);
        } else {
          return helper.payAny(creep);
        }
      } else {
        return helper.moveHome(creep);
      }
    } else {
      // if creep is supposed to harvest energy from source
      // if in target room
      if (creep.room.name == creep.memory.target) {
        creep.say('mineral');
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) < 100 &&
          helper.withdrawContainer(creep, null, true)) return;
        creep.say('link');
        if (helper.withdrawLink(creep)) return;
        creep.say('loot mnr');
        if (helper.harvestLoot(creep, 10, false)) return;
        creep.say('loot');
        if (helper.harvestLoot(creep, 300, true)) return;
        creep.say('container');
        if (helper.withdrawContainerIfRich(creep)) return;
        creep.say('storage');
        if (helper.withdrawStorage(creep)) return;
        // if (creep.store.getUsedCapacity(RESOURCE_ENERGY) >
        //  creep.store.getCapacity(RESOURCE_ENERGY) * 0.5){
        //     creep.memory.working = true;
        // } else
        creep.say('edge')
        if (helper.isOnTheEdge(creep)) {
          creep.move(helper.isOnTheEdge(creep));
        }
        creep.say('none')
      } else {
        // if not in target room
        helper.moveTargetRoom(creep);
      }
    }
  },
};
