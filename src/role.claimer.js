const helper = require("./helper");

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {

        if (creep.room.name == creep.memory.target) {
            if (creep.room.controller) {
                var controller = creep.room.controller;
                if (creep.pos.isNearTo(creep.room.controller)){
                    if (!creep.room.controller.my && creep.room.controller
                        .owner) {
                        creep.attackController(creep.room.controller)
                    } else {
                        if (creep.claimController(creep.room.controller) == ERR_GCL_NOT_ENOUGH){
                            creep.reserveController(creep.room.controller);
                        }
                    }
                } else {
                    creep.myMoveTo(creep.room.controller);
                }
                
            }
        } else {
            helper.moveTargetRoom(creep);
        }
    }
};