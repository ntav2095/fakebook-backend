const { Sequelize } = require('sequelize');


const sequelize = new Sequelize('d1jdto7ignafd9', 'gwyrhdvmzhktte', 'd8ff627285bdd97b8f2284ea0e46026b4114e07ef183e88be47c0557d03e842c', {
    host: 'ec2-3-229-252-6.compute-1.amazonaws.com',
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});


const testConnectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB")
    } catch (error) {
        console.error("from sequlize config :", error);
    }

}


module.exports = {
    sequelize,
    testConnectDB
}



