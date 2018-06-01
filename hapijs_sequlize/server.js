/**
 * This module is the starter module. It defines the configurations 
 * for MySQL DB and others.
 */

'use strict';
const Service = require('./service');
const Sequelize = require('sequelize');

let sequelizeOptions;

let dbConfig = {
    db: {
        user: 'root',//'root',
        password: 'password',// 'mysqlpwd',
        schema: 'csr_db_dev'
    },
    options: {
       // host: 'AZURE',
       // server: 'AZURE',
       host: 'localhost',  
       port: 3306,//3306,
        database: 'csr_db_dev',
         dialect: 'mysql',// 'mysql'
        // encrypt: true
        // pool: { max: 5, min: 0, idle: 10000 },
        // dialectOptions: {
        //     encrypt: true
        // }
    }
};
console.log(dbConfig.db.schema);
// setting up sequelize
sequelizeOptions = new Sequelize(dbConfig.db.schema, dbConfig.db.user, dbConfig.db.password,
    dbConfig.options);

let config = {
    sequelize: sequelizeOptions
};

Service.start(config);