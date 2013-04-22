var fs = require('fs')
var api = require('zenircbot-api');
var Set = require('Set')
var bot_config = api.load_config('../bot.json')
var zen = new api.ZenIRCBot(bot_config.redis.host,
                            bot_config.redis.port,
                            bot_config.redis.db)
var sub = zen.get_redis_client();
var channels = ['#readthedocs']
var oncall = new Set()

fs.exists('./rtfd/rtfd.json', function (exists) {
    if (exists) {
        var conf = api.load_config('./rtfd/rtfd.json')
        channels = channels.concat(conf.channels)
        if (conf.oncall) {
            oncall = oncall.addAll(conf.oncall)
        }
    }
})

var info = [
    ('Welcome to #readthedocs, if you have a question please prefix it with ' +
     '!help in order to notify the volunteer support people.'),
    ('Please allow some time for a response as we may be asleep or ' +
     'otherwise busy.'),
    ("If you don't get a response please file an issue here: " +
     "https://github.com/rtfd/readthedocs.org/issues")
]


zen.register_commands(
    "rtfd.js",
    [
        {
            name: "oncall",
            description: "Adds caller to on call list."
        }, {
            name: "offcall",
            description: "Removes call from on call list."
        }, {
            name: "help",
            description: "Pings on call people and records question."
        }, {
            name: "info",
            description: "Gives basic information about using the commands."
        }
    ]
)

sub.subscribe('in');
sub.on('message', function(channel, message){
    var msg = JSON.parse(message)
    if (msg.version == 1 && msg.type == 'directed_privmsg' &&
        channels.indexOf(msg.data.channel) != -1) {
        var help = /^help(\s.*)?$/.exec(msg.data.message)
        if (/^info$/.test(msg.data.message)) {
            info.forEach(function (line) {
                zen.send_privmsg(msg.data.channel, line)
            })
        } else if (help) {
            zen.send_privmsg(msg.data.channel,
                             oncall.toArray().join(', ') + ': ^')
            var question = help[1]
            if (question) {
                fs.appendFile('./question.log', question.trim() + '\n')
            }
        } else if (/^oncall$/.test(msg.data.message)) {
            oncall.add(msg.data.sender)
        } else if (/^offcall$/) {
            oncall.remove(msg.data.sender)
        }
    }
})
