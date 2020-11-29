const helper = require("./helper");

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        
        if (!creep.memory.home) {
            helper.recycle(creep);
            return;
        }

        if (creep.room.name == creep.memory.target) {
            if (creep.room.controller) {
                if (!creep.room.controller.my && creep.room.controller
                    .owner) {
                    if (creep.attackController(creep.room.controller) ==
                        ERR_NOT_IN_RANGE) {
                        creep.myMoveTo(creep.room.controller);
                    }
                } else {
                    if (creep.room.controller.isActive()) {
                        if (creep.claimController(creep.room
                            .controller) == ERR_NOT_IN_RANGE) {
                            creep.myMoveTo(creep.room.controller);
                        }
                    } else {
                        if (creep.reserveController(creep.room
                                .controller) == ERR_NOT_IN_RANGE) {
                            creep.myMoveTo(creep.room.controller);
                        }
                    }
                }
            }
        } else {
            helper.moveTargetRoom(creep);
        }
    }
};