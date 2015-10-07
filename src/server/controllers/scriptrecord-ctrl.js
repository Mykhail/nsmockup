'use strict';
var vmSim = require('../../vm-sim'),
    ssParams = require('../../suite-script/utils/ss-params');

// NetSuite Libs
var nlobjRequest = require('../../../lib/nsobj/request').nlobjRequest,
    nlobjResponse = require('../../../lib/nsobj/response').nlobjResponse;

var cacheFiles = [];

exports.exec = (req, res) => {
    let db = global.$db,
        id = req.query.script,
        script = db.object.__scripts[id - 1];
    if (!script) {
        res.status(500).send('SSS_INVALID_INTERNAL_ID');
    } else {
        let methods,
            method = req.method.toLowerCase();
        if (script.type === 'suitelet') {
            methods = ['get', 'post'];
        } else if (script.type === 'restlet') {
            methods = ['get', 'post', 'put', 'delete'];
        }

        if (!methods || !~methods.indexOf(method)) {
            res.status(500).send('SSS_INVALID_TYPE_SCRIPT');
        }

        let execFunc;
        if (script.funcs && method) {
            execFunc = script.funcs[method];
        } else {
            execFunc = script.func;
        }
        // load libs
        for (let i = 0; i < script.files.length; i++) {
            let file = script.files[i];
            if (!~cacheFiles.indexOf(file)) {
                vmSim.addScript(file);
                cacheFiles.push(file);
            }
        }

        // load params configurations
        ssParams.load(script.params);

        let ff = execFunc.split('.'),
            func = global[ff[0]],
            nsreq = new nlobjRequest(req),
            nsres = new nlobjResponse(res);
        // workaround
        if (ff.length === 1)
            func(nsreq, nsres);
        else if (ff.length === 2)
            func[ff[1]](nsreq, nsres);
        else if (ff.length === 3)
            func[ff[1]][ff[2]](nsreq, nsres);
    }
};