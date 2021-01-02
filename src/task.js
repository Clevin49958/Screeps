const helper = require('./helper');
const {queueNode, PriorityQueue} = require('./priorityQueue');
/**
 * This module aim to provide a list of base classes for task based process
 */

class task extends queueNode{
    defaultAction() {}
  

    constructor(priority, aciton = this.defaultAction) {
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
      * @type {number}
      */
      this.status = 0;
      /**
         * @function
         * @param {Creep} creep the creep performing task
         */
      this.perform = aciton;
    }
}
class TaskQueue extends PriorityQueue {
  constructor() {
    super();
  }
}

class payTask extends task {
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
     * creep will pay $amount of $srcType to $target
     * @param {Creep} creep the creep to perform task
     * @returns {number} result of task:
     * 1: complete
     * 0: OK
     * <0: one of the ERR_*
     */
    defaultAction(creep) {
      // pay structure
      const structure = this.target;
      if (creep.pos.isNearTo(structure)) {
        const amountCarried = creep.store.getUsedCapacity(this.srcType);
        const res = creep.transfer(structure, this.srcType);
        const amountPaid = amountCarried - creep.store.getUsedCapacity(this.srcType);
        this.progress += amountPaid;
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
