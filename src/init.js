const {
    ATK_RANGE,
    WALL_REPAIRER
} = require("./helper");

function addControlledRoom(targetRoom, room){
    Memory.myRooms[room].push(targetRoom);
    Memory.sources[targetRoom] = 2;
    let sources = Memory.sources[targetRoom];
    Memory.creepDemand[room][targetRoom] = {
        harvester:0,
        harvRemote: sources,
        carry: sources,
        upgrader: 0,
        builder: 1,
        repairer: 0,
        wallRepairer: 1,
        claimer: 1
    }
}

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

    addControlledRoom: (targetRoom, room) =>{
        Memory.myRooms[room].push(targetRoom);
        Memory.sources[targetRoom] = 2;
        let sources = Memory.sources[targetRoom];
        Memory.creepDemand[room][targetRoom] = {
            harvester:0,
            harvRemote: sources,
            carry: sources,
            upgrader: 0,
            builder: 1,
            repairer: 0,
            wallRepairer: 1,
            claimer: 1
        }
        Memory.creepDemand[room].total += 3;
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
        if (Memory.exec === true) {
            addControlledRoom('W34N12','W33N12');

            // Memory.spawns.Spawn1.rooms = {
            //     W32N11:Memory
            // }
            // Memory.myRooms.W31N11 = ['W31N11'];

            Memory.exec = Game.time;
        }
    }
}