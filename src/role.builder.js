var roleUpgrader = require('role.upgrader');
const { BUILDER } = require('./helper');
require('./helper');
const helper = require('./helper');
const roleRepairer = require('./role.repairer');

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        creep.say(BUILDER.slice(0,1));
        if (creep.memory.target && creep.memory.target != creep.room.name){
            helper.moveTargetRoom(creep);
            return;
        }

        // if creep is trying to complete a constructionSite but has no energy left
        if (creep.memory.working == true && creep.carry.energy == 0) {
            // switch state
            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            // switch state
            creep.memory.working = true;
        }

        // if creep is supposed to complete a constructionSite
        if (creep.memory.working == true) { 
            // find closest constructionSite
            var constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            // if one is found
            if (constructionSite != undefined) {
                // try to build, if the constructionSite is not in range
                if (creep.build(constructionSite) == ERR_NOT_IN_RANGE) {
                    // move towards the constructionSite
                    creep.moveTo(constructionSite);
                }
            } else {
                var hostileStructure = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
                if (creep.dismantle(hostileStructure) == ERR_NOT_IN_RANGE) {
                    // move towards the hostile structure
                    creep.moveTo(hostileStructure);
                } else {
                    // go upgrading the controller
                    roleRepairer.run(creep);
                }
            }
            // if no constructionSite is found
            
        }
        // if creep is supposed to harvest energy from source
        else {
            if (helper.harvestLoot(creep)) return;
            if (helper.withdrawEnergy(creep)) return;
            
            // helper.harvest(creep);
        }
    }
};