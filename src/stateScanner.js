const {
  UPGRADER,
  roleNames,
  logRate,
} = require('./helper');
const helper = require('./helper');

/**
 * 全局统计信息扫描器
 * 负责搜集关于 cpu、memory、GCL、GPL 的相关信息
 */
module.exports.stateScanner = function() {
  // 每 20 tick 运行一次

  if (Game.time % logRate) return;

  if (Game.cpu.bucket > 9900) {
    Game.cpu.generatePixel();
  }
  if (!Memory.stats) Memory.stats = {};

  // 统计 GCL / GPL 的升级百分比和等级
  Memory.stats.gcl = (Game.gcl.progress / Game.gcl.progressTotal) * 100;
  Memory.stats.gclLevel = Game.gcl.level + Memory.stats.gcl / 100;
  Memory.stats.gpl = (Game.gpl.progress / Game.gpl.progressTotal) * 100;
  Memory.stats.gplLevel = Game.gpl.level + Memory.stats.gpl / 100;
  // bucket 当前剩余量
  Memory.stats.bucket = Game.cpu.bucket;
  // creep sum
  Memory.stats.creeps = _.sum(Memory.creeps, (c) => true);
  // Room control level
  for (const [index, room] of Object.keys(Memory.myRooms).entries()) {
    Memory.stats.rcl[index] = (Game.rooms[room].controller.progress) / (
      Game.rooms[room].controller.progressTotal) * 100;
    Memory.stats.rclevel[index] = Game.rooms[room].controller.level +
            Memory.stats.rcl[index] / 100;
  }

  if (!Memory.stats.roles) Memory.stats.roles = {};
  roleNames.forEach((r) => Memory.stats.roles[r] = _.sum(Game.creeps, (c) =>
    c.memory.role == r));
  // storage
  const storages = {};
  for (const room in Memory.myRooms) {
    if ({}.hasOwnProperty.call(Memory.myRooms, room)) {
      let storage = Game.rooms[room].find(FIND_STRUCTURES, {
        filter: (s) => s.structureType == STRUCTURE_STORAGE,
      });
      if (storage.length > 0) {
        storage = storage[0];
        storages[room] = storage;
        Memory.stats.Storages[room] = storage.store.getUsedCapacity(
            RESOURCE_ENERGY);
        const threshold = 500000;
        const flunctuationRange = 30000;
        const energy = storage.store.getUsedCapacity(RESOURCE_ENERGY);
        if (energy > threshold + 50000) {
          Game.notify(`Storage is at ${
            storage.store.getUsedCapacity(RESOURCE_ENERGY)/10000
          }%`);
        }
        // update upgrader
        if (Game.time % 500 == 0 && Math.abs(energy - threshold) > flunctuationRange) {
          if (energy - threshold > flunctuationRange &&
            Memory.creepDemand[storage.room.name][storage.room.name][UPGRADER] < 3) {
            Memory.creepDemand[storage.room.name][storage.room.name][UPGRADER] += 1;
          }

          if (energy - threshold < -flunctuationRange &&
            Memory.creepDemand[storage.room.name][storage.room.name][UPGRADER] > 1) {
            Memory.creepDemand[storage.room.name][storage.room.name][UPGRADER] -= 1;
          }
        }
      }
    }
  }

  if (Memory.stats.bucket < 500) {
    Game.notify('Bucket is low');
  }

  if (Game.time % helper.logRate == 0) {
    console.log(Memory.watch.values.status);
  }

  // CPU 的当前使用量
  Memory.stats.cpu = Game.cpu.getUsed();
};
