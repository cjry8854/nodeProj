/**
 * path:   build.js
 * desc:   多游戏目录下main.html文件构建脚本
 * author: hzcaijuan@corp.netease.com
 * date:   2014/9/26
 */

var http = require("http");
var fs = require('fs');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');

var tplHash = {};
var tplFile = 'tpl.html';
var games = ['qn', 'jl', 'bl'];
fs.readFile(tplFile, function(err, tpl) {
    if (err) throw err;

    var bufferHelper = new BufferHelper();
    bufferHelper.concat(tpl);
    var str = iconv.decode(bufferHelper.toBuffer(),'gb2312');
    str.split(/<!-- \{\{\/target\}\} -->(\r\n)?/).map(function (item, index) {
        if (item.replace(/\r\n/g, '')) {
            item = item.replace(/<!-- \{\{target: (\w+?)\}\} -->(\r\n)?/, '');
            tplHash[RegExp.$1] = item;
        }
    });
//    for (var key in tplHash) {  console.log(key); }
    genMainFile();
});

// generate file
function genMainFile() {
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

            // comment replacement
            html = html.replace(/##.+?\r\n/g, '');

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
            html = html.replace(/<!-- \{\{if\((\w+?)\)\}\}(.+?)\{\{\/if\}\} -->/g, function () {
                var val = variables[RegExp.$1];
                return val ? RegExp.$2 : '';
            });

//            fs.writeFile(key + '_main.html', html, function(err){
            var newFile = '../../../ui/' + key + 'html/main.html';
            var arr = iconv.encode(html, 'gbk');
            fs.writeFile(newFile, arr, function(err){
                if(err) throw err;
                console.log(newFile, 'has generated');
            });
        });
    });
}
