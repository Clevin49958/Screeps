const RICH_THRESHOLD = 300;
const POOR_THRESHOLD = 1000;
const LOG_RATE = 20;


const HARVESTER = 'harvester';
const UPGRADER = 'upgrader';
const BUILDER = 'builder';
const REPAIRER = 'repairer';
const HARV_REMOTE = 'harvRemote';
const WALL_REPAIRER = 'wallRepairer';
const CLAIMER = 'claimer';
const ATK_RANGE = 'atkRange';
const CARRY = 'carry';

module.exports = {
    HARVESTER: HARVESTER,
    UPGRADER: UPGRADER,
    BUILDER: BUILDER,
    REPAIRER: REPAIRER,
    HARV_REMOTE: HARV_REMOTE,
    WALL_REPAIRER: WALL_REPAIRER,
    CLAIMER: CLAIMER,
    ATK_RANGE: ATK_RANGE,
    CARRY: CARRY,
    roleNames: [HARVESTER, UPGRADER, BUILDER, REPAIRER,
        HARV_REMOTE, WALL_REPAIRER, CLAIMER, ATK_RANGE, CARRY
    ],
    home: 'W32N11',
    logRate: LOG_RATE,

    // logger: Log4js.getDefaultLogger(),

    harvest: function(creep) {
        var source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {
            filter: (s) => s.energy > 0
        });
        // try to harvest energy, if the source is not in range
        if (creep.pos.findInRange(FIND_STRUCTURES, 0, {
                filter: (s) => s.structureType == STRUCTURE_CONTAINER
            }).length > 0) {
            creep.move(Math.floor(Math.random() * 2 + 2));
            return;
        }
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            // move towards the source
            creep.moveTo(source);
        }
    },

    payStructure: function(creep, structure) {
        if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            // move towards it
            creep.moveTo(structure);
        }
    },

    payTower: function(creep) {
        var structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 100
        });
        if (structure) this.payStructure(creep, structure);
        return structure;
    },

    paySpawn: function(creep) {
        // find closest spawn or extension which is not full
        var structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            // the second argument for findClosestByPath is an object which takes
            // a property called filter which can be a function
            // we use the arrow operator to define it
            filter: (s) => ((s.structureType == STRUCTURE_SPAWN ||
                    s.structureType == STRUCTURE_EXTENSION) &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
        });

        if (structure) this.payStructure(creep, structure);
        return structure;
    },

    payContainer: function(creep) {
        structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            // the second argument for findClosestByPath is an object which takes
            // a property called filter which can be a function
            // we use the arrow operator to define it
            filter: (s) => (s.structureType == STRUCTURE_CONTAINER &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 100)
        });
        if (structure) {
            this.payStructure(creep, structure);
            if (structure.store.getFreeCapacity(RESOURCE_ENERGY) < RICH_THRESHOLD) {
                // Memory.states.rich[structure.pos.x] = true;
                Memory.states.rich[structure.id] = true;
            }
        }
        return structure;
    },

    payAny: function(creep) {
        if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0) {
            if (this.payTower(creep)) return true;
        }
        if (this.paySpawn(creep)) return true;
        if (this.payTower(creep)) return true;
        if (this.payStorage(creep)) return true;
        return false;
    },

    payStorage: function(creep) {
        structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            // the second argument for findClosestByPath is an object which takes
            // a property called filter which can be a function
            // we use the arrow operator to define it
            filter: (s) => (s.structureType == STRUCTURE_STORAGE &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 100)
        });
        if (structure) {
            this.payStructure(creep, structure);
        }
        return structure;
    },

    withdrawStorage: function(creep) {
        var source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) =>
                s.structureType == STRUCTURE_STORAGE && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
        });
        if (source) {
            if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                // move towards the source
                creep.moveTo(source);
            }
        }
        return source;
    },

    withdrawContainer: function(creep) {
        var source = null;
        if (!source) {
            source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.getUsedCapacity(RESOURCE_ENERGY) > 200
            });
        }
        if (source) {
            if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                // move towards the source
                creep.moveTo(source);
            } else if (source.store.getFreeCapacity(RESOURCE_ENERGY) > POOR_THRESHOLD) {
                // Memory.states.rich[source.pos.x] = false;
                Memory.states.rich[source.id] = false;
            }
        }
        return source;
    },

    withdrawContainerIfRich: function(creep) {
        var source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) =>
                s.structureType == STRUCTURE_CONTAINER &&
                (Memory.states.rich[s.id] || s.store.getFreeCapacity(RESOURCE_ENERGY) < RICH_THRESHOLD)
        })
        if (source) {
            // console.log(creep,source.pos.x,Memory.states.rich[source.pos.x],source.store.getFreeCapacity(RESOURCE_ENERGY)<RICH_THRESHOLD)
            Memory.states.rich[source.id] = true;
            this.withdrawContainer(creep);
        } else {
            if (creep.pos.findInRange(FIND_STRUCTURES, 0, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER
                }).length > 0) {
                creep.move(Math.floor(Math.random() * 2 + 2));
                return false;
            }
        }
        return source;
    },
    /**
     * 
     * @param {creep} creep 
     * @returns {bool} succeed
     */
    withdrawEnergy: function(creep) {
        if (this.withdrawContainer(creep)) return true;
        if (Memory.states.defending || Memory.states.restart) {
            if (this.withdrawStorage(creep)) return true;
        }
        return false;
    },

    moveTargetRoom: function(creep) {
        if (creep.memory.target && creep.memory.target != creep.room.name) {
            creep.moveTo(new RoomPosition(5, 5, creep.memory.target));
        }
    },

    moveHome: function(creep) {
        if (creep.memory.home && creep.memory.home != creep.room.name) {
            creep.moveTo(new RoomPosition(5, 5, creep.memory.home))
        }
    },

    moveRand: function(creep) {
        creep.move(Math.floor(Math.random() * 7) + 1);
    },

    harvestLoot: function(creep) {
        var source = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
        if (source) {
            // creep.say(JSON.stringify(source.pos))
            if (creep.pickup(source) == ERR_NOT_IN_RANGE) {
                // move towards the source
                creep.moveTo(source);
            }
        }
        return source;
    }
}