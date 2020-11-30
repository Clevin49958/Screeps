require('prototype.spawn')();
const {
    CARRY,
    HARVESTER,
    BUILDER,
    REPAIRER,
    WALL_REPAIRER,
    UPGRADER,
    roleNames,
    HARV_REMOTE,
    CLAIMER,
    ATK_RANGE,
    ATTACKER
} = require('./helper');
const helper = require('./helper');

var roles = {};
// var creepTrack[targetRoom] = {};
helper.roleNames.forEach(role => {
    roles[role] = require('role.' + role);
});

// const roleHarvester = require('role.harvester');
// const roleUpgrader = require('role.upgrader');
// const roleBuilder = require('role.builder');
// const roleRepairer = require('role.repairer');
// const roleHarvRemote = require('role.harvRemote');
// const roleWallRepair = require('role.wallRepairer');
// const roleClaimer = require('role.claimer');
// const roleAtkRange = require('role.atkRange');
// const roleCarry = require('role.carry');


module.exports = {

    generateCreeps: function(name) {
        var spawn = Game.spawns[name];
        var room = spawn.room.name;
        var energy = spawn.room.energyCapacityAvailable;
        if (!Memory.stats.creepTrack[room]) Memory.stats.creepTrack[
            room] = {};
        var creepTrack = Memory.stats.creepTrack[room];
        var creepDemand = Memory.creepDemand[room];
        var res = undefined;

        // update wall repairer
        creepDemand[room][WALL_REPAIRER] = Game.rooms[room].find(
            FIND_HOSTILE_CREEPS).length;

        // count total harv creeps
        var totalHarvs;
        totalHarvs = _.sum(Game.creeps,
            c => (c.memory.role == helper.HARVESTER || c.memory
            .role == helper.HARV_REMOTE) &&
            c.ticksToLive > 75 && c.memory.home == room
        );

        // emergency off control
        if (totalHarvs >= creepDemand[room][HARV_REMOTE]) {
            Memory.states.restart[room] = false;
        }

        // prioritised one off ones 
        if (false) {
            if (spawn.name == "Spawn32")
                spawn.spawnClaimerCreep(target = 'W34N12');
            // spawn.spawnAtkRangeCreep(300, target = 'W33N11', home = 'W32N11')
            return;
        }
        // if colony is dying
        if (totalHarvs < 2) {
            creepDemand.tickNoHarv++;

            if (creepDemand.tickNoHarv > 50) {
                Memory.states.restart[room] = true;
                // spawn one with what is available
                res = spawn.createBalCreep(
                    spawn.room.energyAvailable, helper.HARVESTER, targetRoom, room);
                Game.notify(`Something went wrong. only ${totalHarvs}` +
                    ` harvesters & ${_.sum(Game.creeps,(c)=>1)} left` +
                    `Room: ${room} ${JSON.stringify(creepTrack)}`);
                return;
            }
        } else creepDemand.tickNoHarv = 0;

        // collect some stats of creeps
        for (let targetRoom of Memory.myRooms[room]) {
            if (!creepTrack[targetRoom]) creepTrack[targetRoom] = {};

            // count each role
            for (let role of [CARRY, HARV_REMOTE, BUILDER, REPAIRER,
                    WALL_REPAIRER, CARRY, UPGRADER, CLAIMER
                ]) {
                creepTrack[targetRoom][role] = _.sum(Game.creeps, (c) =>
                    c.memory.role == role &&
                    c.memory.target == targetRoom && 
                    c.memory.home == room && 
                    (c.ticksToLive > 220 || (room == targetRoom && c.ticksToLive > 100))
                );
            }
            
            creepTrack[targetRoom].total = Object.keys(creepTrack[
                targetRoom]).reduce((acc, role) => acc + (role ==
                'total' ? 0 : creepTrack[targetRoom][role]), 0);
            creepDemand[targetRoom].total = Object.keys(creepDemand[
                targetRoom]).reduce((acc, role) => acc + (role ==
                'total' ? 0 : creepDemand[targetRoom][role]), 0);

            // detail logs per room
            // if (Game.time % helper.logRate ==0) {
            //     console.log(`Spawn: ${spawn.name} Room: ${targetRoom} ${JSON.stringify(creepTrack[targetRoom])}`);
            // }
        }

        creepTrack.total = _.reduce(Memory.myRooms[room], (acc, r) => acc + creepTrack[r].total, 0);
        creepDemand.total = _.reduce(Memory.myRooms[room], (acc, r) => acc + creepDemand[r].total, 0);

        if (Game.time % helper.logRate == 0) {
            // room based stats
            console.log(`${spawn.name}: `);
            Object.keys(Memory.myRooms[room]).forEach(targetRoomID => {
                targetRoom = Memory.myRooms[room][targetRoomID];
                if (creepTrack[targetRoom].total < creepDemand[targetRoom].total){
                    console.log(
                    `'\t${targetRoom}: ${creepTrack[targetRoom].total}/${creepDemand[targetRoom].total}`
                    );
                }
            });

            // role based stats
            console.log(`Roles: `);
            [HARV_REMOTE, helper.CARRY, UPGRADER, 
                BUILDER, REPAIRER, WALL_REPAIRER, CLAIMER].forEach(role => {
                var num = _.reduce(creepTrack,
                    (acc, targetRoom) => acc + (
                        typeof targetRoom == 'object' ?
                        targetRoom[role] : 0), 0)
                var sumRole = _.reduce(Memory.myRooms[room], (acc, targetRoom) =>acc+creepDemand[targetRoom][role], 0);
                if (num < sumRole){
                    console.log(`'\t${role}: ${num}/` + `${sumRole}`);
                }
            });
            console.log(`Total: ${creepTrack.total}/${creepDemand.total}`);
        }

        // skip spawning if busy
        if (spawn.spawning) return;

        // spawn defenders: rangedAtk
        try {
            for (let targetRoom of Memory.myRooms[room]) {
                var hostiles = Game.rooms[targetRoom].find(
                    FIND_HOSTILE_CREEPS);
                // console.log('a ',room,targetRoom, hostiles, _.sum(Game.creeps, c => c.memory.role == helper.ATK_RANGE && c.memory.target == targetRoom && c.memory.home == room));
                if (hostiles.length > 0 && hostiles.length > _.sum(Game
                        .creeps, c => c.memory.role == helper.ATK_RANGE && c
                        .memory.target == targetRoom && c.memory.home ==
                        room)) {
                    spawn.spawnAtkRangeCreep(energy, target = targetRoom,
                        home = room);
                    return;
                }
            }
        } catch (error) {
            // console.log(error);
            // error because if there's no creep in room, you can't observe it
        }

        if (Memory.offence[room]){
            for (var targetRoom in Memory.offence[room]){
                for (var role in Memory.offence[room][targetRoom].roles){
                    if (Memory.offence[room][targetRoom].roles[role] > 
                        _.sum(Game.creeps, (c) =>
                        c.memory.role == role &&
                        c.memory.target == targetRoom && 
                        c.memory.home == room && 
                        c.ticksToLive > 220)){
                        if (role == ATK_RANGE){
                            spawn.spawnAtkRangeCreep(energy, targetRoom, home = room);
                        }
                        else if (role == ATTACKER){
                            spawn.spawnAttackerCreep(energy, targetRoom, home = room);
                        }
                    }
                }
            }
        }
        // spawn creeps
        for (let targetRoom of Memory.myRooms[room]) {
            // spawn carry
            if (creepTrack[targetRoom][helper.CARRY] < creepDemand[
                    targetRoom][helper.CARRY]) {
                if (Game.time % helper.logRate == 0)
                    console.log(
                        `    Demand: ${targetRoom} ${helper.CARRY}, have: ${creepTrack[targetRoom][helper.CARRY]}/` +
                        `${creepDemand[targetRoom][helper.CARRY]}`);

                var res = spawn.spawnCarryCreep(energy, targetRoom,
                    home = room, sourceIndex = 0);
                if (res == 0) {
                    console.log(
                        `        Spawned new ${CARRY} ${targetRoom} ${room}`
                        );
                }
                return;
            }

            // spawn harvRemote
            for (let i = 0; i < Memory.sources[targetRoom]; i++) {
                // console.log(i,Memory.sources[sourceRoom],_.reduce(Game.creeps, (acc,c) => acc || (c.memory.role == helper.HARV_REMOTE && 
                // c.memory.target == sourceRoom && c.memory.home == room && c.memory.sourceIndex == i),false))
                if (!_.reduce(Game.creeps, (acc, c) => acc || 
                            (c.memory.role == helper.HARV_REMOTE &&
                            c.memory.target == targetRoom && c.memory.home == room && 
                            c.memory.sourceIndex == i),
                        false)) {

                    if (Game.time % helper.logRate == 0)
                        console.log(
                            `    Demand: ${targetRoom} ${helper.HARV_REMOTE} sourceIndex: ${i}`
                            );
                    var res = spawn.spawnHarvRemoteCreep(energy,
                        targetRoom, home = room, sourceIndex = i)
                    if (res == 0) {
                        console.log(
                            `        Spawned new ${HARV_REMOTE} ${targetRoom} ${room}`
                            );
                    }
                    return;
                }
            }

        }


        // spawn workers for each room

        for (let targetRoom of Memory.myRooms[room]) {
            // spawn workers
            for (let r of [UPGRADER, REPAIRER, BUILDER, WALL_REPAIRER,
                    CLAIMER
                ]) {

                // console.log(`In ${targetRoom} ${creepTrack[targetRoom][r]<creepDemand[room][r]?'need ':'got  '}`
                //     + ` ${r} have: ${creepTrack[targetRoom][r]} need: ${creepDemand[targetRoom][r]}`);

                if (creepTrack[targetRoom][r] < creepDemand[targetRoom][r]) {
                    // spawn
                    if (r == CLAIMER) {
                        res = spawn.spawnClaimerCreep(energy, targetRoom, room);
                    } else {
                        res = spawn.createBalCreep(energy, r,
                            targetRoom, room);
                    }
                    if (res == 0) {
                        console.log(
                            `Spawned new ${r} ${targetRoom} ${room}`
                            );
                    }
                    if (Game.time % helper.logRate == 0) console.log(
                        `    Demand: ${targetRoom} ${r} Result: ${res}, ${creepTrack[targetRoom][r]}/${creepDemand[targetRoom][r]}`
                        );
                    return;
                }
            }
        };
        if (Game.time % helper.logRate == 0) console.log();
    },

    runCreeps: function() {
        // for every creep name in Game.creeps
        for (let name in Game.creeps) {
            // get the creep object
            var creep = Game.creeps[name];

            // who r u?
            // creep.say(creep.memory.role.slice(0,1));

            for (let role of roleNames) {
                if (creep.memory.role == role) {
                    // creep.say(role);
                    roles[role].run(creep);
                }
            }
        }
    },
    roleChange: function(oldRole, newRole) {
        for (let name in Game.creeps) {
            var creep = Game.creeps[name];
            if (creep.memory.role == oldRole) {
                creep.memory.role == newRole;
            }
        }
    }
}