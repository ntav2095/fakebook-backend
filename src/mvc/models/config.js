const { Sequelize } = require('sequelize');


const sequelize = new Sequelize('fakebook', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});


const testConnectDB = async () => {
    try {
        await sequelize.authenticate();
    } catch (error) {
        console.error(error);
    }

}


module.exports = {
    sequelize,
    testConnectDB
}



