// class Logger {

// };

class Log4js {    
    //#region 
    /**  
	 * Hashtable of loggers.
	 * @static
	 * @final
	 * @private  
	 */

    //#endregion

    
    

    constructor(name){
        loggers = {};
        logMethods = [];
        appenders;
        category;
        level;
        this.appenders = [];
        /** category of logger */
        this.category = name || "";
        /** level to be logged */
        this.level = Log4js.Level.FATAL;
    }

    static joinArgs(args){
        return args.join(' ');
    }

    static getLogger(category) {
		
		// Use default logger if category is not specified or invalid
		if (typeof category !== "string") {
			category = "[default]";
		}

		if (!loggers[category]) {
			// Create the logger for this name if it doesn't already exist
			loggers[category] = new Logger(category);
		}
		
		return loggers[category];
    }

    static getDefaultLogger() {
		return getLogger("[default]"); 
	}
    
    mergeArgs(args) {
        // String.
    }
    log(args) {
        this.logMethods.forEach(method => method(joinArgs(args)));
    }
}