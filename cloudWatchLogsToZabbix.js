var async = require('async');
var net = require('net');
var zlib = require('zlib');  

var zabbixAddress = <<IP or Host>>;
var zabbixPort = '10051';
var maxLog = 10;

var extractMessage = function (record, callback) {
  var buffer = new Buffer(record.kinesis.data, 'base64');
  zlib.unzip(buffer, function(err, buffer) {
    if (err) {
      console.log(err);
    } else {
      callback(null, JSON.parse(buffer.toString('utf-8')));
    }
  });
};

exports.handler = function(event, context) {
  console.log("Event: %j", event);
  async.waterfall(
    [
      // extract log messages
      function (callback) {
        async.map (event.Records,
                    extractMessage,
                    function(err, messages) {
                      callback(null, messages);
                    }
                  );
      },
      // send logs to Zabbix
      function (messages, callback) {
        async.every(messages,
          function (message, cb1) {
            var logSets = [];
            for (var logs = message.logEvents; logs.length > 0;) {
              logSets.push(logs.splice(0, maxLog));
            }
            async.every(logSets,
              function (logSet, cb2) {
                // message format is:
                // https://www.zabbix.org/wiki/Docs/protocols/zabbix_sender/2.0
                var zabbixMessage = {
                  request: "sender data",
                  data: logSet.map(function(log, index, logs) {
                     return {
                               host: message.logStream,
                               key: message.logGroup,
                               value: log.message,
                               clock: log.timestamp / 1000
                            };
                  }),
                  clock: Math.floor(new Date().getTime() / 1000)
                };
                var client = net.connect({host: zabbixAddress, port: zabbixPort},
                  function() {
                    client.write(JSON.stringify(zabbixMessage));
                  }
                );
                client.on('data', function(data) {
                  console.log(data.toString('utf-8'));
                  client.end();
                });
                client.on('end', function() {
                  cb2(true);
                });
              },
              function(result) {
                cb1(true);
              }
            );
          },
          function(result) {
            callback(null, result);
          }
        );
      }
    ],
    function (err, result) {
      if (err) {;context.done('error', err);}
      else {context.done(null, result);}
    }
  );
}
// exports.handler(event, {done: function(){process.exit();}});
