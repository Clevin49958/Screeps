const {
  CLAIMER,
  ATK_RANGE,
  ATTACKER,
} = require('./helper');
const helper = require('./helper');

/**
 * Generate a random name for creep in the format of
 * {5 character role name} - {target room} - {home room} - {random id up to 1000}
 * @param {string} role role name of creep
 * @param {string} target room name
 * @param {string} home room name
 * @returns {string} creep name
 */
function getName(role, target, home) {
  return `${role.slice(0, 5)}-${target}-${home}-${Math.floor(Math.random() * 1000)}`;
}
module.exports = function() {
  // create a new function for StructureSpawn
  StructureSpawn.prototype.spawnBalCreep =
    /**
     * set: [WORK, CARRY, MOVE]
     * @param {number} energy energy used
     * @param {string} roleName role of creep
     * @param {string} target room name
     * @param {string} home room name
     * @param {number} lim max number of body sets, max 16
     * @returns {number} spawn result
     */
    function(energy, roleName, target = this.room.name, home = helper
        .home, lim = 8) {
      // create a balanced body as big as possible with the given energy
      const maxSets = 16;
      let numberOfParts = Math.floor(energy / 200);
      numberOfParts = numberOfParts > lim ? lim : numberOfParts;
      numberOfParts = numberOfParts > maxSets ? maxSets : numberOfParts;

      // construct body
      const body = [];
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
          `${getName(roleName, target, home)}`, {
            memory: {
              role: roleName,
              working: false,
              target: target,
              home: home,
              sourceIndex: 0,
            },
          });
    };

  StructureSpawn.prototype.spawnClaimerCreep =
  /**
   * body set: [CLAIM, MOVE]
   * @param {number} energy energy used
   * @param {string} target room name
   * @param {string} home room name
   * @param {number} lim max num of body sets
   * @returns {number} spawn result
   */
    function(energy, target, home = this.room.name, lim = 4) {
      const body = [];
      const maxSets = 4; // prevent overClaim
      // create a body with as many [claim, move] as possible
      let numberOfParts = Math.floor(energy/650);
      numberOfParts = numberOfParts > lim ? lim : numberOfParts;
      numberOfParts = numberOfParts > maxSets ? maxSets : numberOfParts;

      // construct body
      for (let i = 0; i < numberOfParts; i++) {
        body.push(CLAIM);
      }
      for (let i = 0; i < numberOfParts; i++) {
        body.push(MOVE);
      }
      return this.spawnCreep(body,
          `${getName(CLAIMER, target, home)}`, {
            memory: {
              role: helper.CLAIMER,
              target: target,
              home: home,
            },
          });
    };

  /**
     * body set: [WORK * 4, MOVE] * n + [WORK * 2, CARRY * 2, MOVE]
     * at lim = 3: sum(WORK) = 14
     * @param {number} energy energy used
     * @param {string} roleName role of creep
     * @param {string} target room name
     * @param {string} home room name
     * @param {number} lim max number of body sets
     * @returns {number} spawn result
     */
  StructureSpawn.prototype.spawnSemiStationaryCreep = function(
      energy,
      roleName,
      target = this.room.name,
      home = this.room.name,
      lim = 9,
  ) {
    // create a balanced body as big as possible with the given energy
    const maxSets = 9;
    let numberOfParts = Math.floor((energy - 350) / 450);
    numberOfParts = numberOfParts > lim ? lim : numberOfParts;
    numberOfParts = numberOfParts > maxSets ? maxSets : numberOfParts;

    const body = [];
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
        `${getName(roleName, target, home)}`, {
          memory: {
            role: roleName,
            working: false,
            target: target,
            home: home,
            sourceIndex: 0,
          },
        });
  };

  StructureSpawn.prototype.spawnHarvRemoteCreep =
    /**
     * set: [WORK] * n + [CARRY, MOVE * 3]
     * set: [WORK] * n + [MOVE] if energy <= 550
     * @param {number} energy energy used
     * @param {string} target room name
     * @param {string} home room name
     * @param {string} sourceIndex id of source given by Room.find(SOURCES)
     * @param {string} roleName role of creep
     * @param {number} lim max number of body sets
     * @returns {number} spawn result max 8
     */
    function(
        energy,
        target,
        home = this.room.name,
        sourceIndex = 0,
        role = helper.HARV_REMOTE,
        lim = 8,
    ) {
      // create a balanced body as big as possible with the given energy
      const maxSets = 46;
      let numberOfParts = Math.floor((energy - 150) / 100);
      if (energy <= 550) {
        numberOfParts = Math.floor((energy - 50) / 100);
      }
      numberOfParts = numberOfParts > lim ? lim : numberOfParts;
      numberOfParts = numberOfParts > maxSets ? maxSets : numberOfParts;

      const body = [];
      for (let i = 0; i < numberOfParts; i++) {
        body.push(WORK);
      }

      if (energy <= 550) {
        body.push(MOVE);
      } else {
        body.push(CARRY, MOVE, MOVE);
      }
      

      // create creep with the created body and the given role
      return this.spawnCreep(body,
          `${getName(role, target, home)}`, {
            memory: {
              role: role,
              arrived: false,
              target: target,
              home: home,
              sourceIndex: sourceIndex,
            },
          });
    };

  StructureSpawn.prototype.spawnCarryCreep =
        /**
         * body set: [CARRY, CARRY, MOVE] * n + [WORK, MOVE] (for repair roads)
         * @param {number} energy used to generate
         * @param {string} target target room id
         * @param {string} home home room id
         * @param {number} sourceIndex source index of Energy
         * @param {number} [lim=8] limit the number of body part groups the creeps have, max 16, 1600
         */
        function(energy, target, home = this.room.name, sourceIndex = 0, lim = 8) {
          const maxSets = 16;
          let numberOfParts = Math.floor((energy - (energy > 600 ? 150 : 0)) / 150);
          numberOfParts = numberOfParts > lim ? lim : numberOfParts;
          numberOfParts = numberOfParts > maxSets ? maxSets : numberOfParts;

          const body = [];
          for (let i = 0; i < numberOfParts; i++) {
            body.push(CARRY);
            body.push(CARRY);
          }
          for (let i = 0; i < numberOfParts; i++) {
            body.push(MOVE);
          }
          if (energy > 600) {
            body.push(WORK, MOVE);
          }
          // create creep with the created body and the given role
          return this.spawnCreep(body,
              `${getName(helper.CARRY, target, home)}`, {
                memory: {
                  role: helper.CARRY,
                  working: false,
                  target: target,
                  home: home,
                  sourceIndex: sourceIndex,
                },
              });
        };
        /**
         * body sets: [TOUGH, RANGE_ATTACK, MOVE] * n + [HEAL, MOVE] * selfHeal
         * @param {number} energy used to generate
         * @param {string} target target room id
         * @param {string} home home room id
         * @param {number} selfHeal num of heal body sets, default 0
   * @param {number} [lim=16] max num of sets
         * @returns {number} spawn result
         */
  StructureSpawn.prototype.spawnAtkRangeCreep =
    function(energy, target, home = this.room.name, selfHeal = 0, lim = 16) {
          const maxSets = 16;
      let numberOfParts = Math.floor((energy - 300 * selfHeal) / 210);
      numberOfParts = numberOfParts > lim ? lim : numberOfParts;
          numberOfParts = numberOfParts > maxSets ? maxSets : numberOfParts;

          const body = [];
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
            body.push(HEAL, MOVE);
          }


          // create creep with the created body and the given role
          return this.spawnCreep(body,
              `${getName(ATK_RANGE, target, home)}`, {
                memory: {
                  role: helper.ATK_RANGE,
                  attack: true,
                  working: true,
                  target: target,
                  home: home,
                  heal: selfHeal > 0,
                },
              });
        };

  StructureSpawn.prototype.spawnAttackerCreep =
        /**
         * body set: [TOUGH, ATTACK, MOVE]
         * @param {number} energy used to generate
         * @param {string} target target room id
         * @param {string} home home room id
         * @param {number} [lim=16] max num of sets
         */
        function(energy, target, home = this.room.name, lim = 16) {
          const maxSets = 16;
          let numberOfParts = Math.floor(energy / 140);
          numberOfParts = numberOfParts > lim ? lim : numberOfParts;
          numberOfParts = numberOfParts > maxSets ? maxSets : numberOfParts;

          const body = [];
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
              `${getName(ATTACKER, target, home)}`, {
                memory: {
                  role: helper.ATTACKER,
                  attack: true,
                  working: true,
                  target: target,
                  home: home,
                },
              });
        };
};
