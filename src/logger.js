class Logger {
    constructor() {
      this.logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
    }
    log(message, data = null) {
      const timestamp = new Date().toISOString();
      const entry = `${timestamp} [INFO] ${message} ${data ? JSON.stringify(data) : ''}`;
      this._saveLog(entry);
    }
  
    error(message, error = null) {
      const timestamp = new Date().toISOString();
      const entry = `${timestamp} [ERROR] ${message} ${error?.stack || ''}`;
      this._saveLog(entry);
    }

    _saveLog(entry) {
      this.logs.push(entry);
      localStorage.setItem('app_logs', JSON.stringify(this.logs));
      console.log(entry);
    }
    exportLogs() {
      const logText = this.logs.join('\n');
      const blob = new Blob([logText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      
      URL.revokeObjectURL(url);
    }

    clearLogs() {
      this.logs = [];
      localStorage.removeItem('app_logs');
    }
  }

  export const logger = new Logger();