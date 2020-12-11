const {
  BUILDER,
} = require('./helper');
require('./helper');
const helper = require('./helper');
const roleRepairer = require('./role.repairer');

/**
 *
 * @param {Game.Creep} creep
 * @return {number} -1: quest not found; -2: moving to target room
 */
function findQuest(creep) {
  if (creep.memory.target && creep.memory.target != creep.room.name) {
    helper.moveTargetRoom(creep);
    return -2;
  } else {
    const c = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
    creep.memory.quest = c ? c.id : -1;
    return c ? c : -1;
  }
}

module.exports = {
  // a function to run the logic for this role
  run: function(creep) {
    creep.say(BUILDER.slice(0, 1));

    // if (!creep.memory.quest) {
    //     if (Game.rooms[creep.memory.target]){
    //         findQuest(creep);
    //     } else {
    //         helper.moveTargetRoom(creep);
    //     }
    // }

    // if creep is trying to complete a constructionSite but has no energy left
    if (creep.memory.working == true && creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
      // switch state
      creep.memory.working = false;
    } else if (creep.memory.working == false && creep.carry.energy ==
      creep.carryCapacity) {
      // if creep is harvesting energy but is full
      // switch state
      creep.memory.working = true;
      findQuest(creep);
    }

    // if creep is supposed to complete a constructionSite
    if (creep.memory.working == true) {
      let quest = Game.getObjectById(creep.memory.quest);

      if (!quest) {
        quest = findQuest(creep);
      }

      if (quest == -2) {
        return true;
      } else if (quest == -1) {
        roleRepairer.run(creep);
      } else {
        if (creep.build(quest) == ERR_NOT_IN_RANGE) {
          creep.myMoveTo(quest);
        }
      }
    } else {
      // if creep is supposed to harvest energy from source
      creep.say('loot');
      if (helper.harvestLoot(creep)) return;
      creep.say('can');
      if (helper.withdrawEnergy(creep)) return;
      if (helper.withdrawStorage(creep)) return;
      // helper.harvest(creep);
    }
  },
};
