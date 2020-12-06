const OFF = 10000;
const FATAL = 5000;
const ERROR = 4000;
const WARNING = 3000;
const INFO = 2000;
const DEBUG = 1000;
const TRACE = 1;
const ALL = 0

const LOG_LEVEL = INFO;
const EMAIL_LEVEL = WARNING;
class Logger {

    constructor(logLevel = 2000){
        this.logLevel = logLevel;
    }

    static log(level, levelInfo, ...message) {
        let msg;
        if (Game.time == Memory.stats.logTick) {
            msg = `     \[${levelInfo}\]  ${message.map(m => typeof m == 'object' ? JSON.stringify(m) : m).join()}`
        } else {
            msg = `${Game.time % 10000} \[${levelInfo}\]  ${message.map(m => typeof m == 'object' ? JSON.stringify(m) : m).join()}`
            Memory.stats.logTick = Game.time;
        }
        
        if (level >= LOG_LEVEL){
            console.log(msg);
        }
        if (level >= EMAIL_LEVEL){
            Game.notify(msg);
        }
    }

    static getLogger(level){
        return new Logger(level);
    }

    static all(...message){
        this.log(ALL, 'ALL', ...message);
    }
    static trace(...message){
        this.log(TRACE, 'TRACE', ...message);
    }
    static debug(...message){
        this.log(DEBUG, 'DEBUG', ...message);
    }
    static info(...message){
        this.log(INFO, 'INFO', ...message);
    }
    static warn(...message){
        this.log(WARNING, 'WARN', ...message);
    }
    static error(...message){
        this.log(ERROR, 'ERROR', ...message);
    }
    static fatal(...message){
        this.log(FATAL, 'FATAL', ...message);
    }
}

module.exports = Logger;