const helper = require('./helper');
const {Logger} = require('./Logger');
module.exports = {
  updateWorkingState: function(creep) {},
  
  // a function to run the logic for this role
  run: function(creep) {
    if (!creep.memory.source) {
      if (Game.rooms[creep.memory.target]) {
        creep.memory.source = Game.rooms[creep.memory.target].find(FIND_SOURCES)[creep.memory
            .sourceIndex].id;
      } else {
        if (helper.moveTargetRoom(creep)) {
          return;
        }
      }
    }
    // console.log(creep.name,JSON.stringify(Game.getObjectById(creep.memory.source)))
    const source = Game.getObjectById(creep.memory.source);
    // if arrived
    if (creep.memory.arrived == true) {
      // check for presence of link
      if (creep.memory.link === undefined) {
        const links = creep.pos.findInRange(FIND_STRUCTURES,
            1, {filter: (s) => s.structureType == STRUCTURE_LINK});
        creep.memory.link = (links.length > 0) ? links[0].id : null;
      }
      if (!creep.memory.container) {
        const container = creep.pos.findInRange(FIND_STRUCTURES,
            0, {filter: (s) => s.structureType == STRUCTURE_CONTAINER});
        creep.memory.container = (container.length > 0) ? container[0].id : null;
      }
      let container = Game.getObjectById(creep.memory.container);
      if (creep.store.getCapacity(RESOURCE_ENERGY) > 0 && creep
          .store.getFreeCapacity(RESOURCE_ENERGY) <= 10) {
        if (container) {
          // var loot = creep.pos.findClosestByRange(
          //     FIND_DROPPED_RESOURCES);
          if (container.hits < container.hitsMax * 0.99) {
            creep.repair(container);
            return;
          }
          // if (loot && creep.pos.isEqualTo(loot) && container
          //     .store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
          //     creep.pickup(loot);
          // }
          if (creep.memory.link && Game.getObjectById(creep.memory.link)
              .store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            return creep.transfer(Game.getObjectById(creep.memory.link), RESOURCE_ENERGY);
          }

          if (source.energy > 0) {
            creep.harvest(source);
            helper.updateContainer(container);
          }
        } else {
          container = creep.pos.findClosestByPath(
              FIND_CONSTRUCTION_SITES);
          if (!container) {
            const res = creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
            if (res) {
              Logger.error(`Creep failed to create construction site for container in ${creep.room} res: ${res}`, creep);
              return;
            }
            container = creep.pos.findClosestByPath(
                FIND_CONSTRUCTION_SITES);
          }
          creep.build(container);
        }
      } else {
        creep.harvest(source);
        helper.updateContainer(container);
      }
    } else if (source && creep.pos.inRangeTo(source, 2)) {
      let container = creep.pos.findInRange(FIND_STRUCTURES,
          4, {
            filter: (s) => s.structureType ==
                        STRUCTURE_CONTAINER,
          });
      if (container.length == 0) {
        container = creep.pos.findInRange(
            FIND_CONSTRUCTION_SITES, 4, {filter: (s) => s.structureType == STRUCTURE_CONTAINER});
      }
      if (container.length == 0) {
        if (!creep.pos.isNearTo(source)) {
          return creep.myMoveTo(source);
        }
        const res = creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
        if (res) {
          Logger.error(`Creep failed to create construction site for container in ${creep.room} res: ${res}`, creep);
          return;
        }
        container = creep.pos.findInRange(
            FIND_CONSTRUCTION_SITES, 4, {filter: (s) => s.structureType == STRUCTURE_CONTAINER});
      }
      if (creep.pos.isEqualTo(container[0])) {
        creep.say(container[0].pos.x + ' ' + container[0].pos.y);
        creep.memory.arrived = true;
        creep.harvest(source);
      } else {
        creep.myMoveTo(container[0]);
      }
    } else {
      if (!source && helper.moveTargetRoom(creep)) return true;
      creep.myMoveTo(source, {range: 1});
    }
  },
};
