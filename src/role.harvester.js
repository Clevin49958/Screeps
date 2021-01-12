const {
  HARVESTER,
} = require('./helper');
const helper = require('./helper');
const { Logger } = require('./Logger');

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
    }
  },

  // a function to run the logic for this role
  run: function(creep) {
    creep.say(HARVESTER.slice(0, 1));

    if (creep.memory.working == true) {
      // if creep is supposed to transfer energy to the spawn or an extension
      /** @type {PayTask} */
      const task = global.creeps[creep.name].task;
      if (task) {
        Logger.trace(`Perform`, creep.name, task.constructor.name, task)
        task.aciton(creep);
      } else {
        helper.moveOffRoad(creep);
      }
    } else {
      // if creep is supposed to harvest energy from source
      if (Memory.states.restart[creep.memory.home]) {
        if (helper.withdrawEnergy(creep)) return;
      }
      helper.harvest(creep);
    }
  },
};
