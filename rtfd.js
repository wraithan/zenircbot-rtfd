var ZenIRCBot = require('zenircbot-api').ZenIRCBot;
var zen = new ZenIRCBot;
var sub = zen.get_redis_client();
var channels = ['#pdxbots']

zen.register_commands(
    "rtd.js",
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
    var msg = JSON.parse(message);
    if (msg.version == 1 && msg.type == 'directed_privmsg'
	&& channels.indexOf(msg.data.channel) != -1) {
	
	if (/^info$/.test(msg.data.message.trim())) {
	    zen.send_privmsg(msg.data.channel,
			     'Welcome to #readthedocs, if you have a ' +
			     'question please prefix it with !help in order ' +
			     'to notify the volunteer support people.')
	    zen.send_privmsg(msg.data.channel,
			     'Please allow some time for a response as we ' +
			     'may be asleep or otherwise busy.')
	    zen.send_privmsg(msg.data.channel,
			     "If you don't get a response please file an issue here: " +
			     "https://github.com/rtfd/readthedocs.org/issues")
	}
    }
})
