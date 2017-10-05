'use strict';

/**
 * 语言核心模块
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const util = require('util');

/**
 * 常量
 */
const SERVE_DIR = process.env.SERVE_DIR;
const PORT = process.env.PORT || 3000;
const RES_CATALOGUE_TEMPLATE = `
<html>
    <head>
        <title>SimStatic</title>
        <meta charset="UTF-8" />
    </head>
    <body>
        {{catalogue}}
    </body>
</htm>
`;

/**
 * 修改当前工作目录
 */
if (SERVE_DIR) {
    const cwd = path.resolve(SERVE_DIR);
    if (cwd.indexOf('~') !== -1) {
        cwd = `${os.homedir()}${cwd.slice(cwd.indexOf('~') + 1)}`;
    }
    process.chdir(cwd);
}

/**
 * 响应错误信息
 * @param {Object} err 
 * @param {Object} res 
 */
function errResHandler(err, res) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html;charset=utf8');

    res.end(err.stack.replace(/\n/g, '<br />'));
}

/**
 * 响应文件目录页面
 * @param {Array} files 
 * @param {String} prefix 
 * @param {Object} res 
 */
function dirResHandler(files, prefix, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html;charset=utf8');
    
    let resBody = '';
    files.forEach(function (file) {
        resBody += `<a href="${prefix}${file}">${file}</a><br />`;
    });
    res.end(RES_CATALOGUE_TEMPLATE.replace(/\{\{catalogue\}\}/g, resBody));
}

/**
 * 响应文件下载
 * @param {Buffer} fileContent 
 * @param {Object} res 
 */
function fileResHandler(fileContent, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/octet-stream');

    res.end(fileContent);
}

/**
 * HTTP 请求你处理函数
 * @param {Object} req 
 * @param {Object} res 
 */
function reqHandler(req, res) {
    if (req.url === '/favicon.ico') {  // 响应 Chrome 浏览器的 /favicon.ico 请求
        res.end();
    } else if (req.url === '/') {  // 首页请求
        fs.readdir(process.cwd(), function (err, files) {
            if (err) {
                return errResHandler(err, res);
            }

            return dirResHandler(files, '/', res);
        });
    } else {  // 其他文件夹或文件请求
        const clientRequestFile = decodeURIComponent(req.url.slice(1));
        fs.stat(clientRequestFile, function (err, stat) {
            if (err) {
                return errResHandler(err, res);
            }

            if (stat.isDirectory()) {  // 如果请求为文件夹，读取文件夹中文件名并响应为文件目录
                fs.readdir(clientRequestFile, function (err, files) {
                    if (err) {
                        return errResHandler(err, res);
                    }

                    return dirResHandler(files, `/${clientRequestFile}/`, res);
                });
            } else {  // 如果请求为文件，提供文件下载
                fs.readFile(clientRequestFile, function (err, fileContent) {
                    if (err) {
                        return errResHandler(err, res);
                    }

                    return fileResHandler(fileContent, res);
                });
            }
        });
    }
}

/**
 * 创建 HTTP 服务并监听指定端口
 */
http
    .createServer(reqHandler)
    .listen(PORT, function () {
        console.log(`SimStatic server listen on: 0.0.0.0:${PORT}`);
    });
