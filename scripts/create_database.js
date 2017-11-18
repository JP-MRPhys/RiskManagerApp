/**
 * Created by barrett on 8/28/14.
 */

var mysql = require('mysql');
var dbconfig = require('../config/database_AWS');

var connection = mysql.createConnection(dbconfig.connection);

//connection.query('CREATE DATABASE ' + dbconfig.database);

connection.query('USE' + dbconfig.database);

var user_table=1;
var portfolio_table=1;

if (user_table==1){

//create user table
connection.query('\
CREATE TABLE `' + dbconfig.database + '`.`' + dbconfig.users_table + '` ( 
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT, \
    `username` VARCHAR(20) NOT NULL, \
    `password` CHAR(60) NOT NULL, \
    `firstname` CHAR(60) NOT NULL, \
    `lastname` CHAR(60) NOT NULL, \
    `email` CHAR(60) NOT NULL, \
        PRIMARY KEY (`id`), \
    UNIQUE INDEX `id_UNIQUE` (`id` ASC), \
    UNIQUE INDEX `username_UNIQUE` (`username` ASC) \
)');
}

//portfolio table
if (portfolio_table==0){

console.log('create portfolio table');

connection.query('CREATE TABLE `'test'` ( \
    `portfolioname` VARCHAR(50) NOT  NULL, \
    `userid` VARCHAR(50) NOT NULL, \
    `ticker` VARCHAR(60) NOT NULL, \
    `weight` VARCHAR(60) NOT NULL, \
        PRIMARY KEY (`portfolioname`), \
)';//query




    }

//SQL synatx for creating tables
//CREATE TABLE test (`portfolioname` VARCHAR(50) NOT NULL, userid VARCHAR(50) NOT NULL, ticker VARCHAR(50) NOT NULL, weight float NOT NULL);



//connection.end();
