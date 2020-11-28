const {
    UPGRADER,
    roleNames
} = require("./helper")
const helper = require("./helper")

/**
 * 全局统计信息扫描器
 * 负责搜集关于 cpu、memory、GCL、GPL 的相关信息
 */
module.exports.stateScanner = function() {
    // 每 20 tick 运行一次

    if (Game.time % 20) return

    if (!Memory.stats) Memory.stats = {}

    // 统计 GCL / GPL 的升级百分比和等级
    Memory.stats.gcl = (Game.gcl.progress / Game.gcl.progressTotal) * 100
    Memory.stats.gclLevel = Game.gcl.level + Memory.stats.gcl / 100;
    Memory.stats.gpl = (Game.gpl.progress / Game.gpl.progressTotal) * 100
    Memory.stats.gplLevel = Game.gpl.level + Memory.stats.gpl / 100;
    // CPU 的当前使用量
    Memory.stats.cpu = Game.cpu.getUsed()
    // bucket 当前剩余量
    Memory.stats.bucket = Game.cpu.bucket
    // creep sum
    Memory.stats.creeps = _.sum(Memory.creeps, (c) => true);
    // Room control level
    for (let [index, room] of Object.keys(Memory.myRooms).entries()) {
        Memory.stats.rcl[index] = (Game.rooms[room].controller.progress) / (Game.rooms[room].controller.progressTotal) * 100;
        Memory.stats.rclevel[index] = Game.rooms[room].controller.level + Memory.stats.rcl[index] / 100;
    }

    if (!Memory.stats.roles) Memory.stats.roles = {};
    roleNames.forEach(r => Memory.stats.roles[r] = _.sum(Game.creeps, (c) => c.memory.role == r));
    Memory.stats.Harvesters = _.sum(Game.creeps, (c) => c.memory.role == helper.HARVESTER || c.memory.role == helper.HARV_REMOTE);
    Memory.stats.Carry = _.sum(Game.creeps, (c) => c.memory.role == helper.CARRY);
    Memory.stats.Upgraders = _.sum(Game.creeps, (c) => c.memory.role == helper.UPGRADER);
    Memory.stats.Builders = _.sum(Game.creeps, (c) => c.memory.role == helper.BUILDER);
    Memory.stats.Repairers = _.sum(Game.creeps, (c) => c.memory.role == helper.WALL_REPAIRER);

    // storage
    var storages = Game.rooms[helper.home].find(FIND_STRUCTURES, {
        filter: (s) => s.structureType == STRUCTURE_STORAGE
    });
    Memory.stats.Storages = storages.map(s => s.store.getUsedCapacity(RESOURCE_ENERGY));

    storages.forEach(storage => {
        let threshold = 700000;
        let spawn = storage.pos.findClosestByRange(FIND_MY_SPAWNS)
        if (storage.store.getUsedCapacity(RESOURCE_ENERGY) > threshold + 50000) {
            Game.notify(`Storage is at ${storage.store.getUsedCapacity(RESOURCE_ENERGY)/10000}%`)
        }
        if (!spawn.memory[spawn.room.name]) spawn.memory[spawn.room.name] = {};
        spawn.memory[spawn.room.name][UPGRADER] = storage.store.getUsedCapacity(RESOURCE_ENERGY) > threshold ? 4 : 2;
    });

    if (Memory.stats.bucket < 8000) {
        Game.notify("Bucket is low");
    }

    if (Game.time % helper.logRate == 0) {
        console.log(`${Game.time}   Creeps: W32N11: ${Memory.stats.creepTrack.Spawn1.total}/${Memory.spawns.Spawn1.total}, W33N12: ${Memory.stats.creepTrack.Spawn32.total}/${Memory.spawns.Spawn32.total};   Storage: ${Memory.stats.Storages.map(s=>(s/1000).toFixed(0) + 'k')}   RCL: ${Memory.stats.rclevel.map(l => l.toFixed(3))}  GCL: ${Memory.stats.gclLevel.toFixed(3)}  GPL: ${Memory.stats.gplLevel.toFixed(3)}`);
    }
}