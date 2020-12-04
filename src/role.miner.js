const helper = require("./helper");
const Logger = require("./Logger");

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        if (!creep.memory.source){
            if (Game.rooms[creep.memory.target]){
                creep.memory.source = Game.rooms[creep.memory.target].find(FIND_MINERALS)[0].id;
            } else {
                return helper.moveTargetRoom(creep);
            }
        } 
        if (!creep.memory.extractor){
            let extractors = Game.rooms[creep.memory.target].find(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_EXTRACTOR});
            if (extractors.length){
                creep.memory.extractor = extractors[0].id;
            } else {
                Logger.warn(creep.memory.target, 'no extractor found');
                return;
            }
            
            
        } 
        // console.log(creep.name,JSON.stringify(Game.getObjectById(creep.memory.source)))
        let source = Game.getObjectById(creep.memory.source);
        let extractor = Game.getObjectById(creep.memory.extractor);
        // if arrived
        if (creep.memory.arrived == true) {
            // check for presence of link
            if (creep.memory.link === undefined){
                let links = creep.pos.findInRange(FIND_STRUCTURES,
                    1, {filter: s => s.structureType == STRUCTURE_LINK});
                creep.memory.link = (links.length > 0) ? links[0].id : null;
            } 
            creep.say(extractor.cooldown)
            if (source.mineralAmount > 0 && extractor.cooldown === 0){
                creep.harvest(source);
            }
            
        } else if (creep.pos.isNearTo(source)) {

            var container = creep.pos.findInRange(FIND_STRUCTURES,
                2, {
                    filter: (s) => s.structureType ==
                        STRUCTURE_CONTAINER
                });
            if (container.length == 0) {
                container = creep.pos.findInRange(
                    FIND_CONSTRUCTION_SITES, 2);
            }
            if (container.length == 0) {
                creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
                return;
            }
            if (creep.pos.isEqualTo(container[0])) {
                creep.memory.arrived = true;
                creep.harvest(source);
            } else {
                creep.myMoveTo(container[0]);
            }
        } else {
            creep.myMoveTo(source);
        }
    }
};