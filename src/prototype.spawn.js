const {
    HARV_REMOTE,
    CARRY,
    CLAIMER,
    ATK_RANGE,
    ATTACKER
} = require("./helper");
const helper = require("./helper");

function getName(role, target, home) {
    return `${role.slice(0,5)}-${target}-${home}-${Math.floor(Math.random() * 1000)}`;
}
module.exports = function() {
    // create a new function for StructureSpawn
    StructureSpawn.prototype.createBalCreep =
        function(energy, roleName, target = this.room.name, home = helper
            .home) {
            // create a balanced body as big as possible with the given energy
            var numberOfParts = Math.floor(energy / 200);
            // numberOfParts = numberOfParts > 5 ? 5 : numberOfParts;
            var body = [];
            for (let i = 0; i < numberOfParts; i++) {
                body.push(WORK);
            }
            for (let i = 0; i < numberOfParts; i++) {
                body.push(CARRY);
            }
            for (let i = 0; i < numberOfParts; i++) {
                body.push(MOVE);
            }

            // create creep with the created body and the given role
            return this.spawnCreep(body,
                `${getName(roleName,target,home)}`, {
                    memory: {
                        role: roleName,
                        working: false,
                        target: target,
                        home: home,
                        sourceIndex: 0
                    }
                });
        };


    /**
     * 
     * @param {string} target target room ID
     */
    StructureSpawn.prototype.spawnClaimerCreep = function(energy, target, home =
        this.room.name) {
        var body;
        if (energy >= 1300 && (!Game.rooms[target].controller.reservation || Game.rooms[target].controller
                .reservation.ticksToEnd < 500)) {
            body = [CLAIM, CLAIM, MOVE, MOVE];
        } else if (!Game.rooms[target].controller.reservation || Game.rooms[target].controller.reservation
            .ticksToEnd < 3000) {
            body = [CLAIM, MOVE, MOVE];
        } else return;
        return this.spawnCreep(body,
            `${getName(CLAIMER,target,home)}`, {
                memory: {
                    role: helper.CLAIMER,
                    target: target,
                    home: home
                }
            });
    }

    StructureSpawn.prototype.spawnHarvRemoteCreep =
        /**
         * 
         * @param {number} energy used to generate
         * @param {string} target target room id
         * @param {number} sourceIndex source index of Energy
         */
        function(energy, target, home = this.room.name, sourceIndex = 0) {
            // create a balanced body as big as possible with the given energy
            var numberOfParts = Math.floor((energy - (target == home ? 100 :
                200)) / 100);
            numberOfParts = numberOfParts > 5 ? 5 : numberOfParts;
            var body = [];
            for (let i = 0; i < numberOfParts; i++) {
                body.push(WORK);
            }
            if (target != home) {
                body.push(CARRY, MOVE);
            }
            body.push(MOVE);
            body.push(MOVE);

            // create creep with the created body and the given role
            return this.spawnCreep(body,
                `${getName(HARV_REMOTE,target,home)}`, {
                    memory: {
                        role: helper.HARV_REMOTE,
                        arrived: false,
                        target: target,
                        home: home,
                        sourceIndex: sourceIndex
                    }
                });
        };

    StructureSpawn.prototype.spawnCarryCreep =
        /**
         * 
         * @param {number} energy used to generate
         * @param {string} target target room id
         * @param {string} home home room id
         * @param {number} sourceIndex source index of Energy
         */
        function(energy, target, home = this.room.name, sourceIndex = 0) {
            // create a balanced body as big as possible with the given energy
            var numberOfParts = Math.floor(energy / 150);
            numberOfParts = numberOfParts > 8 ? 8 : numberOfParts;
            // numberOfParts = (numberOfParts > 5 && target == home) ? 5 : numberOfParts;
            var body = [];
            for (let i = 0; i < numberOfParts; i++) {
                body.push(CARRY);
                body.push(CARRY);
            }
            for (let i = 0; i < numberOfParts; i++) {
                body.push(MOVE)
            }

            // create creep with the created body and the given role
            return this.spawnCreep(body,
                `${getName(helper.CARRY,target,home)}`, {
                    memory: {
                        role: helper.CARRY,
                        working: false,
                        target: target,
                        home: home,
                        sourceIndex: sourceIndex
                    }
                });
        };

    StructureSpawn.prototype.spawnAtkRangeCreep =
        /**
         * 
         * @param {number} energy used to generate
         * @param {string} target target room id
         * @param {string} home home room id
         */
        function(energy, target, home = this.room.name) {
            // create a balanced body as big as possible with the given energy
            var numberOfParts = Math.floor(energy / 210);
            var body = [];
            for (let i = 0; i < numberOfParts; i++) {
                body.push(TOUGH);
            }
            for (let i = 0; i < numberOfParts - 1; i++) {
                body.push(MOVE);
            }
            for (let i = 0; i < numberOfParts; i++) {
                body.push(RANGED_ATTACK);
            }
            body.push(MOVE);


            // create creep with the created body and the given role
            return this.spawnCreep(body,
                `${getName(ATK_RANGE,target,home)}`, {
                    memory: {
                        role: helper.ATK_RANGE,
                        attack: true,
                        working: true,
                        target: target,
                        home: home
                    }
                });
        };

    StructureSpawn.prototype.spawnAttackerCreep =
        /**
         * 
         * @param {number} energy used to generate
         * @param {string} target target room id
         * @param {string} home home room id
         */
        function(energy, target, home = this.room.name) {
            // create a balanced body as big as possible with the given energy
            var numberOfParts = Math.floor(energy / 140);
            var body = [];
            for (let i = 0; i < numberOfParts; i++) {
                body.push(TOUGH);
            }
            for (let i = 0; i < numberOfParts - 1; i++) {
                body.push(MOVE);
            }
            for (let i = 0; i < numberOfParts; i++) {
                body.push(ATTACK);
            }
            body.push(MOVE);


            // create creep with the created body and the given role
            return this.spawnCreep(body,
                `${getName(ATTACKER,target,home)}`, {
                    memory: {
                        role: helper.ATTACKER,
                        attack: true,
                        working: true,
                        target: target,
                        home: home
                    }
                });
        };
};