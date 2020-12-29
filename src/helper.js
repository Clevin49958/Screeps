const {Logger} = require('./Logger'); // eslint-disable-line no-unused-vars

const RICH_THRESHOLD = 1000;
const POOR_THRESHOLD = 1600;
const LOG_RATE = 5;
const HARVESTER = 'harvester';
const UPGRADER = 'upgrader';
const BUILDER = 'builder';
const REPAIRER = 'repairer';
const HARV_REMOTE = 'harvRemote';
const WALL_REPAIRER = 'wallRepairer';
const CLAIMER = 'claimer';
const ATK_RANGE = 'atkRange';
const HAULER = 'hauler';
const ATTACKER = 'attacker';
const MINER = 'miner';
const KEEPER = 'keeper';

Creep.prototype.myMoveTo = function(destination, options = {}) {
  options = _.merge({ignoreCreeps: true}, options);
  if (/* this.memory.home != this.memory.target*/ true) {
    return this.travelTo(destination, options);
  } else {
    return this.moveTo(destination, {
      reusePath: 15,
    });
  }
};

module.exports = {
  HARVESTER,
  UPGRADER,
  BUILDER,
  REPAIRER,
  HARV_REMOTE,
  WALL_REPAIRER,
  CLAIMER,
  ATK_RANGE,
  HAULER,
  ATTACKER,
  MINER,
  KEEPER,

  roleNames: [HARVESTER, UPGRADER, BUILDER, REPAIRER,
    HARV_REMOTE, WALL_REPAIRER, CLAIMER, ATK_RANGE, HAULER, ATTACKER, MINER, KEEPER,
  ],
  logRate: LOG_RATE,
  RICH_THRESHOLD,
  POOR_THRESHOLD,

  harvest: function(creep) {
    const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {
      filter: (s) => s.energy > 0,
    });
    // try to harvest energy, if the source is not in range
    if (creep.pos.findInRange(FIND_STRUCTURES, 0, {
      filter: (s) => s.structureType ==
                    STRUCTURE_CONTAINER,
    }).length > 0) {
      this.moveRand(creep);
      return;
    }
    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
      // move towards the source
      creep.myMoveTo(source);
    }
  },

  payStructure: function(creep, structure, mineral = false) {
    const srcType = mineral ? _.find(_.keys(creep.store), (srcType) =>
      srcType != RESOURCE_ENERGY && creep.store.getUsedCapacity(srcType) > 0) :
         RESOURCE_ENERGY;
    if (creep.transfer(structure, srcType) ==
            ERR_NOT_IN_RANGE) {
      // move towards it
      creep.myMoveTo(structure);
    }
  },

  payTower: function(creep) {
    const structure = creep.pos.findClosestByPath(
        FIND_MY_STRUCTURES, {
          filter: (s) => s.structureType == STRUCTURE_TOWER &&
          s.store.getFreeCapacity(RESOURCE_ENERGY) > 100,
        });
    if (structure) this.payStructure(creep, structure);
    return structure;
  },

  paySpawn: function(creep) {
    // find closest spawn or extension which is not full
    const structure = creep.pos.findClosestByPath(
        FIND_MY_STRUCTURES, {
          // the second argument for findClosestByPath is an object which takes
          // a property called filter which can be a function
          // we use the arrow operator to define it
          filter: (s) => ((s.structureType ==
                        STRUCTURE_SPAWN ||
                        s.structureType == STRUCTURE_EXTENSION
          ) &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          ),
        });

    if (structure) this.payStructure(creep, structure);
    return structure;
  },

  payContainer: function(creep) {
    structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      // the second argument for findClosestByPath is an object which takes
      // a property called filter which can be a function
      // we use the arrow operator to define it
      filter: (s) => (s.structureType ==
                STRUCTURE_CONTAINER &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) >
                100),
    });
    if (structure) {
      this.payStructure(creep, structure);
      this.updateContainer(structure);
    }
    return structure;
  },

  /**
   *
   * @param {Creep} creep creep to pay
   * @param {boolean} [includeStorage=true] should the creep pay storage
   * (prevent circular cpu wasteage)
   * @returns {boolean} whether creep found a target to pay
   */
  payAny: function(creep, includeStorage = true) {
    const carriesMineral = _.sum(_.keys(creep.store), (src) =>
      src != RESOURCE_ENERGY && creep.store.getUsedCapacity(src) > 0);
    if (carriesMineral) {
      if (this.payTerminal(creep, true)) return true;
      if (this.payStorage(creep, true)) return true;
    }
    if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0) {
      creep.say('tower');
      if (this.payTower(creep)) return true;
    }
    creep.say('spawn');
    if (this.paySpawn(creep)) return true;
    creep.say('tower');
    if (this.payTower(creep)) return true;
    creep.say('terminal');
    if (this.payTerminal(creep)) return true;
    creep.say('storage');
    if (includeStorage && this.payStorage(creep)) return true;
    creep.say(`can't pay`);
    return false;
  },

  payStorage: function(creep, mineral = false) {
    structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => (s.structureType ==
                STRUCTURE_STORAGE &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) >
                100),
    });
    if (!structure && creep.room.controller) {
      structure = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 2, {
        filter: (s) => s.structureType == STRUCTURE_CONTAINER &&
          s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
      });
      structure = structure.length == 0 ? null : structure[0];
    }
    if (structure) {
      this.payStructure(creep, structure, mineral);
    }
    return structure;
  },

  payTerminal: function(creep, mineral = false) {
    structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) => (s.structureType ==
                STRUCTURE_TERMINAL &&
                (s.store.getUsedCapacity(RESOURCE_ENERGY) <= 30000 || mineral)
      )});
    if (structure) {
      this.payStructure(creep, structure, mineral);
    }
    return structure;
  },

  /**
   * withdraw energy from storage or the container in range 2 to the controller
   * @param {Creep} creep creep
   * @returns {StructureStorage|null} source
   */
  withdrawStorage: function(creep) {
    let source = creep.room.storage;

    if (!source && creep.room.controller) {
      source = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 2, {
        filter: (s) => s.structureType == STRUCTURE_CONTAINER &&
          s.store.getUsedCapacity(RESOURCE_ENERGY) > 0,
      });
      source = source.length == 0 ? null : source[0];
    }
    if (source) {
      if (creep.withdraw(source, RESOURCE_ENERGY) ==
                ERR_NOT_IN_RANGE) {
        // move towards the source
        creep.myMoveTo(source);
      }
    }
    return source;
  },

  withdrawContainer: function(creep, source = null, mineral = false) {
    // var source = null;
    if (!source) {
      source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s) => {
          if (s.structureType != STRUCTURE_CONTAINER) return false;
          if (!mineral) {
            return s.store.getUsedCapacity(RESOURCE_ENERGY) >= 200;
          } else {
            return _.sum(_.keys(s.store), (src) =>
              src != RESOURCE_ENERGY && s.store.getUsedCapacity(src) >= 1200,
            );
          }
        }});
    }
    if (source) {
      if (creep.pos.isNearTo(source)) {
        if (mineral) {
          creep.withdraw(source, _.find(_.keys(source.store), (srcType) =>
            source.store.getUsedCapacity(srcType) > 50),
          );
        } else {
          creep.withdraw(source, RESOURCE_ENERGY);
          this.updateContainer(source);
        }
      } else {
        creep.myMoveTo(source);
      }
    }
    return source;
  },

  withdrawContainerIfRich: function(creep) {
    const source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (s) =>
        s.structureType == STRUCTURE_CONTAINER && _.get(Memory, ['states', 'rich', s.id]) &&
          !_.find(_.keys(s.store), (srcType) => srcType != RESOURCE_ENERGY),
    });
    if (source) {
      this.withdrawContainer(creep, source);
    } else {
      if (creep.pos.findInRange(FIND_STRUCTURES, 0, {
        filter: (s) => s.structureType ==
                        STRUCTURE_CONTAINER,
      }).length > 0) {
        // this.moveRand(creep);
        return false;
      }
    }
    return source;
  },

  /**
     *
     * @param {Creep} creep
     * @param {StructureLink} link link to withdraw, any receiver link by default
     * @returns {StructureLink} the link withdrawn from, null otherwise
     */
  withdrawLink: function(creep, link = null) {
    if (!link || link.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
      const links = _.get(Memory, ['mine', 'links', creep.memory.target, 'receiver']);
      link = _.find(_.values(links), (link) =>
        Game.getObjectById(link).store.getUsedCapacity(RESOURCE_ENERGY) > 0);
      if (!link) {
        return false;
      } else {
        link = Game.getObjectById(link);
      }
    }
    if (creep.withdraw(link, RESOURCE_ENERGY) ==
            ERR_NOT_IN_RANGE) {
      // move towards the source
      creep.myMoveTo(link);
    }
    return link;
  },

  /**
     *
     * @param {creep} creep
     * @returns {bool} succeed
     */
  withdrawEnergy: function(creep) {
    if (this.withdrawLink(creep)) return true;
    if (this.withdrawStorage(creep)) return true;
    if (this.withdrawContainer(creep)) return true;
    // if (Memory.states.defending[creep.memory.room] || Memory.states.restart[creep.memory.home]) {
    //   if (this.withdrawStorage(creep)) return true;
    // }
    return false;
  },

  /**
   * move the creep to target room and ensure it's not on the edge
   *
   * requires creep.memory.target
   * @param {Creep} creep
   * @returns {boolean} whether the creep is on its way (true)/arrived
   */
  moveTargetRoom: function(creep) {
    if (creep.room.name != creep.memory.target) {
      // find exit to target room
      if (Game.flags[creep.memory.target]) {
        creep.myMoveTo(Game.flags[creep.memory.target]);
        return true;
      }
      const exit = creep.room.findExitTo(creep.memory.target);
      // move to exit
      creep.myMoveTo(creep.pos.findClosestByPath(exit));
      return true;
    } else {
      if (this.isOnTheEdge(creep)) {
        creep.move(this.isOnTheEdge(creep));
        return true;
      } else {
        return false;
      }
    }
  },

  moveHome: function(creep) {
    if (creep.room.name == creep.memory.home) {
      return false;
    } else {
      creep.myMoveTo(Game.rooms[creep.memory.home].controller);
      return true;
    }
  },

  moveRand: function(creep) {
    creep.move(Math.floor(Math.random() * 7) + 1);
  },

  harvestLoot: function(creep, lootMin = 100, energyOnly = true) {
    let source;
    if (energyOnly) {
      source = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
        filter: (s) => s.store.getUsedCapacity(RESOURCE_ENERGY) >= 100,
      });
      if (!source) {
        source = creep.pos.findClosestByPath(FIND_RUINS, {
          filter: (s) => s.store.getUsedCapacity(RESOURCE_ENERGY) >= 50,
        });
      }
      if (source) {
        if (creep.withdraw(source, RESOURCE_ENERGY) ==
                    ERR_NOT_IN_RANGE) {
          // move towards the source
          creep.myMoveTo(source);
        }
      } else {
        source = creep.pos.findClosestByPath(
            FIND_DROPPED_RESOURCES, {
              filter: (r) => r.amount > lootMin && r.resourceType == RESOURCE_ENERGY,
            });
        if (creep.pickup(source) == ERR_NOT_IN_RANGE) {
          // move towards the source
          creep.myMoveTo(source);
        }
      }
      return source;
    } else {
      // look for minerals
      source = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
        filter: (s) => _.find(_.keys(s.store), (srcType) =>
          srcType != RESOURCE_ENERGY &&
          s.store.getUsedCapacity(srcType) > 0),
      });
      if (!source) {
        source = creep.pos.findClosestByPath(FIND_RUINS, {
          filter: (s) => _.find(_.keys(s.store), (srcType) =>
            srcType != RESOURCE_ENERGY &&
            s.store.getUsedCapacity(srcType) > 0),
        });
      }
      if (source) {
        if (creep.withdraw(source, _.find(_.keys(source.store), (srcType) =>
          source.store.getUsedCapacity(srcType) > 0)) == ERR_NOT_IN_RANGE) {
          // move towards the source
          creep.myMoveTo(source);
        }
      } else {
        source = creep.pos.findClosestByPath(
            FIND_DROPPED_RESOURCES, {
              filter: (r) => r.amount > lootMin && r.resourceType != RESOURCE_ENERGY,
            });
        if (creep.pickup(source) == ERR_NOT_IN_RANGE) {
          // move towards the source
          creep.myMoveTo(source);
        }
      }
      return source;
    }
  },

  recycle: function(creep) {
    if (this.moveHome(creep)) return true;

    const spawn = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {filter: (s) =>
      s.structureType == STRUCTURE_SPAWN,
    });
    if (creep.pos.isNearTo(spawn)) {
      spawn.recycleCreep(creep);
    } else {
      creep.myMoveTo(spawn);
    }
  },

  addMemory: function(path, content, starter = Memory) {
    let current = starter;
    for (const item of path) {
      if (!current[item]) {
        current[item] = {};
      }
      current = current[item];
    }
    _.merge(current, content);
    return true;
  },

  /**
   * determine if the creep is on the edge of the room
   * @param {Creep} creep to determine
   * @returns {number} direction to move away from the edge, 0 if not
   */
  isOnTheEdge: function(creep) {
    const pos = creep.pos;
    if (pos.x == 0) {
      return 3;
    }
    if (pos.y == 0) {
      return 5;
    }
    if (pos.x == 49) {
      return 7;
    }
    if (pos.y == 49) {
      return 1;
    }
    return 0;
  },

  /**
   * update whether the container is rich or not
   * @param {StructureContainer} container the container to update
   * @returns {boolean} whether the container is rich or not; false if in between
   */
  updateContainer: function(container) {
    if (container) {
      const space = container.store.getFreeCapacity(RESOURCE_ENERGY);
      if (space < RICH_THRESHOLD) {
        _.set(Memory, ['states', 'rich', container.id], true);
        return true;
      } else if (space > POOR_THRESHOLD) {
        _.set(Memory, ['states', 'rich', container.id], false);
        return false;
      }
    }
  },

  /**
   * Creep will move away from road, towards a flag labeled with room name
   * @param {Creep} creep creep to move away from road
   */
  moveOffRoad: function(creep) {
    const standingAt = creep.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: (s) => s.structureType == STRUCTURE_ROAD,
    });
    if (standingAt.length > 0 && Game.flags[creep.room.name]) {
      creep.myMoveTo(Game.flags[creep.room.name], {offRoad: true});
    }
  },
};
