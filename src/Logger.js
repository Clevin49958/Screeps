const OFF = 10000;
const FATAL = 5000;
const ERROR = 4000;
const WARNING = 3000;
const INFO = 2000;
const DEBUG = 1000;
const TRACE = 1;
const ALL = 0

const LOG_LEVEL = INFO;
class Logger {

    constructor(logLevel = 2000){
        this.logLevel = logLevel;
    }

    static log(level, levelInfo, ...message) {
        if (level >= LOG_LEVEL){
            console.log(`${Game.time} ${levelInfo}  ${message.join()}`);
        }
    }

    static getLogger(level){
        return new Logger(level);
    }

    static trace(...message){
        log(TRACE, 'trace', ...message);
    }
    static debug(...message){
        log(DEBUG, 'debug', ...message);
    }
    static info(...message){
        this.log(INFO, 'info ', ...message);
    }
    static warn(...message){
        log(WARNING, 'warn ', ...message);
    }
    static error(...message){
        log(ERROR, 'error', ...message);
    }
    static fatal(...message){
        log(FATAL, 'fatal', ...message);
    }
}

module.exports = Logger;