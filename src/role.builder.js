const {
  BUILDER,
} = require('./helper');
require('./helper');
const helper = require('./helper');
const roleRepairer = require('./role.repairer');

/**
 *
 * @param {Creep} creep creep to exec
 * @returns {number} -1: quest not found; -2: moving to target room
 */
function findQuest(creep) {
  if (helper.moveTargetRoom(creep)) {
    return -2;
  } else {
    const c = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES);
    creep.memory.quest = c ? c.id : -1;
    return c ? c : -1;
  }
}

module.exports = {
  updateWorkingState: function(creep) {
    // if creep is trying to complete a constructionSite but has no energy left
    if (creep.memory.working == true && creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
      // switch state
      creep.memory.working = false;
    } else if (creep.memory.working == false && creep.store.getUsedCapacity(RESOURCE_ENERGY) ==
      creep.store.getCapacity(RESOURCE_ENERGY)) {
      // if creep is harvesting energy but is full
      // switch state
      creep.memory.working = true;
      findQuest(creep);
    }
  },
  // a function to run the logic for this role
  run: function(creep) {
    creep.say(BUILDER.slice(0, 1));

    // move to target room first
    if (helper.moveTargetRoom(creep)) {
      return;
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
          creep.myMoveTo(quest, {range: 3});
        }
      }
    } else {
      // if creep is supposed to harvest energy from source
      // creep.say('loot');
      // if (helper.harvestLoot(creep)) return;
      creep.say('store');
      if (helper.withdrawStorage(creep)) return;
      if (creep.getActiveBodyparts(WORK) > creep.body.length / 3) {
        return;
      }
      creep.say('can');
      if (helper.withdrawEnergy(creep)) return;
      creep.say('harv');
      helper.harvest(creep);
    }
  },
};
