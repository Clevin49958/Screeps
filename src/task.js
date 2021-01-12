const { HAULER, HARVESTER, MINER } = require('./helper');
const helper = require('./helper');
const { Logger } = require('./Logger');
const {queueNode, PriorityQueue} = require('./priorityQueue');
/**
 * This module aim to provide a list of base classes for task based process
 */

class Task extends queueNode{
    defaultAction() {}
  

  constructor(priority) {
      super(priority);
      /**
      * 1: complete
      *
      * 0~1: in progress (decimal may indicate progress)
      *
      * 0: intiated
      *
      * -1: failed
      *
    * -2: waiting
    *
      * @type {number}
      */
    this.status = -2;
      /**
         * @function
         * @param {Creep} creep the creep performing task
         */
    this.perform = this.defaultAction;
    }
  /**
   * 
   * @param {number} status whether the task is completed (OK) or failed (ERR_*)
   */
  onComplete(status) {}
}
class TaskQueue extends PriorityQueue {
  constructor() {
    super();
  }
}

class PayTask extends Task {
  /**
   * 
   * @param {number} priority 
   * @param {ResourceConstant} srcType 
   * @param {number} amount 
   * @param {AnyStoreStructure} target 
   * @param {{action: Function, prerequisite: Function, callbacks: Function[]}} options
   */
  constructor(priority, srcType, amount, target, options = {}) {
    super(priority);
    this.srcType = srcType;

    this.progressTotal = amount;
    /** @type {number} */
    this.progress = 0;

    this.targetID = target.id;
    this.targetPos = target.pos;

    this.aciton = options.action || this.defaultAction;
    this.prerequisite = options.prerequisite || this.defaultPrerequisite;
    this.callbacks = options.callbacks || [];

    /** @type {string} */
    this.creepName;
  }

    /**
   * 
   * @param {number} status whether the task is completed (OK) or failed (ERR_*)
     */
  onComplete(status) {
    // remove references of task
    const path = ['rooms', this.targetPos.roomName, 'objs', this.targetID, this.srcType];
    const task = _.get(global, path);
    this.callbacks.forEach(f => f(this));
    const msg = [`Task finished with }`, status, _.keys({status}[0]), this];
    switch (status) {
      case OK:
        Logger.trace(...msg);
        break;
      // creep not found
      case ERR_NO_BODYPART:
        Logger.debug(...msg);

      default:
        Logger.warn(...msg);
        break;
        }
    if (task && task.creepName == this.creepName) {
      _.set(global, path, undefined);
      }
    global.creeps[this.creepName].task = undefined;
    }

  /**
   * 
   * @param {Creep} creep the creep to perform task
   * @returns {boolean}
   */
  defaultPrerequisite(creep) {
    if (!this.targetPos) {
      Logger.warn(`Pos disappeared`, creep.name, this.targetID, this.targetPos, Game.getObjectById(this.targetID).pos, this)
}

class takeTask extends task {
  constructor(priority, srcType, amount, target, aciton = this.defaultAction) {
    this.priority = priority;
    this.srcType = srcType;
    this.progressTotal = amount;
    /** @type {AnyStoreStructure} */
    this.target = target;
    this.aciton = aciton;
    this.progress = 0;
  }

    /**
     * creep will take $amount of $srcType to $target
     * @param {Creep} creep the creep to perform task
     * @returns {number} result of task:
     * 1: complete
     * 0: OK
     * <0: one of the ERR_*
     */
    defaultAction(creep){
      // pay structure
      const structure = this.target;
      if (creep.pos.isNearTo(structure)) {
        const amountCarried = creep.store.getUsedCapacity(this.srcType);
        const res = creep.withdraw(structure, this.srcType);
        const amountWithdrawn = creep.store.getUsedCapacity(this.srcType) - amountCarried;
        this.progress += amountWithdrawn;
        this.status = this.progress / this.progressTotal;
        if (this.status >= 1) {
          // TODO task is complete, delete task
          return 1;
        }
        return res;
      } else {
        const res = creep.myMoveTo(structure);
        return res;
      }
    }
}


module.exports = {
  TaskQueue,
  PayTask,
  // TakeTask,
  Task
}