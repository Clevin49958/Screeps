const helper = require('./helper');

module.exports = {
  // a function to run the logic for this role
  run: function(creep) {
    if (!creep.memory.quest && Game.rooms[creep.memory.target]) {
      creep.memory.quest = Game.rooms[creep.memory.target].controller.id;
    }
    if (helper.moveTargetRoom(creep)) {
      return;
    }
    
    if (creep.memory.quest) {
      const controller = Game.getObjectById(creep.memory.quest);
      if (creep.pos.isNearTo(controller)) {
        if (!controller.my && controller
            .owner) {
          creep.attackController(controller);
        } else {
          if (_.keys(Memory.myRooms).includes(creep.memory.target)) {
            creep.claimController(controller)
          } else {
            creep.reserveController(controller);
          }
        }
      } else {
        creep.myMoveTo(controller);
      }
    }
  },
};
