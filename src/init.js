const {
    ATK_RANGE,
    WALL_REPAIRER
} = require("./helper");

module.exports = {
    minCreeps: () => {
        for (let spawnName in Game.spawns) {
            var spawn = Game.spawns[spawnName];
            if (!spawn.memory.init) {
                spawn.memory.init = {};
            }

            // if (true){
            if (!spawn.memory.init.minCreeps) {

                // current room config
                spawn.memory[spawn.room.name] = {
                    // harvester:0,
                    // carry:0,
                    harvRemote: Memory.sources[Game.spawns[spawnName].room.name],
                    carry: Memory.sources[Game.spawns[spawnName].room.name],
                    upgrader: 1,
                    builder: 1,
                    repairer: 0,
                    wallRepairer: 0
                };

                // remote harv room config
                for (let id in Memory.myRooms[spawn.room.name]) {
                    let roomName = Memory.myRooms[spawn.room.name][id];
                    spawn.memory[roomName] = {
                        // harvester:0,
                        // carry:0,
                        harvRemote: Memory.sources[roomName],
                        carry: Memory.sources[roomName],
                        upgrader: 0,
                        builder: 1,
                        repairer: 0,
                        wallRepairer: 0
                    };
                }
                spawn.memory.init.minCreeps = true;
            }
        }
    },


    alter: () => {
        // for (let name in Game.creeps){
        //     var creep = Game.creeps[name];
        //     if (creep.memory.role == ATK_RANGE || creep.memory.role==WALL_REPAIRER){
        //         if (creep.pos.isNearTo(Game.spawns.Spawn1)){
        //             Game.spawns.Spawn1.recycleCreep(creep);
        //         } else creep.moveTo(Game.spawns.Spawn1)
        //     }
        // }
    },
    alterOnce: () => {
        // Memory.init.exec = 0;s
        if (Memory.exec) {
            // Memory.myRooms.W32N11 = ['W31N11','W32N11','W32N12'];
            // Memory.myRooms.W31N11 = [];

            Memory.sources.W32N12 = 2;

            // Memory.spawns.Spawn1.rooms = {
            //     W32N11:Memory
            // }
            // Memory.myRooms.W31N11 = ['W31N11'];

            Memory.exec = false;
        }
    }
}