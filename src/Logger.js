const OFF = 10000;
const FATAL = 5000;
const ERROR = 4000;
const WARNING = 3000;
const INFO = 2000;
const DEBUG = 1000;
const TRACE = 1;
const ALL = 0

class Logger {
    
    logLevel;

    constructor(logLevel = 2000){
        this.logLevel = logLevel;
    }

    log(level, levelInfo, ...message) {
        if (level >= this.logLevel){
            console.log(`${Game.time} ${levelInfo}  ${_.join(' ', message)}`);
        }
    }

    trace(...message){
        this.log(TRACE, 'trace', ...message);
    }
    debug(...message){
        this.log(DEBUG, 'debug', ...message);
    }
    info(...message){
        this.log(INFO, 'info ', ...message);
    }
    warn(...message){
        this.log(WARNING, 'warn ', ...message);
    }
    error(...message){
        this.log(ERROR, 'error', ...message);
    }
    fatal(...message){
        this.log(FATAL, 'fatal', ...message);
    }
}