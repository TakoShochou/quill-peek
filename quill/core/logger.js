let levels = ['error', 'warn', 'log', 'info'];
let level = 'info';

function debug(method, ...args) {
  if (levels.indexOf(method) <= levels.indexOf(level)) {
    console['trace']('%c[QuillDebug]', 'color:white;background:red;', ...args);  // eslint-disable-line no-console
  }
}

function namespace(ns) {
  return levels.reduce(function(logger, method) {
    logger[method] = debug.bind(console, method, ns);
    return logger;
  }, {});
}

debug.level = namespace.level = function(newLevel) {
  level = newLevel;
};


export default namespace;
