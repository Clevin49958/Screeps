/* eslint-disable no-unused-vars */
const OFF = 10000;
const FATAL = 5000;
const ERROR = 4000;
const WARNING = 3000;
const INFO = 2000;
const DEBUG = 1000;
const TRACE = 1;
const ALL = 0;
/* eslint-enable no-unused-vars */

const LOG_LEVEL = INFO;
const EMAIL_LEVEL = WARNING;

const myColor = {
  blue: 'DodgerBlue',
  green: 'SpringGreen',
  white: 'White',
  yellow: 'Yellow',
  red: 'Tomato',
  purple: 'Indigo'
}

const colorForLevel = {
  [TRACE]: myColor.blue,
  [DEBUG]: myColor.green,
  [INFO]: myColor.white,
  [WARNING]: myColor.yellow,
  [ERROR]: myColor.red,
  [FATAL]: myColor.purple
},

function wrapColor(color, msg) {
  return `<span style="color: ${myColor[color] || color};">${msg}</span>`;
}

/**
 * Traverses a javascript object, and deletes all circular values
 * @param source object to remove circular references from
 * @param censoredMessage optional: what to put instead of censored values
 * @param censorTheseItems should be kept null, used in recursion
 * @returns {undefined}
 */
function JSONsafe(source, censoredMessage, censorTheseItems) {
  //init recursive value if this is the first call
  censorTheseItems = censorTheseItems || [source];
  //default if none is specified
  censoredMessage = censoredMessage || "CIR";
  //values that have allready apeared will be placed here:
  var recursiveItems = {};
  //initaite a censored clone to return back
  var ret = {};
  //traverse the object:
  for (var key in source) {
      var value = source[key]
      if (typeof value == "object") {
          //re-examine all complex children again later:
          recursiveItems[key] = value;
      } else {
          //simple values copied as is
          ret[key] = value;
      }
  }
  //create list of values to censor:
  var censorChildItems = [];
  for (var key in recursiveItems) {
      var value = source[key];
      //all complex child objects should not apear again in children:
      censorChildItems.push(value);
  }
  //censor all circular values
  for (var key in recursiveItems) {
      var value = source[key];
      var censored = false;
      censorTheseItems.forEach(function (item) {
          if (item === value) {
              censored = true;
          }
      });
      if (censored) {
          //change circular values to this
          value = censoredMessage;
      } else {
          //recursion:
          value = JSONsafe(value, censoredMessage, censorChildItems.concat(censorTheseItems));
      }
      ret[key] = value

  }

  return ret;
}

/**
 * Log messages with time info
 *
 * Level higher than LOG_LEVEL will be displayed in console
 *
 * Level higher than EMAIL_LEVEL will notify the user
 */
class Logger {
  /**
   * @constructor
   * @param {number} logLevel should be one of the level constants, default INFO
   */
  constructor(logLevel = 2000) {
    this.logLevel = logLevel;
  }

  static toMsg(obj) {
    return typeof obj == 'object' ? JSON.stringify(JSONsafe(obj), null, 2) : obj;
  }

  /**
   * base function of log
   * @param {number} level level constant
   * @param {string} levelInfo text representation of log level
   * @param  {...any} message message to log, will stringify any object
   */
  static log(level, levelInfo, ...message) {
    if (Memory.config?.pause) {
      return;
    }
    let msg;
    let combined = message.map((m) => {
      try {
        return Logger.toMsg(m);
      } catch (e) {
        return typeof m == 'object' ? m.toString() : m
      }
    }).join('; ');

    if (Game.time == Memory.stats.logTick) {
      msg = wrapColor(colorForLevel[level], `     \[${levelInfo}\]  ${combined}`);
    } else {
      msg = wrapColor(colorForLevel[level], `${Game.time % 10000} \[${levelInfo}\]  ${combined}`);
      Memory.stats.logTick = Game.time;
    }

    if (level >= LOG_LEVEL) {
      console.log(msg);
    }
    if (level >= EMAIL_LEVEL) {
      msg = `${Math.floor(Game.time / 100)}xx} \[${levelInfo}\]  ${combined}`;
      Game.notify(msg);
    }
  }

  /**
   * get logger
   * @deprecated all logger methods are now static. Use Logger.xxx instead
   * @param {number} level level constant
   * @returns {Logger}logger instance
   */
  static getLogger(level) {
    return new Logger(level);
  }

  /**
   * log at all level
   * @param  {...any} message
   */
  static all(...message) {
    this.log(ALL, 'ALL', ...message);
  }

  /**
   * log at trace level
   * @param  {...any} message
   */
  static trace(...message) {
    this.log(TRACE, 'TRACE', ...message);
  }

  /**
   * log at debug level
   * @param  {...any} message
   */
  static debug(...message) {
    this.log(DEBUG, 'DEBUG', ...message);
  }

  /**
   * log at info level
   * @param  {...any} message
   */
  static info(...message) {
    this.log(INFO, 'INFO', ...message);
  }

  /**
   * log at warning level
   * @param  {...any} message
   */
  static warn(...message) {
    this.log(WARNING, 'WARN', ...message);
  }

  /**
   * log at error level
   * @param  {...any} message
   */
  static error(...message) {
    this.log(ERROR, 'ERROR', ...message);
  }

  /**
   * log at fatal level
   * @param  {...any} message
   */
  static fatal(...message) {
    this.log(FATAL, 'FATAL', ...message);
  }
}

module.exports = {
  Logger,
  LOG_LEVEL,
  EMAIL_LEVEL,
  JSONsafe,
  wrapColor
};
