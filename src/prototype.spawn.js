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
    StructureSpawn.prototype.spawnBalCreep =
        function(energy, roleName, target = this.room.name, home = helper
            .home, lim = 8) {
            // create a balanced body as big as possible with the given energy
            var numberOfParts = Math.floor(energy / 200);
            numberOfParts = numberOfParts > lim ? lim : numberOfParts;
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
        // create a body with as many [claim, move] as possible
        var numberOfParts = Math.floor(energy/650);
        numberOfParts = numberOfParts > 5 ? 5 : numberOfParts;
        var body = [];
        for (let i = 0; i < numberOfParts; i++) {
            body.push(CLAIM);
        }
        for (let i = 0; i < numberOfParts; i++) {
            body.push(MOVE);
        }
        return this.spawnCreep(body,
            `${getName(CLAIMER,target,home)}`, {
                memory: {
                    role: helper.CLAIMER,
                    target: target,
                    home: home
                }
            });
    }

    StructureSpawn.prototype.spawnSemiStaionaryCreep = function(energy, roleName, target = this.room.name, home = helper
        .home, lim = 3) {
        // create a balanced body as big as possible with the given energy
        var numberOfParts = Math.floor((energy - 350) / 450);
        numberOfParts = numberOfParts > lim ? lim : numberOfParts;
        
        var body = [];
        for (let i = 0; i < numberOfParts * 4 + 2; i++) {
            body.push(WORK);
        }
        for (let i = 0; i < 2; i++) {
            body.push(CARRY);
        }
        for (let i = 0; i < numberOfParts + 1; i++) {
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

    StructureSpawn.prototype.spawnHarvRemoteCreep =
        /**
         * 
         * @param {number} energy used to generate
         * @param {string} target target room id
         * @param {number} sourceIndex source index of Energy
         */
        function(energy, target, home = this.room.name, sourceIndex = 0, role = helper.HARV_REMOTE, lim = 7) {
            // create a balanced body as big as possible with the given energy
            var numberOfParts = Math.floor((energy - 200) / 100);
            numberOfParts = numberOfParts > lim ? lim : numberOfParts;
            var body = [];
            for (let i = 0; i < numberOfParts; i++) {
                body.push(WORK);
            }

            body.push(CARRY, MOVE);
            body.push(MOVE);
            body.push(MOVE);

            // create creep with the created body and the given role
            return this.spawnCreep(body,
                `${getName(role,target,home)}`, {
                    memory: {
                        role: role,
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
         * @param {number} lim limit the number of body part groups the creeps have have
         */
        function(energy, target, home = this.room.name, sourceIndex = 0, lim = 8) {
            // create a balanced body as big as possible with the given energy
            var numberOfParts = Math.floor((energy - (target == home ? 0 : 150)) / 150);
            numberOfParts = numberOfParts > lim ? lim : numberOfParts;
            var body = [];
            for (let i = 0; i < numberOfParts; i++) {
                body.push(CARRY);
                body.push(CARRY);
            }
            for (let i = 0; i < numberOfParts; i++) {
                body.push(MOVE)
            }
            if (target != home) {
                body.push(WORK,MOVE);
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
        function(energy, target, home = this.room.name, selfHeal = 0) {
            // create a balanced body as big as possible with the given energy
            var numberOfParts = Math.floor((energy - 300 * selfHeal) / 210);
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
            for (let i = 0; i < selfHeal; i++) {
                body.push(HEAL,MOVE);
            }


            // create creep with the created body and the given role
            return this.spawnCreep(body,
                `${getName(ATK_RANGE,target,home)}`, {
                    memory: {
                        role: helper.ATK_RANGE,
                        attack: true,
                        working: true,
                        target: target,
                        home: home,
                        heal: selfHeal > 0
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