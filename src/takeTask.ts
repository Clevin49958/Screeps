// import { CreepTask, taskOptions, TransferTask } from "./task";

// export class TakeTask<Target extends AnyStoreStructure> extends TransferTask<Target> {
//   get alternativeId(): string {
//     return `pay-${this.roomName}-${this.target.type}-${this.generatedTime % 10000}-${this.target.id.substr(0,3)}`;
//   }
//   onComplete(status: number): void {
//     throw new Error("Method not implemented.");
//   }

//   constructor(
//     priority: number,
//     srcType: ResourceConstant,
//     amount: number,
//     target: GlobalObjInfo<Target>,
//     roomName: string,
//     handledByKeeper: boolean,
//     options: taskOptions<Creep> = {}
//   ) {
//     super(
//       priority,
//       srcType,
//       amount,
//       target,
//       handledByKeeper,
//       roomName,
//       options.action || ((creep: Creep) => this.defaultAction(creep)),
//       options.prerequisite || ((creep: Creep) => this.defaultPrerequisite(creep)),
//       options.callbacks || []
//     );
//   }


//   /**
//    * creep will take $amount of $srcType to $target
//    * @param {Creep} creep the creep to perform task
//    * @returns {number} result of task:
//    * 1: complete
//    * 0: OK
//    * <0: one of the ERR_*
//    */
//   private defaultAction(creep: Creep): ScreepsReturnCode | 1 {
//     creep.say(`${this.priority}:${this.progress}`);
//     // take from structure
//     const structure = Game.getObjectById(this.target.id as Id<Target>);
//     const pos = new RoomPosition(this.target.x, this.target.y, this.roomName);

//     if (creep.pos.isNearTo(pos)) {
//       const amountToTake = _.min([
//         creep.store.getFreeCapacity(this.srcType),
//         this.progressTotal - this.progress
//       ]);
//       const res = creep.withdraw(structure, this.srcType, amountToTake);
//       this.progress += amountToTake;
//       this.status = this.progress / this.progressTotal;
//       if (this.status >= 1) {
//         this.onComplete(OK);
//         return 1;
//       }
//       return res;
//     } else {
//       const res = creep.myMoveTo(pos);
//       return res;
//     }
//   }

//   private defaultPrerequisite(creep: Creep): boolean {
//     throw new Error("Method not implemented.");
//   }
// }
