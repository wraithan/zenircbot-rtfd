var path = require('path')
var fs = require('fs')
var api = require('zenircbot-api')
var Set = require('Set')

var zen = new api.ZenIRCBot()
var channels = ['#readthedocs']
var oncall = new Set()
var confFile = path.join(__dirname, 'rtfd.json')

if (fs.existsSync(confFile)) {
    var conf = api.load_config(confFile)
    if (conf.channels) {
        channels = channels.concat(conf.channels)
    }
    if (conf.oncall) {
        oncall = oncall.addAll(conf.oncall)
    }
}

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

var filtered = zen.filter({version: 1, type: 'directed_privmsg'})
filtered.on('data', function(msg) {
    if (channels.indexOf(msg.data.channel) !== -1) {
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
