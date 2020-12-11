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

  /**
   * base function of log
   * @param {number} level level constant
   * @param {string} levelInfo text representation of log level
   * @param  {...any} message message to log, will stringify any object
   */
  static log(level, levelInfo, ...message) {
    let msg;
    if (Game.time == Memory.stats.logTick) {
      msg = `     \[${levelInfo}\]  ${message.map((m) =>
        typeof m == 'object' ? JSON.stringify(m) : m,
      ).join()}`;
    } else {
      msg = `${Game.time % 10000} \[${levelInfo}\]  ${message.map((m) =>
        typeof m == 'object' ? JSON.stringify(m) : m,
      ).join()}`;
      Memory.stats.logTick = Game.time;
    }

    if (level >= LOG_LEVEL) {
      console.log(msg);
    }
    if (level >= EMAIL_LEVEL) {
      Game.notify(msg);
    }
  }

  /**
   * get logger
   * @deprecated all logger methods are now static. Use Logger.xxx instead
   * @param {number} level level constant
   * @return {Logger}logger instance
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

module.exports = Logger;
