/* eslint-disable guard-for-in */
require('prototype.spawn')();
const {
  HAULER,
  BUILDER,
  REPAIRER,
  WALL_REPAIRER,
  UPGRADER,
  roleNames,
  HARV_REMOTE,
  CLAIMER,
  ATK_RANGE,
  ATTACKER,
  MINER,
  KEEPER,
} = require('./helper');
const helper = require('./helper');
const {Logger, LOG_LEVEL} = require('./Logger');

const roles = {};
// var creepTrack[targetRoom] = {};
helper.roleNames.forEach((role) => {
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
// const roleHauler = require('role.hauler');


module.exports = {

  generateCreeps: function(name) {
    /** @type {StructureSpawn} */
    const spawn = Game.spawns[name];
    /** @type {string} */
    const room = spawn.room.name;
    /** @type {number} */
    const energyMax = spawn.room.energyCapacityAvailable;

    if (!Memory.stats.creepTrack[room]) {
      Memory.stats.creepTrack[
          room] = {};
    }
    const creepTrack = Memory.stats.creepTrack[room];
    const creepDemand = Memory.creepDemand[room];
    let res = undefined;

    // If I'm not logging, and it's busy, then I don't care
    if (Game.time % helper.logRate != 0 && spawn.spawning && LOG_LEVEL >= 2000) {
      Logger.debug(spawn.name, 'is spawning', spawn.spawning.name);
      return;
    }

    // update wall repairer
    const demand = Game.rooms[room].find(
        FIND_HOSTILE_CREEPS).length;
    creepDemand[room][WALL_REPAIRER] = _.min([1, demand, creepDemand[room][WALL_REPAIRER]]);
    // update claimer
    for (let targetRoom of Memory.myRooms[room]) {
      if (creepDemand[targetRoom][CLAIMER] == -1) {
        continue;
      }
      let demand = 0;
      if (targetRoom != room) {
        if (Game.rooms[targetRoom]) {
          const controller = Game.rooms[targetRoom].controller;
          demand = (!_.get(controller, ['reservation']) ||
            controller.reservation.ticksToEnd < 1000 ||
            controller.reservation.username != Memory.userName) ? 1 : 0;
        } else {
          demand = 1;
        }
      }
      helper.addMemory(['creepDemand', room, targetRoom], {'claimer': demand});
    }

    // count total harv creeps
    const totalHarvs = _.sum(Game.creeps,
        (c) => (c.memory.role == helper.HARVESTER || c.memory
            .role == helper.HARV_REMOTE) &&
            c.ticksToLive > 75 && c.memory.home == room,
    );

    // prioritised one off ones
    if (false) {
      if (spawn.name == 's3') {
        Logger.info(spawn.spawnAtkRangeCreep(energyMax, target = 'W35N11', home = 'W34N12', selfHeal =2));
      }
      return;
    }

    // collect some stats of creeps
    for (let targetRoom of Memory.myRooms[room]) {
      if (!Game.rooms[targetRoom]) {
        continue;
      } else {
        if (!creepTrack[targetRoom]) creepTrack[targetRoom] = {};
        // update builder count
        if (Game.time % helper.logRate == 0) {
          totalProgress = _.sum(Game.rooms[targetRoom]
            .find(FIND_MY_CONSTRUCTION_SITES)
            .map(s => s.progressTotal - s.progress)
          );
          let totalRequired = Math.ceil(totalProgress / 4500 / Game.rooms[room].controller.level);
          totalRequired = totalRequired > 3 ? 3 : totalRequired;
          creepDemand[targetRoom][BUILDER] = totalRequired;
        }
      }

      // count each role
      for (let role of [HAULER, HARV_REMOTE, BUILDER, REPAIRER,
        WALL_REPAIRER, UPGRADER, CLAIMER,
      ]) {
        creepTrack[targetRoom][role] = _.sum(Game.creeps, (c) =>
          c.memory.role == role &&
                    c.memory.target == targetRoom &&
                    c.memory.home == room &&
                    (c.ticksToLive > 220 || (room == targetRoom && c.ticksToLive > 100)),
        );
      }

      creepTrack[targetRoom].total = Object.keys(creepTrack[
          targetRoom]).reduce((acc, role) => acc + (role ==
                'total' ? 0 : creepTrack[targetRoom][role]), 0);
      creepDemand[targetRoom].total = Object.keys(creepDemand[
          targetRoom]).reduce((acc, role) => acc + (
            (role == 'total' || creepDemand[targetRoom][role] < 0) ?
            0 : creepDemand[targetRoom][role]
          ), 0);

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
      let msg = [];
      msg.push(`${spawn.name}:  `);
      Object.keys(Memory.myRooms[room]).forEach((targetRoomID) => {
        targetRoom = Memory.myRooms[room][targetRoomID];
        if (creepTrack[targetRoom].total < creepDemand[targetRoom].total) {
          msg.push(
              `\t${targetRoom}: ${creepTrack[targetRoom].total}/${creepDemand[targetRoom].total}`,
          );
        }
      });
      Logger.info(...msg);

      // role based stats
      msg = [];
      msg.push(`  ${creepTrack.total}/${creepDemand.total}`);
      [HARV_REMOTE, HAULER, UPGRADER,
        BUILDER, REPAIRER, WALL_REPAIRER, CLAIMER,
      ].forEach((role) => {
        const num = _.reduce(creepTrack,
            (acc, targetRoom) => acc + (
                        typeof targetRoom == 'object' ?
                        targetRoom[role] : 0), 0);
        const sumRole = _.reduce(Memory.myRooms[room], (acc, targetRoom) => acc + creepDemand[
            targetRoom][role], 0);
        if (num < sumRole) {
          msg.push(`\t${role}: ${num}/${sumRole}`);
        }
        helper.addMemory(['stats', 'roleDemand'], {[role]: num / sumRole});
      });
      Logger.info(...msg);
    }

    // if it's busy and I'm not debugging, skip spawn
    if (spawn.spawning && LOG_LEVEL >= 2000) {
      Logger.debug(spawn.name, 'is spawning', spawn.spawning.name);
      return;
    }

    // emergency off control
    if (totalHarvs > 1) {
      Memory.states.restart[room] = false;
    }

    // if colony is dying
    const totalHauler = _.sum(
      _.keys(creepTrack).map(r => creepTrack[r][HAULER])
    )
    Logger.debug(spawn.name, Memory.states.restart[room], totalHarvs < 1, _.get(Memory, ['stats', 'Storages', room]) > 10000, totalHauler < 1)
    if (Memory.states.restart[room] || totalHarvs < 1 ||
          (_.get(Memory, ['stats', 'Storages', room]) > 10000 &&
           totalHauler < 1
          )) {
      if (creepDemand.tickSinceRestart === undefined) {
        creepDemand.tickSinceRestart = 0;
      }
      creepDemand.tickSinceRestart++;

      if (creepDemand.tickSinceRestart > 100) {
        Memory.states.restart[room] = true;

        if (creepDemand.tickSinceRestart > 200) {
          Game.notify(`Something went wrong. only ${totalHarvs}` +
                    ` harvesters & ${_.sum(Game.creeps, (c)=>1)} left` +
                    `Room: ${room} ${JSON.stringify(creepTrack)}`);
        }

        if (_.get(Memory, ['stats', 'Storages', room]) > 10000 && totalHauler < 1) {
          res = spawn.spawnHaulerCreep(spawn.room.energyAvailable, room, room, 0, 16);
          Logger.warn(spawn.name, 'attempt to spawn', 'hauler for emergency', 'res', res);
          return res;
        } else {
          res = spawn.spawnBalCreep(spawn.room.energyAvailable, helper.HARVESTER, room, room);
          Logger.warn(spawn.name, 'attempt to spawn', 'bal harvester for emergency', 'res', res);
          return res;
        }
      }
      Logger.trace(`${spawn.name} has been ${creepDemand.tickSinceRestart} ticks without harv`);
    } else creepDemand.tickSinceRestart = 0;


    // spawn defenders: rangedAtk
    Logger.trace(`${spawn.name} trying to spawn defender rangeATK`);
    try {
      for (let targetRoom of Memory.myRooms[room]) {
        if (!Game.rooms[targetRoom]) {
          Logger.trace(`Offencing room ${targetRoom} can't be traced`);
          continue;
        }
        let hostiles = Game.rooms[targetRoom].find(
            FIND_HOSTILE_CREEPS);
        let hostileHealer = _.reduce(hostiles, ((acc, c) =>
                    acc || _.reduce(c.body, (acc, part) => acc || part
                        .type == HEAL, undefined) ? c : acc), null);

        // Logger.info('a ',room,targetRoom, hostiles, _.sum(Game.creeps, c => c.memory.role == helper.ATK_RANGE && c.memory.target == targetRoom && c.memory.home == room), Game.rooms[targetRoom].find(FIND_HOSTILE_STRUCTURES));
        // energy exist without healer, and no tower in the room
        if (hostiles.length > 0 && !hostileHealer && hostiles.length > _.sum(
            Game.creeps, (c) => c.memory.role == helper.ATK_RANGE &&
            c.memory.target == targetRoom && c.memory.home == room) &&
            Game.rooms[targetRoom].find(FIND_MY_STRUCTURES, {filter: (s) =>
              s.structureType == STRUCTURE_TOWER,
            }).length == 0
        ) {
          spawn.sp
          let res;
          if (hostiles.length == 1) {
            spawn.spawat
            res = spawn.spawnAtkRangeCreep(energyMax, targetRoom, room, 1, 5);
          } else {
            res = spawn.spawnAtkRangeCreep(energyMax, targetRoom, room);
          }
          Logger.debug(spawn.name, 'attempt to spawn', 'atk range to defend', 'res', res);
          return;
        } else {
          hostiles = Game.rooms[targetRoom].find(FIND_HOSTILE_STRUCTURES);
          if (hostiles.length > 0 && hostiles.length > _.sum(Game
              .creeps, (c) => c.memory.role == helper.ATTACKER && c
              .memory.target == targetRoom && c.memory.home ==
                        room)) {
            let res = spawn.spawnAttackerCreep(energyMax, targetRoom, room);
            Logger.debug(spawn.name, 'attempt to spawn',
                'attacker prob target: invader core', 'res', res);
            return;
          }
        }
      }
    } catch (error) {
      Logger.error('Error when spawning defender:', error.message, error.stack, '.');
      // error because if there's no creep in room, you can't observe it
    }

    // spawn keeper
    Logger.trace(`${spawn.name} trying to spawn keeper`);
    const flagName = `keeper-${room}`;
    if (Game.flags[flagName] && _.sum(Game.creeps, (c) =>
          c.memory.role == KEEPER &&
          c.memory.target == room &&
          c.memory.home == room &&
          c.ticksToLive > 5) == 0) {
      const dir = _.get(Game, ['flags', flagName, 'memory', 'dir']);
      spawn.spawnKeeperCreep(room, room, dir, true, true);
    }

    // spawn harv and hauler
    Logger.trace(`${spawn.name} trying to spawn basic workers`);
    for (let targetRoom of Memory.myRooms[room]) {
      // spawn hauler
      Logger.all(`${targetRoom} Hauler: ${creepTrack[targetRoom][HAULER]}/${creepDemand[targetRoom][HAULER]} ` +
                `Harv: ${creepTrack[targetRoom][helper.HARV_REMOTE]}/${creepDemand[targetRoom][helper.HARV_REMOTE]}`);

      // spawn harvRemote
      if (creepDemand[targetRoom][HARV_REMOTE] == -1) {
        continue;
      }
      for (let i = 0; i < Memory.sources[targetRoom]; i++) {
        // Logger.info(i,Memory.sources[sourceRoom],_.reduce(Game.creeps, (acc,c) =>
        // acc || (c.memory.role == helper.HARV_REMOTE &&
        // c.memory.target == sourceRoom && c.memory.home == room && c.memory.sourceIndex == i),false))
        if (!_.reduce(Game.creeps, (acc, c) => acc ||
                    (c.memory.role == helper.HARV_REMOTE &&
                        c.memory.target == targetRoom && c.memory.home == room &&
                        c.memory.sourceIndex == i),
        false)) {
          // make sure there is a hauler first before 2nd harv
          if (i >=1 &&
              creepTrack[targetRoom][HAULER] < 1 &&
              creepDemand[targetRoom][HAULER] > 0
              ) {
            break;
          }
          const res = spawn.spawnHarvRemoteCreep(energyMax,
              targetRoom, room, i);
          // if (Game.time % helper.logRate == 0) {
          Logger.info(
              `    Demand: ${targetRoom} ${helper.HARV_REMOTE}, ${res}, sourceIndex: ${i}`,
          );
          // }
          // Logger.debug(spawn.name, 'attempt to spawn', 'Honly', 'res', res);
          // if (res == 0) {
          //   Logger.info(
          //       `        ${spawn.name} spawned new ${HARV_REMOTE} ${targetRoom} ${room}`,
          //   );
          // }
          return;
        }
      }
      let needExtras = 0;
      if (Game.rooms[targetRoom]) {
        needExtras = Game.rooms[targetRoom].find(FIND_DROPPED_RESOURCES, {
          filter: (r) => r.amount > 500,
        }).length;
        needExtras = needExtras > 2 ? 2 : needExtras;
      }
      if (creepTrack[targetRoom][HAULER] <
          creepDemand[targetRoom][HAULER] + needExtras) {
        let res;
        if (targetRoom == room) {
          res = spawn.spawnHaulerCreep(energyMax, targetRoom, room, 0, 16);
        } else {
          res = spawn.spawnHaulerCreep(energyMax, targetRoom, room, 0);
        }
        if (Game.time % helper.logRate == 0) {
          Logger.info(
              `    Demand: ${targetRoom} ${HAULER}, have: ${creepTrack[targetRoom][HAULER]}/` +
                        `${creepDemand[targetRoom][HAULER]}, ${res}`);
        }
        if (res == 0) {
          Logger.info(`${spawn.name} spawned new ${HAULER} ${targetRoom} ${room}`);
        }
        Logger.debug(spawn.name, 'attempt to spawn', 'hauler', 'res', res);
        return;
      }
    }


    Logger.trace(`${spawn.name} trying to spawn offensive troops`);
    if (Memory.offence[room]) {
      for (let targetRoom in Memory.offence[room]) {
        for (let role in Memory.offence[room][targetRoom].roles) {
          if (Memory.offence[room][targetRoom].roles[role] >
                        _.sum(Game.creeps, (c) =>
                          c.memory.role == role &&
                            c.memory.target == targetRoom &&
                            c.memory.home == room &&
                            c.ticksToLive > 220)) {
            let res;
            if (role == ATK_RANGE) {
              res = spawn.spawnAtkRangeCreep(energyMax, targetRoom, room);
            } else if (role == ATTACKER) {
              res = spawn.spawnAttackerCreep(energyMax, targetRoom, room);
            }
            Logger.debug(spawn.name, 'attempt to spawn', 'offensive creeps', 'res', res);
          }
        }
      }
    }

    // spawn mineral miners
    Logger.trace(`${spawn.name} trying to spawn miners`);
    const source = Game.rooms[room].find(FIND_MINERALS)[0];
    const extractors = Game.rooms[room].find(FIND_STRUCTURES, {filter: (s) =>
      s.structureType == STRUCTURE_EXTRACTOR,
    });
    const minersNum = _.sum(Game.creeps, (c) =>
      c.memory.role == MINER &&
      c.memory.home == room &&
      c.memory.target == room &&
      c.ticksToLive > 150,
    );
    if (
      extractors.length > 0 &&
          minersNum == 0 &&
          source.mineralAmount > 0 &&
          extractors[0].pos.findInRange(FIND_STRUCTURES, 1, {filter: (s) =>
            s.structureType == STRUCTURE_CONTAINER,
          }).length > 0
    ) {
      res = spawn.spawnHarvRemoteCreep(energyMax, room, room, 0, MINER, 18);
      Logger.debug(
          spawn.name, 'attempt to spawn', MINER, 'res', res,
      );
      return;
    }

    // spawn workers for each room
    Logger.trace(`${spawn.name} trying to spawn other workers`);
    for (let targetRoom of Memory.myRooms[room]) {
      // spawn workers
      for (let r of [UPGRADER, REPAIRER, BUILDER, WALL_REPAIRER, CLAIMER]) {
        // Logger.info(`In ${targetRoom} ` +
        // `${creepTrack[targetRoom][r]<creepDemand[room][r]?'need ':'got  '}`
        //     + ` ${r} have: ${creepTrack[targetRoom][r]} need: ${creepDemand[targetRoom][r]}`);

        if (creepTrack[targetRoom][r] < creepDemand[targetRoom][r]) {
          // spawn
          if (r == CLAIMER) {
            res = spawn.spawnClaimerCreep(energyMax, targetRoom, room);
          } else if (
              r == UPGRADER && (
                _.get(Memory, ['stats', 'Storages', room]) ||
                Game.rooms[targetRoom].controller.pos.findInRange(FIND_STRUCTURES, 2, {
                  filter: s => s.structureType == STRUCTURE_CONTAINER
              }).length > 0)) {
            res = spawn.spawnSemiStationaryCreep(energyMax, r, targetRoom, room);
          } else {
            res = spawn.spawnBalCreep(energyMax, r, targetRoom, room);
          }
          if (Game.time % helper.logRate == 0) {
            Logger.info(
                `    Demand: ${targetRoom} ${r} Result: ${res}, ${creepTrack[targetRoom][r]}/${creepDemand[targetRoom][r]}`,
            );
          };
          if (res == 0) {
            Logger.info(
                `${spawn.name} spawned new ${r} ${targetRoom} ${room}`,
            );
          }
          Logger.debug(spawn.name, 'attempt to spawn', r, 'res', res);
          return;
        }
      }
    };

    if (Game.rooms[room].find(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_STORAGE}).length == 0 &&
        creepTrack[room][UPGRADER] < 6 / Game.rooms[room].controller.level
        ) {
      if (Game.rooms[room].controller.pos.findInRange(FIND_STRUCTURES, 2, {
        filter: s => s.structureType == STRUCTURE_CONTAINER
      }).length > 0) {
        res = spawn.spawnSemiStationaryCreep(energyMax, UPGRADER, room, room, 4);
      } else {
        res = spawn.spawnBalCreep(energyMax, UPGRADER, room, room);
      }
      
      Logger.debug(`Spawned extra upgraders for ${room}: RCL: ${Game.rooms[room].controller.level}`)
    }
    Logger.debug(`${spawn.name} finished without spawn`);
    // if (Game.time % helper.logRate == 0) Logger.info();
  },

  runCreeps: function() {
    // for every creep name in Game.creeps
    for (let name in Game.creeps) {
      // if ({}.hasOwnProperty.call(Game.creeps, name)) {
      // get the creep object
      let creep = Game.creeps[name];

      // who r u?
      // creep.say(creep.memory.role.slice(0,1));

      for (let role of roleNames) {
        try {
          if (creep && creep.memory.role == role) {
            // creep.say(role);
            roles[role].run(creep);
          }
        } catch (e) {
          Logger.warn(`Error running ${role}`, e.name, e.message, e.fileName, e.lineNumber, creep);
        }
      }
      // }
    }
  },
  roleChange: function(oldRole, newRole) {
    for (let name in Game.creeps) {
      // if ({}.hasOwnProperty.call(Game.creeps, name)) {
      let creep = Game.creeps[name];
      if (creep.memory.role == oldRole) {
        creep.memory.role = newRole;
      }
      // }
    }
  },
};
