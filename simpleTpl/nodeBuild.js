
var http = require("http");
var fs = require('fs');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');

var tplHash = {};
var tplUrl = 'http://localhost:8797/ngp/misc/yuicompressor/mainGen/tpl.html';
var req = http.get(tplUrl, function(res) {
    var bufferHelper = new BufferHelper();
    res.on('data', function (chunk) {
        bufferHelper.concat(chunk);
    }).on('end',function(){
        var str = iconv.decode(bufferHelper.toBuffer(),'gb2312');
        str.split('<!-- {{/target}} -->').map(function (item, index) {
            if (item.replace(/\r\n/g, '')) {
                item = item.replace(/<!-- \{\{target: (\w+?)\}\} -->(\r\n)?/, '');
                tplHash[RegExp.$1] = item;
            }
        });
//        for (var key in tplHash) {  console.log(key); }
        start();
    });

}).on('error', function(e) {
    console.log('problem with request: ' + e.message);
});

// generate file
function start() {
    var games = ['qn', 'jl', 'bl'];
    games.map(function (key, index) {
        var file = key + 'html-main.tpl';
        fs.readFile(file, function(err, html) {
            if (err) throw err;

            var bufferHelper = new BufferHelper();
            bufferHelper.concat(html);
            html = iconv.decode(bufferHelper.toBuffer(),'gb2312');

            // get variables
            var variables = {};
            html = html.replace(/<!-- \{\{define: (\w+?)=(\w+?)\}\} -->(\r\n)?/g, function (match) {
                variables[RegExp.$1] = RegExp.$2;
                return '';
            });

            // module replacement
            html = html.replace(/<!-- \{\{import: (\w+?)\}\} -->(\r\n)?/g, function (match) {
                var str = tplHash[RegExp.$1] || '';
                if (!str) {
                    console.error('Tpl[ ' + RegExp.$1 + ' ] Not Found!');
                }
                return str;
            });

            // variables replacement
            html = html.replace(/\{\{([\w\s]+?\|)?(\w+?)\}\}/g, function (match) {
                var val = variables[RegExp.$2];
                var conditionVal = RegExp.$1;
                if (conditionVal) {
                    return (val == true) ? conditionVal.split('|')[0] : '';
                }
                return val || '';
            });

//            fs.writeFile(key + '_main.html', html, function(err){
            var file = '../../../ui/' + key + 'html/main.html';
            var arr = iconv.encode(html, 'gbk');
            fs.writeFile(file, arr, function(err){
                if(err) throw err;
                console.log(file, 'has finished');
            });
        });
    });
}

// write data to request body
//req.write('data\n');
//req.write('data\n');
req.end();
