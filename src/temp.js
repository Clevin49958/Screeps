`${Game.time}   ${_.reduce(Game.spawns, (acc,s) => `${acc} ${s.name}: ${Memory.stats.creepTrack[s.room.name].total}/${Memory.creepDemand[s.room.name].total}`,'')} Storage: ${Object.values(Memory.stats.Storages).map(s=>(s/1000).toFixed(0) + 'k')}   RCL: ${Memory.stats.rclevel.map(l => l.toFixed(3))}  GCL: ${Memory.stats.gclLevel.toFixed(3)}  GPL: ${Memory.stats.gplLevel.toFixed(3)} Bucket: ${Memory.stats.bucket}`