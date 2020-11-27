require('prototype.spawn')();
const {
    CARRY,
    HARVESTER,
    BUILDER,
    REPAIRER,
    WALL_REPAIRER,
    UPGRADER,
    roleNames,
    HARV_REMOTE
} = require('./helper');
const helper = require('./helper');

var roles = {};
// var numPerRolePerRoom[targetRoom] = {};
var numPerRolePerRoom = {};
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

function getHarvAndCarry(spawn, energy, room) {

}

module.exports = {

    generateCreeps: function() {

        for (let name in Game.spawns) {
            var spawn = Game.spawns[name];
            var room = spawn.room.name;
            var energy = spawn.room.energyCapacityAvailable;
            var res = undefined;

            // update wall repairer
            spawn.memory[room][WALL_REPAIRER] = Game.rooms[room].find(FIND_HOSTILE_CREEPS).length;

            // count total harv creeps
            var totalHarvs;
            totalHarvs = _.sum(Game.creeps,
                c => c.memory.role == helper.HARVESTER || c.memory.role == helper.HARV_REMOTE &&
                c.memory.target == room && c.ticksToLive > 75 && c.memory.home == room
            );

            // emergency off control
            if (totalHarvs >= spawn.memory[room][HARVESTER]) {
                Memory.states.restart = false;
            }

            // prioritised one off ones 
            if (false) {
                // res = spawn.spawnClaimerCreep(target = 'W33N11');
                spawn.spawnAtkRangeCreep(300, target = 'W33N11', home = 'W32N11')
                return;
            }

            // if colony is dying
            if (totalHarvs < spawn.memory[room][HARVESTER]) {
                spawn.memory.tickNoHarv++;

                if (spawn.memory.tickNoHarv > 300) {
                    // spawn one with what is available
                    res = spawn.createBalCreep(
                        spawn.room.energyAvailable, helper.HARVESTER);
                    Game.notify(`Something went wrong. only ${totalHarvs}` +
                        ` harvesters & ${_.sum(Game.creeps,(c)=>1)} left` +
                        `Room: ${room} ${JSON.stringify(numPerRolePerRoom[targetRoom])}`);
                    return;
                }
            } else spawn.memory.tickNoHarv = 0;

            // spawn defenders: rangedAtk
            for (let targetRoom of Memory.myRooms[room]) {
                var hostiles = Game.rooms[targetRoom].find(FIND_HOSTILE_CREEPS);
                // console.log('a ',room,targetRoom, hostiles, _.sum(Game.creeps, c => c.memory.role == helper.ATK_RANGE && c.memory.target == targetRoom && c.memory.home == room));
                if (hostiles.length > 0 && hostiles.length > _.sum(Game.creeps, c => c.memory.role == helper.ATK_RANGE && c.memory.target == targetRoom && c.memory.home == room)) {
                    spawn.spawnAtkRangeCreep(energy, target = targetRoom, home = room);
                    return;
                }
            }

            // log some stats of creeps
            for (let targetRoom of Memory.myRooms[room]) {
                numPerRolePerRoom[targetRoom] = {};
                [helper.CARRY, helper.HARV_REMOTE, BUILDER, REPAIRER, WALL_REPAIRER, CARRY, UPGRADER].forEach(
                    (role) => numPerRolePerRoom[targetRoom][role] = _.sum(Game.creeps, (c) => c.memory.role == role &&
                        c.memory.target == targetRoom && c.memory.home == room && (c.ticksToLive > 300 || (room == targetRoom && c.ticksToLive > 100))
                    ));

                if (Game.time % helper.logRate == 0) {
                    console.log(`Spawn: ${spawn.name} Room: ${targetRoom} ${JSON.stringify(numPerRolePerRoom[targetRoom])}`);
                }
            }

            for (let targetRoom of Memory.myRooms[room]) {
                [helper.CARRY, helper.HARV_REMOTE, BUILDER, REPAIRER, WALL_REPAIRER, CARRY, UPGRADER].forEach(
                    (role) => numPerRolePerRoom[targetRoom][role] = _.sum(Game.creeps, (c) => c.memory.role == role &&
                        c.memory.target == targetRoom && c.memory.home == room && (c.ticksToLive > 300 || (room == targetRoom && c.ticksToLive > 100))
                    ));
                if (numPerRolePerRoom[targetRoom][helper.CARRY] < spawn.memory[targetRoom][helper.CARRY]) {
                    if (Game.time % helper.logRate == 0)
                        console.log(`    Demand ${targetRoom} ${helper.CARRY} have: ${numPerRolePerRoom[targetRoom][helper.CARRY]} ` +
                            `need: ${spawn.memory[targetRoom][helper.CARRY]}`);

                    var res = spawn.spawnCarryCreep(energy, targetRoom, home = room, sourceIndex = 0);
                    if (res == 0) {
                        console.log(`Spawned new ${CARRY} ${targetRoom} ${room}`);
                    }
                    if (res <= 0) return true;
                }

                // console.log(`Harvester in ${sourceRoom}: ${numPerRolePerRoom[targetRoom][HARV_REMOTE]}`)
                for (let i = 0; i < Memory.sources[targetRoom]; i++) {
                    // console.log(i,Memory.sources[sourceRoom],_.reduce(Game.creeps, (acc,c) => acc || (c.memory.role == helper.HARV_REMOTE && 
                    // c.memory.target == sourceRoom && c.memory.home == room && c.memory.sourceIndex == i),false))
                    if (!_.reduce(Game.creeps, (acc, c) => acc || (c.memory.role == helper.HARV_REMOTE &&
                            c.memory.target == targetRoom && c.memory.home == room && c.memory.sourceIndex == i), false)) {

                        if (Game.time % helper.logRate == 0)
                            console.log(`    Demand ${targetRoom} ${helper.HARV_REMOTE} sourceIndex: ${i}`);
                        var res = spawn.spawnHarvRemoteCreep(energy, targetRoom, home = room, sourceIndex = i)
                        if (res == 0) {
                            console.log(`Spawned new ${HARV_REMOTE} ${targetRoom} ${room}`);
                        }
                        if (res <= 0) return true;
                    }
                }

            }

            // spawn workers for each room

            Memory.myRooms[room].forEach(targetRoom => {
                // spawn workers
                for (let r of [UPGRADER, REPAIRER, BUILDER, WALL_REPAIRER]) {

                    // console.log(`In ${targetRoom} ${numPerRolePerRoom[targetRoom][r]<spawn.memory[room][r]?'need ':'got  '}`
                    //     + ` ${r} have: ${numPerRolePerRoom[targetRoom][r]} need: ${spawn.memory[targetRoom][r]}`);

                    if (numPerRolePerRoom[targetRoom][r] < spawn.memory[targetRoom][r]) {
                        // log
                        if (Game.time % helper.logRate == 0) console.log(`    Demand ${targetRoom} ${r} have: ${numPerRolePerRoom[targetRoom][r]} need: ${spawn.memory[targetRoom][r]}`);

                        // spawn
                        res = spawn.createBalCreep(energy, r, targetRoom, room);
                        if (res == 0) {
                            console.log(`Spawned new ${r} ${targetRoom} ${room}`);
                        }
                        if (res <= 0) break;
                    }
                }
                if (Game.time % helper.logRate == 0) console.log();
            });
        }
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