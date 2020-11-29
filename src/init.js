const {
    ATK_RANGE,
    WALL_REPAIRER
} = require("./helper");

function roomCreepConfig(room) {
    return {
        harvester: 0,
        harvRemote: Memory.sources[room],
        carry: Memory.sources[room],
        upgrader: 0,
        builder: 1,
        repairer: 1,
        wallRepairer: 0,
        claimer: 1
    }
}
function addControlledRoom(controlled, room, demands = null) {
    if (!demands) {
        demands = roomCreepConfig(controlled);
    }
    Memory.myRooms[room].push(controlled);
    Memory.creepDemand[room][controlled] = demands;
}

function removeControlledRoom(controlled, room) {
    Memory.myRooms[room].splice(Memory.myRooms[room].findIndex(r => r == room), 1);
    var demands = Memory.creepDemand[room][controlled];
    Memory.creepDemand[room][controlled] = undefined;
    return demands;
}

function transferControlledRoom(room, oldOwner, newOwner) {
    addControlledRoom(room, newOwner, demands = removeControlledRoom(room,
        oldOwner))
}

function addOwnerRoom(room){
    Memory.myRooms[room] = [room];
    var creepTrack = Memory.stats.creepTrack;
    creepTrack[room] = {}
    creepTrack[room][room] = roomCreepConfig(room);
    var creepDemand = Memory.creepDemand;
    creepDemand[room] = {[room]: roomCreepConfig(room)}
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
                    harvRemote: Memory.sources[Game.spawns[
                        spawnName].room.name],
                    carry: Memory.sources[Game.spawns[spawnName]
                        .room.name],
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
        if (Game.spawns.s3 && Memory.creepDemand.W33N12.W34N12) {
            removeControlledRoom('W34N12','W33N12');
            Memory.mySpawns['W34n12'] = Game.spawns.s3.id;
            Game.notify('Spawn Construction is Completed');
        }
    },
    alterOnce: () => {
        // Memory.init.exec = 0;s
        if (Memory.exec === true) {

            transferControlledRoom('W34N13','W33N12','W34N12')
            // Memory.spawns.Spawn1.rooms = {
            //     W32N11:Memory
            // }
            // Memory.myRooms.W31N11 = ['W31N11'];

            Memory.exec = 'ran';
        }
    }
}