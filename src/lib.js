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
const Logger = require('./Logger');

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
        /** @type string */
        var spawn = Game.spawns[name];
        /** @type string */
        var room = spawn.room.name;
        var energyMax = spawn.room.energyCapacityAvailable;
        if (!Memory.stats.creepTrack[room]) Memory.stats.creepTrack[
            room] = {};
        var creepTrack = Memory.stats.creepTrack[room];
        var creepDemand = Memory.creepDemand[room];
        var res = undefined;

        // If I'm not logging, and it's busy, then I don't care
        if (Game.time % helper.logRate != 0 && spawn.spawning && Logger.LOG_LEVEL >= 2000) {
            Logger.debug(spawn.name, 'is spawning', spawn.spawning.name);
            return;
        }

        // update wall repairer
        creepDemand[room][WALL_REPAIRER] = Game.rooms[room].find(
            FIND_HOSTILE_CREEPS).length;
        if (creepDemand[room][WALL_REPAIRER] == 0) {
            creepDemand[room][WALL_REPAIRER] = 1;
        };
        // update claimer
        for (let targetRoomId in Memory.myRooms[room]){
            let targetRoom = Memory.myRooms[room][targetRoomId];
            let demand = 0;
            if (targetRoom != room) {
                demand = (!helper.getMemory(['rooms', targetRoom, 'controller', 'reservation'], Game) || 
                Game.rooms[targetRoom].controller.reservation.ticksToEnd < 1000) ? 1 : 0;
            }
            helper.addMemory(['creepDemand', room, targetRoom], {'claimer': demand});
        }

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
            if (spawn.name == "s3")
                // spawn.spawnClaimerCreep(target = 'W34N12');
            Logger.info(spawn.spawnAtkRangeCreep(energyMax, target = 'W35N11', home = 'W34N12',selfHeal =2));
            return;
        }
        // if colony is dying
        if (totalHarvs < 2) {
            creepDemand.tickNoHarv++;

            if (creepDemand.tickNoHarv > 50) {
                Memory.states.restart[room] = true;
                // spawn one with what is available
                res = spawn.spawnBalCreep(
                    spawn.room.energyAvailable, helper.HARVESTER, targetRoom, room);
                Logger.debug(spawn.name, 'attempt to spawn', 'bal harvester for emergency', 'res', res);
                if (creepDemand.tickNoHarv > 200){
                    Game.notify(`Something went wrong. only ${totalHarvs}` +
                    ` harvesters & ${_.sum(Game.creeps,(c)=>1)} left` +
                    `Room: ${room} ${JSON.stringify(creepTrack)}`);
                }
                return;
            }
            Logger.trace(`${spawn.name} has been ${creepDemand.tickNoHarv} ticks without harv`);
        } else creepDemand.tickNoHarv = 0;

        // collect some stats of creeps
        for (let targetRoom of Memory.myRooms[room]) {
            if (!creepTrack[targetRoom]) creepTrack[targetRoom] = {};

            // update builder count
            if (Game.time % helper.logRate == 0) {
                numConstructionSites = Game.rooms[room].find(FIND_CONSTRUCTION_SITES).length;
                creepDemand[room][BUILDER] = numConstructionSites > 10 ? 2 : (numConstructionSites > 1
                    ? 1 : 0);
            }

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
            //     Logger.info(`Spawn: ${spawn.name} Room: ${targetRoom} ${JSON.stringify(creepTrack[targetRoom])}`);
            // }
        }

        creepTrack.total = _.reduce(Memory.myRooms[room], (acc, r) => acc + creepTrack[r].total, 0);
        creepDemand.total = _.reduce(Memory.myRooms[room], (acc, r) => acc + creepDemand[r].total, 0);
        helper.addMemory(['stats', 'roomDemand'], {[room]: creepTrack.total / creepDemand.total});

        if (Game.time % helper.logRate == 0) {
            // room based stats
            Logger.info(`${spawn.name}: ${creepTrack.total}/${creepDemand.total}`);
            Object.keys(Memory.myRooms[room]).forEach(targetRoomID => {
                targetRoom = Memory.myRooms[room][targetRoomID];
                if (creepTrack[targetRoom].total < creepDemand[targetRoom].total) {
                    Logger.info(
                        `\t${targetRoom}: ${creepTrack[targetRoom].total}/${creepDemand[targetRoom].total}`
                    );
                }
            });

            // role based stats
            [HARV_REMOTE, helper.CARRY, UPGRADER,
                BUILDER, REPAIRER, WALL_REPAIRER, CLAIMER
            ].forEach(role => {
                var num = _.reduce(creepTrack,
                    (acc, targetRoom) => acc + (
                        typeof targetRoom == 'object' ?
                        targetRoom[role] : 0), 0)
                var sumRole = _.reduce(Memory.myRooms[room], (acc, targetRoom) => acc + creepDemand[
                    targetRoom][role], 0);
                if (num < sumRole) {
                    Logger.info(`\t${role}: ${num}/${sumRole}`);
                }
                helper.addMemory(['stats', 'roleDemand'], {[role]: num / sumRole});
            });
        }

        // Logger.debug(spawn.name,spawn.spawning)
        if (spawn.spawning && Logger.LOG_LEVEL >= 2000) {
            Logger.debug(spawn.name, 'is spawning', spawn.spawning.name);
            return;
        }

        Logger.trace(`${spawn.name} trying to spawn defender rangeATK`);
        // spawn defenders: rangedAtk
        try {
            for (let targetRoom of Memory.myRooms[room]) {
                if (!Game.rooms[targetRoom]){
                    Logger.trace(`Offencing room ${targetRoom} can't be traced`);
                    continue;
                }
                var hostiles = Game.rooms[targetRoom].find(
                    FIND_HOSTILE_CREEPS);
                var hostile_healer = _.reduce(hostiles, ((acc, c) =>
                    acc || _.reduce(c.body, (acc, part) => acc || part
                        .type == HEAL, undefined) ? c : acc), null);
                // if (hostiles.length>0){
                //     Logger.info(room, targetRoom, hostile_healer, JSON.stringify(hostiles))}
                if (hostile_healer){
                    creepDemand[targetRoom][WALL_REPAIRER] = hostiles.length;
                } else creepDemand[targetRoom][WALL_REPAIRER] = 0;
                        
                // Logger.info('a ',room,targetRoom, hostiles, _.sum(Game.creeps, c => c.memory.role == helper.ATK_RANGE && c.memory.target == targetRoom && c.memory.home == room), Game.rooms[targetRoom].find(FIND_HOSTILE_STRUCTURES));
                if (hostiles.length > 0 && !hostile_healer && hostiles.length > _.sum(Game
                        .creeps, c => c.memory.role == helper.ATK_RANGE && c
                        .memory.target == targetRoom && c.memory.home ==
                        room) && Game.rooms[targetRoom].find(FIND_MY_STRUCTURES, {filter: s => s.structureType == STRUCTURE_TOWER}).length == 0) {
                    let res = spawn.spawnAtkRangeCreep(energyMax, target = targetRoom,
                        home = room);
                    Logger.debug(spawn.name, 'attempt to spawn', 'atk range to defend', 'res', res);
                    return;
                } else {
                    hostiles = Game.rooms[targetRoom].find(FIND_HOSTILE_STRUCTURES);
                    if (hostiles.length > 0 && hostiles.length > _.sum(Game
                        .creeps, c => c.memory.role == helper.ATTACKER && c
                        .memory.target == targetRoom && c.memory.home ==
                        room)) {
                        let res = spawn.spawnAttackerCreep(energyMax, target = targetRoom,
                            home = room);
                        Logger.debug(spawn.name, 'attempt to spawn', 'attacker prob target: invader core', 'res', res);
                        return;
                    }
                }
            }
        } catch (error) {
            Logger.error(error.message);
            // error because if there's no creep in room, you can't observe it
        }

        Logger.trace(`${spawn.name} trying to spawn basic workers`)
        // spawn creeps
        for (let targetRoom of Memory.myRooms[room]) {
            // spawn carry
            Logger.all(`${targetRoom} Carry: ${creepTrack[targetRoom][helper.CARRY]}/${creepDemand[targetRoom][helper.CARRY]} `
                + `Harv: ${creepTrack[targetRoom][helper.HARV_REMOTE]}/${creepDemand[targetRoom][helper.HARV_REMOTE]}`);

            // spawn harvRemote
            for (let i = 0; i < Memory.sources[targetRoom]; i++) {
                // Logger.info(i,Memory.sources[sourceRoom],_.reduce(Game.creeps, (acc,c) => acc || (c.memory.role == helper.HARV_REMOTE && 
                // c.memory.target == sourceRoom && c.memory.home == room && c.memory.sourceIndex == i),false))
                if (!_.reduce(Game.creeps, (acc, c) => acc ||
                    (c.memory.role == helper.HARV_REMOTE &&
                        c.memory.target == targetRoom && c.memory.home == room &&
                        c.memory.sourceIndex == i),
                    false)) {
                    
                    // make sure there is a carry first before 2nd harv
                    if (i >=1 && creepTrack[targetRoom][helper.CARRY] < 1){
                        break;
                    }
                    var res = spawn.spawnHarvRemoteCreep(energyMax,
                    targetRoom, home = room, sourceIndex = i);
                    if (Game.time % helper.logRate == 0) {
                        Logger.info(
                            `    Demand: ${targetRoom} ${helper.HARV_REMOTE}, ${res}, sourceIndex: ${i}`
                        );
                    }
                    Logger.debug(spawn.name, 'attempt to spawn', 'Honly', 'res', res);
                    if (res == 0) {
                        Logger.info(
                            `        ${spawn.name} spawned new ${HARV_REMOTE} ${targetRoom} ${room}`
                        );
                    }
                    return;
                }
            }
            let needExtras = 0;
            if (Game.rooms[targetRoom]){
                needExtras = Game.rooms[targetRoom].find(FIND_DROPPED_RESOURCES, {filter: r => r.amount > 500}).length;
            }
            if (creepTrack[targetRoom][helper.CARRY] < creepDemand[targetRoom][helper.CARRY] + needExtras) {
                var res = spawn.spawnCarryCreep(energyMax, targetRoom,
                home = room, sourceIndex = 0);
                if (Game.time % helper.logRate == 0) {
                    Logger.info(
                        `    Demand: ${targetRoom} ${helper.CARRY}, have: ${creepTrack[targetRoom][helper.CARRY]}/` +
                        `${creepDemand[targetRoom][helper.CARRY]}, ${res}`);
                }
                if (res == 0) {
                    Logger.info(`${spawn.name} spawned new ${CARRY} ${targetRoom} ${room}`);
                }
                Logger.debug(spawn.name, 'attempt to spawn', 'carry', 'res', res);
                return;
            }
        }

        
        Logger.trace(`${spawn.name} trying to spawn offensive troops`);
        if (Memory.offence[room]) {
            for (var targetRoom in Memory.offence[room]) {
                for (var role in Memory.offence[room][targetRoom].roles) {
                    if (Memory.offence[room][targetRoom].roles[role] >
                        _.sum(Game.creeps, (c) =>
                            c.memory.role == role &&
                            c.memory.target == targetRoom &&
                            c.memory.home == room &&
                            c.ticksToLive > 220)) {
                        let res;
                        if (role == ATK_RANGE) {
                            res = spawn.spawnAtkRangeCreep(energyMax, targetRoom, home = room);
                        } else if (role == ATTACKER) {
                            res = spawn.spawnAttackerCreep(energyMax, targetRoom, home = room);
                        }
                        Logger.debug(spawn.name, 'attempt to spawn', 'offensive creeps', 'res', res);
                    }
                }
            }
        }

        // spawn workers for each room
        Logger.trace(`${spawn.name} trying to spawn other workers`);
        for (let targetRoom of Memory.myRooms[room]) {
            // spawn workers
            for (let r of [UPGRADER, REPAIRER, BUILDER, WALL_REPAIRER, CLAIMER]) {

                // Logger.info(`In ${targetRoom} ${creepTrack[targetRoom][r]<creepDemand[room][r]?'need ':'got  '}`
                //     + ` ${r} have: ${creepTrack[targetRoom][r]} need: ${creepDemand[targetRoom][r]}`);

                if (creepTrack[targetRoom][r] < creepDemand[targetRoom][r]) {
                    // spawn
                    if (r == CLAIMER) {
                        res = spawn.spawnClaimerCreep(energyMax, targetRoom, room);
                    } else if (r == UPGRADER && helper.getMemory(['stats', 'Storages', room])) {
                        res = spawn.spawnSemiStaionaryCreep(energyMax, r, targetRoom, room);
                    } else {
                        res = spawn.spawnBalCreep(energyMax, r, targetRoom, room);
                    }
                    if (Game.time % helper.logRate == 0) {
                        Logger.info(
                        `    Demand: ${targetRoom} ${r} Result: ${res}, ${creepTrack[targetRoom][r]}/${creepDemand[targetRoom][r]}`
                    )};
                    if (res == 0) {
                        Logger.info(
                            `${spawn.name} spawned new ${r} ${targetRoom} ${room}`
                        );
                    }
                    Logger.debug(spawn.name, 'attempt to spawn', r, 'res', res);
                    return;
                }
            }
        };

        
        Logger.debug(`${spawn.name} finished without spawn`);
        // if (Game.time % helper.logRate == 0) Logger.info();
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